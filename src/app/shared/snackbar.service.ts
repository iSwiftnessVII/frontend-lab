import { Injectable, signal } from '@angular/core';

export type SnackType = 'success' | 'error' | 'warn' | 'info';

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  readonly openSig = signal(false);
  readonly messageSig = signal('');
  readonly typeSig = signal<SnackType>('info');
  private hideTimer: any;

  private show(msg: string, type: SnackType, duration = 3000) {
    try { clearTimeout(this.hideTimer); } catch {}
    this.messageSig.set(msg);
    this.typeSig.set(type);
    this.openSig.set(true);
    this.hideTimer = setTimeout(() => this.openSig.set(false), Math.max(1200, duration));
  }

  success(msg: string, duration = 2500) { this.show(msg, 'success', duration); }
  error(msg: string, duration = 3500) { this.show(msg, 'error', duration); }
  warn(msg: string, duration = 2500) { this.show(msg, 'warn', duration); }
  info(msg: string, duration = 2500) { this.show(msg, 'info', duration); }
  close() { this.openSig.set(false); }
}
