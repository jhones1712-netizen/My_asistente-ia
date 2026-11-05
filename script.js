// ===== Configuración =====
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODELO = 'google/gemma-4-31b-it:free';
const CLAVE_STORAGE = 'openrouter_api_key'; // Nombre de la clave en sessionStorage
const MAX_HISTORIAL = 20;                   // Mensajes recientes que se envían al modelo

// Instrucciones de personalidad del asistente
const PROMPT_SISTEMA = `Eres Valentina, vendedora virtual de una tienda de maquillaje.
Responde siempre en español, con un tono amable, cercano y profesional.
- Saluda y haz preguntas breves para conocer el tipo de piel, el tono, el look que busca y su presupuesto.
- Recomienda categorías de productos (base, corrector, polvos, rubor, sombras, labiales, máscaras de pestañas, desmaquillantes, etc.) y explica por qué sirven para cada necesidad.
- No inventes precios, existencias, promociones ni datos de envío. Si preguntan por ellos, indica que pueden consultar el catálogo oficial de la tienda o hablar con un asesor humano.
- Da consejos básicos de uso y cuidado de la piel, sin hacer diagnósticos médicos. Si hay una reacción alérgica o molestia en la piel, recomienda consultar a un dermatólogo.
- Mantén las respuestas cortas (3 a 5 oraciones, salvo que el usuario pida más detalle) y termina, cuando sea natural, con una pregunta que guíe la compra.
- Si el tema no tiene relación con maquillaje o ventas, declina con amabilidad y reconduce la conversación.`;

// Mensajes amables que se muestran al usuario en cada caso de error
const MENSAJES = {
  limite: 'Estamos recibiendo muchas consultas en este momento. Por favor, espera unos segundos e inténtalo de nuevo.',
  clave: 'La clave de OpenRouter no es válida o no tiene permisos. Revísala en la barra lateral e inténtalo de nuevo.',
  sinClave: 'Para conversar conmigo necesito tu clave de OpenRouter. Pégala en la barra lateral, guárdala e inténtalo de nuevo. 😊',
  red: 'No pude conectarme en este momento. Revisa tu conexión a internet e inténtalo de nuevo.',
  generico: 'Ocurrió un problema inesperado. Por favor, inténtalo de nuevo en un momento.'
};

// ===== Referencias al DOM =====
const app = document.getElementById('app');
const formClave = document.getElementById('form-clave');
const inputClave = document.getElementById('input-clave');
const btnBorrarClave = document.getElementById('btn-borrar-clave');
const avisoClave = document.getElementById('aviso-clave');
const btnSidebar = document.getElementById('btn-sidebar');
const btnNuevo = document.getElementById('btn-nuevo');
const chat = document.getElementById('chat');
const bienvenida = document.getElementById('bienvenida');
const mensajes = document.getElementById('mensajes');
const formChat = document.getElementById('form-chat');
const textarea = document.getElementById('mensaje');
const btnEnviar = document.getElementById('btn-enviar');

// Historial de la conversación en memoria (solo mensajes de usuario y asistente)
let historial = [];
// Evita envíos duplicados mientras se espera respuesta
let enviando = false;
// Referencia al indicador "escribiendo..."
let indicadorEscribiendo = null;

// ===== Inicio =====
function iniciar() {
  // Si hay una clave guardada en esta sesión, la rellenamos
  const claveGuardada = obtenerClave();
  if (claveGuardada) {
    inputClave.value = claveGuardada;
    mostrarAviso('Clave cargada desde esta sesión.', 'ok');
  }

  formClave.addEventListener('submit', guardarClave);
  btnBorrarClave.addEventListener('click', borrarClave);
  btnSidebar.addEventListener('click', alternarBarraLateral);
  btnNuevo.addEventListener('click', nuevoChat);
  formChat.addEventListener('submit', enviarMensaje);
  textarea.addEventListener('input', ajustarAltura);
  textarea.addEventListener('keydown', manejarTeclado);
}

// ===== Gestión de la clave =====

// Devuelve la clave guardada en sessionStorage (o cadena vacía)
function obtenerClave() {
  return sessionStorage.getItem(CLAVE_STORAGE) || '';
}

// Guarda la clave escrita por el usuario en sessionStorage
function guardarClave(evento) {
  evento.preventDefault();
  const clave = inputClave.value.trim();

  if (!clave) {
    mostrarAviso('Escribe tu clave antes de guardar.', 'error');
    return;
  }

  sessionStorage.setItem(CLAVE_STORAGE, clave);
  mostrarAviso('✓ Clave guardada en esta sesión.', 'ok');
}

// Elimina la clave de sessionStorage y limpia el campo
function borrarClave() {
  sessionStorage.removeItem(CLAVE_STORAGE);
  inputClave.value = '';
  mostrarAviso('La clave fue eliminada.', 'ok');
}

// Muestra un aviso visual en la barra lateral
function mostrarAviso(texto, tipo) {
  avisoClave.textContent = texto;
  avisoClave.className = `aviso ${tipo}`;
}

// ===== Interfaz =====

// Muestra u oculta la barra lateral según el tamaño de pantalla
function alternarBarraLateral() {
  const esMovil = window.matchMedia('(max-width: 899px)').matches;
  const claseActiva = esMovil ? 'menu-abierto' : 'menu-oculto';
  const estaOculta = esMovil
    ? !app.classList.contains('menu-abierto')
    : app.classList.contains('menu-oculto');

  app.classList.toggle(claseActiva);
  btnSidebar.setAttribute('aria-expanded', String(estaOculta));
}

// Reinicia la conversación
function nuevoChat() {
  historial = [];
  mensajes.innerHTML = '';
  bienvenida.classList.remove('oculta');
  textarea.focus();
}

// Oculta el saludo inicial al empezar la conversación
function ocultarBienvenida() {
  bienvenida.classList.add('oculta');
}

// Añade una burbuja de mensaje (usa textContent para evitar inyección de HTML)
function agregarMensaje(rol, texto, esError = false) {
  const burbuja = document.createElement('div');
  burbuja.className = `mensaje mensaje-${rol}` + (esError ? ' mensaje-error' : '');
  burbuja.textContent = texto;
  mensajes.appendChild(burbuja);
  desplazarAlFinal();
  return burbuja;
}

// Muestra el indicador "escribiendo..."
function mostrarEscribiendo() {
  indicadorEscribiendo = document.createElement('div');
  indicadorEscribiendo.className = 'mensaje mensaje-asistente escribiendo';
  indicadorEscribiendo.setAttribute('aria-label', 'Valentina está escribiendo');
  indicadorEscribiendo.innerHTML = '<span></span><span></span><span></span>';
  mensajes.appendChild(indicadorEscribiendo);
  desplazarAlFinal();
}

// Quita el indicador "escribiendo..."
function ocultarEscribiendo() {
  if (indicadorEscribiendo) {
    indicadorEscribiendo.remove();
    indicadorEscribiendo = null;
  }
}

// Desplaza el chat hasta el último mensaje
function desplazarAlFinal() {
  chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
}

// Activa o desactiva el botón de enviar
function establecerEnviando(valor) {
  enviando = valor;
  btnEnviar.disabled = valor;
}

// Ajusta la altura del textarea según su contenido
function ajustarAltura() {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
}

// Enter envía el mensaje; Shift + Enter agrega un salto de línea
function manejarTeclado(evento) {
  if (evento.key === 'Enter' && !evento.shiftKey) {
    evento.preventDefault();
    formChat.requestSubmit();
  }
}

// ===== Envío de mensajes =====
async function enviarMensaje(evento) {
  evento.preventDefault();
  if (enviando) return;

  const texto = textarea.value.trim();
  if (!texto) return;

  const clave = obtenerClave();
  if (!clave) {
    ocultarBienvenida();
    agregarMensaje('asistente', MENSAJES.sinClave, true);
    return;
  }

  // Preparar la interfaz para la respuesta
  ocultarBienvenida();
  agregarMensaje('usuario', texto);
  historial.push({ role: 'user', content: texto });
  textarea.value = '';
  ajustarAltura();
  establecerEnviando(true);
  mostrarEscribiendo();

  try {
    const respuesta = await llamarModelo(clave);
    agregarMensaje('asistente', respuesta);
    historial.push({ role: 'assistant', content: respuesta });
  } catch (error) {
    // Mostramos el error como burbuja del asistente y quitamos el mensaje sin respuesta
    agregarMensaje('asistente', error.message, true);
    historial.pop();
  } finally {
    ocultarEscribiendo();
    establecerEnviando(false);
    textarea.focus();
  }
}

// ===== Conexión con el modelo =====

// Construye los mensajes para la API.
// Las instrucciones de Valentina van como primer mensaje de usuario,
// porque algunos modelos Gemma no aceptan el rol "system".
function construirMensajes() {
  return [
    { role: 'user', content: `Instrucciones para ti (no las menciones al cliente):\n${PROMPT_SISTEMA}` },
    { role: 'assistant', content: 'Entendido. Soy Valentina, lista para asesorar al cliente.' },
    ...historial.slice(-MAX_HISTORIAL)
  ];
}

// Realiza la petición a OpenRouter y devuelve el texto de la respuesta
async function llamarModelo(clave) {
  let respuesta;
  try {
    respuesta = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clave}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODELO,
        messages: construirMensajes()
      })
    });
  } catch (error) {
    console.error('Error de red al llamar a OpenRouter:', error);
    throw new Error(MENSAJES.red);
  }

  if (!respuesta.ok) {
    // Mostramos en consola el detalle que devuelve OpenRouter para diagnosticar
    const detalle = await respuesta.text().catch(() => '');
    console.error(`OpenRouter respondió ${respuesta.status}:`, detalle);
    throw new Error(mensajeParaEstado(respuesta.status));
  }

  let datos;
  try {
    datos = await respuesta.json();
  } catch (error) {
    console.error('La respuesta no es JSON válido:', error);
    throw new Error(MENSAJES.generico);
  }

  const contenido = datos?.choices?.[0]?.message?.content;
  if (!contenido) {
    console.error('Respuesta sin contenido:', datos);
    throw new Error(MENSAJES.generico);
  }

  return contenido.trim();
}

// Devuelve el mensaje amable según el código de estado HTTP
function mensajeParaEstado(codigo) {
  if (codigo === 429) return MENSAJES.limite;
  if (codigo === 401 || codigo === 403) return MENSAJES.clave;
  return MENSAJES.generico;
}

// ===== Arranque =====
iniciar();
