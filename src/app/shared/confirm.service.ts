import { Injectable, signal } from '@angular/core';

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

export type ConfirmState = {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
};

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly state = signal<ConfirmState>({
    open: false,
    title: 'Confirmacion',
    message: '',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    danger: false
  });

  private resolver: ((value: boolean) => void) | null = null;

  confirm(opts: ConfirmOptions): Promise<boolean> {
    if (this.resolver) {
      try { this.resolver(false); } catch {}
      this.resolver = null;
    }

    const next: ConfirmState = {
      open: true,
      title: (opts.title || 'Confirmacion').trim(),
      message: String(opts.message || '').trim(),
      confirmText: (opts.confirmText || 'Aceptar').trim(),
      cancelText: (opts.cancelText || 'Cancelar').trim(),
      danger: !!opts.danger
    };

    this.state.set(next);
    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  resolve(result: boolean): void {
    if (this.resolver) {
      try { this.resolver(result); } catch {}
      this.resolver = null;
    }
    const current = this.state();
    if (current.open) {
      this.state.set({ ...current, open: false });
    }
  }
}
