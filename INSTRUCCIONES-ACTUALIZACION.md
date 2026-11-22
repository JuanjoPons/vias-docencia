# Vías a la docencia · Instrucciones

Aplicación web estática (HTML + CSS + JavaScript) de orientación para el acceso a la profesión docente, con atención especial a las Illes Balears.

## Cómo abrirla

- **Doble clic en `index.html`**: funciona sin servidor gracias a `data/bundle.js`.
- **Con servidor local** (recomendado para publicar o depurar):
  `python3 -m http.server 8765` desde esta carpeta y abrir `http://localhost:8765`.
- Para publicarla (GitHub Pages, Moodle, servidor del centro) basta con subir la carpeta `web/` completa.

## Estructura

```
web/
├── index.html                 Estructura de la aplicación
├── css/styles.css             Diseño (tema oscuro "glass" + tema claro)
├── js/core.js                 Utilidades, iconos, router, modal, almacenamiento, textos (i18n)
├── js/engine.js               MOTOR DE REGLAS: evalúa el perfil contra los datos
├── js/diagram.js              Diagramas de flujo interactivos por vía
├── js/report.js               Informes imprimibles / PDF
├── js/main.js                 Arranque y carga de datos
├── js/views/*.js              Una vista por apartado (inicio, simulador, resultados, vías…)
├── data/*.json                BASE DE DATOS (editar aquí)
├── data/bundle.js             Generado automáticamente (no editar a mano)
└── tools/build-data.mjs       Regenera bundle.js
```

## Base de datos (`data/`)

| Archivo | Contenido |
| --- | --- |
| `titulaciones.json` | Niveles, familias de FP, ramas, ámbitos de conocimiento y catálogo de títulos del buscador |
| `especialidades.json` | Especialidades docentes (categorías A–E), cuerpos y fichas |
| `correspondencias.json` | **Titulación → especialidad**, con fuente, artículo, estado y condición |
| `vias.json` | Vías de acceso: ficha, matriz y diagrama de cada una |
| `requisitos.json` | Qué significa cada requisito, por qué, cómo conseguirlo y dónde |
| `normativa.json` | Normas, convocatorias y enlaces oficiales |
| `convocatorias.json` | Procedimientos documentados (no en tiempo real) |
| `organismos.json` | Directorio de organismos y casos «¿dónde consulto?» |
| `perfiles.json` | Perfiles de ejemplo **ficticios** |

### Añadir una correspondencia

Cada correspondencia **debe** tener respaldo documental. Ejemplo:

```json
{
  "id": "C70",
  "titulos": ["g_historia"],
  "ambitos": [],
  "especialidades": ["0590005"],
  "vias": ["opos0590", "bolsa", "extraordinaria", "urgencia", "privados"],
  "condicion": { "tipo": "ects30" },
  "estado": "condicionado",
  "fuente": ["boib15_2026"],
  "articulo": "Anexo 4 (BOIB 15/2026), especialidad 0590005",
  "observaciones": ""
}
```

- `estado`: `verificado` (listado sin condiciones) · `condicionado` (asterisco o acreditación adicional) · `no_verificado` (la fuente no confirma el listado literal) · `no_permite` (exclusión expresa).
- Coincidencia: por `titulos` (id exacto del catálogo), `ambitos` (ámbito del Grado), `niveles` o `expFamilias` (sector de experiencia).
- `condicion.tipo`: `exp2`, `alt4`, `ects30`, `exp_sector`, `contenidos`, `exp4` (definidas en el mismo archivo).
- `fuente` debe usar ids de `normativa.json`. La ficha de cada especialidad muestra la referencia (`id`) y la fecha de consulta.
- **No** añadas correspondencias por parecido de nombre ni generadas por IA sin comprobar el anexo oficial.

### Añadir una especialidad o un título

- Especialidad: nuevo objeto en `especialidades.json` (`id` = código oficial, `categoria` A–E, `vias`, `normativa`, `estadoFuente`).
- Título: nuevo objeto en `titulaciones.json` (`nivel`, y `familia` para FP o `ambito` para Grados). La asignación de ámbito es orientativa: compruébala en el RUCT.

### Modificar una vía o su diagrama

En `vias.json`, cada nodo del diagrama tiene `paso` (fila), `col` (`l`, `c`, `r`), `tipo`, `caracter` (`obligatorio`, `condicional`, `informativo`), `fuente`, `enlace` y, opcionalmente, `req` (id de requisito que se colorea con el perfil del alumno). Las flechas se declaran en `aristas` como `["origen", "destino", "etiqueta opcional"]`.

### Después de cualquier cambio

```bash
node tools/build-data.mjs
```

Actualiza también `fechaConsulta` / `ultimaVerificacion` en los `_meta` de los archivos modificados.

## Traducción al catalán (preparada)

- Textos de navegación: diccionario `STR` en `js/core.js` (añadir `ca: { … }` y activar el botón «Català» en `js/main.js`).
- Datos: se recomienda añadir campos paralelos (`nombre_ca`, `resumen_ca`…) y leerlos con `App.lang`.

## Futuras ampliaciones

- `js/main.js → cargar()` es el único punto de entrada de datos: puede sustituirse por una API o base de datos sin tocar las vistas.
- El motor (`js/engine.js`) no conoce la interfaz: recibe un perfil y devuelve vías, especialidades, requisitos y hoja de ruta.
- Si se incorpora un asistente de IA, debe citar el `id` de la correspondencia y su `fuente`, y señalar las limitaciones (estado `no_verificado`).

## Privacidad

El perfil solo se guarda en el navegador si la persona marca «Recordar mi perfil» (almacenamiento local). El botón «Borrar mis datos» lo elimina. No se envía nada a ningún servidor.

## Fuentes documentales

Generado a partir de `manual_de_consulta_…illes_balears.md` y `correspondencia_titulaciones_y_especialidades_docentes_illes_balears.md` (carpeta superior). Los enlaces marcados como «añadido» o «genérico» en *Fuentes y fiabilidad* no proceden del cuaderno y deben verificarse.

## Publicación (GitHub Pages)

- Repositorio: https://github.com/JuanjoPons/vias-docencia
- Web pública: https://juanjopons.github.io/vias-docencia/
- Para publicar cambios: editar los JSON → `node tools/build-data.mjs` → `git add -A && git commit -m "…" && git push`. GitHub Pages se actualiza en 1-2 minutos.
