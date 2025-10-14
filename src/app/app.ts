import { Component, signal } from '@angular/core';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { authService, authUser } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('app-lab');
  // expose the authUser signal to template
  readonly user = authUser;
  readonly isLoggingOut = signal(false);
  readonly currentYear = new Date().getFullYear();

  constructor(private router: Router) {}

  logout() {
    authService.logout();
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

  showFooter(): boolean {
    const url = this.router.url || '';
    // ocultar en login, registro y olvido de contraseña
    return !url.startsWith('/login') && !url.startsWith('/register') && !url.startsWith('/forgot');
  }
}
