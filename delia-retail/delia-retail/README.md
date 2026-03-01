# Delia Retail – Sistema de Gestión de Inventarios

Aplicación web frontend para la gestión de inventario empresarial.

## Tecnologías

- HTML5
- CSS3 (variables, flexbox, grid)
- Bootstrap 5.3
- Bootstrap Icons
- JavaScript Vanilla (ES5+)
- localStorage (persistencia total)

## Estructura del Proyecto

```
delia-retail/
├── index.html        → Estructura HTML, layout y modales
├── style.css         → Estilos, variables CSS y diseño responsivo
├── localStorage.js   → Capa de datos: Storage, KEYS, initData(), helpers
├── app.js            → Lógica: auth, navegación, CRUD, dashboard, stats
└── README.md         → Documentación
```

## Roles

| Rol           | Permisos |
|---------------|----------|
| Administrador | CRUD completo, categorías, estadísticas, historial |
| Empleado      | Registrar movimientos, consultar inventario |

## Credenciales Demo

| Usuario | Contraseña | Rol           |
|---------|------------|---------------|
| admin   | admin123   | Administrador |
| emp     | emp123     | Empleado      |

## Funcionalidades

- Login y registro con roles
- CRUD completo de productos (admin)
- Control de stock automático
- Historial de movimientos con fecha, tipo y usuario
- Gestión de categorías con colores (admin)
- Panel de estadísticas: top productos, valor por categoría (admin)
- Notificaciones toast
- Persistencia total en localStorage
- Diseño responsivo

## Cómo usar

Abre `index.html` en tu navegador. No requiere servidor.
