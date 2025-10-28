import { Component, signal, effect, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { authService, authUser, authInitializing } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnDestroy {
  protected readonly title = signal('app-lab');
  // expose the authUser signal to template
  readonly user = authUser;
  readonly isLoggingOut = signal(false);
  readonly menuOpen = signal(false);
  readonly currentYear = new Date().getFullYear();

  constructor(private router: Router) {
    // Try to restore the real user from stored token. Do not block the
    // constructor (guards may call whoami themselves) but start the async
    // initialization so the UI will update when the call completes.
    void this.initAuth();
    this.constructorEffectSetup();
    // Close user menu when clicking outside
    document.addEventListener('click', this.handleDocumentClick, true);
  }

  private async initAuth() {
    try {
      await authService.whoami();
    } catch (err) {
      // If validation fails we ensure logout state is clean (token removed by whoami)
      console.debug('No valid session on init:', err);
    }
  }

  // Expose auth initializing state to the template
  isAuthInitializing = authInitializing;

  constructorEffectSetup() {
    // Log auth state changes to help debug menu disappearance
    effect(() => {
      const u = authUser();
      const init = authInitializing();
      console.debug('[app] auth state change: authUser=', u, 'authInitializing=', init);
    });
  }

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

  // Derive a short display name from the user's email (part before @)
  userShortName(): string {
    try {
      const email = this.user()?.email ?? '';
      if (!email) return '';
      const local = String(email).split('@')[0] || '';
      // replace dots/underscores with spaces and capitalize words
      return local.replace(/[._]/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
    } catch (e) {
      return '';
    }
  }

  // Document click handler to close menu when clicking outside .user-menu
  private handleDocumentClick = (ev: Event) => {
    try {
      const menu = document.querySelector('#app-header .user-menu');
      if (!menu) return;
      const target = ev.target as Node | null;
      if (!target) return;
      if (!menu.contains(target)) {
        this.menuOpen.set(false);
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
    // ocultar en login, registro y olvido de contraseña
    return !url.startsWith('/login') && !url.startsWith('/register') && !url.startsWith('/forgot');
  }
}
