import { Component, signal, effect, OnDestroy, untracked } from '@angular/core';
import { RouterOutlet, Router, RouterModule, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { SnackbarService } from './shared/snackbar.service';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { authService, authUser } from './services/auth.service';
import { reactivosService } from './services/reactivos.service';
import { ConfirmService } from './shared/confirm.service';
import { excelService } from './services/excel.service';
import { notificationsService } from './services/notifications.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnDestroy {
  protected readonly title = signal('app-lab');
  readonly user = authUser;
  readonly isLoggingOut = signal(false);
  readonly menuOpen = signal(false);
  readonly inventoryMenuOpen = signal(false);
  readonly isDarkMode = signal<boolean>(false);
  readonly currentYear = new Date().getFullYear();
  readonly isNavigating = signal(false);
  readonly appVersion = (() => {
    try {
      return (window as any)?.__env?.APP_VERSION || '';
    } catch {
      return '';
    }
  })();
  // whether footer should be shown because page needs scrolling
  readonly footerNeeded = signal<boolean>(false);
  readonly reactivosPorVencerCount = signal<number>(0);
  readonly reactivosVencidosCount = signal<number>(0);
  readonly reactivosAlertLoading = signal<boolean>(false);
  readonly reactivosPorVencerList = signal<any[]>([]);
  readonly reactivosVencidosList = signal<any[]>([]);
  readonly notifVencidosOpen = signal<boolean>(false);
  readonly notifPorVencerOpen = signal<boolean>(false);

  readonly updatesModalOpen = signal(false);
  readonly updatesDetailOpen = signal(false);
  readonly selectedUpdate = signal<{ id: number; date: string; title: string; summary: string; detail: string; hasNotes?: boolean } | null>(null);
  readonly readUpdateIds = signal<Set<number>>(new Set());
  readonly excelModalOpen = signal(false);
  readonly excelBusy = signal<'unlock' | 'lock' | null>(null);
  excelFiles: File[] = [];
  excelFileName: string = '';
  excelPassword = '';
  excelMsg = '';

  get excelFilesSorted(): File[] {
    return [...this.excelFiles].sort((a, b) => (a?.name || '').localeCompare(b?.name || '', 'es', { sensitivity: 'base' }));
  }

  get excelFilesTotalSize(): string {
    const total = this.excelFiles.reduce((sum, f) => sum + (Number(f?.size) || 0), 0);
    return this.formatBytes(total);
  }
  readonly updatesNotes = signal<Array<{ id: number; date: string; title: string; summary: string; detail: string; hasNotes?: boolean }>>([
    {
      id: 1,
      date: '2026-02-10',
      title: 'Plantillas: loops y permisos auxiliares',
      summary: 'Se habilitaron loops por modulo y el control de acceso para auxiliares.',
      detail: 'Se agregaron botones de Generar loop en los apartados de Plantillas.\nSe habilito el manejo de loops en backend para Equipos, Volumetricos y Referencia.\nSe agrego el permiso Plantillas para auxiliares y el modo solo lectura en la UI.\nSe habilito el acceso a Plantillas para Auxiliar en el menu y las rutas.',
      hasNotes: true
    },
    {
      id: 3,
      date: '2026-02-10',
      title: 'Guia de llaves: apartados ampliados',
      summary: 'Se ampliaron guias con llaves y mini menus por modulo.',
      detail: 'Se agregaron apartados con llaves detalladas para Equipos, Volumetricos y Referencia.\nSe organizaron mini menus por bloque (material, historial e intervalos).\nSe ajusto el panel de ayuda para facilitar la navegacion.',
      hasNotes: true
    },
    {
      id: 4,
      date: '2026-02-16',
      title: 'Excel: bloqueo y desbloqueo de hojas',
      summary: 'Nuevo modal para bloquear o desbloquear hojas Excel desde el menu de perfil.',
      detail: 'Se agrego un modal de Excel con soporte para multiples archivos.\nDesbloquea la proteccion de hojas con contraseña y bloquea solo celdas con informacion dejando vacias editables.\nPermite definir una contraseña al bloquear hojas.\nLa opcion solo esta visible para Administrador y Superadmin.',
      hasNotes: true
    }
  ]);

  get updatesNotesSorted() {
    return [...this.updatesNotes()].sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (b.id || 0) - (a.id || 0);
    });
  }
  
  // NUEVO: Signals para los menús seleccionados
  readonly selectedInventory = signal<string | null>(null);
  
  private routerSub?: any;
  private resizeHandler?: () => void;
  private routeEndHandler?: () => void;
  private handleSelectClickRef = (ev: Event) => this.handleSelectClick(ev);
  private handleSelectFocusOutRef = (ev: FocusEvent) => this.handleSelectFocusOut(ev);
  private handleSelectKeydownRef = (ev: KeyboardEvent) => this.handleSelectKeydown(ev);

  constructor(private router: Router, public snack: SnackbarService, public confirm: ConfirmService) {
    // Inicializar autenticación con TU sistema
    void this.initAuth();

    // Mantener alertas de reactivos sincronizadas con la sesión
    effect(() => {
      const u = this.user();
      if (u) {
        void this.cargarReactivosAlertas();
      } else {
        this.reactivosPorVencerCount.set(0);
        this.reactivosVencidosCount.set(0);
      }
    });

    effect(() => {
      const u = this.user();
      untracked(() => {
        if (u) {
          void this.loadUpdateReads();
        } else {
          this.readUpdateIds.set(new Set());
          this.updatesNotes.set(this.hydrateUpdatesNotes());
        }
      });
    });

    // Theme init (dark/light)
    this.initTheme();
    
    // Mantener características UI del repositorio
    this.constructorEffectSetup();
    document.addEventListener('click', this.handleDocumentClick, true);
    // Global select caret state: toggle data-select-open on parent div to rotate chevron
    try {
      document.addEventListener('click', this.handleSelectClickRef, true);
      document.addEventListener('focusout', this.handleSelectFocusOutRef, true);
      document.addEventListener('keydown', this.handleSelectKeydownRef, true);
    } catch {}

    // Route transition animation: toggle navigating flag on router events
    this.routerSub = this.router.events.subscribe(ev => {
      if (ev instanceof NavigationStart) {
        this.isNavigating.set(true);
      }
      if (ev instanceof NavigationEnd || ev instanceof NavigationCancel || ev instanceof NavigationError) {
        // small delay to let new view render before removing effect
        setTimeout(() => this.isNavigating.set(false), 80);
      }
    });

    // NUEVO: Detectar automáticamente la ruta actual para establecer las selecciones
    this.setSelectionsFromRoute(this.router.url);
    
    // NUEVO: Suscribirse a cambios de ruta para actualizar automáticamente
        (this as any)._footerRouterSub = this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        this.setSelectionsFromRoute(event.url);
      }
    });

    // Setup footer visibility detection (show footer only when page is scrollable)
    this.setupFooterDetection();

    this.updatesNotes.set(this.hydrateUpdatesNotes());
  }

  hasUpdateNotes(): boolean {
    return this.updatesNotes().some((note) => !!note.hasNotes);
  }

  openUpdatesModal(): void {
    this.menuOpen.set(false);
    this.updatesModalOpen.set(true);
  }

  openExcelModal(): void {
    const rol = this.user()?.rol;
    if (rol !== 'Administrador' && rol !== 'Superadmin') {
      this.snack.warn('No tienes permisos para usar Excel');
      return;
    }
    this.menuOpen.set(false);
    this.excelModalOpen.set(true);
    this.excelMsg = '';
  }

  closeExcelModal(): void {
    if (this.excelBusy()) return;
    this.excelModalOpen.set(false);
  }

  onExcelFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement | null;
    const files = input?.files ? Array.from(input.files) : [];
    this.excelFiles = files;
    if (files.length === 1) {
      this.excelFileName = files[0].name || '';
    } else if (files.length > 1) {
      this.excelFileName = `${files.length} archivos seleccionados`;
    } else {
      this.excelFileName = '';
    }
    this.excelMsg = '';
  }

  clearExcelFile(input?: HTMLInputElement): void {
    this.excelFiles = [];
    this.excelFileName = '';
    this.excelPassword = '';
    this.excelMsg = '';
    if (input) input.value = '';
  }

  private downloadExcel(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  formatBytes(bytes: number): string {
    const value = Number(bytes) || 0;
    if (value <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const idx = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)));
    const sized = value / Math.pow(1024, idx);
    return `${sized.toFixed(sized >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
  }

  async unlockExcelFile(input?: HTMLInputElement): Promise<void> {
    if (!this.excelFiles.length) {
      this.snack.warn('Selecciona un archivo Excel');
      return;
    }
    this.excelBusy.set('unlock');
    this.excelMsg = '';
    try {
      for (const file of this.excelFiles) {
        const { blob, filename } = await excelService.unlockExcel(file);
        this.downloadExcel(blob, filename);
      }
      this.excelMsg = this.excelFiles.length > 1 ? 'Archivos desbloqueados.' : 'Archivo desbloqueado.';
      this.snack.success(this.excelMsg);
      this.clearExcelFile(input);
    } catch (err: any) {
      const msg = err?.message || 'No se pudo desbloquear el archivo';
      this.excelMsg = msg;
      this.snack.error(msg);
    } finally {
      this.excelBusy.set(null);
    }
  }

  async lockExcelFile(input?: HTMLInputElement): Promise<void> {
    if (!this.excelFiles.length) {
      this.snack.warn('Selecciona un archivo Excel');
      return;
    }
    this.excelBusy.set('lock');
    this.excelMsg = '';
    try {
      for (const file of this.excelFiles) {
        const { blob, filename } = await excelService.lockExcel(file, this.excelPassword);
        this.downloadExcel(blob, filename);
      }
      this.excelMsg = this.excelFiles.length > 1 ? 'Archivos bloqueados.' : 'Archivo bloqueado.';
      this.snack.success(this.excelMsg);
      this.clearExcelFile(input);
    } catch (err: any) {
      const msg = err?.message || 'No se pudo bloquear el archivo';
      this.excelMsg = msg;
      this.snack.error(msg);
    } finally {
      this.excelBusy.set(null);
    }
  }

  closeUpdatesModal(): void {
    this.updatesModalOpen.set(false);
  }

  async openUpdateDetail(note: { id: number; date: string; title: string; summary: string; detail: string; hasNotes?: boolean }): Promise<void> {
    this.updatesModalOpen.set(false);
    if (note?.hasNotes) {
      await this.markUpdateAsRead(note.id);
      const updated = this.hydrateUpdatesNotes();
      this.updatesNotes.set(updated);
      const normalized = updated.find((item) => item.id === note.id) || note;
      this.selectedUpdate.set(normalized);
    } else {
      this.selectedUpdate.set(note);
    }
    this.updatesDetailOpen.set(true);
  }

  private hydrateUpdatesNotes(): Array<{ id: number; date: string; title: string; summary: string; detail: string; hasNotes?: boolean }> {
    const readIds = this.readUpdateIds();
    return this.updatesNotes().map((item) => ({
      ...item,
      hasNotes: !readIds.has(item.id)
    }));
  }

  private async loadUpdateReads(): Promise<void> {
    try {
      const ids = await notificationsService.getReadUpdateIds();
      this.readUpdateIds.set(new Set(ids));
    } catch {
      // keep local state if backend is unavailable
    } finally {
      this.updatesNotes.set(this.hydrateUpdatesNotes());
    }
  }

  private async markUpdateAsRead(id: number): Promise<void> {
    const prev = new Set(this.readUpdateIds());
    if (prev.has(id)) return;
    const next = new Set(prev);
    next.add(id);
    this.readUpdateIds.set(next);
    this.updatesNotes.set(this.hydrateUpdatesNotes());

    try {
      await notificationsService.markUpdatesRead([id]);
    } catch (err: any) {
      this.readUpdateIds.set(prev);
      this.updatesNotes.set(this.hydrateUpdatesNotes());
      this.snack.error(err?.message || 'No se pudo guardar la notificacion como leida');
    }
  }

  closeUpdateDetail(): void {
    this.updatesDetailOpen.set(false);
    this.selectedUpdate.set(null);
  }

  private initTheme(): void {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;

      const stored = window.localStorage?.getItem('liba.theme');
      if (stored === 'dark' || stored === 'light') {
        this.setTheme(stored);
        return;
      }

      // Default: follow OS preference when no stored value exists
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
      this.setTheme(prefersDark ? 'dark' : 'light', { persist: false });
    } catch {
      // ignore
    }
  }

  private setTheme(theme: 'dark' | 'light', opts?: { persist?: boolean }): void {
    const persist = opts?.persist !== false;
    try {
      this.isDarkMode.set(theme === 'dark');
    } catch {}

    try {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
      }
    } catch {}

    if (persist) {
      try { window.localStorage?.setItem('liba.theme', theme); } catch {}
    }
  }

  toggleTheme(ev?: Event): void {
    try { ev?.stopPropagation(); } catch {}
    const next = this.isDarkMode() ? 'light' : 'dark';
    this.setTheme(next);
  }

  // NUEVO: Método para detectar automáticamente las selecciones desde la ruta
  private setSelectionsFromRoute(url: string): void {
    const inventoryRoutes: { [key: string]: string } = {
      '/reactivos': 'reactivos',
      '/insumos': 'insumos',
      '/papeleria': 'papeleria',
      '/equipos': 'equipos',
      '/materiales-volumetricos': 'volumetricos',
      '/materiales-referencia': 'referencia'
    };

    // Detectar inventario
    for (const [route, inventory] of Object.entries(inventoryRoutes)) {
      if (url.startsWith(route)) {
        this.selectedInventory.set(inventory);
        break;
      }
    }


    // Resetear inventario si no está en ninguna ruta de inventario
    if (!Object.keys(inventoryRoutes).some(route => url.includes(route))) {
      this.selectedInventory.set(null);
    }

  }

  // NUEVO: Métodos para Inventario
  setSelectedInventory(inventory: string): void {
    this.selectedInventory.set(inventory);
    this.inventoryMenuOpen.set(false); // Cerrar el dropdown después de seleccionar
  }

  getInventoryIcon(inventory: string): string {
    const icons: { [key: string]: string } = {
      'reactivos': 'fa-flask',
      'insumos': 'fa-boxes',
      'papeleria': 'fa-paperclip',
      'equipos': 'fa-microscope',
      'volumetricos': 'fa-vial',
      'referencia': 'fa-vial'
    };
    return icons[inventory] || 'fa-warehouse';
  }

  getInventoryName(inventory: string): string {
    const names: { [key: string]: string } = {
      'reactivos': 'Reactivos',
      'insumos': 'Insumos',
      'papeleria': 'Papelería',
      'equipos': 'Equipos',
      'volumetricos': 'Volumétricos',
      'referencia': 'Referencia'
    };
    return names[inventory] || 'Inventario';
  }

  // NUEVO: Método para resetear las selecciones (opcional)
  resetSelections(): void {
    this.selectedInventory.set(null);
  }

  // TU sistema de autenticación con checkAuth()
  private async initAuth() {
    try {
      await authService.checkAuth();
    } catch (err) {
      console.debug('No valid session on init:', err);
    }
  }

  private isReactivoActivo(val: any): boolean {
    if (val === undefined || val === null) return true;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val === 1;
    const s = String(val).trim().toLowerCase();
    return s === '1' || s === 'true' || s === 't' || s === 'yes' || s === 'y';
  }

  private async cargarReactivosAlertas(): Promise<void> {
    if (!this.user()) return;
    this.reactivosAlertLoading.set(true);
    try {
      const resp = await reactivosService.listarReactivos('', 1000);
      const reactivos = Array.isArray(resp) ? resp : (resp?.rows || []);
      const visibles = reactivos.filter((r: any) => this.isReactivoActivo(r?.activo));

      const hoy = new Date();
      const limite = new Date();
      limite.setDate(hoy.getDate() + 30);

      const porVencer = visibles.filter((reactivo: any) => {
        if (!reactivo.fecha_vencimiento) return false;
        const fechaVenc = new Date(reactivo.fecha_vencimiento);
        return fechaVenc <= limite && fechaVenc >= hoy;
      });

      const vencidos = visibles.filter((reactivo: any) => {
        if (!reactivo.fecha_vencimiento) return false;
        const fechaVenc = new Date(reactivo.fecha_vencimiento);
        return fechaVenc < hoy;
      });

      this.reactivosPorVencerCount.set(porVencer.length);
      this.reactivosVencidosCount.set(vencidos.length);
      this.reactivosPorVencerList.set(porVencer);
      this.reactivosVencidosList.set(vencidos);
    } catch (error) {
      console.error('Error cargando alertas de reactivos:', error);
      this.reactivosPorVencerCount.set(0);
      this.reactivosVencidosCount.set(0);
      this.reactivosPorVencerList.set([]);
      this.reactivosVencidosList.set([]);
    } finally {
      this.reactivosAlertLoading.set(false);
    }
  }

  toggleNotifVencidos(ev?: Event): void {
    try { ev?.stopPropagation(); } catch {}
    this.notifVencidosOpen.set(!this.notifVencidosOpen());
    if (this.notifVencidosOpen()) {
      this.notifPorVencerOpen.set(false);
    }
  }

  toggleNotifPorVencer(ev?: Event): void {
    try { ev?.stopPropagation(); } catch {}
    this.notifPorVencerOpen.set(!this.notifPorVencerOpen());
    if (this.notifPorVencerOpen()) {
      this.notifVencidosOpen.set(false);
    }
  }

  closeNotifPanels(): void {
    this.notifVencidosOpen.set(false);
    this.notifPorVencerOpen.set(false);
  }

  // Mantener el effect para debug (opcional)
  constructorEffectSetup() {
    effect(() => {
      const u = authUser();
      console.debug('[app] auth state change: authUser=', u);
    });
  }

  // TUS métodos de roles
  async ngOnInit() {
    // Ya se llama en initAuth(), pero lo dejamos por compatibilidad
    const user = await authService.checkAuth();
  }

  isSuperadmin(): boolean {
    return authService.isSuperadmin();
  }

  isAdminOrAuxiliar(): boolean {
    return authService.isAdmin() || authService.isAuxiliar();
  }

  // Métodos del repositorio para UI
  logout() {
    authService.logout();
    this.menuOpen.set(false);
    // Ensure route transition effect can't block the login inputs
    this.isNavigating.set(false);
    this.router.navigate(['/login']);
  }

  async onLogout() {
    if (this.isLoggingOut()) return;
    const confirmLogout = await this.confirm.confirm({
      title: 'Cerrar sesion',
      message: '¿Deseas cerrar sesion?',
      confirmText: 'Si, salir',
      cancelText: 'Cancelar',
      danger: true
    });
    if (!confirmLogout) return;
    try {
      this.isLoggingOut.set(true);
      await Promise.resolve();
      this.logout();
    } finally {
      this.isLoggingOut.set(false);
    }
  }

  toggleUserMenu() {
    this.menuOpen.set(!this.menuOpen());
  }

  toggleInventoryMenu(ev?: Event) {
    try { ev?.stopPropagation(); } catch {}
    this.inventoryMenuOpen.set(!this.inventoryMenuOpen());
  }

  closeInventoryMenu() {
    this.inventoryMenuOpen.set(false);
  }

  goToPerfil() {
    try { this.menuOpen.set(false); } catch {}
    void this.router.navigate(['/perfil']);
  }

  userShortName(): string {
    try {
      const email = this.user()?.email ?? '';
      if (!email) return '';
      const local = String(email).split('@')[0] || '';
      return local.replace(/[._]/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
    } catch (e) {
      return '';
    }
  }

  private handleDocumentClick = (ev: Event) => {
    try {
      const menu = document.querySelector('#app-header .user-menu');
      const target = ev.target as Node | null;
      if (target && menu && !menu.contains(target)) {
        this.menuOpen.set(false);
      }

      const notif = document.querySelector('#app-header .header-notifs');
      if (target && notif && !notif.contains(target)) {
        this.closeNotifPanels();
      }

      // Close inventory dropdown when clicking outside
      const inv = document.querySelector('.nav-menu .full-width-dropdown');
      if (target && inv && !inv.contains(target)) {
        this.inventoryMenuOpen.set(false);
      }
    } catch (e) {
      // ignore
    }
  };

  private handleSelectClick(ev: Event) {
    const t = ev.target as HTMLElement | null;
    if (!t || t.tagName !== 'SELECT') return;
    // Toggle on wrapper if exists, else on the select itself
    const wrapper = t.parentElement as HTMLElement | null;
    const targetEl = (wrapper ?? t) as HTMLElement;
    const isOpen = targetEl.getAttribute('data-select-open') === 'true' || targetEl.getAttribute('data-open') === 'true';
    // Use data-select-open for compatibility; also set data-open for simple selectors if needed
    targetEl.setAttribute('data-select-open', isOpen ? 'false' : 'true');
    targetEl.setAttribute('data-open', isOpen ? 'false' : 'true');
  }

  private handleSelectFocusOut(ev: FocusEvent) {
    const t = ev.target as HTMLElement | null;
    if (!t || t.tagName !== 'SELECT') return;
    const wrapper = t.parentElement as HTMLElement | null;
    const targetEl = (wrapper ?? t) as HTMLElement;
    targetEl.removeAttribute('data-select-open');
    targetEl.removeAttribute('data-open');
  }

  private handleSelectKeydown(ev: KeyboardEvent) {
    const t = ev.target as HTMLElement | null;
    if (!t || t.tagName !== 'SELECT') return;
    if (ev.key === 'Escape' || ev.key === 'Esc') {
      const wrapper = t.parentElement as HTMLElement | null;
      const targetEl = (wrapper ?? t) as HTMLElement;
      targetEl.removeAttribute('data-select-open');
      targetEl.removeAttribute('data-open');
    }
  }

  ngOnDestroy(): void {
    try { document.removeEventListener('click', this.handleDocumentClick, true); } catch (e) {}
    try { document.removeEventListener('click', this.handleSelectClickRef, true); } catch {}
    try { document.removeEventListener('focusout', this.handleSelectFocusOutRef, true); } catch {}
    try { document.removeEventListener('keydown', this.handleSelectKeydownRef, true); } catch {}
    try { this.routerSub?.unsubscribe?.(); } catch {}
    try { window.removeEventListener('resize', this.resizeHandler!); } catch {}
    try { (this as any)._footerMutationObserver?.disconnect?.(); } catch {}
    try { (this as any)._footerRouterSub?.unsubscribe?.(); } catch {}
  }
  showFooter(): boolean {
    const url = this.router.url || '';
    // Only show footer on non-auth routes and when page requires scrolling
    const routeOk = !url.startsWith('/login') && !url.startsWith('/register') && !url.startsWith('/forgot');
    return routeOk && this.footerNeeded();
  }

  // Observe page size and update `footerNeeded` whenever content height changes
  private setupFooterDetection(): void {
    const recompute = () => {
      try {
        const needs = (typeof window !== 'undefined' && typeof document !== 'undefined')
          ? (document.body.scrollHeight > window.innerHeight)
          : false;
        this.footerNeeded.set(!!needs);
      } catch (e) {
        // ignore
      }
    };

    // Initial check after small delay to let view render
    setTimeout(recompute, 120);

    // Recompute on window resize
    this.resizeHandler = () => recompute();
    window.addEventListener('resize', this.resizeHandler);

    // Also recompute after navigation end (content changed)
    this.router.events.subscribe(ev => {
      if (ev instanceof NavigationEnd) {
        // give route a moment to render
        setTimeout(recompute, 80);
      }
    });

    // MutationObserver to detect content changes that affect height
    try {
      const mo = new MutationObserver(() => recompute());
      mo.observe(document.body, { childList: true, subtree: true, attributes: true });
      // store on this for potential cleanup (not strictly necessary)
      (this as any)._footerMutationObserver = mo;
    } catch (e) {}
  }
}
