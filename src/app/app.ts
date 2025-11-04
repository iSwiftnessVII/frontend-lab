import { Component, signal, effect, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { authService, authUser } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, NgIf],
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

  constructor(private router: Router) {
    // Inicializar autenticación con TU sistema
    void this.initAuth();
    
    // Mantener características UI del repositorio
    this.constructorEffectSetup();
    document.addEventListener('click', this.handleDocumentClick, true);
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

  ngOnDestroy(): void {
    try { document.removeEventListener('click', this.handleDocumentClick, true); } catch (e) {}
  }

  showFooter(): boolean {
    const url = this.router.url || '';
    return !url.startsWith('/login') && !url.startsWith('/register') && !url.startsWith('/forgot');
  }
}