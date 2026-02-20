import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { authUser } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { reactivosService } from '../services/reactivos.service';
import { SnackbarService } from '../shared/snackbar.service';
import { ConfirmService } from '../shared/confirm.service';

@Component({
  standalone: true,
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css'],
  imports: [CommonModule, RouterModule, FormsModule]
})
export class PerfilComponent implements OnInit {
  readonly user = authUser;
  public get esAuxiliar(): boolean {
    const u = this.user();
    return u?.rol === 'Auxiliar';
  }
  suscripcionMsg = '';
  suscripcionLoading = false;
  suscritoSig = signal(false);
  
  constructor(public snack: SnackbarService, private confirm: ConfirmService) {}

  userShortName(): string {
    try {
      const u = this.user();
      const nombre = String(u?.nombre ?? '').trim();
      if (nombre) {
        return nombre.replace(/\s+/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
      }
      const email = u?.email ?? '';
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
      }
    } catch {}
  }

  private subscriptionsEffectStop = effect(() => {
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

  async onSuscribirse() {
    const email = String(this.user()?.email || '').trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !re.test(email)) {
      this.suscripcionMsg = 'No hay correo válido en la sesión';
      this.snack.warn('No hay correo válido en la sesión');
      return;
    }
    this.suscripcionLoading = true;
    this.suscripcionMsg = '';
    try {
      await reactivosService.suscribirse(email);
      this.suscripcionMsg = 'Suscripción confirmada. Revisa tu correo.';
      this.suscritoSig.set(true);
      this.snack.success('Suscripción confirmada');
    } catch (err: any) {
      this.suscripcionMsg = err?.message || 'No se pudo suscribir';
      this.snack.error(this.suscripcionMsg);
    } finally {
      this.suscripcionLoading = false;
    }
  }


  async onCancelarSuscripcion() {
    const email = this.user()?.email || '';
    if (!email) {
      this.snack.warn('No hay usuario autenticado');
      return;
    }
    const ok = await this.confirm.confirm({
      title: 'Cancelar suscripcion',
      message: '¿Cancelar la suscripción a vencimiento de reactivos?',
      confirmText: 'Si, cancelar',
      cancelText: 'Cancelar',
      danger: true
    });
    if (!ok) return;
    this.suscripcionLoading = true;
    try {
      await reactivosService.cancelarSuscripcion(email);
      this.snack.success('Suscripción cancelada');
      this.suscritoSig.set(false);
      this.suscripcionMsg = 'Suscripción cancelada';
    } catch (err: any) {
      const msg = err?.message || 'No se pudo cancelar la suscripción';
      this.snack.error(msg);
      this.suscripcionMsg = msg;
    } finally {
      this.suscripcionLoading = false;
    }
  }

}
