import { Routes } from '@angular/router';

// Auth
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

// Client layout + pages
import { ClientLayoutComponent } from './features/client/layout/client-layout.component';
import { ClientDashboardComponent } from './features/client/dashboard/dashboard.component';
import { NewOrderComponent } from './features/client/orders/new-order.component';
import { MyOrdersComponent } from './features/client/orders/my-orders.component';
import { OrderDetailComponent } from './features/client/orders/order-detail.component';
import { ClientPaymentComponent } from './features/client/payments/client-payment.component';
import { ClientPaymentsListComponent } from './features/client/payments/client-payments-list.component';
import { ClientNotificationsComponent } from './features/client/notifications/client-notifications.component';

// Operator
import { OperatorLayoutComponent } from './features/operator/layout/operator-layout.component';
import { OperatorDashboardComponent } from './features/operator/dashboard/dashboard.component';
import { OperatorOrderDetailComponent } from './features/operator/order-detail/order-detail.component';
import { OperatorHistoryComponent } from './features/operator/history/operator-history.component';
import { OperatorProfileComponent } from './features/operator/profile/operator-profile.component';

// Admin layout + pages
import { AdminLayoutComponent } from './features/admin/layout/admin-layout.component';
import { AdminDashboardComponent } from './features/admin/dashboard/dashboard.component';
import { ServicesAdminComponent } from './features/admin/services/services-admin.component';
import { MaterialsAdminComponent } from './features/admin/materials/materials-admin.component';
import { AdminOrdersComponent } from './features/admin/orders/admin-orders.component';
import { AdminPaymentsComponent } from './features/admin/payments/admin-payments.component';
import { AdminUsersComponent } from './features/admin/users/admin-users.component';
import { AdminReportsComponent } from './features/admin/reports/admin-reports.component';

// Guards
import { authGuard, publicGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },

    // Rutas públicas
    { path: 'login',    component: LoginComponent,    canActivate: [publicGuard] },
    { path: 'register', component: RegisterComponent, canActivate: [publicGuard] },

    // ── Cliente (layout compartido) ──────────────────────────────────────────
    {
        path: 'client',
        component: ClientLayoutComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['CLIENT'] },
        children: [
            { path: 'dashboard',            component: ClientDashboardComponent },
            { path: 'orders/new',           component: NewOrderComponent },
            { path: 'orders/:id/payment',   component: ClientPaymentComponent },
            { path: 'orders/:id',           component: OrderDetailComponent },
            { path: 'orders',               component: MyOrdersComponent },
            { path: 'payments',             component: ClientPaymentsListComponent },
            { path: 'notifications',        component: ClientNotificationsComponent },
            { path: '',                     redirectTo: 'dashboard', pathMatch: 'full' },
        ]
    },

    // ── Operador (layout compartido) ─────────────────────────────────────────
    {
        path: 'operator',
        component: OperatorLayoutComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['OPERATOR'] },
        children: [
            { path: 'dashboard',      component: OperatorDashboardComponent },
            { path: 'orders/:id',     component: OperatorOrderDetailComponent },
            { path: 'history',        component: OperatorHistoryComponent },
            { path: 'profile',        component: OperatorProfileComponent },
            { path: '',               redirectTo: 'dashboard', pathMatch: 'full' },
        ]
    },

    // ── Admin (layout compartido) ─────────────────────────────────────────
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ADMIN'] },
        children: [
            { path: 'dashboard',  component: AdminDashboardComponent },
            { path: 'orders',     component: AdminOrdersComponent },
            { path: 'payments',   component: AdminPaymentsComponent },
            { path: 'users',      component: AdminUsersComponent },
            { path: 'services',   component: ServicesAdminComponent },
            { path: 'materials',  component: MaterialsAdminComponent },
            { path: 'reports',    component: AdminReportsComponent },
            { path: '',           redirectTo: 'dashboard', pathMatch: 'full' },
        ]
    },

    { path: '**', redirectTo: 'login' }
];
