import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';
import { authGuard } from './services/auth.guard';
import { InsumosComponent } from './insumos/insumos.component';
import { ReactivosComponent } from './reactivos/reactivos.component';

export const routes: Routes = [
	{ path: '', redirectTo: 'login', pathMatch: 'full' },
  	{ path: 'insumos', component: InsumosComponent },
	{ path: 'reactivos', component: ReactivosComponent},
	{ path: 'login', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },
	{ path: 'register', loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent) },
	{ path: 'forgot', loadComponent: () => import('./forgot/forgot.component').then(m => m.ForgotComponent) },
	{ path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
	{ path: 'solicitudes', loadComponent: () => import('./solicitudes/solicitudes.component').then(m => m.SolicitudesComponent), canActivate: [authGuard] },
	{ path: 'reactivos', loadComponent: () => import('./reactivos/reactivos.component').then(m => m.ReactivosComponent), canActivate: [authGuard] },

];

export const appRouterProviders = [
	provideRouter(routes)
];
