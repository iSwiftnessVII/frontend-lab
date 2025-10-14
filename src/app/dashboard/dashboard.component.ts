import { Component } from '@angular/core';
import { authService, authUser } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule]
})
export class DashboardComponent {
  user: any = null;
  constructor(private router: Router) {
    this.load();
  }

  async load() {
    try {
      // With session-less client we can use authService or authUser
      const u = authUser();
      if (u) this.user = u;
      else {
        authService.logout();
        this.router.navigate(['/login']);
      }
    } catch (err) {
      authService.logout();
      this.router.navigate(['/login']);
    }
  }

  logout() {
    authService.logout();
    this.router.navigate(['/login']);
  }
}
