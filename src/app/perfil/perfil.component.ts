import { Component, OnInit, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { authUser } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { reactivosService } from '../services/reactivos.service';
import { SnackbarService } from '../shared/snackbar.service';
import { SolicitudesService } from '../services/clientes/solicitudes.service';
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
  solicitudMsg = '';
  solicitudLoading = false;
  suscritoSolicitudSig = signal(false);
  revisionMsg = '';
  revisionLoading = false;
  suscritoRevisionSig = signal(false);
  private solicitudesService = inject(SolicitudesService);
  
  
  constructor(public snack: SnackbarService, private confirm: ConfirmService) {}

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
          const rr = await this.solicitudesService.estadoSuscripcionSolicitudes(u.email);
          this.suscritoSolicitudSig.set(!!rr?.suscrito);
        } catch {
          this.suscritoSolicitudSig.set(false);
        }
        try {
          const rrr = await this.solicitudesService.estadoSuscripcionRevision(u.email);
          this.suscritoRevisionSig.set(!!rrr?.suscrito);
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
          const rr = await this.solicitudesService.estadoSuscripcionSolicitudes(u.email);
          this.suscritoSolicitudSig.set(!!rr?.suscrito);
        } catch {
          this.suscritoSolicitudSig.set(false);
        }
        try {
          const rrr = await this.solicitudesService.estadoSuscripcionRevision(u.email);
          this.suscritoRevisionSig.set(!!rrr?.suscrito);
        } catch {
          this.suscritoRevisionSig.set(false);
        }
      })();
    } else {
      this.suscritoSig.set(false);
      this.suscritoSolicitudSig.set(false);
      this.suscritoRevisionSig.set(false);
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

  async onSuscribirseSolicitudes() {
    const email = String(this.user()?.email || '').trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !re.test(email)) {
      this.solicitudMsg = 'No hay correo válido en la sesión';
      this.snack.warn('No hay correo válido en la sesión');
      return;
    }
    this.solicitudLoading = true;
    this.solicitudMsg = '';
    try {
      await this.solicitudesService.suscribirseSolicitudes(email);
      this.solicitudMsg = 'Suscripción a solicitudes confirmada. Revisa tu correo.';
      this.snack.success('Suscripción a solicitudes confirmada');
      this.suscritoSolicitudSig.set(true);
    } catch (err: any) {
      this.solicitudMsg = err?.message || 'No se pudo suscribir a solicitudes';
      this.snack.error(this.solicitudMsg);
    } finally {
      this.solicitudLoading = false;
    }
  }

  async onSuscribirseRevision() {
    const email = String(this.user()?.email || '').trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !re.test(email)) {
      this.revisionMsg = 'No hay correo válido en la sesión';
      this.snack.warn('No hay correo válido en la sesión');
      return;
    }
    this.revisionLoading = true;
    this.revisionMsg = '';
    try {
      await this.solicitudesService.suscribirseRevision(email);
      this.revisionMsg = 'Suscripción a revisión confirmada. Revisa tu correo.';
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

  async onCancelarSuscripcionSolicitudes() {
    const email = this.user()?.email || '';
    if (!email) {
      this.snack.warn('No hay usuario autenticado');
      return;
    }
    const ok = await this.confirm.confirm({
      title: 'Cancelar suscripcion',
      message: '¿Cancelar la suscripción a nuevas solicitudes?',
      confirmText: 'Si, cancelar',
      cancelText: 'Cancelar',
      danger: true
    });
    if (!ok) return;
    this.solicitudLoading = true;
    try {
      await this.solicitudesService.cancelarSuscripcionSolicitudes(email);
      this.snack.success('Suscripción de solicitudes cancelada');
      this.suscritoSolicitudSig.set(false);
      this.solicitudMsg = 'Suscripción de solicitudes cancelada';
    } catch (err: any) {
      const msg = err?.message || 'No se pudo cancelar la suscripción de solicitudes';
      this.snack.error(msg);
      this.solicitudMsg = msg;
    } finally {
      this.solicitudLoading = false;
    }
  }

  async onCancelarSuscripcionRevision() {
    const email = this.user()?.email || '';
    if (!email) {
      this.snack.warn('No hay usuario autenticado');
      return;
    }
    const ok = await this.confirm.confirm({
      title: 'Cancelar suscripcion',
      message: '¿Cancelar la suscripción a revisión de oferta?',
      confirmText: 'Si, cancelar',
      cancelText: 'Cancelar',
      danger: true
    });
    if (!ok) return;
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
