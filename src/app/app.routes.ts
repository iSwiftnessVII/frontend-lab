import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './services/auth.guard';
import { InsumosComponent } from './insumos/insumos.component';
import { PapeleriaComponent } from './papeleria/papeleria.component';
// Equipos will be lazy-loaded like other sections

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },
  { path: 'forgot', loadComponent: () => import('./forgot/forgot.component').then(m => m.ForgotComponent) },
  
  // Rutas protegidas
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent), 
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador', 'Auxiliar', 'Superadmin'] }
  },
  { 
    path: 'solicitudes', 
    loadComponent: () => import('./solicitudes/solicitudes.component').then(m => m.SolicitudesComponent), 
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador', 'Auxiliar', 'Superadmin'] }
  },
  { 
    path: 'reactivos', 
    loadComponent: () => import('./reactivos/reactivos.component').then(m => m.ReactivosComponent), 
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador', 'Auxiliar', 'Superadmin'] }
  },
  { 
    path: 'insumos', 
    component: InsumosComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador', 'Auxiliar', 'Superadmin'] }
  },
  { 
    path: 'papeleria', 
    component: PapeleriaComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador', 'Auxiliar', 'Superadmin'] }
  },
  { 
    path: 'equipos', 
  loadComponent: () => import('./equipos/equipos.component').then(m => m.EquiposComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador', 'Auxiliar', 'Superadmin'] }
  },
  { 
    path: 'materiales-volumetricos', 
    loadComponent: () => import('./materiales-volumetricos/materiales-volumetricos.component').then(m => m.MaterialesVolumetricosComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador', 'Auxiliar', 'Superadmin'] }
  },
  { 
    path: 'usuarios', 
    loadComponent: () => import('./usuarios/usuarios.component').then(m => m.UsuariosComponent), 
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Superadmin'] } 
  },
  { 
  path: 'auditoria', 
  loadComponent: () => import('./logs/logs.component').then(m => m.LogsComponent), 
  canActivate: [authGuard, roleGuard],
  data: { roles: ['Administrador', 'Superadmin'] } 
},
{ 
  path: 'reportes', 
  loadComponent: () => import('./reportes/reportes.component').then(m => m.ReportesComponent), 
  canActivate: [authGuard, roleGuard],
  data: { roles: ['Administrador'] }  // Solo Administrador
}
];