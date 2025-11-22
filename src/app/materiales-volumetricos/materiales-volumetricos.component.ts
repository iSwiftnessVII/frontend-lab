import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialesVolService } from '../services/materiales-vol.service';
import { SnackbarService } from '../shared/snackbar.service';

@Component({
  standalone: true,
  selector: 'app-materiales-volumetricos',
  templateUrl: './materiales-volumetricos.component.html',
  styleUrls: ['./materiales-volumetricos.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class MaterialesVolumetricosComponent {
  // Signals for form fields (reflect SQL schema)
  private itemSig = signal<number | null>(null);          get item() { return this.itemSig(); }          set item(v: number | null) { const n:any=v; if(n===''||n==null) {this.itemSig.set(null);} else { const num=Number(n); this.itemSig.set(Number.isFinite(num)?num:null);} }
  private nombreMatSig = signal<string>('');              get nombre_material() { return this.nombreMatSig(); } set nombre_material(v: string) { this.nombreMatSig.set((v||'').toString()); }
  private claseSig = signal<string>('');                  get clase() { return this.claseSig(); } set clase(v: string) { this.claseSig.set((v||'').toString()); }
  private marcaSig = signal<string>('');                  get marca() { return this.marcaSig(); } set marca(v: string) { this.marcaSig.set((v||'').toString()); }
  private referenciaSig = signal<string>('');             get referencia() { return this.referenciaSig(); } set referencia(v: string) { this.referenciaSig.set((v||'').toString()); }
  private fechaAdqSig = signal<string>('');               get fecha_adquisicion() { return this.fechaAdqSig(); } set fecha_adquisicion(v: string) { this.fechaAdqSig.set((v||'').toString()); }
  private cantidadSig = signal<number | null>(null);      get cantidad() { return this.cantidadSig(); } set cantidad(v:number | null){ const n:any=v; if(n===''||n==null){this.cantidadSig.set(null);} else { const num=Number(n); this.cantidadSig.set(Number.isFinite(num)?num:null);} }
  private codigoCalSig = signal<string>('');              get codigo_calibrado() { return this.codigoCalSig(); } set codigo_calibrado(v:string){ this.codigoCalSig.set((v||'').toString()); }
  private fechaCalSig = signal<string>('');               get fecha_calibracion() { return this.fechaCalSig(); } set fecha_calibracion(v:string){ this.fechaCalSig.set((v||'').toString()); }
  private codigoUsoSig = signal<string>('');              get codigo_en_uso() { return this.codigoUsoSig(); } set codigo_en_uso(v:string){ this.codigoUsoSig.set((v||'').toString()); }
  private codigoFueraSig = signal<string>('');            get codigo_fuera_de_uso() { return this.codigoFueraSig(); } set codigo_fuera_de_uso(v:string){ this.codigoFueraSig.set((v||'').toString()); }
  private observacionesSig = signal<string>('');          get observaciones() { return this.observacionesSig(); } set observaciones(v:string){ this.observacionesSig.set((v||'').toString()); }

  private creandoSig = signal<boolean>(false);            get creando() { return this.creandoSig(); }
  private msgSig = signal<string>('');                    get msg() { return this.msgSig(); }

  // Listado + UI
  private listaAllSig = signal<Array<any>>([]);           get listaAll() { return this.listaAllSig(); }
  private listaSig = signal<Array<any>>([]);              get lista() { return this.listaSig(); }
  private cargandoSig = signal<boolean>(false);           get cargando() { return this.cargandoSig(); }
  private errorSig = signal<string>('');                  get error() { return this.errorSig(); }
  private expandedIdSig = signal<number | null>(null);    isExpanded(r:any){ return this.expandedIdSig() === r?.id; }
  toggleExpand(r:any){ this.expandedIdSig.set(this.isExpanded(r) ? null : (r?.id ?? null)); }
  private busyIdsSig = signal<Set<number>>(new Set());    isBusy(id:number){ return this.busyIdsSig().has(id); }

  constructor(private svc: MaterialesVolService, private snack: SnackbarService) {}

  // === VALIDACIONES DE ENTRADA === 
  // Método para bloquear números negativos y solo permitir números enteros
  bloquearNoNumeros(event: KeyboardEvent): void {
    const permitidas = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
    if (permitidas.includes(event.key)) return;
    
    // Solo permitir dígitos (0-9) - bloquea negativo, decimal, letras, emojis
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  // Método para letras y números (nombre material, marca)
  bloquearNoLetrasNumeros(event: KeyboardEvent): void {
    const permitidas = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', ' '];
    if (permitidas.includes(event.key)) return;
    
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\-\.]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  // Método para solo texto (clase)
  bloquearNoTexto(event: KeyboardEvent): void {
    const permitidas = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', ' '];
    if (permitidas.includes(event.key)) return;
    
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\-\.]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  // Validar fecha pasada/hoy
  validarFechaPasada(fecha: string): boolean {
    if (!fecha) return true; // Campo vacío es válido
    const fechaIngresada = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
    return fechaIngresada <= hoy;
  }

  async ngOnInit(){ await this.cargarLista(); }

  async cargarLista(){
    this.errorSig.set(''); this.cargandoSig.set(true);
    try {
      const data = await this.svc.listar();
      const arr = Array.isArray(data) ? data : [];
      this.listaAllSig.set(arr); this.listaSig.set(arr);
    } catch(e:any){
      this.errorSig.set(e?.message || 'Error cargando lista');
      this.listaAllSig.set([]); this.listaSig.set([]);
    } finally { this.cargandoSig.set(false); }
  }

  private addBusy(id:number){ const s = new Set(this.busyIdsSig()); s.add(id); this.busyIdsSig.set(s); }
  private removeBusy(id:number){ const s = new Set(this.busyIdsSig()); s.delete(id); this.busyIdsSig.set(s); }

  async eliminar(material:any, ev?:Event){
    if(ev) ev.stopPropagation();
    if(!material?.id) return;
    if(!confirm('¿Eliminar material volumétrico?')) return;
    this.addBusy(material.id);
    try {
      await this.svc.eliminar(material.id);
      // Actualizar arrays locales sin recargar todo
      const nextAll = this.listaAllSig().filter(m => m.id !== material.id);
      this.listaAllSig.set(nextAll);
      this.listaSig.set(nextAll);
      this.snack.success('Material eliminado');
    } catch(e:any){
      this.snack.error(e?.message || 'Error eliminando material');
    } finally { this.removeBusy(material.id); }
  }

  resetForm(){
    this.item = null; this.nombre_material=''; this.clase=''; this.marca=''; this.referencia='';
    this.fecha_adquisicion=''; this.cantidad=null; this.codigo_calibrado=''; this.fecha_calibracion='';
    this.codigo_en_uso=''; this.codigo_fuera_de_uso=''; this.observaciones=''; this.msgSig.set('');
  }

  async crear(ev: Event){
  ev.preventDefault();
  this.msgSig.set('');
  
  // Validar TODOS los campos obligatorios
  if(!this.item || 
     !this.nombre_material || 
     !this.clase || 
     !this.marca || 
     !this.referencia || 
     !this.fecha_adquisicion || 
     !this.cantidad || 
     !this.codigo_calibrado || 
     !this.fecha_calibracion || 
     !this.codigo_en_uso || 
     !this.codigo_fuera_de_uso) { 
    this.snack.warn('Faltan campos por rellenar'); 
    return; 
  }
  
  // Validación de fecha adquisición (no futura)
  if (this.fecha_adquisicion && !this.validarFechaPasada(this.fecha_adquisicion)) {
    this.snack.warn('La fecha de adquisición no puede ser futura');
    return;
  }

  const payload = {
    item: this.item,
    nombre_material: this.nombre_material.trim(),
    clase: this.clase.trim(),
    marca: this.marca.trim(),
    referencia: this.referencia.trim(),
    fecha_adquisicion: this.fecha_adquisicion,
    cantidad: this.cantidad,
    codigo_calibrado: this.codigo_calibrado.trim(),
    fecha_calibracion: this.fecha_calibracion,
    codigo_en_uso: this.codigo_en_uso.trim(),
    codigo_fuera_de_uso: this.codigo_fuera_de_uso.trim(),
    observaciones: this.observaciones.trim() || null, // Único opcional
  };
  
  try {
    this.creandoSig.set(true);
    await this.svc.crear(payload);
    this.snack.success('Material volumétrico creado');
    this.resetForm();
    await this.cargarLista();
  } catch(e:any){
    this.snack.error(e?.message || 'Error creando material');
  } finally { this.creandoSig.set(false); }
}
}