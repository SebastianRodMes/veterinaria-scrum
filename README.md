# Sitio Web Veterinaria — Grupo 3

Sistema de reserva y gestión de consultas para una clínica veterinaria. Permite a los clientes agendar citas para sus mascotas y a los administradores gestionar las consultas, confirmarlas y notificar a los usuarios.

## Historias de usuario

| # | Título | Prioridad | Estado | Rol |
|---|--------|-----------|--------|-----|
| 1 | Ingreso de mascota | 1 | Backlog | Cliente |
| 2 | Notificaciones | 1 | Backlog | Cliente |
| 3 | Ver consultas | 1 | Backlog | Administrador |
| 4 | Confirmar consulta | 1 | Backlog | Administrador |
| 5 | Horario de disponibilidades | 2 | Backlog | Cliente |

### 1. Ingreso de mascota

**Como** Cliente de veterinaria
**Quiero** Reservar una consulta
**Para** Asegurar la disponibilidad del veterinario

- El usuario debe visualizar un módulo para reservar la consulta con la información suya y de la mascota.

### 2. Notificaciones

**Como** Cliente
**Quiero** Ser notificado con la hora y día de la atención
**Para** Contemplar la hora de llegada y confirmación de consulta

- Debe haber llenado formulario con datos de la mascota y usuario.

### 3. Ver consultas

**Como** Administrador
**Quiero** Observar las consultas agendadas
**Para** Visualizar cuántas atenciones tiene pendientes, completas y en curso

- Módulo con tabla que muestre todas las atenciones, con atributos como estado (completado, en curso, pendiente).

### 4. Confirmar consulta

**Como** Administrador
**Quiero** Confirmar consulta agendada
**Para** Notificarle al usuario hora y fecha de su consulta

- Permite seleccionar consulta agendada específica, ver información de mascota y usuario, confirmar la cita y seleccionar hora y fecha de atención.

### 5. Horario de disponibilidades

**Como** Cliente de veterinaria
**Quiero** Visualizar el horario de la veterinaria
**Para** Asegurar la llegada entre horas de trabajo del veterinario

- Debe mostrarse esta vista al ingresar a la página.

## Stack

HTML, CSS y JavaScript puro. Persistencia con `localStorage`. Sin frameworks, sin dependencias externas, sin build tools.

## Estructura del proyecto

```
/
├── docs/
│   ├── adr/                  # Architecture Decision Records
│   └── CONTEXT.md            # Glosario del dominio (lenguaje ubicuo)
├── assets/
│   ├── css/
│   │   ├── base.css          # Reset, variables CSS, tipografía
│   │   ├── layout.css        # Grid, estructura de página
│   │   ├── componentes.css   # Componentes UI reutilizables
│   │   └── vistas/           # Estilos específicos por vista
│   │       ├── cliente.css
│   │       └── admin.css
│   ├── js/
│   │   ├── lib/
│   │   │   ├── storage.js    # localStorage wrapper (interfaz profunda)
│   │   │   ├── dom.js        # Helpers de manipulación del DOM
│   │   │   ├── router.js     # Navegación cliente-side simple
│   │   │   └── validacion.js # Validación de formularios
│   │   ├── modules/
│   │   │   ├── consultas.js  # CRUD de consultas, transiciones de estado
│   │   │   ├── mascotas.js   # Registro de mascotas
│   │   │   ├── notificaciones.js
│   │   │   ├── horarios.js
│   │   │   └── auth.js       # Autenticación (cliente / admin)
│   │   └── app.js            # Punto de entrada
│   └── img/
├── test/                     # Páginas HTML con specs manuales por módulo
│   ├── spec-consultas.html
│   └── spec-mascotas.html
├── index.html                # Landing page (lado cliente)
├── admin.html                # Panel de administración
├── .agents/                  # Skills del agente
│   └── skills/
├── AGENTS.md
└── skills-lock.json
```

## Convenciones

### Módulos JS (deep modules)

Cada archivo en `assets/js/modules/` expone una interfaz pública pequeña (función o clase con pocos métodos públicos). La lógica compleja y los detalles de `localStorage` quedan encapsulados. Los callers no acceden directamente a `localStorage`, pasan por `lib/storage.js`.

### Flujo TDD

- Ciclo rojo-verde-refactor: un spec HTML → implementación mínima → repetir.
- Specs en `test/` como páginas HTML que ejercitan la interfaz pública del módulo.
- Slices verticales: una historia a la vez, no todas primero.

### Decisiones de arquitectura

Decisiones de diseño que afecten la estructura del código se registran en `docs/adr/`.

## Roadmap

1. [ ] Crear scaffolding base (`index.html`, `admin.html`, `assets/css/base.css`)
2. [ ] Definir `docs/CONTEXT.md` con el glosario del dominio
3. [ ] Historia 1: Ingreso de mascota — formulario de reserva de consulta
4. [ ] Historia 5: Horario de disponibilidades — vista de horarios en landing
5. [ ] Historia 3: Ver consultas — tabla de consultas en panel admin
6. [ ] Historia 4: Confirmar consulta — flujo de confirmación + asignar fecha/hora
7. [ ] Historia 2: Notificaciones — aviso visual de cita confirmada
