import { Component, EffectRef, OnDestroy, OnInit, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { authService, authUser } from '../services/auth.service';
import { SnackbarService } from '../shared/snackbar.service';
import { usuariosService } from '../services/usuarios.service'
import { ConfirmService } from '../shared/confirm.service';

@Component({
  standalone: true,
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class UsuariosComponent implements OnInit, OnDestroy {
  // Estado de carga
  cargando: boolean = false;

  // Formulario crear usuario
  email: string = '';
  contrasena: string = '';
  rol_id: any = '';
  mensaje: string = '';

  // Roles disponibles
  roles: Array<any> = [];

  // Lista de usuarios
  usuarios: Array<any> = [];
  usuariosFiltrados: Array<any> = [];

  // Signals para lista (imitando enfoque usado en Reactivos)
  usuariosSig = signal<Array<any>>([]);
  usuariosFiltradosSig = signal<Array<any>>([]);

  // Getters to expose signals to templates (matching pattern used in Reactivos)
  get usuariosCount() { return this.usuariosSig().length; }
  get usuariosList() { return this.usuariosSig(); }
  get usuariosFiltradosList() { return this.usuariosFiltradosSig(); }

  // Filtros (signals con accessors para respuesta instantánea)
  private emailQSig = signal<string>('');
  get emailQ() { return this.emailQSig(); }
  set emailQ(v: string) { this.emailQSig.set((v ?? '').toString()); }
  private rolQSig = signal<any>('');
  get rolQ() { return this.rolQSig(); }
  set rolQ(v: any) { this.rolQSig.set(v ?? ''); }
  private estadoQSig = signal<string>('');
  get estadoQ() { return this.estadoQSig(); }
  set estadoQ(v: string) { this.estadoQSig.set((v ?? '').toString()); }

  private filtrosEffectStop?: EffectRef;

  constructor(public snack: SnackbarService, private confirm: ConfirmService) {
    this.filtrosEffectStop = effect(() => {
      const _ = this.usuariosSig();
      const __e = this.emailQSig();
      const __r = this.rolQSig();
      const __s = this.estadoQSig();
      this.aplicarFiltros();
    });
  }

  ngOnInit() {
    this.preloadAll();
  }

  ngOnDestroy() {
    try { this.filtrosEffectStop?.destroy(); } catch {}
  }

  editUserModalOpen = false;
  editUserId: number | null = null;
  editUserEmail: string = '';
  editNuevaContrasena: string = '';
  editNuevaContrasena2: string = '';
  editSubmitted = false;
  auxPermsSig = signal<Record<number, Record<string, boolean>>>({});
  auxPermSavingSig = signal<Record<number, boolean>>({});
  auxPermsExpandedSig = signal<Record<number, boolean>>({});
  auxPermModules = [
    { key: 'reactivos', label: 'Reactivos' },
    { key: 'plantillas', label: 'Plantillas' },
    { key: 'equipos', label: 'Equipos' },
    { key: 'referencia', label: 'Materiales referencia' },
    { key: 'volumetricos', label: 'Materiales volumetricos' },
    { key: 'insumos', label: 'Insumos' },
    { key: 'papeleria', label: 'Papeleria' }
  ];

  // ========== CARGAR DATOS ==========

  // Precarga concurrente para mostrar todo al toque
  async preloadAll() {
    this.cargando = true;
    try {
      const [roles, rows] = await Promise.all([
        usuariosService.listarRoles(),
        usuariosService.listarUsuarios()
      ]);
      this.roles = roles || [];
      this.usuarios = rows || [];
      this.usuariosSig.set(this.usuarios);
      this.usuariosFiltrados = this.usuarios.slice();
      this.usuariosFiltradosSig.set(this.usuariosFiltrados);
      this.aplicarFiltros();
      // Cargar permisos auxiliares en segundo plano para no bloquear la lista
      void this.loadAuxPermsForUsers();
    } catch (err) {
      console.error('Error en precarga de usuarios/roles:', err);
      this.snack.error('Error cargando datos de usuarios');
    } finally {
      this.cargando = false;
    }
  }

  async loadRoles() {
    try {
      this.roles = await usuariosService.listarRoles();
    } catch (err) {
      console.error('Error cargando roles:', err);
    }
  }

  async loadUsuarios() {
    this.cargando = true;
    try {
      const rows = await usuariosService.listarUsuarios();
      this.usuarios = rows || [];
      // actualizar signals para que la plantilla pueda reaccionar inmediatamente
      this.usuariosSig.set(this.usuarios);
      // asegurar que la lista filtrada también se inicializa inmediatamente
      this.usuariosFiltrados = this.usuarios.slice();
      this.usuariosFiltradosSig.set(this.usuariosFiltrados);
      this.aplicarFiltros();
      // Cargar permisos auxiliares en segundo plano para no bloquear la lista
      void this.loadAuxPermsForUsers();
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      this.snack.error('Error cargando usuarios');
    } finally {
      this.cargando = false;
    }
  }

  // ========== CREAR USUARIO ==========

  async crearUsuario(e: Event) {
    e.preventDefault();
    this.mensaje = '';

    // Validaciones
    if (!this.email.trim() || !this.contrasena.trim() || !this.rol_id) {
      this.snack.warn('Todos los campos son requeridos');
      return;
    }

    if (this.contrasena.length < 6) {
      this.snack.warn('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!this.validarEmail(this.email)) {
      this.snack.warn('Email no válido');
      return;
    }

    try {
      await usuariosService.crearUsuario({
        email: this.email.trim(),
        contrasena: this.contrasena,
        rol_id: parseInt(this.rol_id)
      });
      this.snack.success('Usuario creado correctamente');
      this.resetForm();
      await this.loadUsuarios();
    } catch (err: any) {
      this.snack.error(err?.message || 'Error creando usuario');
    }
  }

  // ========== CAMBIAR ESTADO ==========

  async cambiarEstado(usuario: any, nuevoEstado: 'ACTIVO' | 'INACTIVO') {
    const accion = nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar';
    const ok = await this.confirm.confirm({
      title: `Confirmar ${accion}`,
      message: `¿Está seguro de ${accion} a ${usuario.email}?`,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar'
    });
    if (!ok) return;

    try {
      await usuariosService.cambiarEstado(usuario.id_usuario, nuevoEstado);
      this.snack.success(`Usuario ${accion === 'activar' ? 'activado' : 'desactivado'} correctamente`);
      await this.loadUsuarios();
    } catch (err: any) {
      this.snack.error(err?.message || `Error al ${accion} usuario`);
    }
  }

  // ========== ELIMINAR USUARIO ==========

  async eliminarUsuario(id: number) {
    const ok = await this.confirm.confirm({
      title: 'Eliminar usuario',
      message: '¿Está seguro de eliminar este usuario?\n\nEsta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true
    });
    if (!ok) return;

    try {
      await usuariosService.eliminarUsuario(id);
      this.snack.success('Usuario eliminado correctamente');
      await this.loadUsuarios();
    } catch (err: any) {
      this.snack.error(err?.message || 'Error eliminando usuario');
    }
  }

  abrirModalEditar(usuario: any) {
    this.editUserId = usuario.id_usuario;
    this.editUserEmail = usuario.email;
    this.editNuevaContrasena = '';
    this.editNuevaContrasena2 = '';
    this.editSubmitted = false;
    this.editUserModalOpen = true;
  }

  cerrarModalEditar() {
    this.editUserModalOpen = false;
    this.editSubmitted = false;
    this.editUserId = null;
    this.editUserEmail = '';
    this.editNuevaContrasena = '';
    this.editNuevaContrasena2 = '';
  }

  async guardarNuevaContrasena(form?: NgForm) {
    this.editSubmitted = true;
    if (form && form.invalid) {
      try { form.control.markAllAsTouched(); } catch {}
      return;
    }
    const p1 = (this.editNuevaContrasena || '').trim();
    const p2 = (this.editNuevaContrasena2 || '').trim();
    if (!p1 || !p2) return;
    if (p1.length < 6) {
      this.snack.warn('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (p1 !== p2) {
      this.snack.warn('Las contraseñas no coinciden');
      return;
    }
    if (this.editUserId == null) return;
    try {
      await usuariosService.cambiarContrasena(this.editUserId, p1);
      this.snack.success('Contraseña actualizada correctamente');
      this.cerrarModalEditar();
      await this.loadUsuarios();
    } catch (err: any) {
      this.snack.error(err?.message || 'Error actualizando contraseña');
    }
  }

  // ========== FILTROS ==========

  filtrarUsuarios() {
    this.aplicarFiltros();
  }

  private aplicarFiltros() {
    const emailQ = this.normalizarTexto(this.emailQ);
    const rolQ = this.rolQ ? parseInt(this.rolQ) : null;
    const estadoQ = this.estadoQ.toUpperCase().trim();

    if (!emailQ && !rolQ && !estadoQ) {
      this.usuariosFiltrados = [...this.usuarios];
      this.usuariosFiltradosSig.set(this.usuariosFiltrados);
      return;
    }

    this.usuariosFiltrados = this.usuarios.filter(u => {
      const emailMatch = !emailQ || this.normalizarTexto(u.email).includes(emailQ);
      const rolMatch = !rolQ || u.rol_id === rolQ;
      const estadoMatch = !estadoQ || u.estado === estadoQ;
      return emailMatch && rolMatch && estadoMatch;
    });
    // actualizar signal con los resultados filtrados
    this.usuariosFiltradosSig.set(this.usuariosFiltrados);
  }

  resetFiltros() {
    this.emailQ = '';
    this.rolQ = '';
    this.estadoQ = '';
    this.aplicarFiltros();
  }

  // ========== UTILIDADES ==========

  resetForm() {
    this.email = '';
    this.contrasena = '';
    this.rol_id = '';
    this.mensaje = '';
  }

  normalizarTexto(s: string): string {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  validarEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  contarPorEstado(estado: string): number {
    return this.usuarios.filter(u => u.estado === estado).length;
  }

  async logout() {
    const ok = await this.confirm.confirm({
      title: 'Cerrar sesion',
      message: '¿Cerrar sesión?',
      confirmText: 'Si, salir',
      cancelText: 'Cancelar',
      danger: true
    });
    if (ok) {
      authService.logout();
    }
  }

   // Función para verificar permisos de cambiar rol
  canChangeRole(): boolean {
    const user = authUser();
    return user?.rol === 'Superadmin';
  }

  canEditAuxPerms(): boolean {
    return this.canChangeRole();
  }

  private defaultAuxPerms(): Record<string, boolean> {
    const perms: Record<string, boolean> = {};
    for (const mod of this.auxPermModules) perms[mod.key] = true;
    return perms;
  }

  private normalizeAuxPerms(perms: Record<string, boolean> | null | undefined): Record<string, boolean> {
    const base = this.defaultAuxPerms();
    if (!perms) return base;
    for (const mod of this.auxPermModules) {
      if (Object.prototype.hasOwnProperty.call(perms, mod.key)) {
        base[mod.key] = !!perms[mod.key];
      }
    }
    return base;
  }

  private setAuxPermsLocal(userId: number, perms: Record<string, boolean>) {
    const current = { ...this.auxPermsSig() };
    current[userId] = perms;
    this.auxPermsSig.set(current);
  }

  private setAuxPermSaving(userId: number, saving: boolean) {
    const current = { ...this.auxPermSavingSig() };
    current[userId] = saving;
    this.auxPermSavingSig.set(current);
  }

  getAuxPermValue(userId: number, key: string): boolean {
    const perms = this.auxPermsSig()[userId];
    if (!perms) return true;
    return perms[key] !== false;
  }

  isAuxPermSaving(userId: number): boolean {
    return !!this.auxPermSavingSig()[userId];
  }

  isAuxPermsExpanded(userId: number): boolean {
    const expanded = this.auxPermsExpandedSig()[userId];
    return expanded === true;
  }

  toggleAuxPermsExpanded(userId: number) {
    const current = { ...this.auxPermsExpandedSig() };
    current[userId] = !this.isAuxPermsExpanded(userId);
    this.auxPermsExpandedSig.set(current);
  }

  handleAuxCardClick(ev: Event, usuario: any) {
    if (!usuario || usuario.rol_nombre !== 'Auxiliar' || !this.canEditAuxPerms()) return;
    const target = ev.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('button, a, input, select, textarea, label')) return;
    this.toggleAuxPermsExpanded(usuario.id_usuario);
  }

  private async loadAuxPermsForUsers() {
    if (!this.canEditAuxPerms()) return;
    const auxUsers = this.usuarios.filter(u => (u.rol_nombre || '').toLowerCase() === 'auxiliar');
    if (!auxUsers.length) return;

    const updates: Record<number, Record<string, boolean>> = { ...this.auxPermsSig() };
    const ids = auxUsers.map(u => Number(u.id_usuario)).filter(n => Number.isFinite(n));

    try {
      const batch = await usuariosService.getPermisosAuxiliaresBatch(ids);
      for (const id of ids) {
        const perms = batch[id];
        updates[id] = this.normalizeAuxPerms(perms);
      }
      this.auxPermsSig.set(updates);
      return;
    } catch {
      // fallback: per-user requests
    }

    await Promise.all(auxUsers.map(async (u) => {
      try {
        const data = await usuariosService.getPermisosAuxiliares(u.id_usuario);
        updates[u.id_usuario] = this.normalizeAuxPerms(data?.permisos);
      } catch (err) {
        updates[u.id_usuario] = this.defaultAuxPerms();
      }
    }));
    this.auxPermsSig.set(updates);
  }

  async toggleAuxPerm(usuario: any, key: string, ev: Event) {
    if (!this.canEditAuxPerms()) return;
    const input = ev.target as HTMLInputElement | null;
    const checked = !!input?.checked;
    const userId = usuario.id_usuario;
    const prev = this.normalizeAuxPerms(this.auxPermsSig()[userId]);
    const next = { ...prev, [key]: checked };

    this.setAuxPermsLocal(userId, next);
    this.setAuxPermSaving(userId, true);
    try {
      await usuariosService.setPermisosAuxiliares(userId, next);
      this.snack.success('Permisos auxiliares actualizados');
    } catch (err: any) {
      this.setAuxPermsLocal(userId, prev);
      this.snack.error(err?.message || 'Error actualizando permisos auxiliares');
    } finally {
      this.setAuxPermSaving(userId, false);
    }
  }

  // Función para cambiar el rol
  async cambiarRol(usuario: any, nuevoRolId: number) {
    const rolId = Number(nuevoRolId);
    const rolSeleccionado = this.roles.find(r => Number(r.id_rol) === rolId);
    const nombreRol = rolSeleccionado ? rolSeleccionado.nombre : 'Desconocido';

    const ok = await this.confirm.confirm({
      title: 'Cambiar rol',
      message: `¿Está seguro de cambiar el rol de ${usuario.email} a ${nombreRol}?`,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      danger: true
    });
    if (!ok) {
      await this.loadUsuarios();
      return;
    }

    try {
      await usuariosService.cambiarRol(usuario.id_usuario, rolId);
      this.snack.success('Rol actualizado correctamente');
      await this.loadUsuarios();
    } catch (err: any) {
      this.snack.error(err?.message || 'Error cambiando rol');
      await this.loadUsuarios();
    }
  }
}
