# Sitio Web Veterinaria — Grupo 3

Sistema de reserva y gestión de consultas para una clínica veterinaria. Permite a los clientes agendar citas para sus mascotas y a los administradores gestionar las consultas, confirmarlas y notificar a los usuarios.

## Historias de usuario

| # | Título | Prioridad | Estado | Rol |
|---|--------|-----------|--------|-----|
| 1 | Ingreso de mascota | 1 | Implementada | Cliente |
| 2 | Notificaciones | 1 | Implementada | Cliente |
| 3 | Ver consultas | 1 | Implementada | Administrador |
| 4 | Confirmar consulta | 1 | Implementada | Administrador |
| 5 | Horario de disponibilidades | 2 | Implementada | Cliente |
| 6 | Cancelar consulta | 2 | Pendiente | Cliente |
| 7 | Registro de múltiples mascotas | 2 | Pendiente | Cliente |
| 8 | Búsqueda y filtrado de consultas | 2 | Pendiente | Administrador |
| 9 | Historial clínico (Notas médicas) | 1 | Pendiente | Administrador |
| 10| Calificación del servicio | 3 | Pendiente | Cliente |

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
│   │   │   ├── router.js     # Navigation cliente-side simple
│   │   │   └── validacion.js # Validación de formularios
│   │   ├── modules/
│   │   │   ├── consultas.js  # CRUD de consultas, transiciones de estado
│   │   │   ├── mascotas.js   # Registro de mascotas
│   │   │   ├── notificaciones.js
│   │   │   ├── horarios.js
│   │   │   ├── historial.js  # Gestión del expediente clínico (Nuevo)
│   │   │   └── auth.js       # Autenticación (cliente / admin)
│   │   └── app.js            # Punto de entrada
│   └── img/
├── test/                     # Páginas HTML con specs manuales por módulo
│   ├── spec-consultas.html
│   ├── spec-mascotas.html
│   └── spec-historial.html   # Specs para el flujo clínico (Nuevo)
├── index.html                # Landing page (lado cliente)
├── admin.html                # Panel de administración
├── .agents/                  # Skills del agente
│   └── skills/
├── AGENTS.md
└── skills-lock.json
```

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

### 6. Cancelar consulta

**Como** Cliente de veterinaria  
**Quiero** Cancelar una consulta que ya había agendado  
**Para** Liberar el espacio en caso de imprevistos y permitir que otro usuario reserve  

- El cliente podrá ver un botón de "Cancelar" junto al estado de su cita en su panel visual.
- Al cancelar, el estado de la consulta cambiará a "Cancelada" en el `localStorage` y se liberará la hora en el flujo del administrador.

### 7. Registro de múltiples mascotas

**Como** Cliente de veterinaria  
**Quiero** Asociar más de una mascota a mi información de contacto  
**Para** No tener que reescribir todos mis datos personales cada vez que agende una cita para un animal diferente  

- El formulario de reserva debe permitir seleccionar una mascota ya existente (guardada previamente en el perfil del cliente en `localStorage`) o registrar una nueva.

### 8. Búsqueda y filtrado de consultas

**Como** Administrador  
**Quiero** Filtrar las consultas por estado (Pendiente, En curso, Completada, Cancelada) o por el nombre de la mascota  
**Para** Encontrar rápidamente registros específicos sin tener que leer toda la tabla  

- Se añadirán inputs de filtrado sobre la tabla en el panel de administración (`admin.html`).
- La reactividad se manejará limpiando y re-renderizando las filas de la tabla según los datos filtrados de `localStorage`.

### 9. Historial clínico (Notas médicas)

**Como** Administrador / Veterinario  
**Quiero** Agregar observaciones, peso y recetas médicas a la consulta cuando cambie a estado "Completada"  
**Para** Mantener un expediente e historial de salud accesible para futuras visitas de la mascota  

- Al cambiar el estado de una consulta a "Completada", se habilitará un formulario modal para ingresar los detalles de la atención médica.
- Estos datos quedarán vinculados de forma permanente a la mascota en el almacenamiento persistente.

### 10. Calificación del servicio

**Como** Cliente de veterinaria  
**Quiero** Calificar la atención recibida con estrellas y dejar un comentario corto tras finalizar la consulta  
**Para** Expresar mi nivel de satisfacción con el trato hacia mi mascota  

- Una vez que el administrador marque la consulta como "Completada", el cliente verá una opción en su módulo de notificaciones para dejar una reseña (1 a 5 estrellas).

## Stack

HTML, CSS y JavaScript puro. Persistencia con `localStorage`. Sin frameworks, sin dependencias externas, sin build tools.

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

1. [x] Crear scaffolding base (`index.html`, `admin.html`, `assets/css/base.css`)
2. [x] Definir `docs/CONTEXT.md` con el glosario del dominio
3. [x] Historia 1: Ingreso de mascota — formulario de reserva de consulta
5. [x] Historia 3: Ver consultas — tabla de consultas en panel admin
6. [x] Historia 4: Confirmar consulta — flujo de confirmación + asignar fecha/hora
4. [x] Historia 5: Horario de disponibilidades — vista de horarios en landing
7. [x] Historia 2: Notificaciones — aviso visual de cita confirmada
8. [ ] Historia 6: Cancelar consulta — actualización de estados y liberación de cupos
9. [ ] Historia 7: Registro de múltiples mascotas — persistencia relacional cliente-mascota
10. [ ] Historia 8: Búsqueda y filtrado de consultas — UI de búsqueda en `admin.html`
11. [ ] Historia 9: Historial clínico — guardado de notas médicas post-consulta
12. [ ] Historia 10: Calificación del servicio — componente de feedback con estrellas

## Diseño visual

La UI implementa el diseño **"Pet App — Citas Veterinarias"** (handoff de Claude Design):
estilo plano y amigable, paleta océano azul/cian (`#03045e` → `#caf0f8`), tipografías
**Fredoka** (títulos) + **Nunito** (texto). El conmutador **Cliente / Admin** del header
navega entre `index.html` y `admin.html`. Las variables de color viven en `assets/css/base.css`.
