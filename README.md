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
- Accesibilidad (`aria-pressed`, `aria-label`) y protección XSS (render con `textContent`).

## Cómo usar

1. Abre la app y pega tu clave API (formato `sk-...`) en **Configuración** → Guardar.
2. Opcional: activa **"Pensamiento Profundo"** (queda activo durante la sesión; respuesta más elaborada pero tarda más en empezar).
3. Escribe tu mensaje y envía.

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

## Estructura

```
index.html   # UI del chat y formulario de la clave
styles.css   # Tema oscuro y estilos
script.js    # Lógica: clave, modos de modelo, llamadas normal y streaming
```

## Notas técnicas

- **CORS:** el endpoint internacional de Model Studio permite llamadas directas desde el navegador (verificado para este dominio de GitHub Pages); no se usa ningún proxy.
- El modo normal envía `enable_thinking: false` para respuesta inmediata; el modo razonamiento usa `enable_thinking: true` + `stream: true` (obligatorio para `qwen3.8-2.4t-a95b`, que es reasoning puro).
- El razonamiento interno del modelo (`reasoning_content`) se acumula solo para diagnóstico en consola; no se muestra al usuario.
