# AGENTS.md

## Stack

HTML, CSS y JavaScript puro. Sin frameworks, sin dependencias npm, sin build tools. Persistencia vía `localStorage`.

## Convenciones

- No usar `localStorage` directamente desde los módulos de dominio. Pasar siempre por `assets/js/lib/storage.js`.
- Cada módulo en `assets/js/modules/` expone una interfaz pública mínima (pocas funciones exportadas). La implementación compleja va dentro del mismo archivo pero no se exporta.
- CSS en capas: `base.css` (variables, reset), `layout.css` (grid), `componentes.css` (UI reutilizable), y `vistas/*.css` para estilos de página.
- Las páginas HTML son `index.html` (cliente) y `admin.html` (admin). La navegación entre "vistas" dentro de cada rol se maneja con `assets/js/lib/router.js`.
- Specs de testing en `test/` como páginas HTML auto-ejecutables que verifican la interfaz pública de cada módulo. No usar `console.log` como test.

## Domain vocabulary (CONTEXT.md)

Usar el lenguaje del dominio definido en `docs/CONTEXT.md` para nombrar variables, funciones y archivos. Términos esperados: consulta, mascota, cliente, administrador, horario, notificación.

## Installed skills

Skills under `.agents/skills/` (see `skills-lock.json`):

| Skill | Source | Purpose |
|-------|--------|---------|
| `improve-codebase-architecture` | mattpocock/skills | Code structure & architecture review |
| `frontend-design` | anthropics/skills | Frontend design & UI guidelines |
| `tdd` | mattpocock/skills | Test-driven development workflow |
| `to-prd` | mattpocock/skills | Feature spec → PRD conversion |
| `find-skills` | vercel-labs/skills | Discover additional skills |

Use `skill` tool to load a skill by name when its domain is relevant.
