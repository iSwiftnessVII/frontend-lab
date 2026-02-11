import { Routes } from '@angular/router';
import { authGuard, roleGuard, guestGuard } from './services/auth.guard';
import { InsumosComponent } from './insumos/insumos.component';
import { PapeleriaComponent } from './papeleria/papeleria.component';
// Equipos will be lazy-loaded like other sections

export const routes: Routes = [
  // Si hay sesión válida, el authGuard dejará entrar y verás dashboard.
  // Si no, authGuard redirige a /login con returnUrl.
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent), canActivate: [guestGuard] },
  
  // Rutas protegidas
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent), 
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador', 'Auxiliar', 'Superadmin'] }
  },
  {
    path: 'plantillas',
    loadComponent: () => import('./plantillas/plantillas.component').then(m => m.PlantillasComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador', 'Auxiliar', 'Superadmin'] }
  },
  { 
    path: 'solicitudes', 
    loadComponent: () => import('./solicitudes/solicitudes.component').then(m => m.SolicitudesComponent), 
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador', 'Superadmin'] }
  },
  // materiales-referencia route removed
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
    path: 'usuarios', 
    loadComponent: () => import('./usuarios/usuarios.component').then(m => m.UsuariosComponent), 
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Superadmin'] } 
  },
  { 
    path: 'perfil', 
    loadComponent: () => import('./perfil/perfil.component').then(m => m.PerfilComponent), 
    canActivate: [authGuard]
  },
  { 
  path: 'auditoria', 
  loadComponent: () => import('./logs/logs.component').then(m => m.LogsComponent), 
  canActivate: [authGuard, roleGuard],
  data: { roles: ['Administrador', 'Superadmin'] } 
},
{ 
  path: 'equipos', 
  loadComponent: () => import('./equipos/equipos.component').then(m => m.EquiposComponent), 
  canActivate: [authGuard, roleGuard],
  data: { roles: ['Administrador', 'Auxiliar', 'Superadmin'] }
},
{ 
  path: 'materiales-volumetricos', 
  loadComponent: () => import('./volumetricos/volumetricos.component').then(m => m.VolumetricosComponent), 
  canActivate: [authGuard, roleGuard],
  data: { roles: ['Administrador', 'Auxiliar', 'Superadmin'] }
},
{ 
  path: 'materiales-referencia', 
  loadComponent: () => import('./referencia/referencia.component').then(m => m.ReferenciaComponent), 
  canActivate: [authGuard, roleGuard],
  data: { roles: ['Administrador', 'Auxiliar', 'Superadmin'] }
}];
