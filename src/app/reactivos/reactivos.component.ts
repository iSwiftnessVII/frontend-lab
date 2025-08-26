import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactivoService, Reactivo } from '../services/reactivo.service';

@Component({
  selector: 'app-reactivos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reactivos.component.html',
  styleUrls: ['./reactivos.component.css']
})
export class ReactivosComponent implements OnInit {
  reactivos: Reactivo[] = [];
  form!: FormGroup;

  tipos: any[] = [];
  clasificaciones: any[] = [];
  unidades: any[] = [];
  estados: any[] = [];
  almacenamientos: any[] = [];
  tiposRecipiente: any[] = [];

  // Colores oficiales NFPA/GHS para cada clasificación
  clasificacionColors: { [key: string]: string } = {
    'Irritación cutánea y otros': '#FFA500',
    'Inflamables': '#FF0000',
    'Corrosivo': '#00FF00',
    'Peligro para la respiración': '#FFFF00',
    'No peligro': '#87CEEB',
    'Tóxico': '#800080',
    'Peligro para el medio ambiente': '#008080',
    'Comburente': '#FF8C00'
  };

  constructor(private reactivoService: ReactivoService, private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      codigo: ['', Validators.required],
      reactivo: ['', Validators.required],
      presentacion: [''],
      cantidad_envase: [''],
      fecha_adquisicion: [''],
      fecha_vencimiento: [''],
      tipo_id: [''],
      clasificacion_id: [''],
      unidad_id: [''],
      estado_id: [''],
      marca: [''],
      lote: [''],
      id_referencia: [''],
      hoja_seguridad: [''],
      almacenamiento_id: [''],
      tipo_recipiente_id: [''],
      observaciones: ['']
    });

    this.loadSelects();
    this.loadReactivos();
  }

  loadSelects() {
    this.reactivoService.getTipos().subscribe(d => this.tipos = d);
    this.reactivoService.getClasificaciones().subscribe(d => this.clasificaciones = d);
    this.reactivoService.getUnidades().subscribe(d => this.unidades = d);
    this.reactivoService.getEstados().subscribe(d => this.estados = d);
    this.reactivoService.getAlmacenamientos().subscribe(d => this.almacenamientos = d);
    this.reactivoService.getTiposRecipiente().subscribe(d => this.tiposRecipiente = d);
  }

  isVencido(fecha?: string): boolean {
  if (!fecha) return false;
  const hoy = new Date();
  const vencimiento = new Date(fecha);
  return vencimiento < hoy;
}

isPorVencer(fecha?: string): boolean {
  if (!fecha) return false;
  const hoy = new Date();
  const vencimiento = new Date(fecha);
  const diffTime = vencimiento.getTime() - hoy.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7; // dentro de 7 días
}


  getTipoNombre(id?: number) {
    return id ? this.tipos.find(x => x.id === id)?.nombre || '' : '';
  }

  getClasificacionNombre(id?: number) {
    return id ? this.clasificaciones.find(x => x.id === id)?.nombre || '' : '';
  }

  getUnidadNombre(id?: number) {
    return id ? this.unidades.find(x => x.id === id)?.nombre || '' : '';
  }

  getEstadoNombre(id?: number) {
    return id ? this.estados.find(x => x.id === id)?.nombre || '' : '';
  }

  getAlmacenamientoNombre(id?: number) {
    return id ? this.almacenamientos.find(x => x.id === id)?.nombre || '' : '';
  }

  getTipoRecipienteNombre(id?: number) {
    return id ? this.tiposRecipiente.find(x => x.id === id)?.nombre || '' : '';
  }

  getClasificacionColor(nombre: string) {
    return this.clasificacionColors[nombre] || '#ccc';
  }

  loadReactivos() {
    this.reactivoService.getReactivos().subscribe(data => this.reactivos = data);
  }

  onSubmit() {
    if (this.form.valid) {
      this.reactivoService.addReactivo(this.form.value).subscribe(
        () => {
          alert('Reactivo agregado correctamente');
          this.form.reset();
          this.loadReactivos();
        },
        err => {
          console.error('Error al agregar reactivo:', err);
          alert('Error al agregar reactivo, revisa la consola');
        }
      );
    } else {
      alert('Por favor completa todos los campos requeridos.');
    }
  }
}
