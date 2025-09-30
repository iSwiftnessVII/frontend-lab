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

  constructor(private router: Router) {}

  logout() {
    authService.logout();
    this.router.navigate(['/login']);
  }
}
