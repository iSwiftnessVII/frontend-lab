import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class ForgotComponent implements OnInit, OnDestroy {
  email = '';
  loading = false;
  submitted = false;
  message = '';

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit(): void {
    this.renderer.addClass(this.document.body, 'auth-page');
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(this.document.body, 'auth-page');
  }

  async onSubmit(e: Event) {
    e.preventDefault();
    if (!this.email) return;
    this.loading = true;
    this.message = '';
    try {
      // Simulación de solicitud; aquí iría el llamado real a la API si existiera.
      await new Promise((res) => setTimeout(res, 800));
      this.submitted = true;
      this.message = 'Si el correo está registrado, te enviaremos un enlace para restablecer tu contraseña.';
    } catch (err) {
      this.message = 'Ocurrió un error al procesar la solicitud. Intenta nuevamente.';
    } finally {
      this.loading = false;
    }
  }
}
