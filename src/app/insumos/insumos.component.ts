import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InsumoCreateInput, insumosService } from '../services/insumos.service';
import { SnackbarService } from '../shared/snackbar.service';
import { authUser } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-insumos',
  templateUrl: './insumos.component.html',
  styleUrls: ['./insumos.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class InsumosComponent implements OnInit {
  readonly user = authUser;

  get esAuxiliar(): boolean {
    const u = this.user();
    return !!u && u.rol === 'Auxiliar';
  }

  formularioActivo: 'crear' | null = null;

  cargando = signal(false);
  insumosSig = signal<any[]>([]);
  insumosQ = '';

  nombre = '';
  cantidad_adquirida: number | null = null;
  cantidad_existente: number | null = null;
  presentacion = '';
  marca = '';
  referencia = '';
  descripcion = '';
  fecha_adquisicion = '';
  ubicacion = '';
  observaciones = '';
  imagenFile: File | null = null;
  imagenPreviewUrl: string | null = null;

  insumosFiltrados = computed(() => {
    const q = (this.insumosQ || '').trim().toLowerCase();
    const rows = this.insumosSig() || [];
    if (!q) return rows;
    return rows.filter((r: any) => {
      const hay = [
        r?.nombre,
        r?.marca,
        r?.referencia,
        r?.ubicacion,
        r?.presentacion,
        r?.descripcion,
        r?.observaciones
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  });

  constructor(public snack: SnackbarService) {}

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  toggleFormulario(kind: 'crear'): void {
    if (this.esAuxiliar) return;
    this.formularioActivo = this.formularioActivo === kind ? null : kind;
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      const rows = await insumosService.listarInsumos('', 2000);
      this.insumosSig.set(rows);
    } catch (err: any) {
      this.insumosSig.set([]);
      this.snack.error(err?.message || 'Error cargando insumos');
    } finally {
      this.cargando.set(false);
    }
  }

  onImagenChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] || null;
    this.imagenFile = file;
    if (this.imagenPreviewUrl) URL.revokeObjectURL(this.imagenPreviewUrl);
    this.imagenPreviewUrl = file ? URL.createObjectURL(file) : null;
  }

  async crearInsumo(event: Event): Promise<void> {
    event.preventDefault();
    if (this.esAuxiliar) return;

    const input: InsumoCreateInput = {
      nombre: (this.nombre || '').trim(),
      cantidad_adquirida: Number(this.cantidad_adquirida),
      cantidad_existente: Number(this.cantidad_existente),
      presentacion: (this.presentacion || '').trim() || null,
      marca: (this.marca || '').trim() || null,
      referencia: (this.referencia || '').trim() || null,
      descripcion: (this.descripcion || '').trim() || null,
      fecha_adquisicion: this.fecha_adquisicion || null,
      ubicacion: (this.ubicacion || '').trim() || null,
      observaciones: (this.observaciones || '').trim() || null
    };

    if (!input.nombre) {
      this.snack.warn('El nombre es obligatorio');
      return;
    }
    if (!Number.isFinite(input.cantidad_adquirida) || input.cantidad_adquirida < 0) {
      this.snack.warn('La cantidad adquirida es obligatoria');
      return;
    }
    if (!Number.isFinite(input.cantidad_existente) || input.cantidad_existente < 0) {
      this.snack.warn('La cantidad existente es obligatoria');
      return;
    }

    try {
      await insumosService.crearInsumo(input, this.imagenFile);
      this.snack.success('Insumo registrado');
      this.resetForm();
      this.formularioActivo = null;
      await this.cargar();
    } catch (err: any) {
      this.snack.error(err?.message || 'Error registrando insumo');
    }
  }

  resetForm(): void {
    this.nombre = '';
    this.cantidad_adquirida = null;
    this.cantidad_existente = null;
    this.presentacion = '';
    this.marca = '';
    this.referencia = '';
    this.descripcion = '';
    this.fecha_adquisicion = '';
    this.ubicacion = '';
    this.observaciones = '';
    this.imagenFile = null;
    if (this.imagenPreviewUrl) URL.revokeObjectURL(this.imagenPreviewUrl);
    this.imagenPreviewUrl = null;
  }
}
