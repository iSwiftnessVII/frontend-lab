import { Component, OnInit, OnDestroy, Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { authService } from '../services/auth.service';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

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
  showPassword = false;
  error = '';
  success = '';

  constructor(
    private router: Router,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    console.debug('[register] ngOnInit: adding body.auth-page');
    this.renderer.addClass(this.document.body, 'auth-page');
  }

  ngOnDestroy(): void {
    console.debug('[register] ngOnDestroy: removing body.auth-page');
    this.renderer.removeClass(this.document.body, 'auth-page');
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

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }
}

