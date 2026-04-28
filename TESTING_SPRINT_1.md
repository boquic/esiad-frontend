# 🧪 Guía de Pruebas: Sprint 1 (Autenticación y Roles)

Esta guía detalla los pasos manuales para comprobar la integridad de las funcionalidades creadas (Guards, Interceptor, Vistas de Auth y Dashboards) correspondientes al **Sprint 1**. 

⚠️ **Atención:** Para respetar los límites impuestos de *"no toques archivos fuera del alcance"*, **no modifiqué el enrutador principal en su momento**. Para poder visualizar las pantallas y probar las redirecciones deberás copiar y pegar la configuración de rutas detallada a continuación.

---

## 1️⃣ Configuración Previa: Enrutador (\`app.routes.ts\`)

Abre el archivo \`src/app/app.routes.ts\` y reemplaza el contenido actual con el siguiente arreglo de rutas. Este paso interconecta los componentes visuales con los *Guards* recién creados:

```typescript
import { Routes } from '@angular/router';

// Componentes Creados
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ClientDashboardComponent } from './features/client/dashboard/dashboard.component';
import { OperatorDashboardComponent } from './features/operator/dashboard/dashboard.component';
import { AdminDashboardComponent } from './features/admin/dashboard/dashboard.component';

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
  
  // Resguardo contra rutas inexistentes
  { path: '**', redirectTo: 'login' }
];
```

---

## 2️⃣ Casos de Prueba Manuales

Asegúrate de que tu **Backend (Node.js/Prisma)** ya esté corriendo (la ruta natural será \`http://localhost:3000\`) y levanta el entorno de Angular en tu consola con el comando \`ng serve\`. 

### Prueba A: Validaciones de UI Reactiva y Registro
1. Entra a `http://localhost:4200/register`.
2. Presiona "Crear Cuenta" sin llenar información. El formulario detectará los errores, mostrará validaciones por campo en color rojo y evitará envíos innecesarios.
3. Intenta forzar errores simulados introduciendo un DNI de 3 dígitos. El mensaje de validación de formato (\`pattern\`) debe aparecer.
4. Completa la información con datos verídicos y envía. Ocurrirá una petición \`POST\` mediante HttpClient, se inhabilitará temporalmente el botón (aparece *Spinner*), y de ser exitosa en el backend, te debe de redirigir a la vista de Login.

### Prueba B: Login y Public Guard *(Filtro inverso)*
1. Consigue los accesos de un operario o el usuario recién registrado.
2. Ingresa a `http://localhost:4200/login`, escribe las credenciales (Ej., DNI + Contraseña).
3. Presiona "Iniciar Sesión". El sistema leerá el JWT en crudo suministrado por el backend, decodificará la cabecera (averiguando automáticamente su rol), lo persistirá en tu almacenamiento (\`localStorage\`) y se te enviará volando a tu panel correspondiente (*Portal de Cliente*, por ejemplo).
4. Mientras disfrutas la vista desde ese panel superior interactúa con el **\`publicGuard\`**: intenta visitando manualmente \`http://localhost:4200/login\`. Te expulsará violentamente de vuelta a tu dashboard según el rol decodificado. 🛡️

### Prueba C: Control Restricto (Role Guard)
1. Estás dentro con el rol \`CLIENT\`.
2. Como cliente rebelde, intenta sobreescribir la URL en el navegador: \`http://localhost:4200/admin/dashboard\`.
3. El **\`roleGuard\`** interviene, extrae las llaves \`roles: ['ADMIN']\` de \`route.data\` configuradas en el archivo principal y observa que tú no correspondes. El acceso se deniega y el router te encauza devolviéndote a `/client/dashboard`.
4. Utiliza el botón de **Cerrar Sesión** en pantalla (destruye el JWT).

### Prueba D: Inyección Autónoma de Tokens (Interceptor)
Observando las transacciones de red (*Network tab* pulsando \`F12\`):
1. Registra tu sesión (con un token presente simulado en \`localStorage\`).
2. Dispara cualquier tipo de petición hacia la infraestructura. Notarás en el recuadro "Request Headers" de tu navegador que las peticiones se enriquecieron antes de ser enviadas en las sombras con la etiqueta: \`Authorization: Bearer eyJhb...\`
3. Esto confirma contundentemente que nuestro interceptor HTTP atrapa, inyecta y canaliza los métodos HTTP exitosamente.

¡Pasando estos escollos tendrás verificado por completo el **Definition of Done (DoD)** de los Sprints aplicados en tu Front-End! 🚀
