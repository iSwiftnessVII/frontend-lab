import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { authService } from '../services/auth.service';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class RegisterComponent implements OnInit, OnDestroy {
  name = '';
  email = '';
  password = '';
  error = '';
  success = '';

  constructor(private router: Router) {}

  ngOnInit() {
    document.body.classList.add('auth-page');
  }

  ngOnDestroy() {
    document.body.classList.remove('auth-page');
  }

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

