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
  activeTooltip: string | null = null;
  form!: FormGroup;
  mostrarModal: boolean = false;
  tipos: any[] = [];
  clasificaciones: any[] = [];
  unidades: any[] = [];
  estados: any[] = [];
  almacenamientos: any[] = [];
  tiposRecipiente: any[] = [];

  // Colores oficiales NFPA/GHS para cada clasificación
  clasificacionColors: { [key: string]: string } = {
    'Irritación cutánea y otros': '#488FD0',      // Azul
    'Inflamables': '#FF0000',                     // Rojo (se mantiene igual)
    'Corrosivo': '#FFC000',                       // Amarillo anaranjado
    'Peligro para la respiración': '#7030A0',     // Púrpura oscuro
    'No peligro': '#D9D9D9',                      // Gris claro
    'Tóxico': '#00B050',                          // Verde
    'Peligro para el medio ambiente': '#7030A0',  // Púrpura oscuro (igual que respiración)
    'Comburente': '#FFFF00'                       // Amarillo puro
  };


  constructor(private reactivoService: ReactivoService, private fb: FormBuilder) {}

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  
  
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
  
  // Calcular fecha límite de 2 meses antes del vencimiento
  const dosMesesAntes = new Date(vencimiento);
  dosMesesAntes.setMonth(vencimiento.getMonth() - 2);
  
  return hoy >= dosMesesAntes && hoy < vencimiento;
}

isPorVencer(fecha?: string): boolean {
  if (!fecha) return false;
  
  const hoy = new Date();
  const vencimiento = new Date(fecha);
  
  // Si ya está en estado "vencido", no mostrar como "por vencer"
  if (this.isVencido(fecha)) return false;
  
  // Calcular fecha límite de 6 meses antes del vencimiento
  const seisMesesAntes = new Date(vencimiento);
  seisMesesAntes.setMonth(vencimiento.getMonth() - 6);
  
  return hoy >= seisMesesAntes && hoy < vencimiento;
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
