import { Component, OnInit, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { authUser } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { reactivosService } from '../services/reactivos.service';
import { SnackbarService } from '../shared/snackbar.service';
import { SolicitudesService } from '../services/clientes/solicitudes.service';

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
  revisionEmail = '';
  revisionMsg = '';
  revisionLoading = false;
  suscritoRevisionSig = signal(false);
  private solicitudesService = inject(SolicitudesService);
  
  
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
        try {
          const rr = await this.solicitudesService.estadoSuscripcionRevision(u.email);
          this.suscritoRevisionSig.set(!!rr?.suscrito);
        } catch {
          this.suscritoRevisionSig.set(false);
        }
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
        try {
          const rr = await this.solicitudesService.estadoSuscripcionRevision(u.email);
          this.suscritoRevisionSig.set(!!rr?.suscrito);
        } catch {
          this.suscritoRevisionSig.set(false);
        }
      })();
    } else {
      this.suscritoSig.set(false);
      this.suscritoRevisionSig.set(false);
    }
  });

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

  async onSuscribirseRevision() {
    const email = String(this.revisionEmail || '').trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !re.test(email)) {
      this.revisionMsg = 'Ingresa un correo válido';
      this.snack.warn('Ingresa un correo válido');
      return;
    }
    this.revisionLoading = true;
    this.revisionMsg = '';
    try {
      await this.solicitudesService.suscribirseRevision(email);
      this.revisionMsg = 'Suscripción a revisión confirmada. Revisa tu correo.';
      this.revisionEmail = '';
      this.snack.success('Suscripción a revisión confirmada');
      this.suscritoRevisionSig.set(true);
    } catch (err: any) {
      this.revisionMsg = err?.message || 'No se pudo suscribir a revisión';
      this.snack.error(this.revisionMsg);
    } finally {
      this.revisionLoading = false;
    }
  }

  async onCancelarSuscripcion() {
    const email = this.user()?.email || '';
    if (!email) {
      this.snack.warn('No hay usuario autenticado');
      return;
    }
    if (!window.confirm('¿Cancelar la suscripción a vencimiento de reactivos?')) return;
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

  async onCancelarSuscripcionRevision() {
    const email = this.user()?.email || '';
    if (!email) {
      this.snack.warn('No hay usuario autenticado');
      return;
    }
    if (!window.confirm('¿Cancelar la suscripción a revisión de oferta?')) return;
    this.revisionLoading = true;
    try {
      await this.solicitudesService.cancelarSuscripcionRevision(email);
      this.snack.success('Suscripción de revisión cancelada');
      this.suscritoRevisionSig.set(false);
      this.revisionMsg = 'Suscripción de revisión cancelada';
    } catch (err: any) {
      const msg = err?.message || 'No se pudo cancelar la suscripción de revisión';
      this.snack.error(msg);
      this.revisionMsg = msg;
    } finally {
      this.revisionLoading = false;
    }
  }
}
