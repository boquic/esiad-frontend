import { Routes } from '@angular/router';

// Componentes Creados
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ClientDashboardComponent } from './features/client/dashboard/dashboard.component';
import { NewOrderComponent } from './features/client/orders/new-order.component';
import { MyOrdersComponent } from './features/client/orders/my-orders.component';
import { OrderDetailComponent } from './features/client/orders/order-detail.component';
import { OperatorDashboardComponent } from './features/operator/dashboard/dashboard.component';
import { AdminDashboardComponent } from './features/admin/dashboard/dashboard.component';
import { ServicesAdminComponent } from './features/admin/services/services-admin.component';
import { MaterialsAdminComponent } from './features/admin/materials/materials-admin.component';

// Guards Creados
import { authGuard, publicGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },

    // -- Rutas Públicas (Usa publicGuard para expulsar a quienes ya estén logueados)
    { path: 'login', component: LoginComponent, canActivate: [publicGuard] },
    { path: 'register', component: RegisterComponent, canActivate: [publicGuard] },

    // -- Dashboards Restringidos: Solicitan tanto Login (authGuard) como Rol (roleGuard)
    {
        path: 'client/dashboard',
        component: ClientDashboardComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['CLIENT'] }
    },
    {
        path: 'client/orders/new',
        component: NewOrderComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['CLIENT'] }
    },
    {
        path: 'client/orders',
        component: MyOrdersComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['CLIENT'] }
    },
    {
        path: 'client/orders/:id',
        component: OrderDetailComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['CLIENT'] }
    },
    {
        path: 'operator/dashboard',
        component: OperatorDashboardComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['OPERATOR'] }
    },
    {
        path: 'admin/dashboard',
        component: AdminDashboardComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ADMIN'] }
    },
    {
        path: 'admin/services',
        component: ServicesAdminComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ADMIN'] }
    },
    {
        path: 'admin/materials',
        component: MaterialsAdminComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ADMIN'] }
    },

    // Resguardo contra rutas inexistentes
    { path: '**', redirectTo: 'login' }
];
