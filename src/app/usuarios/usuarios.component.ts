import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { authService } from '../services/auth.service';
import { usuariosService } from '../services/usuarios.service'

@Component({
  standalone: true,
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class UsuariosComponent implements OnInit {
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

  // Filtros
  emailQ: string = '';
  rolQ: any = '';
  estadoQ: string = '';

  ngOnInit() {
    this.loadRoles();
    this.loadUsuarios();
  }

  // ========== CARGAR DATOS ==========

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
      this.usuarios = await usuariosService.listarUsuarios();
      this.aplicarFiltros();
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      this.mensaje = '❌ Error cargando usuarios';
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
      this.mensaje = '⚠️ Todos los campos son requeridos';
      return;
    }

    if (this.contrasena.length < 6) {
      this.mensaje = '⚠️ La contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (!this.validarEmail(this.email)) {
      this.mensaje = '⚠️ Email no válido';
      return;
    }

    try {
      await usuariosService.crearUsuario({
        email: this.email.trim(),
        contrasena: this.contrasena,
        rol_id: parseInt(this.rol_id)
      });

      this.mensaje = '✅ Usuario creado correctamente';
      this.resetForm();
      await this.loadUsuarios();
    } catch (err: any) {
      this.mensaje = '❌ ' + (err?.message || 'Error creando usuario');
    }
  }

  // ========== CAMBIAR ESTADO ==========

  async cambiarEstado(usuario: any, nuevoEstado: 'ACTIVO' | 'INACTIVO') {
    const accion = nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar';
    if (!confirm(`¿Está seguro de ${accion} a ${usuario.email}?`)) return;

    try {
      await usuariosService.cambiarEstado(usuario.id_usuario, nuevoEstado);
      this.mensaje = `✅ Usuario ${accion === 'activar' ? 'activado' : 'desactivado'} correctamente`;
      await this.loadUsuarios();
    } catch (err: any) {
      this.mensaje = '❌ ' + (err?.message || `Error al ${accion} usuario`);
    }
  }

  // ========== ELIMINAR USUARIO ==========

  async eliminarUsuario(id: number) {
    if (!confirm('¿Está seguro de eliminar este usuario?\n\nEsta acción no se puede deshacer.')) {
      return;
    }

    try {
      await usuariosService.eliminarUsuario(id);
      this.mensaje = '✅ Usuario eliminado correctamente';
      await this.loadUsuarios();
    } catch (err: any) {
      this.mensaje = '❌ ' + (err?.message || 'Error eliminando usuario');
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
      return;
    }

    this.usuariosFiltrados = this.usuarios.filter(u => {
      const emailMatch = !emailQ || this.normalizarTexto(u.email).includes(emailQ);
      const rolMatch = !rolQ || u.rol_id === rolQ;
      const estadoMatch = !estadoQ || u.estado === estadoQ;
      return emailMatch && rolMatch && estadoMatch;
    });
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

  logout() {
    if (confirm('¿Cerrar sesión?')) {
      authService.logout();
    }
  }
}