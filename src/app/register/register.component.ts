import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { authService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [CommonModule, FormsModule, RouterModule]
})
export class RegisterComponent {
  email = '';
  password = '';
  error = '';
  success = '';

  constructor(private router: Router) {}

  async onSubmit(e: Event) {
    e.preventDefault();
    try {
      this.error = '';
      this.success = '';
      await authService.register(this.email, this.password);
      this.success = 'Usuario registrado exitosamente. Redirigiendo al login...';
      // Redirigir al login después de un breve delay para mostrar el mensaje
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } catch (err: any) {
      this.error = err.message || 'Error en el registro';
    }
  }
}

