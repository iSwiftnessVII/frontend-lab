import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ReactivoService, Reactivo } from '../services/reactivo.service';

@Component({
  selector: 'app-reactivos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
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
  selectedFileName: string = '';
  uploading: boolean = false;
  reactivoPdfs: { [codigo: string]: any[] } = {}; // Para almacenar PDFs por reactivo

  // Colores oficiales NFPA/GHS para cada clasificación
  clasificacionColors: { [key: string]: string } = {
    'Irritación cutánea y otros': '#488FD0',
    'Inflamables': '#FF0000',
    'Corrosivo': '#FFC000',
    'Peligro para la respiración': '#7030A0',
    'No peligro': '#D9D9D9',
    'Tóxico': '#00B050',
    'Peligro para el medio ambiente': '#7030A0',
    'Comburente': '#FFFF00'
  };

  constructor(
    private reactivoService: ReactivoService, 
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.selectedFileName = '';
    this.form.reset();
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
      almacenamiento_id: [''],
      tipo_recipiente_id: [''],
      observaciones: ['']
    });

    this.loadSelects();
    this.loadReactivos();
  }

  // Método para manejar la selección de archivos
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Por favor, seleccione un archivo PDF válido.');
        this.removeFile();
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo no debe exceder los 10MB.');
        this.removeFile();
        return;
      }
      
      this.selectedFileName = file.name;
    }
  }

  // Método para eliminar el archivo seleccionado
  removeFile(): void {
    this.selectedFileName = '';
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // MÉTODO ONSUBMIT UNIFICADO
  async onSubmit() {
    if (this.form.valid) {
      this.uploading = true;
      
      try {
        const formData = { ...this.form.value };
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = fileInput?.files?.[0];
        const codigo = formData.codigo;
        
        // Primero agregar el reactivo (sin PDF)
        this.reactivoService.addReactivo(formData).subscribe(
          async () => {
            // Si hay archivo, subirlo después de crear el reactivo
            if (file) {
              try {
                await this.uploadFile(file, codigo);
                alert('Reactivo y PDF agregados correctamente');
              } catch (error) {
                alert('Reactivo agregado, pero error al subir PDF');
              }
            } else {
              alert('Reactivo agregado correctamente');
            }
            
            this.uploading = false;
            this.cerrarModal();
            this.loadReactivos();
          },
          err => {
            console.error('Error al agregar reactivo:', err);
            alert('Error al agregar reactivo');
            this.uploading = false;
          }
        );
        
      } catch (error) {
        console.error('Error procesando el formulario:', error);
        alert('Error al procesar el formulario');
        this.uploading = false;
      }
    } else {
      alert('Por favor completa todos los campos requeridos.');
    }
  }

  // Método para subir el archivo PDF
  private async uploadFile(file: File, codigo: string): Promise<string> {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('codigo', codigo);
    
    const response: any = await this.http.post('http://localhost:3000/api/upload-pdf', formData).toPromise();
    return response.fileName;
  }

  // Método para cargar PDFs de un reactivo
  loadPdfsForReactivo(codigo: string) {
    this.http.get<any>(`http://localhost:3000/api/reactivos/${codigo}/pdf`).subscribe(
      (response) => {
        if (response.success) {
          this.reactivoPdfs[codigo] = response.pdfs;
        }
      },
      (error) => {
        console.error('Error cargando PDFs:', error);
      }
    );
  }

  // Método para visualizar PDF
  viewPdf(fileName: string) {
    const pdfUrl = `http://localhost:3000/pdf/${fileName}`;
    window.open(pdfUrl, '_blank');
  }

  // Obtener PDFs de un reactivo
  getPdfsForReactivo(codigo: string): any[] {
    return this.reactivoPdfs[codigo] || [];
  }

  // Resto de métodos existentes...
  loadSelects() {
    this.reactivoService.getTipos().subscribe(d => this.tipos = d);
    this.reactivoService.getClasificaciones().subscribe(d => this.clasificaciones = d);
    this.reactivoService.getUnidades().subscribe(d => this.unidades = d);
    this.reactivoService.getEstados().subscribe(d => this.estados = d);
    this.reactivoService.getAlmacenamientos().subscribe(d => this.almacenamientos = d);
    this.reactivoService.getTiposRecipiente().subscribe(d => this.tiposRecipiente = d);
  }

  loadReactivos() {
    this.reactivoService.getReactivos().subscribe(data => {
      this.reactivos = data;
      // Cargar PDFs para cada reactivo
      this.reactivos.forEach(reactivo => {
        this.loadPdfsForReactivo(reactivo.codigo);
      });
    });
  }

  isVencido(fecha?: string): boolean {
    if (!fecha) return false;
    
    const hoy = new Date();
    const vencimiento = new Date(fecha);
    
    const dosMesesAntes = new Date(vencimiento);
    dosMesesAntes.setMonth(vencimiento.getMonth() - 2);
    
    return hoy >= dosMesesAntes && hoy < vencimiento;
  }

  isPorVencer(fecha?: string): boolean {
    if (!fecha) return false;
    
    const hoy = new Date();
    const vencimiento = new Date(fecha);
    
    if (this.isVencido(fecha)) return false;
    
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
}