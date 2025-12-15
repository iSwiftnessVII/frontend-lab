import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { authUser } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { reactivosService } from '../services/reactivos.service';
import { SnackbarService } from '../shared/snackbar.service';

@Component({
  standalone: true,
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css'],
  imports: [CommonModule, RouterModule, FormsModule]
})
export class PerfilComponent implements OnInit {
  readonly user = authUser;
  suscripcionEmail = '';
  suscripcionMsg = '';
  suscripcionLoading = false;
  suscritoSig = signal(false);
  
  constructor(public snack: SnackbarService) {}

  userShortName(): string {
    try {
      const email = this.user()?.email ?? '';
      if (!email) return '';
      const local = String(email).split('@')[0] || '';
      return local.replace(/[._]/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
    } catch {
      return '';
    }
  }

  async ngOnInit() {
    try {
      const u = this.user();
      if (u?.email) {
        const r = await reactivosService.estadoSuscripcion(u.email);
        this.suscritoSig.set(!!r?.suscrito);
        if (this.suscritoSig()) {
          this.snack.info('Estás suscrito a Reactivos');
        }
      }
    } catch {}
    effect(() => {
      const u = this.user();
      if (u?.email) {
        (async () => {
          try {
            const r = await reactivosService.estadoSuscripcion(u.email);
            this.suscritoSig.set(!!r?.suscrito);
          } catch {
            this.suscritoSig.set(false);
          }
        })();
      } else {
        this.suscritoSig.set(false);
      }
    });
  }

  async onSuscribirse() {
    const email = String(this.suscripcionEmail || '').trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !re.test(email)) {
      this.suscripcionMsg = 'Ingresa un correo válido';
      this.snack.warn('Ingresa un correo válido');
      return;
    }
    this.suscripcionLoading = true;
    this.suscripcionMsg = '';
    try {
      await reactivosService.suscribirse(email);
      this.suscripcionMsg = 'Suscripción confirmada. Revisa tu correo.';
      this.suscripcionEmail = '';
      this.suscritoSig.set(true);
      this.snack.success('Suscripción confirmada');
    } catch (err: any) {
      this.suscripcionMsg = err?.message || 'No se pudo suscribir';
      this.snack.error(this.suscripcionMsg);
    } finally {
      this.suscripcionLoading = false;
    }
  }
}
