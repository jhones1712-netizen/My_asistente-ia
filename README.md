# asistente-ia

Asistente virtual experto en ventas — **Valentina**, asesora de maquillaje — desarrollado con HTML, CSS y JavaScript puro (sin build ni dependencias).

**Demo:** https://jorgeivangrisalesmarin-art.github.io/asistente-ia/

## Características

- Chat con la API de **Alibaba Cloud Model Studio** (endpoint OpenAI-compatible, región internacional Singapur).
- Dos modos de modelo, controlados con el chip **"Pensamiento Profundo"**:
  - **Normal:** `deepseek-v4-pro-0813` — rápido, respuesta en un solo paso.
  - **Pensamiento Profundo:** `qwen3.8-2.4t-a95b` — reasoning puro con streaming SSE; la respuesta crece en vivo en la conversación.
- La **API key la aporta cada usuario**: se pega en la barra lateral y se guarda solo en `sessionStorage` (nunca sale del navegador ni se persiste entre sesiones).
- Mensajes de error amigables según el caso (clave inválida, límite de consultas, modelo no disponible, red).
- **Tema claro / oscuro** con un botón en la barra superior: sigue la preferencia del sistema en la primera visita y recuerda tu elección (`localStorage`). El tema se aplica antes de pintar, sin parpadeo.
- **Identidad visual vino y berenjena**, con logo de labial en SVG propio (sin archivos de imagen) y favicon incluido.
- **Publicidad de fondo con movimiento:** cuatro bandas diagonales (relleno, contorno y cinta) que se desplazan lentamente detrás de la conversación. Se editan en la constante `PUBLICIDAD` de `script.js`. Un botón en la barra superior permite ocultarla y recuerda la elección.
- **Animaciones** sutiles: transición de colores al cambiar de tema, entrada de mensajes, labial del inicio y elevación de botones. Se desactivan si el sistema pide reducir movimiento (`prefers-reduced-motion`).
- Accesibilidad (`aria-pressed`, `aria-label` dinámico en el botón de tema, foco visible en ambos temas) y protección XSS (render con `textContent`).

## Cómo usar

1. Abre la app y pega tu clave API (formato `sk-...`) en **Configuración** → Guardar.
2. Opcional: activa **"Pensamiento Profundo"** (queda activo durante la sesión; respuesta más elaborada pero tarda más en empezar).
3. Opcional: cambia entre modo claro y oscuro con el botón sol/luna de la barra superior.
4. Escribe tu mensaje y envía.

### Obtener una API key

1. Crea una cuenta en [alibabacloud.com](https://www.alibabacloud.com/) (edición internacional).
2. Activa **Model Studio** y genera una clave en su consola — debe ser de la región **Singapur** (las claves son por región).
3. Guía oficial: [Get API Key](https://www.alibabacloud.com/help/en/model-studio/get-api-key).

## Ejecutar en local

```bash
python3 -m http.server 8000
# abre http://localhost:8000
```

No requiere build ni instalación de dependencias.

## Configuración (`script.js`)

| Constante | Valor | Descripción |
|-----------|-------|-------------|
| `API_URL` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions` | Endpoint internacional de Model Studio |
| `MODELO` | `deepseek-v4-pro-0813` | Modelo del modo normal |
| `MODELO_RAZONAMIENTO` | `qwen3.8-2.4t-a95b` | Modelo del modo "Pensamiento Profundo" |
| `MAX_HISTORIAL` | `20` | Mensajes recientes enviados como contexto |
| `TEMA_STORAGE` | `tema` | Clave de `localStorage` donde se guarda el tema (`claro` u `oscuro`) |
| `PUBLICIDAD_STORAGE` | `publicidad` | Clave de `localStorage` (`1` visible, `0` oculta) |
| `PUBLICIDAD` | 4 bandas | Frases, estilo, sentido y velocidad de cada banda de fondo |

### Editar la publicidad

Cada elemento de `PUBLICIDAD` define una banda: `frases` (texto), `estilo` (`relleno`, `contorno` o `cinta`), `sentido` (`izquierda` o `derecha`) y `velocidad` (segundos por vuelta; más alto es más lento). El texto se inserta con `textContent`.

> Valentina tiene prohibido inventar precios y promociones, por lo que la publicidad usa solo categorías y mensajes de marca. Si añades una campaña real (por ejemplo un descuento), asegúrate de que la tienda la haya confirmado y de que el asistente esté informado de ella.

## Temas y personalización (`styles.css`)

Todos los colores viven en variables CSS, definidas dos veces: `:root[data-tema="oscuro"]` y `:root[data-tema="claro"]`. Para cambiar la paleta basta con editar esos dos bloques.

| Variable | Uso |
|----------|-----|
| `--fondo`, `--superficie`, `--superficie-2`, `--borde` | Capas de la interfaz |
| `--texto`, `--texto-suave` | Texto principal y secundario |
| `--acento` | Fondos de acento (botones, burbuja del usuario) |
| `--acento-texto` | Acento usado como texto o icono (más claro en oscuro, por contraste) |
| `--degradado` | Burbuja del usuario, botón de enviar y cinta de publicidad |
| `--burbuja-asistente`, `--sombra` | Burbuja del asistente y elevación de burbujas y cuadro de entrada |
| `--publicidad` | Color de las bandas de fondo |
| `--foco` | Anillo de foco del teclado |
| `--error`, `--borde-error`, `--ok` | Estados |

## Estructura

```
index.html   # UI del chat y formulario de la clave
styles.css   # Temas claro/oscuro (variables), estilos y animaciones
script.js    # Lógica: clave, tema, modos de modelo, llamadas normal y streaming
```

## Notas técnicas

- **CORS:** el endpoint internacional de Model Studio permite llamadas directas desde el navegador (verificado para este dominio de GitHub Pages); no se usa ningún proxy.
- El modo normal envía `enable_thinking: false` para respuesta inmediata; el modo razonamiento usa `enable_thinking: true` + `stream: true` (obligatorio para `qwen3.8-2.4t-a95b`, que es reasoning puro).
- El razonamiento interno del modelo (`reasoning_content`) se acumula solo para diagnóstico en consola; no se muestra al usuario.
- **Tema:** el script del `<head>` en `index.html` lee `localStorage` y pone `data-tema` en `<html>` antes de que se pinte la página. La clave API usa `sessionStorage` (sensible, no persiste); el tema usa `localStorage` porque es solo una preferencia.
- **Publicidad y accesibilidad:** la capa de fondo es decorativa (`aria-hidden`, `pointer-events: none`). Al ser movimiento continuo junto al contenido, se puede ocultar con el botón de la barra superior (WCAG 2.2.2), se detiene con `prefers-reduced-motion`, y el saludo inicial tiene un panel translúcido para que el texto se lea siempre.
