import { Component, signal, effect, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, RouterModule, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { SnackbarService } from './shared/snackbar.service';
import { CommonModule, NgIf } from '@angular/common';
import { authService, authUser } from './services/auth.service';

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
  readonly currentYear = new Date().getFullYear();
  readonly isNavigating = signal(false);
  
  // NUEVO: Signals para los menús seleccionados
  readonly selectedInventory = signal<string | null>(null);
  readonly selectedAnalysis = signal<string | null>(null);
  
  private routerSub?: any;
  private handleSelectClickRef = (ev: Event) => this.handleSelectClick(ev);
  private handleSelectFocusOutRef = (ev: FocusEvent) => this.handleSelectFocusOut(ev);
  private handleSelectKeydownRef = (ev: KeyboardEvent) => this.handleSelectKeydown(ev);

  constructor(private router: Router, public snack: SnackbarService) {
    // Inicializar autenticación con TU sistema
    void this.initAuth();
    
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
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.setSelectionsFromRoute(event.url);
      }
    });
  }

  // NUEVO: Método para detectar automáticamente las selecciones desde la ruta
  private setSelectionsFromRoute(url: string): void {
    const inventoryRoutes: { [key: string]: string } = {
      '/reactivos': 'reactivos',
      '/insumos': 'insumos',
      '/papeleria': 'papeleria',
      '/equipos': 'equipos',
      '/materiales-volumetricos': 'volumetricos',
      '/material-referencia': 'referencia'
    };

    const analysisRoutes: { [key: string]: string } = {
      '/auditoria': 'auditoria',
      '/reportes': 'reportes'
    };

    // Detectar inventario
    for (const [route, inventory] of Object.entries(inventoryRoutes)) {
      if (url.startsWith(route)) {
        this.selectedInventory.set(inventory);
        break;
      }
    }

    // Detectar análisis
    for (const [route, analysis] of Object.entries(analysisRoutes)) {
      if (url.startsWith(route)) {
        this.selectedAnalysis.set(analysis);
        break;
      }
    }

    // Resetear inventario si no está en ninguna ruta de inventario
    if (!Object.keys(inventoryRoutes).some(route => url.includes(route))) {
      this.selectedInventory.set(null);
    }

    // Resetear análisis si no está en ninguna ruta de análisis
    if (!Object.keys(analysisRoutes).some(route => url.includes(route))) {
      this.selectedAnalysis.set(null);
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
      'referencia': 'fa-vials'
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

  // NUEVO: Métodos para Análisis
  setSelectedAnalysis(analysis: string): void {
    this.selectedAnalysis.set(analysis);
  }

  getAnalysisIcon(analysis: string): string {
    const icons: { [key: string]: string } = {
      'auditoria': 'fa-clipboard-check',
      'reportes': 'fa-chart-bar'
    };
    return icons[analysis] || 'fa-chart-line';
  }

  getAnalysisName(analysis: string): string {
    const names: { [key: string]: string } = {
      'auditoria': 'Auditoría',
      'reportes': 'Reportes'
    };
    return names[analysis] || 'Análisis';
  }

  // NUEVO: Método para resetear las selecciones (opcional)
  resetSelections(): void {
    this.selectedInventory.set(null);
    this.selectedAnalysis.set(null);
  }

  // TU sistema de autenticación con checkAuth()
  private async initAuth() {
    try {
      await authService.checkAuth();
    } catch (err) {
      console.debug('No valid session on init:', err);
    }
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
    this.router.navigate(['/login']);
  }

  async onLogout() {
    if (this.isLoggingOut()) return;
    const confirmLogout = window.confirm('¿Deseas cerrar sesión?');
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

      // Close inventory dropdown when clicking outside
      const inv = document.querySelector('.nav-menu .dropdown');
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
  }

  showFooter(): boolean {
    const url = this.router.url || '';
    return !url.startsWith('/login') && !url.startsWith('/register') && !url.startsWith('/forgot');
  }
}