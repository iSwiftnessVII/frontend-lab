import { Component, signal, effect, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, RouterModule, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { SnackbarService } from './shared/snackbar.service';
import { CommonModule, NgIf } from '@angular/common';
import { authService, authUser } from './services/auth.service';
import { reactivosService } from './services/reactivos.service';
import { ConfirmService } from './shared/confirm.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
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
    }
  ]);
  
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

    this.hydrateUpdatesNotes();
  }

  hasUpdateNotes(): boolean {
    return this.updatesNotes().some((note) => !!note.hasNotes);
  }

  openUpdatesModal(): void {
    this.menuOpen.set(false);
    this.updatesModalOpen.set(true);
  }

  closeUpdatesModal(): void {
    this.updatesModalOpen.set(false);
  }

  openUpdateDetail(note: { id: number; date: string; title: string; summary: string; detail: string; hasNotes?: boolean }): void {
    this.updatesModalOpen.set(false);
    if (note?.hasNotes) {
      this.markUpdateAsRead(note.id);
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
    const readIds = this.getReadUpdateIds();
    return this.updatesNotes().map((item) => (
      readIds.has(item.id) ? { ...item, hasNotes: false } : item
    ));
  }

  private getReadUpdateIds(): Set<number> {
    try {
      const raw = window.localStorage?.getItem('liba.updates.read') || '[]';
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.map((id) => Number(id)).filter((id) => Number.isFinite(id)));
      }
    } catch {}
    return new Set();
  }

  private markUpdateAsRead(id: number): void {
    try {
      const readIds = this.getReadUpdateIds();
      readIds.add(id);
      window.localStorage?.setItem('liba.updates.read', JSON.stringify(Array.from(readIds)));
    } catch {}
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
