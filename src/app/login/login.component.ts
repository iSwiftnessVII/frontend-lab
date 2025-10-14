import { Component, OnInit, OnDestroy, Renderer2, Inject } from '@angular/core';
import { DOCUMENT, CommonModule } from '@angular/common';
import { authService } from '../services/auth.service';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class LoginComponent implements OnInit, OnDestroy {
  email = '';
  password = '';
  error = '';
  loading = false;
  triedSubmit = false;
  private returnUrl = '/dashboard';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
  ) {
    const q = this.route.snapshot.queryParamMap.get('returnUrl');
    // Aceptar sólo rutas internas seguras empezando por '/dashboard'
    if (q && /^\/dashboard(\/|$)/.test(q)) {
      this.returnUrl = q;
    } else {
      this.returnUrl = '/dashboard';
    }
  }

  ngOnInit(): void {
    this.renderer.addClass(this.document.body, 'auth-page');
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(this.document.body, 'auth-page');
  }

  async onSubmit(e: Event, form?: NgForm) {
    e?.preventDefault();
    this.triedSubmit = true;
    this.error = '';
    if (form && form.invalid) {
      // Marcar todos los controles como tocados para mostrar errores
      Object.values(form.controls).forEach((c: any) => c?.control?.markAsTouched?.());
      return; // No continuar si el formulario es inválido
    }
    this.loading = true;
    try {
      await authService.login(this.email, this.password);
      this.triedSubmit = false;
      await this.router.navigateByUrl(this.returnUrl);
    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);
      this.error = err?.message || 'Error al iniciar sesión. Intenta nuevamente.';
    } finally {
      this.loading = false;
    }
  }

  // Placeholder for Google sign-in flow (UI only)
  onGoogleSignIn() {
    // implement OAuth redirect or popup here
    console.log('Google sign-in clicked');
  }
}
