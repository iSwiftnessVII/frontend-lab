import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { authService } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-reactivos',
  templateUrl: './reactivos.component.html',
  styleUrls: ['./reactivos.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class ReactivosComponent {
  
  constructor() {
    this.load();
  }

  async load() {
    try {
      // Aquí se cargarán los datos de reactivos cuando se implemente
      console.log('Componente Reactivos cargado');
    } catch (err) {
      console.error('Error cargando reactivos:', err);
    }
  }

  logout() {
    authService.logout();
  }
}