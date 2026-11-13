/* Puntos Santana — app única: clientes (#/), personal (#/personal) */
(() => {
'use strict';
const CFG = window.PS_CONFIG;
const sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, storageKey: 'ps_staff' } });
const app = document.getElementById('app');
const LOGO = 'santana-logo.jpg';

/* ---------- utilidades ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (n) => Number(n || 0).toLocaleString('es-CO');
const money = (n) => '$' + num(Math.round(Number(n || 0)));
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fdate = (d) => { if (!d) return '—'; const x = typeof d === 'string' && d.length === 10 ? new Date(d + 'T12:00:00') : new Date(d); return x.getDate() + ' ' + MESES[x.getMonth()] + ' ' + x.getFullYear(); };
const iso = (d) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
const digits = (s) => String(s || '').replace(/\D/g, '');
const ini = (s) => String(s || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const $ = (sel, root = app) => root.querySelector(sel);
const $$ = (sel, root = app) => Array.from(root.querySelectorAll(sel));

let toastT;
function toast(msg, isError) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'show' + (isError ? ' error' : '');
  clearTimeout(toastT); toastT = setTimeout(() => { t.className = ''; }, 3200);
}

const ERR = {
  CEDULA_EXISTE: 'Ya existe un cliente con esa cédula.',
  PIN_INVALIDO: 'El PIN debe tener exactamente 4 números.',
  SIN_AUTORIZACION_DATOS: 'El cliente debe autorizar el tratamiento de sus datos.',
  CLIENTE_NO_EXISTE: 'No hay un cliente con esa cédula.',
  VALOR_INVALIDO: 'Escribe el valor de la compra.',
  TIENDA_INVALIDA: 'Elige la tienda donde compró.',
  SALDO_INSUFICIENTE: 'No tiene puntos suficientes.',
  PIN_INCORRECTO: 'PIN incorrecto.',
  PIN_BLOQUEADO: 'Demasiados intentos fallidos. Espera 15 minutos.',
  DATOS_INCORRECTOS: 'Cédula o PIN incorrectos.',
  SESION_INVALIDA: 'Tu sesión terminó. Ingresa de nuevo.',
  SIN_STOCK: 'Este premio está agotado.',
  PREMIO_NO_DISPONIBLE: 'Este premio ya no está disponible.',
  PREMIO_INACTIVO: 'Este premio está desactivado.',
  SELLOS_INSUFICIENTES: 'Aún no completa los sellos.',
  YA_SOLICITADO: 'Ya tienes este regalo solicitado.',
  SOLICITUD_NO_DISPONIBLE: 'Esta solicitud ya fue entregada o cancelada.',
  NO_AUTORIZADO: 'No tienes permiso para esta acción.',
  NO_ES_RECAUDADOR: 'Solo los puntos recaudadores (Pilatos, Derek y Restaurante) pueden entregar premios.',
  SOLO_ACUMULACIONES: 'Solo se pueden editar compras.',
  FACTURA_REQUERIDA: 'Escribe el número de la factura.',
  FACTURA_USADA: 'Esa factura ya se usó para un sello.',
  FECHA_REQUERIDA: 'Escribe la fecha de la factura.',
  FECHA_FUTURA: 'La fecha de la factura no puede ser futura.',
  FACTURA_VENCIDA: 'Esa factura tiene más de un año: sus puntos ya estarían vencidos.',
  NOMBRE_NO_COINCIDE: 'La factura no está a nombre de este cliente. Solo el titular puede acumular sus facturas.',
  SOLO_RESTAURANTE: 'El helado de cumpleaños solo se entrega en el Restaurante (Punto Dulce).',
  CLIENTE_SIN_ACTIVAR: 'El cliente debe activar su cuenta en Puntos Santana primero.',
  SIN_FECHA_NACIMIENTO: 'El cliente no tiene fecha de nacimiento registrada.',
  NO_ES_SU_MES: 'Este no es el mes de cumpleaños del cliente.',
  HELADO_YA_ENTREGADO: 'Este cliente ya recibió su helado de cumpleaños este año.',
  SIN_CLIENTES_ELEGIDOS: 'Agrega al menos un cliente.',
  FACTURA_MAS_DE_UN_MES: 'Esta factura tiene más de 1 mes. Solo se acumulan facturas de hasta 1 mes después de la compra.',
  SIN_CLAVE_UNICA: 'El cliente aún no ha generado su clave única. Pídele que toque "Generar clave única" en su celular.',
  CLAVE_UNICA_INCORRECTA: 'Clave única incorrecta. Revísala con el cliente.',
  CLAVE_UNICA_ANULADA: 'Demasiados intentos: la clave se anuló. El cliente debe generar una nueva.',
  CLAVE_REDENCION_INCORRECTA: 'Clave de redención incorrecta.',
  CLAVE_NO_CONFIGURADA: 'Este punto aún no tiene clave de redención. Pídela al administrador.',
  SOLICITUD_VENCIDA: 'Esta solicitud venció: pasaron las 24 horas.',
  CLAVE_CORTA: 'La clave debe tener mínimo 4 caracteres.',
  USA_CLAVE_REDENCION: 'Los premios se entregan desde la lista de solicitudes con la clave de redención.',
  REDIME_EN_TIENDA: 'Los premios se reclaman en Pilatos, Derek o el Restaurante con tu cédula y tu PIN.',
  PREMIO_OTRA_TIENDA: 'Este premio no se entrega aquí: las prendas se entregan en Pilatos o Derek y la comida en el Restaurante.',
  FACTURA_YA_ACUMULADA: 'Esta factura ya fue registrada antes. No se sumaron puntos.',
  SELLO_HOY: 'Este cliente ya recibió su sello hoy (máximo 1 por día).',
  TARJETA_LLENA: 'La tarjeta ya está completa: entrega el regalo primero.',
  SIN_ACTIVAR: 'Tu cuenta aún no está activa. Acércate a Pilatos, Derek o el Restaurante con tu cédula para activarla y crear tu PIN.',
  YA_ACTIVO: 'Este cliente ya tiene su cuenta activa.',
  CELULAR_INVALIDO: 'Escribe un celular válido.',
  NACIMIENTO_INVALIDO: 'Revisa la fecha de nacimiento.',
  TIENDA_FAVORITA_REQUERIDA: 'Elige la tienda favorita del cliente.',
  MOTIVO_REQUERIDO: 'Escribe el motivo.',
  TITULAR_REQUERIDO: 'Escribe el nombre o la cédula que aparece en la factura.',
  CEDULA_NO_COINCIDE: 'La cédula de la factura no es la de este cliente. Solo el titular puede acumular sus facturas.',
  VERIFICAR_CEDULA: 'Confirma que verificaste la cédula física del cliente.',
  TARJETA_VACIA: 'La tarjeta no tiene sellos.'
};
function errText(e) {
  const m = (e && (e.message || e.error || e)) + '';
  for (const k of Object.keys(ERR)) if (m.includes(k)) return ERR[k];
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Sin conexión. Revisa el internet.';
  if (/Invalid login/i.test(m)) return 'Usuario o contraseña incorrectos.';
  return 'Ocurrió un error. Intenta de nuevo.';
}
async function rpc(fn, args) {
  const { data, error } = await sb.rpc(fn, args);
  if (error) throw error;
  if (data && data.error) throw new Error(data.error);
  return data;
}

const ICON = {
  home: '<path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  gift: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1"/>',
  ticket: '<path d="M3 9a3 3 0 0 0 0 6v4h18v-4a3 3 0 0 1 0-6V5H3z"/><path d="M14 5v14" stroke-dasharray="2 2"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  user: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><path d="M19 8v6M16 11h6"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><path d="M16 4a4 4 0 0 1 0 8M22 21c0-3-2-5-5-6"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>'
};
const ic = (n, size = 22, w = 2) => `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;
const SUN = '<svg class="sun" aria-hidden="true" viewBox="0 0 100 100"><circle cx="50" cy="50" r="22" fill="#F6A21E"/><g stroke="#EB5440" stroke-width="7" stroke-linecap="round"><path d="M50 8v12M50 80v12M8 50h12M80 50h12M20 20l8 8M72 72l8 8M80 20l-8 8M28 72l-8 8"/></g></svg>';


/* ---------- Términos y condiciones · Autorización de datos ---------- */
const POLITICAS = {
  datos: 'Mediante el registro de mis datos personales y mi información transaccional, autorizo al Hotel-Mall Santana del Rio y a Unión Cifuentes & Cia en general, para la recolección, almacenamiento y uso de los mismos con la finalidad de ofrecer servicios y campañas comerciales, ofertar servicios, participar en programas de beneficios, consultar en centrales de información para fines comerciales y de servicios de crédito, consultar hábitos de consumo y aficiones para ofertas, promociones, entre otros. Contactarlo para estudios de mercado y encuestas de satisfacción, gestionar tramites, compartir con empresas aliadas, asociados, sucursales, franquicias, filiales y subsidiarias. Como titular de su información tiene derecho a conocer, actualizar y rectificar sus datos personales.',
  terminos: [
    'Los puntos se pueden acumular hasta 1 mes después de la fecha de la factura de compra, presentando la factura.',
    'La factura de compra debe estar a nombre de la persona que hace la acreditación de puntos y esta debe presentar un documento de identidad que la identifique; por ende, el vendedor no puede ir a acumular facturas del cliente, ni ningún familiar o amigo.',
    'Los puntos son personales e intransferibles.',
    'Los puntos vencen 1 año después de acumulados.',
    'Los premios van variando según las directrices del establecimiento comercial.',
    'Cada $1.000 pesos en compra equivalen a 25 puntos acumulados.',
    'Una vez el cliente activa la redención de un premio en la app, tiene 24 horas completas (corridas) para reclamarlo en el punto de entrega. Pasado ese tiempo la solicitud se vence y los puntos siguen en su cuenta.',
  ],
};
function politicasHTML() {
  return `<div class="stack" style="gap:14px;text-align:left">
    <section class="stack" style="gap:8px"><h2 style="font-size:18px;font-weight:800;margin:0">Términos y condiciones</h2>
      <ul style="margin:0;padding-left:20px;display:grid;gap:6px;font-size:14px;line-height:1.45">${POLITICAS.terminos.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>
    <section class="stack" style="gap:8px"><h2 style="font-size:18px;font-weight:800;margin:0">Autorización para la utilización de los datos personales y para compartir información</h2>
      <p style="margin:0;font-size:14px;line-height:1.5">${esc(POLITICAS.datos)}</p></section></div>`;
}
function verPoliticas() { dialog(`<div style="max-height:65vh;overflow:auto;padding-right:4px">${politicasHTML()}</div>`, async () => {}, 'Entendido'); const d = document.querySelector('dialog:last-of-type [data-x]'); if (d) d.remove(); }
document.addEventListener('click', (e) => { const a = e.target.closest('[data-politicas]'); if (!a) return; e.preventDefault(); verPoliticas(); });
const AUTORIZA = 'El cliente leyó y acepta los <a href="#" data-politicas style="font-weight:700">Términos y condiciones y la Autorización de datos personales</a> de Puntos Santana (Ley 1581 de 2012), y acepta recibir notificaciones y mensajes con promociones en la app.';

/* ---------- router ---------- */
function route() {
  const h = location.hash.replace(/^#/, '') || '/';
  // Computadores de caja: la app instalada abre en el inicio de sesión del personal
  let modo = null; try { modo = localStorage.getItem('ps_modo'); } catch {}
  if (h === '/' && modo === 'personal' && !tok()) { location.replace('#/personal'); return; }
  if (h.startsWith('/personal')) { try { localStorage.setItem('ps_modo', 'personal'); } catch {} return staffRoute(h.split('/')[2] || ''); }
  return clientRoute(h.split('/')[1] || '', h.split('/')[2] || '');
}
window.addEventListener('hashchange', route);

/* =====================================================
   CLIENTE
   ===================================================== */
const TK = 'ps_cliente_token';
const tok = () => { try { return localStorage.getItem(TK); } catch { return null; } };
const setTok = (v) => { try { v ? localStorage.setItem(TK, v) : localStorage.removeItem(TK); } catch {} };
/* Cuenta regresiva hasta una fecha (HH:MM:SS) */
function restante(fecha) {
  const ms = new Date(fecha) - Date.now(); if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600e3), m = Math.floor(ms % 3600e3 / 60e3), sg = Math.floor(ms % 60e3 / 1e3);
  return [h, m, sg].map((x) => String(x).padStart(2, '0')).join(':');
}
let relojes = null;
function arrancarRelojes() {
  clearInterval(relojes);
  relojes = setInterval(() => { const els = document.querySelectorAll('[data-hasta]'); if (!els.length) return clearInterval(relojes); els.forEach((el) => { el.textContent = restante(el.dataset.hasta); }); }, 1000);
}

let cInicio = null;

async function clientCall(fn, extra) {
  try { return await rpc(fn, { p_token: tok(), ...(extra || {}) }); }
  catch (e) {
    if (String(e.message).includes('SESION_INVALIDA')) { setTok(null); cInicio = null; location.hash = '#/'; toast(ERR.SESION_INVALIDA, true); route(); throw e; }
    throw e;
  }
}

function clientRoute(tab, arg) {
  document.title = 'Puntos Santana';
  if (!tok()) return clientLogin();
  if (tab === 'canje' && arg) return clientCanje(arg);
  if (tab === 'premios') return clientPremios();
  if (tab === 'cupones') return clientCupones();
  if (tab === 'mensajes') return clientMensajes();
  return clientInicio();
}

function tabbar(active) {
  const nl = cInicio && cInicio.no_leidos > 0 ? `<span class="badge">${cInicio.no_leidos}</span>` : '';
  const t = (href, key, icon, label, extra = '') => `<a href="${href}" ${active === key ? 'aria-current="page"' : ''}>${ic(icon, 24, active === key ? 2.3 : 2)}${label}${extra}</a>`;
  return `<nav class="tabbar" aria-label="Navegación">${t('#/', 'inicio', 'home', 'Inicio')}${t('#/premios', 'premios', 'gift', 'Premios')}${t('#/cupones', 'cupones', 'ticket', 'Cupones')}${t('#/mensajes', 'mensajes', 'chat', 'Mensajes', nl)}</nav>`;
}

function clientLogin() {
  app.innerHTML = `
  <div class="phone">
    <svg class="login-wave" aria-hidden="true" viewBox="0 0 390 200" preserveAspectRatio="none"><path d="M0 100 C 110 40, 230 150, 390 70 L390 200 L0 200 Z" fill="#13235B"/><path d="M0 100 C 110 40, 230 150, 390 70" fill="none" stroke="#1BA6C2" stroke-width="4"/></svg>
    <form class="phone-body" id="f" style="position:relative;z-index:1;padding-bottom:24px;min-height:100dvh" novalidate>
      <img class="logo-round" src="${LOGO}" alt="Puntos Santana – Santana del Río Mall Comercial">
      <div><h1 style="font-size:26px;font-weight:800">Consulta tus puntos</h1>
      <p class="muted" style="margin:4px 0 0;font-size:14px">Ingresa con tu cédula y tu PIN de 4 números.</p></div>
      <div class="field"><label for="ced">Número de cédula</label><input class="input" id="ced" inputmode="numeric" autocomplete="username" required></div>
      <div class="field"><label for="pin">PIN</label><input class="input pin" id="pin" type="password" inputmode="numeric" maxlength="4" autocomplete="current-password" required></div>
      <p id="err" class="small" style="color:var(--coral-t);margin:0;min-height:18px"></p>
      <button class="btn coral block" style="height:56px;font-size:17px">Entrar</button>
      ${botonInstalar()}
      ${tarjetaNotifLogin()}
      <div style="flex:1;min-height:120px"></div><p class="center small" style="margin:0;color:#fff">¿Aún no estás inscrito u olvidaste tu PIN? Acércate a Pilatos, Derek o el Restaurante con tu cédula.</p><p class="center small" style="margin:6px 0 0"><a href="#" data-politicas style="color:#fff;font-weight:700">Términos y condiciones · Tratamiento de datos</a></p>
    </form>
  </div>`;
  const bn = $('#notif-login'); if (bn) bn.onclick = async () => { try { const r = await Notification.requestPermission(); if (r === 'granted') { $('#notif-card').outerHTML = '<div class="card" style="background:#E7F7F1;border-color:#0F7A63;padding:12px 14px;position:relative;z-index:1"><b style="color:#0F7A63">✓ Notificaciones activadas.</b> <span class="small">Ahora entra con tu cédula y tu PIN.</span></div>'; $('#ced').focus(); } else toast('No se activaron. Puedes activarlas luego desde Inicio.', true); } catch { toast('Este celular no permite notificaciones.', true); } };
  if (!bn) $('#ced').focus();
  $('#f').onsubmit = async (e) => {
    e.preventDefault();
    const b = $('button', $('#f')); b.disabled = true; $('#err').textContent = '';
    try {
      const r = await rpc('cliente_ingresar', { p_cedula: digits($('#ced').value), p_pin: $('#pin').value });
      setTok(r.token); activarPush(false).catch(() => {}); route();
    } catch (er) { $('#err').textContent = errText(er); b.disabled = false; }
  };
}

async function loadInicio() { cInicio = await clientCall('cliente_inicio'); return cInicio; }

/* Historial de la tarjeta de sellos (personal y administrador) */
function historialSellos(f) {
  const det = f.sellos_detalle || [], meta = f.sellos_meta || 8;
  const filas = det.map((x, i) => `<tr><td><b>${i + 1}</b></td><td>${fdate(x.fecha)}<div class="small muted">${esc(x.hora || '')}</div></td><td><b>${esc(x.factura || '—')}</b></td><td>${esc(x.tienda || '—')}</td><td class="small">${esc(x.marcado_por || '—')}</td></tr>`).join('');
  const ant = (f.tarjetas_anteriores || []).map((t) => `<details class="small" style="border-top:1px solid var(--line);padding-top:8px"><summary style="cursor:pointer"><b>${t.estado === 'entregada' ? 'Regalo entregado' : 'Tarjeta reiniciada'}</b> el ${fdate(t.fecha)}${t.tienda ? ' en ' + esc(t.tienda) : ''}${t.por ? ' · ' + esc(t.por) : ''}${t.motivo ? ` · <span class="muted">${esc(t.motivo)}</span>` : ''}</summary>
    <div class="muted" style="margin-top:6px">${(t.sellos || []).map((x) => `${fdate(x.fecha)} (${esc(x.factura || '—')})`).join(' · ')}</div></details>`).join('');
  return `<section class="card stack" style="gap:10px">
    <div class="row between wrap"><h2 style="font-size:17px;font-weight:800">Historial de sellos · tarjeta actual</h2><span class="pill ${det.length >= meta ? 'sun' : 'navy'}">${det.length}/${meta}</span></div>
    <div class="small"><b>${esc(f.nombre)}</b> · C.C. ${esc(num(f.cedula))}</div>
    ${det.length ? `<div class="tbl-wrap"><table><thead><tr><th>#</th><th>Fecha</th><th>Factura</th><th>Marcado en</th><th>Por</th></tr></thead><tbody>${filas}</tbody></table></div>` : '<div class="empty" style="padding:14px">Aún no tiene sellos en esta tarjeta.</div>'}
    ${ant ? `<div class="stack" style="gap:6px"><b class="small">Tarjetas anteriores</b>${ant}</div>` : ''}
  </section>`;
}

/* Tarjeta digital de sellos (la ven el cliente y el personal) */
function stampCard(d, quien) {
  const meta = d.sellos_meta || 8;
  const n = Math.min(d.sellos || 0, meta);
  const det = d.sellos_detalle || [];
  const llena = n >= meta;
  const faltan = meta - n;
  const slots = Array.from({ length: meta }, (_, i) => {
    const ultimo = i === meta - 1;
    if (i < n) {
      const f = det[i] && det[i].fecha ? fdate(det[i].fecha).split(' ').slice(0, 2).join(' ') : '';
      return `<div class="slot on" aria-label="Sello ${i + 1} obtenido${f ? ' el ' + f : ''}"><svg aria-hidden="true" viewBox="0 0 100 100" class="slot-sun"><circle cx="50" cy="50" r="26" fill="#F6A21E"/><g stroke="#EB5440" stroke-width="8" stroke-linecap="round"><path d="M50 6v12M50 82v12M6 50h12M82 50h12M19 19l8 8M73 73l8 8M81 19l-8 8M27 73l-8 8"/></g><path d="M38 51l8 8 16-17" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${esc(f)}</span></div>`;
    }
    return `<div class="slot ${ultimo ? 'gift' : ''}" aria-label="${ultimo ? 'Sello 8: regalo' : 'Sello ' + (i + 1) + ' pendiente'}">${ultimo ? ic('gift', 22, 2) + '<span>REGALO</span>' : `<b>${i + 1}</b>`}</div>`;
  }).join('');
  let pie;
  if (llena) pie = quien === 'cliente'
    ? (d.regalo_pedido
      ? `<div class="sc-done" style="text-align:center"><div style="font-size:18px;font-weight:900">Regalo listo para reclamar</div><div style="margin:4px 0 8px">${esc(d.regalo_sellos)}</div><div style="background:#fff;border-radius:12px;padding:10px"><div class="small muted">Muestra esta pantalla en caja</div><b style="font-size:17px">${esc(d.nombre || '')}</b><div>C.C. ${esc(num(d.cedula || ''))}</div></div><div class="small" style="margin-top:8px">El cajero verifica tus 8 sellos y te pide tu PIN.</div></div>`
      : `<div class="sc-done" style="text-align:center"><div style="font-size:18px;font-weight:900">¡Completaste tu tarjeta!</div><div style="margin:4px 0 10px">Tu regalo: <b>${esc(d.regalo_sellos)}</b></div><button class="btn coral block" id="redimir-sellos" style="height:56px;font-size:17px">Redimir mi regalo</button></div>`)
    : `<div class="sc-done">Tarjeta completa. Verifica el historial y entrega el regalo: <b>${esc(d.regalo_sellos)}</b></div>`;
  else pie = `<div class="sc-foot">${faltan === 1 ? 'Te falta <b>1 sello</b>' : `Te faltan <b>${faltan} sellos</b>`} para tu regalo: ${esc(d.regalo_sellos)}</div>`;
  if (quien !== 'cliente' && !llena) pie = pie.replace('Te falta', 'Le falta').replace('Te faltan', 'Le faltan').replace('tu regalo', 'el regalo');
  const compacta = quien === 'cliente' && !llena;
  return `<section class="stampcard${compacta ? ' compact' : ''}" aria-label="Tarjeta de sellos">
    <header><img src="${LOGO}" alt=""><div><b>Tarjeta de sellos</b><span>Restaurante · Santana del Río</span></div><em>${n}/${meta}</em></header>
    <div class="slots">${slots}</div>
    ${pie}
    <div class="sc-rules">1 sello por cada comida fuerte en el Restaurante · Presenta tu factura en caja · Máximo 1 sello por día${d.regalos_recibidos ? ` · Regalos recibidos: ${d.regalos_recibidos}` : ''}</div>
  </section>`;
}

async function clientInicio() {
  app.innerHTML = `<div class="phone"><div class="phone-body"><div class="empty">Cargando…</div></div>${tabbar('inicio')}</div>`;
  let d, prem = []; try { [d, prem] = await Promise.all([loadInicio(), clientCall('cliente_premios').catch(() => [])]); } catch (e) { if (tok()) toast(errText(e), true); return; }
  const reservado = (d.solicitudes || []).reduce((acc, x) => acc + (x.tipo === 'premio' ? (x.puntos || 0) : 0), 0);
  const disp = Math.max(0, d.puntos - reservado);
  const activos = (prem || []).filter((x) => !x.agotado).sort((x, y) => x.puntos - y.puntos);
  const alcanzables = activos.filter((x) => x.puntos <= disp);
  const proximo = activos.find((x) => x.puntos > disp);
  const metaHtml = proximo
    ? `<div class="next"><div class="next-img">${proximo.imagen_url ? `<img src="${esc(proximo.imagen_url)}" alt="">` : ic('gift', 22)}</div><div style="flex:1;min-width:0"><div class="next-t">Tu próximo premio: <b>${esc(proximo.nombre)}</b></div><div class="next-bar"><div style="width:${Math.min(100, Math.round(disp / proximo.puntos * 100))}%"></div></div><div class="next-t">Te faltan <b>${num(proximo.puntos - disp)} pts</b></div></div></div>`
    : '';
  const yaPuede = alcanzables.length ? `<a class="btn coral block" href="#/premios" style="margin-top:12px;position:relative">${ic('gift', 20)} ¡Ya puedes redimir ${alcanzables.length === 1 ? '1 premio' : alcanzables.length + ' premios'}!</a>` : '';
  const pv = d.proximo_vencimiento;
  const mov = (d.movimientos || []).map((m) => {
    const red = m.tipo === 'redencion';
    return `<div class="mv"><div class="ini" style="${red ? 'background:#FCD9D2;color:#C2402F' : ''}">${esc(ini(m.tienda))}</div>
      <div class="t"><b>${esc(red ? (m.tienda || 'Redención') : m.tienda)}${m.con_sello ? ' · +1 sello' : ''}</b><span>${fdate(m.fecha)}${m.valor_compra ? ' · ' + money(m.valor_compra) : ''}</span></div>
      <b style="color:${red ? 'var(--coral-t)' : 'var(--teal-d)'};font-size:14px">${m.puntos > 0 ? '+' : ''}${num(m.puntos)}</b></div>`;
  }).join('') || '<div class="empty">Aún no tienes movimientos.</div>';
  const pend = (d.solicitudes || []).map((s) => `
    <div class="pending stack" style="gap:8px">
      <div class="row between"><b>${s.tipo === 'sellos' ? 'Regalo de sellos' : esc(s.premio)}</b>${s.tipo === 'premio' ? `<span class="pill navy">${num(s.puntos)} pts</span>` : ''}</div>
      ${s.tipo === 'sellos' ? '<span class="small">Reclámalo en la caja del <b>Restaurante</b> con tu cédula y tu PIN.</span><button class="btn ghost sm" data-cancel="' + s.id + '" style="align-self:flex-start">Cancelar solicitud</button>'
        : `<span class="small">Reclámala en ${s.tienda === 'RESTAURANTE' || s.tienda === 'PUNTO DULCE' ? 'el <b>Restaurante</b>' : '<b>Pilatos</b> o <b>Derek</b>'}. Te quedan <b data-hasta="${esc(s.expira_en)}">${restante(s.expira_en)}</b></span>
        <a class="btn coral sm" href="#/canje/${s.id}" style="align-self:flex-start">Ver mi solicitud</a>`}
    </div>`).join('');
  app.innerHTML = `
  <div class="phone"><div class="phone-body">
    <div class="row between">
      <div><span class="muted" style="font-size:13px">¡Hola!</span><h1 style="font-size:22px;font-weight:800">${esc(d.nombre)}</h1></div>
      <button class="btn ghost sm" id="salir" aria-label="Cerrar sesión">${ic('logout', 18)}Salir</button>
    </div>
    <section class="balance big" aria-label="Tus puntos">${SUN}
      <span class="lbl">Tus puntos disponibles</span>
      <span class="num">${num(d.puntos)}<small> pts</small></span>
      <span class="lbl" style="font-size:12px">Ganas 25 puntos por cada $1.000 de compra</span>
      ${metaHtml}
      ${pv && pv.puntos ? `<div class="warn">${ic('clock', 20).replace('currentColor', '#FFD23F')}<span>${num(pv.puntos)} pts vencen el <b>${fdate(pv.fecha)}</b></span></div>` : ''}
      ${yaPuede}
    </section>
    ${stampCard(d, 'cliente')}
    <div class="card row between wrap" style="gap:10px"><div><span class="small muted">Tu tienda favorita</span><div style="font-weight:800;font-size:16px">${esc(d.tienda_favorita || 'Sin elegir')}</div><span class="small muted">Elige también de qué tiendas quieres recibir promociones.</span></div><button class="btn ghost sm" id="fav">Mis tiendas</button></div>
    ${tarjetaPush(d.push_activo)}
    ${botonInstalar()}
    ${d.helado ? `<div class="card row" style="gap:14px;align-items:center;${d.helado.reclamado_en ? '' : 'border-color:var(--sun);background:#FFFBEA'}"><div style="font-size:38px">🍦</div><div class="stack" style="gap:2px"><b>${d.helado.reclamado_en ? 'Ya recibiste tu helado de cumpleaños' : '¡Feliz mes de cumpleaños! Tienes un helado de 2 bolas'}</b><span class="small">${d.helado.reclamado_en ? 'Lo reclamaste el ' + fdate(d.helado.reclamado_en) + '. ¡Que lo hayas disfrutado!' : 'Reclámalo en <b>Punto Dulce</b> durante este mes presentando la factura de tu compra con descuento de cumpleaños.'}</span></div></div>` : ''}
    ${pend ? `<section class="stack" style="gap:10px"><h2 style="font-size:16px;font-weight:800">Premios por reclamar</h2>${pend}</section>` : ''}
    <section class="stack" style="gap:10px"><h2 style="font-size:16px;font-weight:800">Últimos movimientos</h2>${mov}</section>
    <p class="center small" style="margin:4px 0 0"><a href="#" data-politicas style="font-weight:700">Términos y condiciones · Tratamiento de datos</a></p>
  </div>${tabbar('inicio')}</div>`;
  const rs = $('#redimir-sellos'); if (rs) rs.onclick = async () => { rs.disabled = true; try { await clientCall('cliente_solicitar', { p_premio: null }); toast('¡Listo! Muestra tu pantalla en caja para recibir tu regalo.'); clientInicio(); } catch (e) { toast(errText(e), true); rs.disabled = false; } };
  if (!d.push_activo) activarPush(true).then((r) => { if (r === 'ok') { cInicio = null; const c = $('#push-card'); if (c) c.remove(); } }).catch(() => {});
  const pb = $('#push-on'); if (pb) pb.onclick = async () => { pb.disabled = true; try { const r = await activarPush(false); if (r === 'ok') { cInicio = null; toast('¡Notificaciones activadas!'); const c = $('#push-card'); if (c) c.remove(); } else { toast(r === 'denied' ? 'No se activaron: las bloqueaste en el navegador. Actívalas en Ajustes del sitio.' : r === 'error' ? 'Este celular no aceptó las notificaciones. Abre la app en Google Chrome actualizado e inténtalo de nuevo.' : 'No se pudieron activar en este celular.', true); pb.disabled = false; } } catch (e) { toast('No se pudieron activar las notificaciones.', true); pb.disabled = false; } };
  $('#fav').onclick = async () => {
    let pr; try { pr = await clientCall('cliente_inicio_prefs'); } catch (e) { return; }
    const promo = new Set(pr.promo || []);
    dialog(`<h2 style="font-size:20px;font-weight:800">Mis tiendas</h2>
      <div class="field"><label for="pf-fav">Tu tienda favorita</label><select class="input" id="pf-fav">${pr.tiendas.map((t) => `<option value="${t.id}" ${t.id === pr.favorita ? 'selected' : ''}>${esc(t.nombre)}</option>`).join('')}</select></div>
      <fieldset class="promo-set"><legend>Quiero recibir promociones de:</legend><div class="chipchks">${pr.tiendas.map((t) => `<label class="chipchk"><input type="checkbox" name="pf-promo" value="${t.id}" ${promo.has(t.id) ? 'checked' : ''}><span>${esc(t.nombre)}</span></label>`).join('')}</div></fieldset>`, async (dl) => {
      const fav = Number(dl.querySelector('#pf-fav').value);
      const lista = Array.from(dl.querySelectorAll('input[name="pf-promo"]:checked')).map((i) => Number(i.value));
      await clientCall('cliente_preferencias', { p_favorita: fav, p_promo: lista }); toast('Tus tiendas quedaron guardadas.'); clientInicio();
    });
  };
  $('#salir').onclick = async () => { try { await rpc('cliente_salir', { p_token: tok() }); } catch {} setTok(null); cInicio = null; route(); };
  arrancarRelojes();
  $$('[data-cancel]').forEach((b) => b.onclick = async () => { if (!confirm('¿Cancelar esta solicitud?')) return; try { await clientCall('cliente_cancelar', { p_solicitud: b.dataset.cancel }); toast('Solicitud cancelada.'); clientInicio(); } catch (e) { toast(errText(e), true); } });
}

async function clientPremios() {
  app.innerHTML = `<div class="phone"><div class="phone-body"><div class="empty">Cargando…</div></div>${tabbar('premios')}</div>`;
  let list, d;
  try { [list, d] = await Promise.all([clientCall('cliente_premios'), loadInicio()]); } catch (e) { if (tok()) toast(errText(e), true); return; }
  const reservado = (d.solicitudes || []).reduce((a, s) => a + (s.tipo === 'premio' ? s.puntos : 0), 0);
  const disp = d.puntos - reservado;
  const tints = ['#FFE7A8', '#FCD9D2', '#D3EEF4', '#E8E2F5'];
  const items = list.map((p, i) => {
    const ok = disp >= p.puntos && !p.agotado;
    const pct = Math.min(100, Math.round(Math.max(0, disp) / p.puntos * 100));
    return `<div class="card prize">
      <div class="img" style="background:${tints[i % 4]}">${p.imagen_url ? `<img src="${esc(p.imagen_url)}" alt="">` : ic('gift', 30, 1.8)}</div>
      <div class="stack" style="gap:4px;flex:1;min-width:0">
        <b style="font-size:15px">${esc(p.nombre)}</b>
        ${p.tienda ? `<span class="small muted">${esc(p.tienda)}</span>` : ''}
        ${p.descripcion ? `<span class="small muted">${esc(p.descripcion)}</span>` : ''}
        <b style="color:var(--coral-t)">${num(p.puntos)} pts</b>
        ${p.agotado ? '<span class="pill" style="background:var(--line);align-self:flex-start">Agotado</span>'
          : ok ? `<button class="btn coral sm" data-quiero="${p.id}" data-nombre="${esc(p.nombre)}" style="align-self:flex-start">Redimir</button>`
          : `<div class="bar"><div style="width:${pct}%"></div></div><span class="small muted">Te faltan ${num(p.puntos - Math.max(0, disp))} pts</span>`}
      </div></div>`;
  }).join('') || '<div class="empty">Pronto publicaremos los premios.</div>';
  app.innerHTML = `
  <div class="phone"><div class="phone-body">
    <div class="row between"><h1 style="font-size:24px;font-weight:800">Premios</h1><span class="pill navy" style="font-size:13px;padding:6px 14px">${num(d.puntos)} pts</span></div>
    ${reservado ? `<p class="small muted" style="margin:0">Tienes ${num(reservado)} pts apartados en premios por reclamar.</p>` : ''}
    ${items}
    <p class="small muted center" style="margin:0">Al redimir tienes <b>24 horas</b> para reclamarlo: las prendas en <b>Pilatos</b> o <b>Derek</b> y la comida en el <b>Restaurante</b>.</p>
  </div>${tabbar('premios')}</div>`;
  $$('[data-quiero]').forEach((b) => b.onclick = async () => {
    if (!confirm(`¿Quieres redimir "${b.dataset.nombre}"? Tendrás 24 horas para reclamarlo.`)) return;
    b.disabled = true;
    try { const r = await clientCall('cliente_solicitar', { p_premio: b.dataset.quiero }); cInicio = null; location.hash = '#/canje/' + r.id; }
    catch (e) { toast(errText(e), true); b.disabled = false; }
  });
}


/* ---- Solicitud de premio con temporizador de 24 horas ---- */
async function clientCanje(id) {
  app.innerHTML = `<div class="phone"><div class="phone-body"><div class="empty">Cargando…</div></div>${tabbar('premios')}</div>`;
  let d; try { d = await clientCall('cliente_canje', { p_solicitud: id }); } catch (e) { if (tok()) toast(errText(e), true); return; }
  if (!d) { location.hash = '#/premios'; return; }
  const est = d.estado, col = est === 'entregada' ? '#1B6B3A' : est === 'pendiente' ? 'var(--coral)' : '#7A8299';
  const cab = { pendiente: 'MUESTRA ESTA PANTALLA EN', entregada: 'PREMIO ENTREGADO EN', vencida: 'SOLICITUD VENCIDA', cancelada: 'SOLICITUD CANCELADA' }[est];
  app.innerHTML = `
  <div class="phone"><div class="phone-body">
    <div class="card stack" style="gap:14px;padding:0;overflow:hidden;border:3px solid ${col}">
      <div style="background:${col};color:#fff;padding:14px 18px;text-align:center">
        <div style="font-size:13px;font-weight:700;letter-spacing:1px">${cab}</div>
        <div style="font-size:22px;font-weight:900">${est === 'entregada' ? esc(d.entregada_en_tienda || '') : est === 'pendiente' ? esc(d.donde).toUpperCase() : ''}</div></div>
      ${d.imagen_url ? `<img src="${esc(d.imagen_url)}" alt="" style="width:100%;max-height:230px;object-fit:cover;display:block;margin-top:-14px">` : ''}
      <div class="stack" style="gap:6px;padding:0 18px">
        <b style="font-size:22px;line-height:1.2">${esc(d.premio)}</b>
        <span class="small muted">${num(d.puntos)} pts · ${esc(d.cliente)} · C.C. ${esc(num(d.cedula))}</span>
      </div>
      ${est === 'pendiente' ? `<div style="margin:0 18px;text-align:center;background:#FFF5F3;border-radius:16px;padding:14px">
          <div class="small" style="font-weight:700">Tiempo para reclamarlo</div>
          <div style="font-size:44px;font-weight:900;color:var(--coral-t);font-variant-numeric:tabular-nums;letter-spacing:1px" data-hasta="${esc(d.expira_en)}">${restante(d.expira_en)}</div>
          <div class="small muted">Vence ${fdate(d.expira_en)} a las ${new Date(d.expira_en).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}</div></div>
        <p class="small" style="margin:0 18px">Ve a <b>${esc(d.donde)}</b> con tu cédula. Frente al cajero, toca el botón y dale la clave única. Tus puntos se descuentan al recibir el premio.</p>
        <div id="cj-cod" style="margin:0 18px"></div>
        <button class="btn coral block" id="cj-gen" style="margin:0 18px;width:auto;height:56px">${d.con_clave ? 'Generar una clave nueva' : 'Generar clave única para el cajero'}</button>
        <button class="btn ghost sm" id="cj-cancel" style="margin:0 18px 18px;align-self:flex-start">Cancelar solicitud</button>`
      : est === 'entregada' ? `<div style="margin:0 18px 18px;background:#E6F4EA;color:#1B6B3A;border-radius:14px;padding:14px;font-weight:700;text-align:center">✓ ¡Disfrútalo!<div class="small" style="font-weight:600;margin-top:4px">Entregado el ${fdate(d.entregada_en)} a las ${new Date(d.entregada_en).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}</div></div>`
      : `<div style="margin:0 18px 18px" class="small muted">${est === 'vencida' ? 'Pasaron las 24 horas sin reclamarlo. Tus puntos siguen en tu cuenta; puedes volver a redimirlo cuando quieras.' : 'Cancelaste esta solicitud. Tus puntos siguen en tu cuenta.'}</div>`}
    </div>
    <a class="small center muted" href="#/">Volver al inicio</a>
  </div>${tabbar('premios')}</div>`;
  if (est === 'pendiente') {
    arrancarRelojes();
    $('#cj-cancel').onclick = async () => { if (!confirm('¿Cancelar esta solicitud?')) return; try { await clientCall('cliente_cancelar', { p_solicitud: id }); cInicio = null; clientCanje(id); } catch (e) { toast(errText(e), true); } };
    const KEY = 'ps_cod_' + id;
    const pintar = (cod) => { $('#cj-cod').innerHTML = cod ? `<div style="text-align:center;border:3px dashed var(--coral);border-radius:16px;padding:12px;background:#fff">
        <div class="small" style="font-weight:700">Clave única para el cajero</div>
        <div style="font-size:46px;font-weight:900;letter-spacing:6px;color:var(--navy);font-variant-numeric:tabular-nums">${cod.slice(0, 3)} ${cod.slice(3)}</div>
        <div class="small muted">Dásela solo al cajero. Si generas otra, esta deja de servir.</div></div>` : ''; };
    let guardado = null; try { guardado = sessionStorage.getItem(KEY); } catch {}
    if (d.con_clave && guardado) pintar(guardado);
    $('#cj-gen').onclick = async () => {
      if (d.con_clave && !confirm('Se generará una clave nueva y la anterior dejará de servir. ¿Continuar?')) return;
      const b = $('#cj-gen'); b.disabled = true;
      try { const r = await clientCall('cliente_generar_codigo', { p_solicitud: id }); try { sessionStorage.setItem(KEY, r.codigo); } catch {} d.con_clave = true; pintar(r.codigo); b.textContent = 'Generar una clave nueva'; }
      catch (e) { toast(errText(e), true); }
      b.disabled = false;
    };
    const vigila = setInterval(async () => { if (!location.hash.includes(id)) return clearInterval(vigila); try { const n = await clientCall('cliente_canje', { p_solicitud: id }); if (n && n.estado !== 'pendiente') { clearInterval(vigila); try { sessionStorage.removeItem(KEY); } catch {} cInicio = null; clientCanje(id); } else if (n && !n.con_clave && d.con_clave) { d.con_clave = false; pintar(null); $('#cj-gen').textContent = 'Generar clave única para el cajero'; toast('Tu clave se anuló. Genera una nueva.', true); } } catch {} }, 4000);
  }
}

async function clientCupones() {
  app.innerHTML = `<div class="phone"><div class="phone-body"><div class="empty">Cargando…</div></div>${tabbar('cupones')}</div>`;
  let list; try { list = await clientCall('cliente_cupones'); } catch (e) { if (tok()) toast(errText(e), true); return; }
  const colors = ['var(--coral)', 'var(--teal)', 'var(--sun)', 'var(--navy)'];
  app.innerHTML = `
  <div class="phone"><div class="phone-body">
    <h1 style="font-size:24px;font-weight:800">Cupones</h1>
    ${list.map((c, i) => `<div>${c.foto_url ? `<img src="${esc(c.foto_url)}" alt="" style="width:100%;max-height:300px;object-fit:cover;border-radius:18px 18px 0 0;display:block">` : ''}<div class="coupon" ${c.foto_url ? 'style="border-top-left-radius:0;border-top-right-radius:0;border-top:0"' : ''}><div class="l" style="background:${colors[i % 4]}">${ic('ticket', 34, 2)}</div>
      <div class="r"><b style="font-size:15px">${esc(c.titulo)}</b>
      ${c.descripcion ? `<span class="small muted">${esc(c.descripcion)}</span>` : ''}
      ${c.tienda ? `<span class="small">${esc(c.tienda)}</span>` : ''}
      ${c.valido_hasta ? `<span class="small muted">Válido hasta ${fdate(c.valido_hasta)}</span>` : ''}
      ${c.codigo ? `<span class="code">${esc(c.codigo)}</span>` : ''}</div></div></div>`).join('') || '<div class="empty">No hay cupones activos por ahora.</div>'}
  </div>${tabbar('cupones')}</div>`;
}

async function clientMensajes() {
  app.innerHTML = `<div class="phone"><div class="phone-body"><div class="empty">Cargando…</div></div>${tabbar('mensajes')}</div>`;
  let list; try { list = await clientCall('cliente_mensajes'); } catch (e) { if (tok()) toast(errText(e), true); return; }
  if (cInicio) cInicio.no_leidos = 0;
  const colors = ['var(--coral)', 'var(--teal)', 'var(--sun)', 'var(--navy)'];
  app.innerHTML = `
  <div class="phone"><div class="phone-body">
    <h1 style="font-size:24px;font-weight:800">Mensajes</h1>
    ${list.map((m, i) => `<div class="card msg" style="${m.leido ? '' : 'border-color:#FCD9D2'}"><div class="ic" style="background:${colors[i % 4]};color:#fff">${ic('bell', 20, 2.2)}</div>
      <div class="stack" style="gap:2px;flex:1;min-width:0"><div class="row between" style="gap:8px;align-items:flex-start"><b style="font-size:14px">${esc(m.titulo)}</b><span class="small muted" style="flex:0 0 auto">${fdate(m.enviado_en)}</span></div>
      <span class="small muted" style="white-space:pre-line">${esc(m.cuerpo)}</span></div></div>`).join('') || '<div class="empty">Aún no tienes mensajes.</div>'}
  </div>${tabbar('mensajes')}</div>`;
}

/* =====================================================
   PERSONAL (administrador y recaudadores)
   ===================================================== */
let perfil = null, tiendas = [], config = {}, ficha = null;

// Cierra la sesión del personal aunque el servidor ya la haya invalidado (p. ej. tras cambiar la contraseña)
async function cerrarSesion() {
  try { await sb.auth.signOut({ scope: 'local' }); } catch {}
  try { Object.keys(localStorage).filter((k) => k.startsWith('ps_staff') || k.startsWith('sb-')).forEach((k) => localStorage.removeItem(k)); } catch {}
  perfil = null; ficha = null;
}
async function loadStaff() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { perfil = null; return null; }
  if (perfil && perfil.user_id === session.user.id) return perfil;
  const [{ data: p }, { data: t }, { data: c }] = await Promise.all([
    sb.from('perfiles').select('*').eq('user_id', session.user.id).maybeSingle(),
    sb.from('tiendas').select('*').order('orden'),
    sb.from('config').select('*')
  ]);
  if (!p) { await cerrarSesion(); return null; }
  perfil = p; tiendas = t || []; config = Object.fromEntries((c || []).map((r) => [r.clave, r.valor]));
  return perfil;
}
const tiendaNombre = (id) => (tiendas.find((t) => t.id === id) || {}).nombre || '';

let mantenerFicha = false;
async function staffRoute(view) {
  document.title = 'Puntos Santana · Personal';
  const p = await loadStaff();
  if (!p) return staffLogin();
  if (p.rol === 'admin' && !(await adminVerificado())) return adminSegundoPaso();
  const isAdmin = p.rol === 'admin';
  if (!view) view = isAdmin ? 'dashboard' : 'acumular';
  const adminOnly = ['diario', 'helados', 'alertas', 'dashboard', 'informe', 'clientes', 'cumpleanos', 'premios', 'cupones', 'mensajes', 'ajustes'];
  if (!isAdmin && adminOnly.includes(view)) view = 'acumular';
  // Cada pantalla empieza en blanco (sin la cédula del cliente anterior), salvo justo después de inscribir o activar
  if (!mantenerFicha) ficha = null;
  mantenerFicha = false;
  staffShell(view);
  const box = $('#content');
  const views = { acumular: vAcumular, nuevo: vNuevo, redimir: vRedimir, sellos: vSellos, dashboard: vDashboard, informe: vInforme, clientes: vClientes, cumpleanos: vCumple, premios: vPremios, cupones: vCupones, mensajes: vMensajes, ajustes: vAjustes, alertas: vAlertas, helado: vHelado, helados: vHelados, diario: vDiario };
  Promise.resolve((views[view] || vAcumular)(box)).catch(() => {}).finally(() => { if (isAdmin) contarAlertas(); });
}

/* ---- Doble verificación del administrador (código de app autenticadora) ---- */
async function adminVerificado() {
  try { const { data } = await sb.auth.mfa.getAuthenticatorAssuranceLevel(); return data && data.currentLevel === 'aal2'; } catch { return false; }
}
async function adminSegundoPaso() {
  document.title = 'Puntos Santana · Verificación';
  let factores = [];
  try { const { data } = await sb.auth.mfa.listFactors(); factores = (data && data.all) || []; } catch {}
  const listo = factores.find((f) => f.factor_type === 'totp' && f.status === 'verified');
  const marco = (inner) => `<div class="login-staff"><form class="card" id="mf2" novalidate style="max-width:460px">
    <div class="brand" style="color:var(--navy)"><img src="${LOGO}" alt=""><div><b>PUNTOS <span style="color:var(--coral)">SANTANA</span></b><small class="muted">Administrador · doble verificación</small></div></div>
    ${inner}
    <div class="field"><label for="mf-code">Código de 6 dígitos</label><input class="input pin" id="mf-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6"></div>
    <p id="err" class="small" style="color:var(--coral-t);margin:0;min-height:18px"></p>
    <button class="btn coral block">Verificar</button>
    <button type="button" class="btn ghost block" id="mf-out">Cerrar sesión</button></form></div>`;
  let factorId;
  if (listo) {
    factorId = listo.id;
    app.innerHTML = marco('<p class="muted" style="margin:0">Abre <b>Google Authenticator</b> (o tu app de códigos) en tu celular y escribe el código de <b>Puntos Santana</b>.</p>');
  } else {
    for (const f of factores.filter((x) => x.status !== 'verified')) { try { await sb.auth.mfa.unenroll({ factorId: f.id }); } catch {} }
    const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Puntos Santana ' + Date.now() });
    if (error) { app.innerHTML = `<div class="login-staff"><div class="card stack"><b>No se pudo iniciar la doble verificación.</b><span class="small muted">${esc(error.message)}</span><button class="btn ghost" id="mf-out">Cerrar sesión</button></div></div>`; $('#mf-out').onclick = async () => { await cerrarSesion(); perfil = null; route(); }; return; }
    factorId = data.id;
    app.innerHTML = marco(`<div class="stack" style="gap:10px">
      <b style="font-size:17px">Activa la doble verificación (una sola vez)</b>
      <ol class="small" style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px">
        <li>Instala <b>Google Authenticator</b> en tu celular (gratis en Play Store o App Store).</li>
        <li>Toca <b>+</b> → <b>Escanear un código QR</b> y escanea este código.</li>
        <li>Escribe abajo el código de 6 dígitos que aparece.</li>
      </ol>
      <div style="align-self:center;background:#fff;padding:10px;border-radius:14px;border:2px solid var(--line)"><img src="${data.totp.qr_code}" alt="Código QR para la app autenticadora" style="width:190px;height:190px;display:block"></div>
      <details class="small"><summary style="cursor:pointer">¿No puedes escanear? Escribe esta clave</summary><code style="word-break:break-all;font-size:13px">${esc(data.totp.secret)}</code></details></div>`);
  }
  $('#mf-code').focus();
  $('#mf-out').onclick = async () => { await cerrarSesion(); perfil = null; location.hash = '#/personal'; route(); };
  $('#mf2').onsubmit = async (e) => {
    e.preventDefault();
    const code = digits($('#mf-code').value), b = $('button', $('#mf2'));
    if (code.length !== 6) { $('#err').textContent = 'Escribe los 6 dígitos.'; return; }
    b.disabled = true; $('#err').textContent = '';
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId, code });
    if (error) { $('#err').textContent = 'Código incorrecto o vencido. Escribe el código que aparece ahora.'; b.disabled = false; $('#mf-code').value = ''; $('#mf-code').focus(); return; }
    toast('Verificación correcta.'); route();
  };
}

function staffLogin() {
  app.innerHTML = `
  <div class="login-staff"><form class="card" id="f" novalidate>
    <div class="brand" style="color:var(--navy)"><img src="${LOGO}" alt=""><div><b>PUNTOS <span style="color:var(--coral)">SANTANA</span></b><small class="muted">Acceso del personal</small></div></div>
    <div class="field"><label for="u">Usuario</label><input class="input" id="u" autocomplete="username" autocapitalize="none" placeholder="admin, pilatos, derek o restaurante" required></div>
    <div class="field"><label for="p">Contraseña</label><input class="input" id="p" type="password" autocomplete="current-password" required></div>
    <p id="err" class="small" style="color:var(--coral-t);margin:0;min-height:18px"></p>
    <button class="btn coral block">Entrar</button>
    <a class="small center muted" href="#/">Ir a la app de clientes</a>
  </form></div>`;
  $('#u').focus();
  $('#f').onsubmit = async (e) => {
    e.preventDefault();
    const b = $('button', $('#f')); b.disabled = true; $('#err').textContent = '';
    let u = $('#u').value.trim().toLowerCase();
    if (!u.includes('@')) u = u + '@' + CFG.dominioUsuarios;
    const { error } = await sb.auth.signInWithPassword({ email: u, password: $('#p').value });
    if (error) { $('#err').textContent = errText(error); b.disabled = false; return; }
    perfil = null; route();
  };
}

function staffShell(view) {
  const isAdmin = perfil.rol === 'admin';
  const L = (v, icon, label) => `<a href="#/personal/${v}" ${view === v ? 'aria-current="page"' : ''}>${ic(icon, 20)}${label}</a>`;
  const side = isAdmin
    ? `<nav class="side admin" aria-label="Menú">${L('dashboard', 'chart', 'Dashboard')}${L('diario', 'chart', 'Informe diario')}${L('informe', 'chart', 'Informe mensual')}${L('clientes', 'users', 'Clientes y transacciones')}${L('cumpleanos', 'gift', 'Cumpleaños del mes')}${L('helados', 'chart', 'Helados de cumpleaños')}${L('premios', 'gift', 'Premios')}${L('cupones', 'ticket', 'Cupones')}${L('mensajes', 'send', 'Mensajes')}${L('alertas', 'bell', 'Alertas<span class="pill" id="al-badge" style="background:var(--coral);color:#fff;margin-left:auto;padding:2px 9px;display:none"></span>')}${L('ajustes', 'gear', 'Ajustes')}<div class="sep"></div>${L('acumular', 'plus', 'Acumular')}${L('sellos', 'check', 'Marcar sello')}${L('nuevo', 'user', 'Cliente nuevo')}${L('redimir', 'gift', 'Entregar premio')}${L('helado', 'gift', 'Helado cumpleaños')}</nav>`
    : `<nav class="side" aria-label="Acciones">${L('nuevo', 'user', 'Cliente nuevo')}${L('acumular', 'plus', 'Acumular')}${L('sellos', 'check', 'Marcar sello')}${L('redimir', 'gift', 'Entregar premio')}${tiendaNombre(perfil.tienda_id) === 'RESTAURANTE' ? L('helado', 'gift', 'Helado cumpleaños') : ''}</nav>`;
  const tn = tiendaNombre(perfil.tienda_id);
  app.innerHTML = `
  <div class="staff">
    <header class="topbar">
      <div class="brand"><img src="${LOGO}" alt="Puntos Santana"><div><b>PUNTOS <span>SANTANA</span></b><small>${isAdmin ? 'Administrador' : 'Punto recaudador'}</small></div></div>
      <div class="row">${tn ? `<span class="pill ${tn === 'DEREK' ? 'sun' : 'teal'}" style="padding:6px 14px">TIENDA ${esc(tn)}</span>` : ''}
      <button class="btn sm" id="logout" style="background:transparent;border:2px solid rgba(255,255,255,.3)">Cerrar sesión</button></div>
    </header>
    <div class="staff-main">${side}<main class="content" id="content"></main></div>
  </div>`;
  $('#logout').onclick = async () => { await cerrarSesion(); perfil = null; ficha = null; location.hash = '#/personal'; route(); };
}

/* ---- buscador de cliente compartido ---- */
function clientBar(f) {
  if (!f) return '';
  const meta = f.sellos_meta || 8;
  const cumple = f.cumple_hoy ? '<span class="pill sun">¡Cumple hoy!</span>' : (f.cumple_mes ? '<span class="pill sun">Cumple este mes</span>' : '');
  const act = f.activo ? '' : `
  <form class="card stack" id="actf" novalidate style="border-color:var(--yellow);background:#FFFBEA">
    <div><b style="font-size:17px">Cliente sin activar</b><div class="small muted">Viene de la base de datos del mall. Ya tiene <b>${num(f.puntos)} puntos</b> guardados. Puede acumular, pero para entrar a la app y redimir debe activar su cuenta. Confirma con el cliente el celular y el correo, y que él mismo escriba su PIN.</div></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
      <div class="field"><label for="a-cel">Celular *</label><input class="input" id="a-cel" inputmode="tel" value="${esc(f.celular_activar || '')}"></div>
      <div class="field"><label for="a-mail">Correo (opcional)</label><input class="input" id="a-mail" type="email" value="${esc(f.correo_activar || '')}"></div>
      ${f.fecha_nacimiento ? '' : '<div class="field"><label for="a-nac">Fecha de nacimiento</label><input class="input" id="a-nac" type="date"></div>'}
      <div class="field"><label for="a-fav">Tienda favorita *</label><select class="input" id="a-fav"><option value="">Elige una tienda…</option>${tiendas.map((t) => `<option value="${t.id}">${esc(t.nombre)}</option>`).join('')}</select></div>
      <div class="field"><label for="a-pin">PIN (4 números) *</label><input class="input pin" id="a-pin" type="password" inputmode="numeric" maxlength="4"></div>
      <div class="field"><label for="a-pin2">Repetir PIN *</label><input class="input pin" id="a-pin2" type="password" inputmode="numeric" maxlength="4"></div>
    </div>
    <fieldset class="promo-set"><legend>¿De qué tiendas quiere recibir promociones? <span class="muted">(puede elegir varias)</span></legend><div class="chipchks">${tiendas.map((t) => `<label class="chipchk"><input type="checkbox" name="a-promo" value="${t.id}"><span>${esc(t.nombre)}</span></label>`).join('')}</div></fieldset>
    <label class="check"><input type="checkbox" id="a-ok"><span>${AUTORIZA}</span></label>
    <button class="btn coral" style="align-self:flex-start">Activar cuenta</button>
  </form>`;
  return `<div class="card client-bar">
    <div class="avatar">${esc(ini(f.nombre))}</div>
    <div style="flex:1;min-width:160px"><div class="row wrap" style="gap:8px"><b style="font-size:18px">${esc(f.nombre)}</b>${cumple}${f.activo ? '' : '<span class="pill" style="background:#FFE7A8">Sin activar</span>'}</div><div class="small muted">C.C. ${esc(num(f.cedula))}${f.celular_fin ? ' · Cel. ••• ' + esc(f.celular_fin) : ''}</div></div>
    <div class="kv"><span>Puntos</span><b>${num(f.puntos)}</b></div>
    <div class="kv"><span>Sellos</span><b style="color:var(--coral-t)">${f.sellos}/${meta}</b></div>
    ${f.activo ? '<button type="button" class="btn ghost sm" id="rpin-btn">Restablecer PIN</button>' : ''}
  </div>${act}`;
}
// Restablecer PIN en tienda (verificando la cédula física)
document.addEventListener('click', (e) => {
  if (!e.target.closest('#rpin-btn') || !ficha) return;
  dialog(`<h2 style="font-size:20px;font-weight:800">Restablecer PIN</h2>
    <p class="muted" style="margin:0">${esc(ficha.nombre)} · C.C. ${esc(num(ficha.cedula))}. El cliente elige su nuevo PIN.</p>
    <div class="grid" style="grid-template-columns:1fr 1fr"><div class="field"><label for="r-p1">Nuevo PIN</label><input class="input pin" id="r-p1" type="password" inputmode="numeric" maxlength="4"></div>
    <div class="field"><label for="r-p2">Repetir PIN</label><input class="input pin" id="r-p2" type="password" inputmode="numeric" maxlength="4"></div></div>
    <label class="check"><input type="checkbox" id="r-ok"><span>Verifiqué la <b>cédula física</b> del cliente y coincide con este registro.</span></label>`, async (dl) => {
    const a = dl.querySelector('#r-p1').value, b = dl.querySelector('#r-p2').value;
    if (!/^\d{4}$/.test(a)) { toast(ERR.PIN_INVALIDO, true); return false; }
    if (a !== b) { toast('Los dos PIN no coinciden.', true); return false; }
    if (!dl.querySelector('#r-ok').checked) { toast(ERR.VERIFICAR_CEDULA, true); return false; }
    ficha = await rpc('restablecer_pin_tienda', { p_cedula: ficha.cedula, p_pin: a, p_verifico: true });
    toast('PIN restablecido. El cliente ya puede entrar con su nuevo PIN.');
  }, 'Restablecer');
});

// Activación de clientes importados (formulario dentro de la ficha)
document.addEventListener('submit', async (e) => {
  if (e.target.id !== 'actf') return;
  e.preventDefault();
  const f = e.target, v = (id) => (f.querySelector('#' + id) || {}).value || '';
  if (digits(v('a-cel')).length < 7) return toast('Escribe el celular del cliente.', true);
  if (!/^\d{4}$/.test(v('a-pin'))) return toast(ERR.PIN_INVALIDO, true);
  if (v('a-pin') !== v('a-pin2')) return toast('Los dos PIN no coinciden.', true);
  if (!v('a-fav')) return toast(ERR.TIENDA_FAVORITA_REQUERIDA, true);
  if (!f.querySelector('#a-ok').checked) return toast(ERR.SIN_AUTORIZACION_DATOS, true);
  const b = f.querySelector('button'); b.disabled = true;
  try {
    ficha = await rpc('activar_cliente', { p_cedula: ficha.cedula, p_celular: v('a-cel'), p_correo: v('a-mail'), p_pin: v('a-pin'), p_acepta: true, p_nacimiento: v('a-nac') || null, p_tienda_favorita: Number(v('a-fav')), p_promo_tiendas: Array.from(f.querySelectorAll('input[name="a-promo"]:checked')).map((i) => Number(i.value)) });
    toast('Cuenta activada. Ya puede entrar a la app con su cédula y PIN.');
    mostrarQRCliente();
    mantenerFicha = true; route();
  } catch (er) { toast(errText(er), true); b.disabled = false; }
});
function searchBox(onFound) {
  return {
    html: `<form class="row wrap" id="sf" style="align-items:flex-end" novalidate>
      <div class="field" style="flex:1;min-width:220px"><label for="sced">Cédula del cliente</label><input class="input" id="sced" inputmode="numeric" autocomplete="off" value="${ficha ? esc(ficha.cedula) : ''}"></div>
      <button class="btn">Buscar</button></form><div id="sres"></div>`,
    bind() {
      $('#sf').onsubmit = async (e) => {
        e.preventDefault();
        const c = digits($('#sced').value); if (!c) return;
        try {
          const f = await rpc('buscar_cliente', { p_cedula: c });
          if (!f) { ficha = null; $('#sres').innerHTML = `<div class="card row wrap between"><span>No hay un cliente con la cédula <b>${esc(num(c))}</b>.</span><a class="btn coral sm" href="#/personal/nuevo" id="go-new">Inscribirlo</a></div>`; $('#go-new').onclick = () => { sessionStorage.setItem('ps_new_ced', c); }; onFound(null); return; }
          ficha = f; onFound(f);
        } catch (er) { toast(errText(er), true); }
      };
    }
  };
}

function vNuevo(box) {
  let pre = ''; try { pre = sessionStorage.getItem('ps_new_ced') || ''; sessionStorage.removeItem('ps_new_ced'); } catch {}
  box.innerHTML = `
  <h1 style="font-size:28px;font-weight:800">Cliente nuevo</h1>
  <form class="card stack" id="nf" style="max-width:720px" novalidate>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
      <div class="field"><label for="n-ced">Cédula *</label><input class="input" id="n-ced" inputmode="numeric" value="${esc(pre)}" required></div>
      <div class="field"><label for="n-nom">Nombre completo *</label><input class="input" id="n-nom" autocomplete="off" required></div>
      <div class="field"><label for="n-cel">Celular *</label><input class="input" id="n-cel" inputmode="tel" required></div>
      <div class="field"><label for="n-mail">Correo (opcional)</label><input class="input" id="n-mail" type="email"></div>
      <div class="field"><label for="n-pin">PIN de 4 números (lo elige el cliente) *</label><input class="input pin" id="n-pin" type="password" inputmode="numeric" maxlength="4" required></div>
      <div class="field"><label for="n-pin2">Repetir PIN *</label><input class="input pin" id="n-pin2" type="password" inputmode="numeric" maxlength="4" required></div>
      <div class="field"><label for="n-nac">Fecha de nacimiento *</label><input class="input" id="n-nac" type="date" max="${iso(new Date())}"></div>
      <div class="field"><label for="n-fav">Tienda favorita *</label><select class="input" id="n-fav"><option value="">Elige una tienda…</option>${tiendas.map((t) => `<option value="${t.id}">${esc(t.nombre)}</option>`).join('')}</select></div>
    </div>
    <fieldset class="promo-set"><legend>¿De qué tiendas quiere recibir promociones? <span class="muted">(puede elegir varias)</span></legend><div class="chipchks">${tiendas.map((t) => `<label class="chipchk"><input type="checkbox" name="n-promo" value="${t.id}"><span>${esc(t.nombre)}</span></label>`).join('')}</div></fieldset>
    <label class="check"><input type="checkbox" id="n-ok"><span>${AUTORIZA}</span></label>
    <p id="err" class="small" style="color:var(--coral-t);margin:0;min-height:18px"></p>
    <button class="btn coral" style="align-self:flex-start">Inscribir cliente</button>
  </form>`;
  $('#nf').onsubmit = async (e) => {
    e.preventDefault();
    const err = $('#err'); err.textContent = '';
    const v = (id) => $('#' + id).value.trim();
    if (!/^\d{5,12}$/.test(v('n-ced').replace(/[.\s-]/g, ''))) { err.textContent = 'En Cédula escribe solo el número del documento (5 a 12 dígitos, sin letras).'; $('#n-ced').focus(); return; }
    if (!v('n-nom')) { err.textContent = 'Escribe el nombre completo.'; $('#n-nom').focus(); return; }
    if (digits(v('n-cel')).length < 7) { err.textContent = 'Revisa el celular: debe tener al menos 7 números.'; $('#n-cel').focus(); return; }
    if (!/^\d{4}$/.test(v('n-pin'))) { err.textContent = ERR.PIN_INVALIDO; return; }
    if (v('n-pin') !== v('n-pin2')) { err.textContent = 'Los dos PIN no coinciden.'; return; }
    if (!v('n-nac')) { err.textContent = 'Escribe la fecha de nacimiento: con ella le enviamos su promoción de cumpleaños.'; return; }
    if (!v('n-fav')) { err.textContent = 'Elige la tienda favorita del cliente: allí recibirá sus promociones.'; return; }
    if (!$('#n-ok').checked) { err.textContent = ERR.SIN_AUTORIZACION_DATOS; return; }
    const b = $('button', $('#nf')); b.disabled = true;
    try {
      ficha = await rpc('crear_cliente', { p_cedula: v('n-ced'), p_nombre: v('n-nom'), p_celular: v('n-cel'), p_correo: v('n-mail'), p_pin: v('n-pin'), p_acepta: true, p_nacimiento: v('n-nac'), p_tienda_favorita: Number(v('n-fav')), p_promo_tiendas: $$('input[name="n-promo"]:checked').map((i) => Number(i.value)) });
      toast('Cliente inscrito. Ya puedes acumular su compra.');
      mostrarQRCliente();
      mantenerFicha = true; location.hash = '#/personal/acumular';
    } catch (er) { err.textContent = errText(er); b.disabled = false; }
  };
}

function vAcumular(box) {
  const s = searchBox(() => draw());
  const ppm = Number(config.puntos_por_mil || 25), meses = Number(config.vigencia_meses || 12);
  let tienda = null, valor = 0, fnum = '', ffecha = iso(new Date()), fnom = '', fced = '';
  box.innerHTML = `<h1 style="font-size:28px;font-weight:800">Acumular compra</h1>
  <p class="muted" style="margin:0">Siempre con la factura en la mano. La factura debe estar <b>a nombre del cliente o traer su cédula</b>: no se acumulan facturas de otra persona.</p>${s.html}<div id="acc"></div>`;
  s.bind();
  function vence() { const d = new Date(ffecha + 'T12:00:00'); d.setMonth(d.getMonth() + meses); return fdate(d); }
  function ready() { return tienda && valor > 0 && fnum.trim() && ffecha && (fnom.trim() || digits(fced)); }
  function draw() {
    const acc = $('#acc');
    if (!ficha) { acc.innerHTML = ''; return; }
    $('#sres').innerHTML = clientBar(ficha);
    const t = tiendas.find((x) => x.id === tienda);
    acc.innerHTML = `
    <div class="cols">
      <section class="card stack"><h2 style="font-size:18px;font-weight:800">1. Tienda que vendió</h2>
        <div class="stores">${tiendas.map((x) => `<button type="button" data-t="${x.id}" aria-pressed="${x.id === tienda}">${esc(x.nombre)}</button>`).join('')}</div>
      </section>
      <section class="navy-card">
        <h2 style="font-size:18px;font-weight:800">2. Datos de la factura</h2>
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">
          <div class="field"><label for="f-num">Número de factura</label><input class="input" id="f-num" autocomplete="off" style="text-transform:uppercase" value="${esc(fnum)}"></div>
          <div class="field"><label for="f-fecha">Fecha de la factura</label><input class="input" id="f-fecha" type="date" max="${iso(new Date())}" min="${(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return iso(d); })()}" value="${esc(ffecha)}"></div>
        </div>
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">
          <div class="field"><label for="f-nom">Nombre en la factura</label><input class="input" id="f-nom" autocomplete="off" value="${esc(fnom)}" placeholder="${esc(ficha.nombre)}"></div>
          <div class="field"><label for="f-ced">Cédula en la factura</label><input class="input" id="f-ced" inputmode="numeric" autocomplete="off" value="${esc(fced)}" placeholder="Si la trae"></div>
        </div>
        <span class="small" style="color:#CFE9F0;margin-top:-6px">Basta con uno: el nombre del cliente o su cédula. Si la factura dice "Consumidor final", usa la cédula.</span>
        <label for="valor" style="font-size:13px;font-weight:600">Valor de la factura</label>
        <div class="money"><span>$</span><input id="valor" inputmode="numeric" autocomplete="off" value="${valor ? num(valor) : ''}"></div>
        <div style="background:rgba(255,255,255,.1);border-radius:16px;padding:14px" class="stack">
          <span class="small" style="color:#CFE9F0">Puntos a acumular</span>
          <span class="big" id="pts">+${num(Math.floor(valor / 1000) * ppm)}</span>
          <span class="small" style="color:#CFE9F0" id="vence">${ppm} pts por cada $1.000 · vencen el ${vence()}</span>
        </div>
        ${t && t.da_sellos ? `<a href="#/personal/sellos" style="background:var(--sun);color:var(--navy);border-radius:14px;padding:12px 14px;font-size:13px;font-weight:700;text-decoration:none">Compra en el Restaurante: si incluye comida fuerte, marca el sello con la factura →</a>` : ''}
        <button class="btn coral block" id="reg" style="height:60px;font-size:17px" ${ready() ? '' : 'disabled'}>Registrar compra</button>
      </section>
    </div>`;
    const upd = () => { $('#reg').disabled = !ready(); };
    $$('[data-t]').forEach((b) => b.onclick = () => { tienda = Number(b.dataset.t); draw(); });
    const vi = $('#valor');
    vi.oninput = () => { valor = Number(digits(vi.value)); vi.value = valor ? num(valor) : ''; $('#pts').textContent = '+' + num(Math.floor(valor / 1000) * ppm); upd(); };
    $('#f-num').oninput = (e) => { fnum = e.target.value; upd(); };
    $('#f-nom').oninput = (e) => { fnom = e.target.value; upd(); };
    $('#f-ced').oninput = (e) => { fced = e.target.value; upd(); };
    $('#f-fecha').oninput = (e) => { ffecha = e.target.value; if (ffecha) $('#vence').textContent = `${ppm} pts por cada $1.000 · vencen el ${vence()}`; upd(); };
    $('#reg').onclick = () => {
      const pts = Math.floor(valor / 1000) * ppm;
      const fila = (k, v, big) => `<div class="vrow"><span>${k}</span><b${big ? ' class="vbig"' : ''}>${v}</b></div>`;
      dialog(`<div class="vhead">${ic('check', 26, 2.6)}<div><h2 style="font-size:22px;font-weight:900">¿Estos son los datos correctos?</h2><span class="small muted">Revísalos con la factura en la mano antes de guardar.</span></div></div>
        <div class="vbox">
          ${fila('Cliente', `${esc(ficha.nombre)}<div class="small muted" style="font-weight:600">C.C. ${esc(num(ficha.cedula))}</div>`)}
          ${fila('Tienda que vendió', esc(tiendaNombre(tienda)))}
          ${fila('Número de factura', esc(fnum.trim().toUpperCase()))}
          ${fila('Fecha de la factura', fdate(ffecha))}
          ${fnom.trim() ? fila('Nombre en la factura', esc(fnom.trim())) : ''}${digits(fced) ? fila('Cédula en la factura', esc(num(digits(fced)))) : ''}
          ${fila('Valor de la factura', money(valor), true)}
          ${fila('Puntos que gana', '+' + num(pts), true)}
        </div>`, async () => {
        const r = await rpc('acumular', { p_cedula: ficha.cedula, p_tienda_id: tienda, p_valor: valor, p_factura_numero: fnum, p_factura_fecha: ffecha, p_factura_nombre: fnom, p_factura_cedula: digits(fced) || null });
        const nombre = r.cliente.nombre, total = r.cliente.puntos, fac = fnum.trim().toUpperCase();
        const tipoCli = r.recurrente ? `<span class="pill navy">Cliente recurrente en ${esc(r.tienda)}</span>` : `<span class="pill" style="background:var(--coral);color:#fff">Cliente nuevo en ${esc(r.tienda)}</span>`;
        // Formulario en blanco: cliente, cédula y factura
        ficha = null; valor = 0; fnum = ''; fnom = ''; fced = ''; tienda = null; ffecha = iso(new Date());
        $('#sced').value = ''; $('#sres').innerHTML = '';
        $('#acc').innerHTML = `<div class="card okcard">${ic('check', 30, 2.6)}<div><div class="row wrap" style="gap:8px"><b style="font-size:18px">Compra registrada</b>${tipoCli}</div><div class="small">Factura ${esc(fac)} · +${num(r.puntos_ganados)} puntos para ${esc(nombre)} · Total: ${num(total)} pts</div><div class="small muted">El formulario quedó en blanco para la siguiente compra.</div></div></div>`;
        $('#sced').focus();
        toast(`+${num(r.puntos_ganados)} puntos para ${nombre}`);
      }, 'Sí, son correctos');
      const dl = document.querySelector('dialog:last-of-type');
      if (dl) dl.querySelector('[data-x]').textContent = 'Corregir';
    };
  }
  if (ficha) draw();
}

function vSellos(box) {
  const s = searchBox(() => draw());
  box.innerHTML = `<h1 style="font-size:28px;font-weight:800">Marcar sello</h1>
  <p class="muted" style="margin:0">El sello es <b>solo por comida fuerte</b> en el Restaurante (no por bebidas, postres ni antojos). El cliente presenta su factura, buscas su cédula, escribes el número de la factura y marcas el sello. Máximo 1 sello por día.</p>${s.html}<div id="sel"></div>`;
  s.bind();
  function draw() {
    const box2 = $('#sel');
    if (!ficha) { box2.innerHTML = ''; return; }
    $('#sres').innerHTML = clientBar(ficha);
    const meta = ficha.sellos_meta || 8;
    const llena = ficha.sellos >= meta;
    box2.innerHTML = `<div class="cols">
      <div>${stampCard(ficha, 'personal')}</div>
      ${llena ? `<form class="navy-card" id="gf" novalidate>
          <h2 style="font-size:20px;font-weight:800">Entregar regalo y reiniciar tarjeta</h2>
          <p style="margin:0;color:#CFE9F0;font-size:14px">Regalo: <b style="color:#fff">${esc(ficha.regalo_sellos)}</b>. Pide al cliente su PIN para confirmar.</p>
          <div class="field"><label for="g-pin">PIN del cliente</label><input class="input pin" id="g-pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></div>
          <button class="btn coral block" style="height:56px">Entregar regalo y reiniciar tarjeta</button>
          <span class="small" style="color:#CFE9F0">Antes de entregar, revisa abajo las 8 facturas y fechas. Al confirmar, la tarjeta se reinicia desde cero.</span>
        </form>`
      : `<form class="navy-card" id="sf2" novalidate>
          <h2 style="font-size:20px;font-weight:800">Nuevo sello</h2>
          ${ficha.sello_hoy ? '<div style="background:var(--sun);color:var(--navy);border-radius:14px;padding:12px 14px;font-size:14px;font-weight:700">Hoy ya recibió su sello. Puede volver mañana.</div>' : `
          <div class="field"><label for="fac">Número de la factura</label><input class="input" id="fac" autocomplete="off" style="text-transform:uppercase" placeholder="Ej.: FE-10234"></div>
          <label class="check" style="color:#fff"><input type="checkbox" id="fuerte"><span>Confirmo que la factura incluye una <b>comida fuerte</b></span></label>
          <button class="btn coral block" style="height:60px;font-size:17px">Marcar sello</button>`}
        </form>`}
    </div>
    <div style="margin-top:20px">${historialSellos(ficha)}</div>`;
    const sf2 = $('#sf2');
    if (sf2 && $('#fac')) {
      $('#fac').focus();
      sf2.onsubmit = async (e) => {
        e.preventDefault();
        const f = $('#fac').value.trim(); if (!f) return toast(ERR.FACTURA_REQUERIDA, true);
        if (!$('#fuerte').checked) return toast('El sello es solo por comida fuerte: confirma que la factura la incluye.', true);
        const b = $('button', sf2); b.disabled = true;
        try { ficha = await rpc('marcar_sello', { p_cedula: ficha.cedula, p_factura: f }); toast(`Sello marcado: ${ficha.sellos} de ${ficha.sellos_meta || 8}`); draw(); }
        catch (er) { toast(errText(er), true); b.disabled = false; }
      };
    }
    const gf = $('#gf');
    if (gf) gf.onsubmit = async (e) => {
      e.preventDefault();
      const b = $('button', gf); b.disabled = true;
      try { const r = await rpc('entregar_regalo_sellos', { p_cedula: ficha.cedula, p_pin: $('#g-pin').value }); ficha = r.cliente; toast('¡Regalo entregado! La tarjeta empieza de nuevo.'); draw(); }
      catch (er) { toast(errText(er), true); b.disabled = false; $('#g-pin').value = ''; }
    };
  }
  if (ficha) draw();
}

function vRedimir(box) {
  const miTienda = tiendaNombre(perfil.tienda_id);
  box.innerHTML = `<div class="row between wrap" style="gap:10px"><h1 style="font-size:28px;font-weight:800">Entregar premio</h1><button class="btn ghost sm" id="rd-act">Actualizar</button></div>
  <p class="muted" style="margin:0">Aquí aparecen los premios que los clientes redimieron desde su celular${perfil.rol === 'admin' ? '' : miTienda === 'RESTAURANTE' ? ' (comida del Restaurante y Punto Dulce)' : ' (prendas y premios de las tiendas)'}. Tienen 24 horas para reclamarlos. Cuando llegue el cliente, verifica su cédula física, pídele la <b>clave única</b> que genera en su celular y escríbela para entregar el premio.</p>
  <div id="rd-list" class="stack" style="margin-top:14px"><div class="empty">Cargando…</div></div>
  <section class="card" style="margin-top:18px"><h2 style="font-size:18px;font-weight:800;margin-bottom:8px">Entregados en los últimos 7 días</h2><div id="rd-hist"><div class="empty">Cargando…</div></div></section>`;
  const tints = ['#FFE7A8', '#FCD9D2', '#D3EEF4', '#E8E2F5'];
  async function cargar() {
    let list; try { list = await rpc('recaudador_solicitudes'); } catch (e) { $('#rd-list').innerHTML = `<div class="empty">${errText(e)}</div>`; return; }
    if (!$('#rd-list')) return;
    $('#rd-list').innerHTML = list.length ? `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px">${list.map((x, i) => `
      <div class="card stack" style="gap:8px;padding:14px">
        <div style="height:130px;border-radius:12px;overflow:hidden;background:${tints[i % 4]};display:flex;align-items:center;justify-content:center">${x.imagen_url ? `<img src="${esc(x.imagen_url)}" alt="" style="width:100%;height:100%;object-fit:cover">` : ic('gift', 30, 1.8)}</div>
        <b style="font-size:17px">${esc(x.premio)}</b>
        <span class="small muted">${esc(x.tienda || '')} · ${num(x.puntos)} pts</span>
        <div class="stack" style="gap:0"><b>${esc(x.cliente)}</b><span class="small">C.C. ${esc(num(x.cedula))}</span></div>
        <span class="pill sun" style="align-self:flex-start">Vence en <b data-hasta="${esc(x.expira_en)}" style="margin-left:4px">${restante(x.expira_en)}</b></span>
        <span class="small" style="font-weight:700;color:${x.con_clave ? '#1B6B3A' : 'var(--muted)'}">${x.con_clave ? '✓ El cliente ya generó su clave única' : 'El cliente aún no genera su clave única'}</span>
        ${x.saldo < x.puntos ? `<span class="small" style="color:var(--coral-t)">El cliente ya no tiene puntos suficientes (${num(x.saldo)}).</span>` : ''}
        <button class="btn coral" data-ent="${x.id}" ${x.saldo < x.puntos ? 'disabled' : ''}>Entregar</button>
      </div>`).join('')}</div>` : '<div class="card empty">No hay premios por entregar en este momento.</div>';
    arrancarRelojes();
    $$('[data-ent]').forEach((b) => b.onclick = () => entregar(list.find((x) => x.id === b.dataset.ent)));
    let h = []; try { h = await rpc('recaudador_entregados'); } catch {}
    if (!$('#rd-hist')) return;
    $('#rd-hist').innerHTML = h.length ? `<div class="tbl-wrap"><table><thead><tr><th>Fecha</th><th>Cliente</th><th>Premio</th><th>Puntos</th><th></th></tr></thead><tbody>${h.map((x, i) => `<tr><td>${fdate(x.fecha)} · ${new Date(x.fecha).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}</td><td>${esc(x.cliente)}<div class="small muted">C.C. ${esc(num(x.cedula))}</div></td><td>${esc(x.premio)}</td><td>${num(x.puntos)}</td><td><button class="btn ghost sm" data-rep="${i}">Imprimir comprobante</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Aún no hay premios entregados en este punto.</div>';
    $$('[data-rep]').forEach((b) => b.onclick = () => mostrarComprobante({ ...h[+b.dataset.rep], reimpresion: true }));
  }
  const entregar = (x) => dialog(`<h2 style="font-size:20px;font-weight:800">Entregar premio</h2>
    <div class="card stack" style="gap:4px;background:var(--cream)"><b>${esc(x.premio)}</b><span class="small">${esc(x.cliente)} · C.C. ${esc(num(x.cedula))} · ${num(x.puntos)} pts</span></div>
    <label class="check"><input type="checkbox" id="ent-ced"><span>Verifiqué la <b>cédula física</b> del cliente</span></label>
    <div class="field"><label for="ent-clave">Clave única del cliente (6 números)</label><input class="input" id="ent-clave" inputmode="numeric" maxlength="7" autocomplete="off" style="font-size:24px;letter-spacing:4px;font-weight:800"></div>
    <p class="small muted" style="margin:0">El cliente la genera en su celular con el botón "Generar clave única para el cajero".</p>`, async (dl) => {
    if (!$('#ent-ced', dl).checked) { toast('Primero verifica la cédula física del cliente.', true); return false; }
    if (digits($('#ent-clave', dl).value).length !== 6) { toast('La clave única tiene 6 números.', true); return false; }
    const r = await rpc('recaudador_entregar', { p_solicitud: x.id, p_clave: digits($('#ent-clave', dl).value) });
    toast(`Premio entregado: ${r.premio} a ${r.cliente}. Se descontaron ${num(r.puntos)} pts.`);
    cargar();
    setTimeout(() => mostrarComprobante(r), 50);
  }, 'Entregar');
  $('#rd-act').onclick = cargar;
  cargar();
  const auto = setInterval(() => { if (!location.hash.includes('redimir')) return clearInterval(auto); cargar(); }, 30000);
}

/* ---------------- ADMIN ---------------- */
function periodo(key) {
  const h = new Date(); let d = new Date(h);
  if (key === 'hoy') {} else if (key === '7d') d.setDate(h.getDate() - 6);
  else if (key === 'mes') d = new Date(h.getFullYear(), h.getMonth(), 1);
  else if (key === 'mes_ant') { d = new Date(h.getFullYear(), h.getMonth() - 1, 1); return [iso(d), iso(new Date(h.getFullYear(), h.getMonth(), 0))]; }
  else if (key === 'anio') d = new Date(h.getFullYear(), 0, 1);
  return [iso(d), iso(h)];
}
let dashState = { per: 'mes', tienda: null };
async function vDashboard(box) {
  const P = [['hoy', 'Hoy'], ['7d', 'Últimos 7 días'], ['mes', 'Este mes'], ['mes_ant', 'Mes pasado'], ['anio', 'Este año']];
  box.innerHTML = `
  <div class="row between wrap"><h1 style="font-size:30px;font-weight:800">Dashboard</h1>
  <div class="row wrap">${P.map(([k, l]) => `<button class="chip" data-per="${k}" aria-pressed="${dashState.per === k}">${l}</button>`).join('')}</div></div>
  <div class="row wrap" style="gap:8px"><button class="chip" data-ti="" aria-pressed="${!dashState.tienda}">TODAS</button>${tiendas.map((t) => `<button class="chip" data-ti="${t.id}" aria-pressed="${dashState.tienda === t.id}">${esc(t.nombre)}</button>`).join('')}</div>
  <div id="dash"><div class="empty">Cargando…</div></div>
  <div id="cerca" style="margin-top:18px"></div>`;
  cercaPremio($('#cerca'));
  $$('[data-per]').forEach((b) => b.onclick = () => { dashState.per = b.dataset.per; vDashboard(box); });
  $$('[data-ti]').forEach((b) => b.onclick = () => { dashState.tienda = b.dataset.ti ? Number(b.dataset.ti) : null; vDashboard(box); });
  const [d1, d2] = periodo(dashState.per);
  let r; try { r = await rpc('admin_resumen', { p_desde: d1, p_hasta: d2, p_tienda_id: dashState.tienda }); } catch (e) { $('#dash').innerHTML = `<div class="empty">${errText(e)}</div>`; return; }
  const max = Math.max(1, ...r.por_tienda.map((x) => Number(x.ventas)));
  const K = (label, v, c) => `<div class="kpi"><div class="dot" style="background:${c}"></div><span>${label}</span><b>${v}</b></div>`;
  $('#dash').innerHTML = `
  <div class="stack" style="gap:20px">
  <div class="kpis">${K('Clientes inscritos', num(r.clientes), 'var(--navy)')}${K('Clientes nuevos', num(r.clientes_nuevos), 'var(--teal)')}${K('Ventas registradas', money(r.ventas), 'var(--coral)')}${K('Puntos emitidos', num(r.puntos_emitidos), 'var(--teal)')}${K('Puntos redimidos', num(r.puntos_redimidos), 'var(--sun)')}${K('Sellos entregados', num(r.sellos), 'var(--yellow)')}</div>
  <div class="cols">
    <section class="card stack"><h2 style="font-size:18px;font-weight:800">Ventas registradas por tienda</h2>
      ${r.por_tienda.map((x, i) => `<div class="hbar"><b>${esc(x.tienda)}</b><div class="t"><div style="width:${Math.round(x.ventas / max * 100)}%;background:${dashState.tienda && tiendaNombre(dashState.tienda) !== x.tienda ? '#D9D3C4' : (i % 2 ? 'var(--teal)' : 'var(--coral)')}"></div></div><b style="text-align:right">${money(x.ventas)}</b></div>`).join('')}
    </section>
    <section class="card stack"><h2 style="font-size:18px;font-weight:800">Puntos por vencer (próximos 30 días)</h2>
      ${r.por_vencer.length ? `<div class="tbl-wrap"><table><thead><tr><th>Cliente</th><th>Cédula</th><th>Vence</th><th style="text-align:right">Puntos</th></tr></thead><tbody>
      ${r.por_vencer.map((x) => `<tr><td><b>${esc(x.nombre)}</b></td><td>${esc(num(x.cedula))}</td><td>${fdate(x.vence_en)}</td><td style="text-align:right;font-weight:800;color:var(--coral-t)">${num(x.puntos)}</td></tr>`).join('')}</tbody></table></div>
      <button class="btn teal sm" id="avisar" style="align-self:flex-start">Enviar mensaje de recordatorio</button>` : '<div class="empty">Nadie tiene puntos por vencer en los próximos 30 días.</div>'}
    </section>
  </div></div>`;
  const av = $('#avisar'); if (av) av.onclick = () => { sessionStorage.setItem('ps_msg_pre', JSON.stringify({ titulo: 'Tus puntos están por vencer', cuerpo: 'Tienes puntos que vencen pronto. ¡Redímelos en Puntos Santana!', seg: 'por_vencer' })); location.hash = '#/personal/mensajes'; };
}

function csv(rows, name) {
  const out = rows.map((r) => r.map((v) => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(';')).join('\r\n');
  const blob = new Blob(['﻿' + out], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

let selCliente = null;
// Qué hizo el cliente en cada movimiento
function accion(t) {
  if (t.anulada) return { txt: 'Anulada', bg: '#E5E7EB', fg: '#4B5563' };
  if (t.tipo === 'redencion') return { txt: 'Redimió', bg: '#FCD9D2', fg: '#B8382A' };
  if (t.tipo === 'ajuste') return t.factura_numero === 'SALDO-INICIAL' ? { txt: 'Saldo inicial', bg: '#FFE7A8', fg: '#7A5A00' } : { txt: 'Ajuste de puntos', bg: '#E0E7FF', fg: '#13235B' };
  return { txt: 'Acumuló', bg: '#D5F0EA', fg: '#0F7A63' };
}
const pillAccion = (t) => { const a = accion(t); return `<span class="pill" style="background:${a.bg};color:${a.fg};padding:3px 10px;font-size:11px;font-weight:800">${a.txt}</span>`; };
function queMovio(t) {
  if (t.tipo === 'redencion') return (t.detalle || 'Premio').replace(/^Premio:\s*/i, '');
  if (t.tipo === 'ajuste') return t.factura_numero === 'SALDO-INICIAL' ? 'Puntos traídos de la base del mall' : (t.detalle || 'Ajuste manual');
  return 'Compra en ' + (t.tienda || '—');
}

async function vClientes(box) {
  box.innerHTML = `
  <div class="row between wrap"><h1 style="font-size:30px;font-weight:800">Clientes y transacciones</h1>
  <div class="row wrap"><button class="btn coral sm" id="imp">Importar clientes (Excel)</button><button class="btn ghost sm" id="x-cli">Exportar clientes</button><button class="btn ghost sm" id="x-tx">Exportar transacciones</button></div></div>
  <form class="row wrap" id="qf" novalidate><label for="q" class="hidden">Buscar</label><input class="input" id="q" placeholder="Buscar por cédula, nombre o celular" style="flex:1;min-width:240px"><button class="btn">Buscar</button></form>
  <div class="cols"><section class="card stack" id="lista"><div class="empty">Cargando…</div></section><section id="det"></section></div>
  <section class="card stack" id="movs" style="margin-top:20px"><div class="empty">Cargando movimientos…</div></section>`;
  movimientos();
  const load = async (q) => {
    let rows; try { rows = await rpc('admin_clientes', { p_busqueda: q || '', p_limite: 200 }); } catch (e) { $('#lista').innerHTML = `<div class="empty">${errText(e)}</div>`; return; }
    $('#lista').innerHTML = `<h2 style="font-size:17px;font-weight:800">Clientes (${rows.length}${rows.length === 200 ? '+' : ''})</h2>` + (rows.length ? `<div class="tbl-wrap"><table><thead><tr><th>Nombre</th><th>Cédula</th><th>Nacimiento</th><th>Favorita · promociones</th><th style="text-align:right">Puntos</th><th style="text-align:right">Sellos</th></tr></thead><tbody>
      ${rows.map((c) => `<tr class="clic ${selCliente === c.id ? 'sel' : ''}" data-c="${c.id}" tabindex="0"><td><b>${esc(c.nombre)}</b>${c.activo ? '' : ' <span class="pill" style="background:#FFE7A8;padding:2px 8px;font-size:10px">Sin activar</span>'}</td><td>${esc(num(c.cedula))}</td><td>${c.fecha_nacimiento ? fdate(c.fecha_nacimiento) : '—'}</td><td class="small"><b>${esc(c.tienda_favorita || '—')}</b>${c.promo_tiendas ? `<div class="muted">${esc(c.promo_tiendas)}</div>` : ''}</td><td style="text-align:right;font-weight:700">${num(c.puntos)}</td><td style="text-align:right">${c.sellos}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Sin resultados.</div>');
    $$('[data-c]').forEach((tr) => { const go = () => { selCliente = tr.dataset.c; $$('[data-c]').forEach((x) => x.classList.toggle('sel', x === tr)); detalle(rows.find((x) => x.id === selCliente)); }; tr.onclick = go; tr.onkeydown = (e) => { if (e.key === 'Enter') go(); }; });
    if (selCliente) { const c = rows.find((x) => x.id === selCliente); if (c) detalle(c); }
  };
  $('#qf').onsubmit = (e) => { e.preventDefault(); load($('#q').value.trim()); };
  $('#imp').onclick = () => importarClientes(() => load(''));
  $('#x-cli').onclick = async () => {
    try { const rows = await rpc('admin_clientes', { p_busqueda: '', p_limite: 100000 });
      csv([['Cédula', 'Nombre', 'Fecha nacimiento', 'Celular', 'Correo', 'Activo', 'Tienda favorita', 'Recibe promociones de', 'Puntos', 'Sellos', 'Inscrito en', 'Fecha inscripción'], ...rows.map((c) => [c.cedula, c.nombre, c.fecha_nacimiento, c.celular, c.correo, c.activo ? 'Sí' : 'No', c.tienda_favorita, c.promo_tiendas, c.puntos, c.sellos, c.tienda_registro, (c.creado_en || '').slice(0, 10)])], 'clientes-puntos-santana.csv');
    } catch (e) { toast(errText(e), true); }
  };
  $('#x-tx').onclick = async () => {
    const { data, error } = await sb.from('transacciones').select('fecha,tipo,factura_numero,factura_fecha,factura_nombre,valor_compra,puntos,puntos_restantes,vence_en,anulada,detalle,clientes(cedula,nombre),tienda:tiendas!transacciones_tienda_id_fkey(nombre),recaudador:tiendas!transacciones_recaudador_tienda_id_fkey(nombre)').order('fecha', { ascending: false }).limit(100000);
    if (error) return toast(errText(error), true);
    csv([['Fecha registro', 'Tipo', 'Cédula', 'Cliente', 'Tienda compra', 'Registrado en', 'N° factura', 'Fecha factura', 'Nombre en factura', 'Valor', 'Puntos', 'Puntos vigentes', 'Vence', 'Anulada', 'Detalle'], ...data.map((t) => [(t.fecha || '').slice(0, 16).replace('T', ' '), t.tipo, t.clientes?.cedula, t.clientes?.nombre, t.tienda?.nombre, t.recaudador?.nombre, t.factura_numero, t.factura_fecha, t.factura_nombre, t.valor_compra, t.puntos, t.puntos_restantes, t.vence_en, t.anulada ? 'Sí' : 'No', t.detalle])], 'transacciones-puntos-santana.csv');
  };
  async function movimientos() {
    const el = $('#movs'); if (!el) return;
    let m; try { m = await rpc('admin_movimientos', { p_limite: 100 }); } catch (e) { el.innerHTML = `<div class="empty">${errText(e)}</div>`; return; }
    el.innerHTML = `<h2 style="font-size:17px;font-weight:800">Movimientos de todos los clientes <span class="small muted" style="font-weight:600">(últimos ${m.length})</span></h2>
      <div class="tbl-wrap"><table><thead><tr><th>Fecha</th><th>Cliente</th><th>Acción</th><th>Detalle</th><th>Registrado en</th><th style="text-align:right">Puntos</th></tr></thead><tbody>
      ${m.map((t) => `<tr class="clic ${t.anulada ? 'tag-anulada' : ''}" data-mc="${t.cliente_id}" tabindex="0"><td style="white-space:nowrap">${fdate(t.fecha)}<div class="small muted">${new Date(t.fecha).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}</div></td>
        <td><b>${esc(t.nombre)}</b><div class="small muted">C.C. ${esc(num(t.cedula))}</div></td><td>${pillAccion(t)}</td>
        <td>${esc(queMovio(t))}${t.valor_compra ? `<div class="small muted">${money(t.valor_compra)}${t.factura_numero ? ' · Factura ' + esc(t.factura_numero) : ''}</div>` : ''}</td>
        <td>${esc(t.registrada_en || (t.tipo === 'ajuste' ? 'Administrador' : '—'))}</td>
        <td style="text-align:right;font-weight:800;color:${t.puntos < 0 ? 'var(--coral-t)' : 'var(--teal-d)'}">${t.puntos > 0 ? '+' : ''}${num(t.puntos)}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">Aún no hay movimientos.</td></tr>'}
      </tbody></table></div><p class="small muted" style="margin:0">Toca una fila para ver la ficha de ese cliente.</p>`;
    $$('[data-mc]').forEach((tr) => tr.onclick = () => { const r = $(`[data-c="${tr.dataset.mc}"]`); if (r) { r.click(); r.scrollIntoView({ behavior: 'smooth', block: 'center' }); } });
  }
  async function detalle(c) {
    const det = $('#det');
    det.innerHTML = '<div class="card empty">Cargando…</div>';
    let tx; try { tx = await rpc('admin_transacciones', { p_cliente: c.id }); } catch (e) { det.innerHTML = `<div class="card empty">${errText(e)}</div>`; return; }
    det.innerHTML = `<div class="card stack">
      <div class="row between wrap"><div><b style="font-size:18px">${esc(c.nombre)}</b><div class="small muted">C.C. ${esc(num(c.cedula))} · ${esc(c.celular)}${c.correo ? ' · ' + esc(c.correo) : ''}${c.tienda_registro ? ' · inscrito en ' + esc(c.tienda_registro) : ''}</div></div>
      <span class="pill navy" style="padding:6px 14px">${num(c.puntos)} pts · ${c.sellos}/${config.sellos_meta || 8} sellos</span></div>
      <div class="row wrap"><button class="btn ghost sm" id="ed-cli">Editar datos</button><button class="btn ghost sm" id="rs-pin">Restablecer PIN</button></div>
      <div class="tbl-wrap"><table><thead><tr><th>Fecha</th><th>Acción</th><th>Valor</th><th>Puntos</th><th>Vence</th><th></th></tr></thead><tbody>
      ${tx.map((t) => `<tr class="${t.anulada ? 'tag-anulada' : ''}"><td>${fdate(t.factura_fecha || t.fecha)}</td><td>${pillAccion(t)}<div style="margin-top:4px"><b>${esc(queMovio(t))}</b></div>${t.factura_numero && t.tipo === 'acumulacion' ? `<div class="small muted">Factura ${esc(t.factura_numero)} · ${esc(t.factura_nombre || '')}${t.factura_cedula ? ' · C.C. ' + esc(num(t.factura_cedula)) : ''}</div>` : ''}${t.cliente_recurrente === true ? '<div class="small" style="font-weight:600">Cliente recurrente</div>' : t.cliente_recurrente === false ? '<div class="small" style="font-weight:600;color:var(--coral-t)">Cliente nuevo en la tienda</div>' : ''}${t.con_sello ? ' · sello' : ''}${t.registrada_en ? `<div class="small muted">en ${esc(t.registrada_en)}</div>` : ''}${t.ediciones ? `<div class="small muted">editada ${t.ediciones}×</div>` : ''}</td>
        <td>${t.valor_compra ? money(t.valor_compra) : '—'}</td><td style="font-weight:800;color:${t.puntos < 0 ? 'var(--coral-t)' : 'var(--teal-d)'}">${t.puntos > 0 ? '+' : ''}${num(t.puntos)}</td><td>${t.vence_en ? fdate(t.vence_en) : '—'}</td>
        <td style="white-space:nowrap;text-align:right">${t.tipo === 'acumulacion' && !t.anulada ? `<button class="btn ghost sm" data-ed="${t.id}">Editar</button> <button class="btn ghost sm" data-an="${t.id}">Anular</button>` : (t.anulada ? '<span class="small">Anulada</span>' : '')}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">Sin movimientos.</td></tr>'}
      </tbody></table></div>
      <p class="small muted" style="margin:0">Cada edición o anulación queda en el historial con fecha, usuario y motivo. Los puntos se recalculan solos.</p></div>
      <div id="det-sellos" style="margin-top:20px"></div>`;
    rpc('buscar_cliente', { p_cedula: c.cedula }).then((f) => {
      if (!f) return;
      const box = $('#det-sellos'); if (!box) return;
      box.innerHTML = historialSellos(f) + (f.sellos > 0 ? `<div class="row wrap" style="margin-top:12px"><button class="btn ghost sm" id="reini">Reiniciar tarjeta de sellos</button>${f.sellos >= (f.sellos_meta || 8) ? '<a class="btn coral sm" href="#/personal/sellos" id="ir-regalo">Entregar regalo</a>' : ''}</div>` : '');
      const ir = $('#ir-regalo'); if (ir) ir.onclick = () => { ficha = f; };
      const rb = $('#reini'); if (rb) rb.onclick = () => dialog(`<h2 style="font-size:20px;font-weight:800">Reiniciar tarjeta de sellos</h2>
        <p class="muted" style="margin:0">Se borran los ${f.sellos} sellos actuales de ${esc(f.nombre)} <b>sin entregar regalo</b> (por ejemplo, por un error o un sello mal marcado). Queda registrado con tu motivo.</p>
        <div class="field"><label for="d-rm">Motivo *</label><input class="input" id="d-rm"></div>`, async (dl) => {
        const m = $('#d-rm', dl).value.trim(); if (!m) { toast('Escribe el motivo.', true); return false; }
        await rpc('admin_reiniciar_tarjeta', { p_cliente: c.id, p_motivo: m }); toast('Tarjeta reiniciada.'); load($('#q').value.trim());
      }, 'Reiniciar');
    }).catch(() => {});
    $$('[data-ed]').forEach((b) => b.onclick = () => {
      const t = tx.find((x) => x.id === b.dataset.ed);
      dialog(`<h2 style="font-size:20px;font-weight:800">Editar compra</h2>
        <div class="field"><label for="d-v">Valor de la compra</label><input class="input" id="d-v" inputmode="numeric" value="${num(t.valor_compra)}"></div>
        <div class="field"><label for="d-t">Tienda</label><select class="input" id="d-t">${tiendas.map((x) => `<option value="${x.id}" ${x.id === t.tienda_id ? 'selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select></div>
        <div class="grid" style="grid-template-columns:1fr 1fr"><div class="field"><label for="d-fn">N° factura</label><input class="input" id="d-fn" value="${esc(t.factura_numero || '')}"></div>
        <div class="field"><label for="d-ff">Fecha factura</label><input class="input" id="d-ff" type="date" value="${esc(t.factura_fecha || '')}"></div></div>
        <div class="field"><label for="d-m">Motivo del cambio *</label><input class="input" id="d-m" required></div>`, async (dl) => {
        const v = Number(digits($('#d-v', dl).value)), m = $('#d-m', dl).value.trim();
        if (!v || !m) { toast('Escribe el valor y el motivo.', true); return false; }
        await rpc('admin_editar_transaccion', { p_id: t.id, p_valor: v, p_tienda_id: Number($('#d-t', dl).value), p_motivo: m, p_factura_numero: $('#d-fn', dl).value.trim() || null, p_factura_fecha: $('#d-ff', dl).value || null });
        toast('Compra actualizada.'); load($('#q').value.trim());
      });
    });
    $$('[data-an]').forEach((b) => b.onclick = () => {
      dialog(`<h2 style="font-size:20px;font-weight:800">Anular compra</h2><p class="muted" style="margin:0">Se quitan los puntos de esta compra y su sello si lo tuvo.</p>
        <div class="field"><label for="d-m">Motivo *</label><input class="input" id="d-m" required></div>`, async (dl) => {
        const m = $('#d-m', dl).value.trim(); if (!m) { toast('Escribe el motivo.', true); return false; }
        await rpc('admin_anular_transaccion', { p_id: b.dataset.an, p_motivo: m });
        toast('Compra anulada.'); load($('#q').value.trim());
      }, 'Anular');
    });
    $('#rs-pin').onclick = () => dialog(`<h2 style="font-size:20px;font-weight:800">Restablecer PIN</h2><p class="muted" style="margin:0">Escribe el nuevo PIN que eligió ${esc(c.nombre)}.</p>
      <div class="field"><label for="d-p">Nuevo PIN</label><input class="input pin" id="d-p" type="password" inputmode="numeric" maxlength="4"></div>`, async (dl) => {
      await rpc('admin_restablecer_pin', { p_cliente: c.id, p_pin: $('#d-p', dl).value }); toast('PIN restablecido.');
    });
    $('#ed-cli').onclick = () => dialog(`<h2 style="font-size:20px;font-weight:800">Editar datos del cliente</h2>
      <div class="field"><label for="d-n">Nombre</label><input class="input" id="d-n" value="${esc(c.nombre)}"></div>
      <div class="field"><label for="d-c">Celular</label><input class="input" id="d-c" value="${esc(c.celular)}"></div>
      <div class="field"><label for="d-e">Correo</label><input class="input" id="d-e" type="email" value="${esc(c.correo || '')}"></div>`, async (dl) => {
      const { error } = await sb.from('clientes').update({ nombre: $('#d-n', dl).value.trim(), celular: digits($('#d-c', dl).value), correo: $('#d-e', dl).value.trim() || null }).eq('id', c.id);
      if (error) throw error; toast('Datos actualizados.'); load($('#q').value.trim());
    });
  }
  load('');
}

function dialog(inner, onOk, okLabel = 'Guardar') {
  const dl = document.createElement('dialog');
  dl.innerHTML = `<form method="dialog" novalidate>${inner}<div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn coral" data-ok>${okLabel}</button></div></form>`;
  document.body.appendChild(dl); dl.showModal();
  const close = () => { dl.close(); dl.remove(); };
  dl.querySelector('[data-x]').onclick = close;
  dl.addEventListener('cancel', () => dl.remove());
  dl.querySelector('form').onsubmit = async (e) => {
    e.preventDefault(); const b = dl.querySelector('[data-ok]'); b.disabled = true;
    try { const r = await onOk(dl); if (r === false) { b.disabled = false; return; } close(); }
    catch (er) { toast(errText(er), true); b.disabled = false; }
  };
  const f = dl.querySelector('input,select,textarea'); if (f) f.focus();
}

/* ---- Informe diario de puntos ---- */
let diarioFecha = null;
const hoyCO = () => new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);
async function vDiario(box) {
  diarioFecha = diarioFecha || hoyCO();
  const f = diarioFecha, esHoy = f === hoyCO();
  const mover = (k) => { const d = new Date(f + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + k); const n = d.toISOString().slice(0, 10); if (n > hoyCO()) return; diarioFecha = n; vDiario(box); };
  box.innerHTML = `<div class="row between wrap" style="gap:10px"><h1 style="font-size:30px;font-weight:800">Informe diario</h1>
    <div class="row" style="gap:8px;align-items:center"><button class="btn ghost sm" id="di-a" aria-label="Día anterior">‹</button>
      <input class="input" type="date" id="di-f" value="${f}" max="${hoyCO()}" style="width:auto;height:44px">
      <button class="btn ghost sm" id="di-s" aria-label="Día siguiente" ${esHoy ? 'disabled' : ''}>›</button>${esHoy ? '' : '<button class="btn ghost sm" id="di-h">Hoy</button>'}</div></div>
    <div id="di" class="stack" style="margin-top:12px"><div class="empty">Cargando…</div></div>`;
  $('#di-a').onclick = () => mover(-1); $('#di-s').onclick = () => mover(1);
  $('#di-f').onchange = (e) => { if (e.target.value) { diarioFecha = e.target.value; vDiario(box); } };
  if ($('#di-h')) $('#di-h').onclick = () => { diarioFecha = hoyCO(); vDiario(box); };
  let d; try { d = await rpc('admin_informe_diario', { p_fecha: f }); } catch (e) { $('#di').innerHTML = `<div class="empty">${errText(e)}</div>`; return; }
  const dif = d.puntos - d.ayer_puntos;
  const kpi = (t, v, sub = '', big = false) => `<div class="card stack" style="gap:4px;${big ? 'background:#13235B;color:#fff;border-color:#13235B' : ''}"><span class="small" style="${big ? 'color:#CFE9F0' : 'color:var(--muted)'}">${t}</span><b style="font-size:${big ? 38 : 28}px">${v}</b>${sub ? `<span class="small" style="${big ? 'color:#FFD23F' : ''}">${sub}</span>` : ''}</div>`;
  const max = Math.max(1, ...d.serie.map((x) => x.puntos));
  const dLabel = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
  $('#di').innerHTML = `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
      ${kpi('Puntos acumulados', num(d.puntos), `${dif === 0 ? 'Igual que' : (dif > 0 ? '+' : '') + num(dif) + ' vs'} el día anterior`, true)}
      ${kpi('Compras registradas', num(d.compras), d.compras ? `${num(d.clientes)} cliente${d.clientes === 1 ? '' : 's'}` : '')}
      ${kpi('Ventas registradas', money(d.ventas), d.compras ? `Promedio ${money(Math.round(d.ventas / d.compras))}` : '')}
      ${kpi('Clientes nuevos', num(d.nuevos))}
      ${kpi('Puntos redimidos', num(d.redimidos), `${num(d.premios)} premio${d.premios === 1 ? '' : 's'} entregado${d.premios === 1 ? '' : 's'}`)}
      ${kpi('Sellos marcados', num(d.sellos))}</div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px">
      <section class="card"><h2 style="font-size:18px;font-weight:800;margin-bottom:8px">Por tienda donde compraron</h2>
        ${d.por_tienda.length ? `<div class="tbl-wrap"><table><thead><tr><th>Tienda</th><th>Compras</th><th>Ventas</th><th>Puntos</th></tr></thead><tbody>${d.por_tienda.map((x) => `<tr><td>${esc(x.tienda)}</td><td>${num(x.compras)}</td><td>${money(x.ventas)}</td><td><b>${num(x.puntos)}</b></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Sin compras registradas este día.</div>'}</section>
      <section class="card"><h2 style="font-size:18px;font-weight:800;margin-bottom:8px">Por punto que registró</h2>
        ${d.por_recaudador.length ? `<div class="tbl-wrap"><table><thead><tr><th>Punto</th><th>Compras</th><th>Puntos</th></tr></thead><tbody>${d.por_recaudador.map((x) => `<tr><td>${esc(x.punto)}</td><td>${num(x.compras)}</td><td><b>${num(x.puntos)}</b></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Sin registros este día.</div>'}</section></div>
    <section class="card"><h2 style="font-size:18px;font-weight:800;margin-bottom:12px">Puntos acumulados · últimos 14 días</h2>
      <div class="stack" style="gap:6px">${d.serie.map((x) => `<div class="row" style="gap:10px;align-items:center"><span class="small" style="width:70px;flex:0 0 auto;${x.dia === f ? 'font-weight:800' : ''}">${dLabel(x.dia)}</span>
        <div style="flex:1;height:14px;background:#F1ECE0;border-radius:7px;overflow:hidden"><div style="height:100%;width:${Math.round(x.puntos / max * 100)}%;background:${x.dia === f ? 'var(--coral)' : '#1BA6C2'};border-radius:7px"></div></div>
        <b class="small" style="width:80px;text-align:right;flex:0 0 auto">${num(x.puntos)}</b></div>`).join('')}</div></section>`;
}

/* ---- Clientes cerca de su próximo premio (solo admin) ---- */
let cercaMax = 200000;
async function cercaPremio(el) {
  if (!el) return;
  const OP = [100000, 200000, 300000, 500000];
  el.innerHTML = `<section class="card stack" style="gap:12px">
    <div class="row between wrap" style="gap:10px"><div><h2 style="font-size:20px;font-weight:800">Cerca de su próximo premio</h2>
      <div class="small muted">Clientes a los que una compra pequeña les alcanza para su próximo premio.</div></div>
      <div class="row wrap" style="gap:6px"><span class="small" style="font-weight:700">Les falta una compra de hasta</span>${OP.map((v) => `<button class="chip" data-cm="${v}" aria-pressed="${cercaMax === v}">${money(v)}</button>`).join('')}</div></div>
    <div id="cp-body"><div class="empty">Cargando…</div></div></section>`;
  $$('[data-cm]', el).forEach((b) => b.onclick = () => { cercaMax = +b.dataset.cm; cercaPremio(el); });
  let list; try { list = await rpc('admin_cerca_premio', { p_max_compra: cercaMax }); } catch (e) { $('#cp-body').innerHTML = `<div class="empty">${errText(e)}</div>`; return; }
  const conPush = list.filter((x) => x.push).length;
  const nombreP = (t) => t.charAt(0) + t.slice(1).toLowerCase();
  $('#cp-body').innerHTML = list.length ? `
    <div class="row between wrap" style="gap:10px;margin-bottom:10px"><b>${num(list.length)} cliente${list.length === 1 ? '' : 's'} · ${num(conPush)} con notificaciones activas</b>
      <div class="row" style="gap:8px"><button class="btn ghost sm" id="cp-x">Descargar Excel</button><button class="btn coral sm" id="cp-env">Enviar mensaje a todos</button></div></div>
    <div class="tbl-wrap"><table><thead><tr><th>Cliente</th><th>Puntos</th><th>Próximo premio</th><th>Le faltan</th><th>Compra que lo logra</th><th>Tienda favorita</th><th>Push</th></tr></thead><tbody>
    ${list.map((x) => `<tr><td><b>${esc(x.nombre)}</b><div class="small muted">C.C. ${esc(num(x.cedula))}</div></td><td>${num(x.puntos)}</td><td>${esc(nombreP(x.premio))}<div class="small muted">${num(x.premio_puntos)} pts</div></td><td><b style="color:var(--coral-t)">${num(x.faltan)} pts</b></td><td><b>${money(x.compra)}</b></td><td>${esc(x.favorita || '—')}</td><td>${x.push ? '✓' : '—'}</td></tr>`).join('')}
    </tbody></table></div>` : `<div class="empty">Nadie está a una compra de hasta ${money(cercaMax)} de su próximo premio.</div>`;
  if (!list.length) return;
  $('#cp-x').onclick = () => csv([['Cliente', 'Cédula', 'Celular', 'Puntos', 'Próximo premio', 'Puntos del premio', 'Le faltan', 'Compra que lo logra', 'Tienda favorita', 'Notificaciones'], ...list.map((x) => [x.nombre, x.cedula, x.celular, x.puntos, x.premio, x.premio_puntos, x.faltan, x.compra, x.favorita, x.push ? 'Sí' : 'No'])], `cerca-de-premio-${new Date().toISOString().slice(0, 10)}.csv`);
  const ej = list[0];
  $('#cp-env').onclick = () => dialog(`<h2 style="font-size:20px;font-weight:800">Enviar mensaje a ${num(list.length)} cliente${list.length === 1 ? '' : 's'}</h2>
    <p class="small muted" style="margin:0">Cada uno recibe su mensaje con su nombre, su premio y la compra que le falta. Llega como notificación a quienes la tienen activa (${num(conPush)}) y a todos les queda en Mensajes.</p>
    <div class="card" style="background:var(--cream)"><b>¡Estás muy cerca de tu ${esc(nombreP(ej.premio))}!</b><div class="small" style="margin-top:4px">${esc(ej.nombre.split(' ')[0])}, te faltan solo ${num(ej.faltan)} puntos para tu ${esc(nombreP(ej.premio))}. ¡Con una compra de ${money(ej.compra)} en cualquier tienda del mall lo logras! Te esperamos en Santana del Río.</div></div>`, async () => {
    const r = await rpc('admin_enviar_cerca_premio', { p_max_compra: cercaMax });
    toast(`Mensaje enviado a ${num(r.enviados)} clientes.`);
  }, 'Enviar');
}

/* ---- Informe mensual por tienda (presupuesto de facturas) ---- */
let informeMes = (() => { const d = new Date(); return iso(new Date(d.getFullYear(), d.getMonth(), 1)); })();
async function vInforme(box) {
  const m = new Date(informeMes + 'T12:00:00');
  const titulo = `${MESES_L[m.getMonth()]} ${m.getFullYear()}`;
  const opciones = Array.from({ length: 13 }, (_, i) => { const d = new Date(); const x = new Date(d.getFullYear(), d.getMonth() - i, 1); return [iso(x), `${MESES_L[x.getMonth()]} ${x.getFullYear()}`]; });
  box.innerHTML = `<div class="row between wrap no-print"><h1 style="font-size:30px;font-weight:800">Informe mensual por tienda</h1>
    <div class="row wrap"><label for="i-mes" class="small" style="font-weight:600">Mes</label><select class="input" id="i-mes" style="width:210px;height:44px">${opciones.map(([v, l]) => `<option value="${v}" ${v === informeMes ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <button class="btn ghost sm" id="i-x">Exportar Excel</button><button class="btn ghost sm" id="i-p">Imprimir / PDF</button><button class="btn ghost sm" id="i-man">Cargar resultados a mano</button><button class="btn coral sm" id="i-meta">Cargar presupuesto</button></div></div>
    <h1 class="only-print" style="font-size:26px;font-weight:800">Puntos Santana · Informe de ${titulo}</h1>
    <div id="i-body"><div class="empty">Cargando…</div></div>`;
  $('#i-mes').onchange = (e) => { informeMes = e.target.value; vInforme(box); };
  $('#i-p').onclick = () => window.print();
  let d; try { d = await rpc('admin_informe_mensual', { p_mes: informeMes }); } catch (e) { $('#i-body').innerHTML = `<div class="empty">${errText(e)}</div>`; return; }
  const T = d.tiendas.map((t) => ({ ...t, pct: t.meta ? Math.round(t.facturas / t.meta * 100) : null }));
  const conMeta = T.filter((t) => t.meta);
  const totF = T.reduce((a, t) => a + t.facturas, 0), totMeta = conMeta.reduce((a, t) => a + t.meta, 0);
  const totFconMeta = conMeta.reduce((a, t) => a + t.facturas, 0);
  const pctG = totMeta ? Math.round(totFconMeta / totMeta * 100) : null;
  const color = (p) => p == null ? '#C9C1AE' : p >= 100 ? '#1B6B3A' : p >= 70 ? '#F6A21E' : '#EB5440';
  const estado = (p) => p == null ? 'Sin meta' : p >= 100 ? 'Cumplió' : p >= 70 ? 'Cerca' : 'Por debajo';
  const rank = [...T].sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1) || b.facturas - a.facturas);
  const hoy = new Date(), esActual = m.getMonth() === hoy.getMonth() && m.getFullYear() === hoy.getFullYear();
  const diasMes = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const avanceMes = esActual ? Math.round(hoy.getDate() / diasMes * 100) : 100;
  const maxDia = Math.max(1, ...d.por_dia.map((x) => x.facturas));
  const dias = Array.from({ length: diasMes }, (_, i) => (d.por_dia.find((x) => x.dia === i + 1) || {}).facturas || 0);
  const K = (l, v, c, sub) => `<div class="kpi"><div class="dot" style="background:${c}"></div><span>${l}</span><b>${v}</b>${sub ? `<span class="small">${sub}</span>` : ''}</div>`;
  const delta = (t) => { const x = t.facturas - t.facturas_anterior; return x === 0 ? '<span class="muted">=</span>' : `<span style="color:${x > 0 ? '#1B6B3A' : '#C2402F'};font-weight:700">${x > 0 ? '▲' : '▼'} ${Math.abs(x)}</span>`; };
  $('#i-body').innerHTML = `<div class="stack" style="gap:20px">
    ${d.manual ? `<div class="card small" style="border-color:var(--teal);background:#EAF7FA">Este mes incluye resultados cargados a mano (marcados con <b>✎</b> en el ranking). Se suman a lo registrado en la app y no cambian los puntos de ningún cliente.</div>` : ''}
    ${esActual ? `<div class="card small" style="border-color:var(--yellow);background:#FFFBEA">Mes en curso: van ${hoy.getDate()} de ${diasMes} días (${avanceMes}% del mes). Una tienda va al día si su cumplimiento está cerca del ${avanceMes}%.</div>` : ''}
    <div class="kpis">
      ${K('Facturas registradas', num(totF), 'var(--navy)')}
      ${K('Presupuesto de facturas', totMeta ? num(totMeta) : '—', 'var(--teal)', conMeta.length ? `${conMeta.length} de ${T.length} tiendas con meta` : 'Sin presupuesto cargado')}
      ${K('Cumplimiento general', pctG == null ? '—' : pctG + '%', color(pctG))}
      ${K('Puntos acumulados', num(T.reduce((a, t) => a + t.puntos, 0)), 'var(--sun)')}
      ${K('Clientes nuevos', num(T.reduce((a, t) => a + t.nuevos, 0)), 'var(--coral)', 'Primera compra en la tienda')}
      ${K('Clientes recurrentes', num(T.reduce((a, t) => a + t.recurrentes, 0)), 'var(--navy)', 'Ya habían comprado en la tienda')}
      ${K('Inscritos en la app', num(d.inscritos), 'var(--yellow)')}
    </div>
    <div class="cols">
      <section class="card stack"><h2 style="font-size:18px;font-weight:800">Facturas vs. presupuesto</h2>
        ${T.map((t) => { const top = Math.max(t.meta || 0, t.facturas, 1); const ref = Math.max(...T.map((x) => Math.max(x.meta || 0, x.facturas)), 1);
          return `<div class="ibar"><b>${esc(t.nombre)}</b><div class="ibar-t" title="${t.facturas} de ${t.meta ?? '—'}"><div style="width:${Math.round(t.facturas / ref * 100)}%;background:${color(t.pct)}"></div>${t.meta ? `<i style="left:${Math.min(100, Math.round(t.meta / ref * 100))}%"></i>` : ''}</div><span>${num(t.facturas)}${t.meta ? ' / ' + num(t.meta) : ''}</span></div>`; }).join('')}
        <div class="row wrap small" style="gap:14px"><span><i class="lg" style="background:#1B6B3A"></i>Cumplió</span><span><i class="lg" style="background:#F6A21E"></i>70–99%</span><span><i class="lg" style="background:#EB5440"></i>Menos de 70%</span><span><i class="lg" style="background:var(--navy);width:3px"></i>Meta</span></div>
      </section>
      <section class="card stack"><h2 style="font-size:18px;font-weight:800">Facturas registradas por día</h2>
        <div class="days">${dias.map((n, i) => `<div title="Día ${i + 1}: ${n} facturas"><div style="height:${Math.round(n / maxDia * 100)}%"></div><span>${(i + 1) % 5 === 0 || i === 0 ? i + 1 : ''}</span></div>`).join('')}</div>
        <span class="small muted">Puntos redimidos en el mes: <b>${num(d.redimidos)}</b></span>
      </section>
    </div>
    <section class="card stack"><h2 style="font-size:18px;font-weight:800">Ranking de tiendas · ${titulo}</h2>
      <div class="tbl-wrap"><table><thead><tr><th>#</th><th>Tienda</th><th style="text-align:right">Facturas</th><th style="text-align:right">Meta</th><th>Cumplimiento</th><th style="text-align:right">Puntos</th><th style="text-align:right">Clientes nuevos</th><th style="text-align:right">Recurrentes</th><th style="text-align:right">vs. mes anterior</th></tr></thead><tbody>
      ${rank.map((t, i) => `<tr><td><b>${i + 1}</b></td><td><b>${esc(t.nombre)}</b>${t.man_facturas != null || t.man_puntos != null || t.man_nuevos != null || t.man_recurrentes != null ? ' <span title="Incluye resultados cargados a mano" style="color:var(--teal-d)">✎</span>' : ''}${t.sellos ? `<div class="small muted">${num(t.sellos)} sellos</div>` : ''}</td><td style="text-align:right;font-weight:800">${num(t.facturas)}</td><td style="text-align:right">${t.meta ? num(t.meta) : '—'}</td>
        <td style="min-width:170px"><div class="row" style="gap:8px"><div class="bar" style="flex:1;height:10px"><div style="width:${Math.min(100, t.pct || 0)}%;background:${color(t.pct)}"></div></div><b style="color:${color(t.pct)};min-width:44px;text-align:right">${t.pct == null ? '—' : t.pct + '%'}</b></div><span class="small" style="color:${color(t.pct)}">${estado(t.pct)}</span></td>
        <td style="text-align:right">${num(t.puntos)}</td><td style="text-align:right;font-weight:700;color:var(--coral-t)">${num(t.nuevos)}</td><td style="text-align:right;font-weight:700">${num(t.recurrentes)}</td><td style="text-align:right">${delta(t)}</td></tr>`).join('')}
      </tbody></table></div>
    </section></div>`;
  $('#i-x').onclick = () => csv([['Mes', 'Puesto', 'Tienda', 'Facturas', 'Meta facturas', 'Cumplimiento %', 'Puntos', 'Clientes nuevos', 'Clientes recurrentes', 'Facturas mes anterior'], ...rank.map((t, i) => [titulo, i + 1, t.nombre, t.facturas, t.meta ?? '', t.pct ?? '', t.puntos, t.nuevos, t.recurrentes, t.facturas_anterior])], `informe-tiendas-${informeMes.slice(0, 7)}.csv`);
  $('#i-man').onclick = () => {
    const nf = (v) => v == null ? '' : num(v);
    dialog(`<h2 style="font-size:20px;font-weight:800">Resultados a mano · ${titulo}</h2>
      <p class="small muted" style="margin:0">Para meses anteriores a la app (por ejemplo octubre) o datos que no pasaron por la app. Se suman al informe; no cambian los puntos de los clientes. Deja vacío lo que no tengas.</p>
      <div class="tbl-wrap" style="max-height:50vh;overflow:auto"><table><thead><tr><th>Tienda</th><th>Facturas</th><th>Puntos</th><th>Clientes nuevos</th><th>Recurrentes</th></tr></thead><tbody>
      ${T.map((t) => `<tr data-man="${t.id}"><td><b>${esc(t.nombre)}</b></td>
        <td><input class="input" aria-label="Facturas ${esc(t.nombre)}" data-k="facturas" inputmode="numeric" value="${nf(t.man_facturas)}" style="height:40px;min-width:90px"></td>
        <td><input class="input" aria-label="Puntos ${esc(t.nombre)}" data-k="puntos" inputmode="numeric" value="${nf(t.man_puntos)}" style="height:40px;min-width:90px"></td>
        <td><input class="input" aria-label="Clientes nuevos ${esc(t.nombre)}" data-k="clientes_nuevos" inputmode="numeric" value="${nf(t.man_nuevos)}" style="height:40px;min-width:90px"></td>
        <td><input class="input" aria-label="Clientes recurrentes ${esc(t.nombre)}" data-k="clientes_recurrentes" inputmode="numeric" value="${nf(t.man_recurrentes)}" style="height:40px;min-width:90px"></td></tr>`).join('')}
      </tbody></table></div>`, async (dl) => {
      const filas = {};
      dl.querySelectorAll('[data-man]').forEach((tr) => { const o = {}; tr.querySelectorAll('[data-k]').forEach((i) => { o[i.dataset.k] = i.value.replace(/\D/g, ''); }); filas[tr.dataset.man] = o; });
      await rpc('admin_guardar_resultados', { p_mes: informeMes, p_filas: filas }); toast('Resultados guardados.'); vInforme(box);
    });
    const dlm = document.querySelector('dialog:last-of-type'); if (dlm) dlm.style.maxWidth = '820px';
    document.querySelectorAll('dialog [data-k]').forEach((i) => i.oninput = () => { const v = i.value.replace(/\D/g, ''); i.value = v ? Number(v).toLocaleString('es-CO') : ''; });
  };
  $('#i-meta').onclick = () => {
    dialog(`<h2 style="font-size:20px;font-weight:800">Presupuesto de facturas · ${titulo}</h2>
      <p class="small muted" style="margin:0">Cuántas facturas debe registrar cada tienda en el mes. Deja vacío si una tienda no tiene meta.</p>
      <button type="button" class="btn ghost sm" id="m-copy" style="align-self:flex-start">Copiar metas del mes anterior</button>
      <div class="grid" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;max-height:46vh;overflow:auto">
      ${T.map((t) => `<div class="field"><label for="m-${t.id}">${esc(t.nombre)}</label><input class="input" id="m-${t.id}" data-meta="${t.id}" data-ant="${t.meta_anterior ?? ''}" inputmode="numeric" value="${t.meta ?? ''}" style="height:46px"></div>`).join('')}</div>`, async (dl) => {
      const metas = {}; dl.querySelectorAll('[data-meta]').forEach((i) => { const v = i.value.replace(/\D/g, ''); metas[i.dataset.meta] = v === '' ? '' : Number(v); });
      await rpc('admin_guardar_presupuesto', { p_mes: informeMes, p_metas: metas }); toast('Presupuesto guardado.'); vInforme(box);
    });
    const cp = document.querySelector('dialog #m-copy');
    if (cp) cp.onclick = () => document.querySelectorAll('dialog [data-meta]').forEach((i) => { if (i.dataset.ant !== '') i.value = i.dataset.ant; });
  };
}

/* ---- Importar clientes desde Excel ---- */
let xlsxLib = null;
function cargarXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (xlsxLib) return xlsxLib;
  xlsxLib = new Promise((ok, fail) => { const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'; sc.onload = () => ok(window.XLSX); sc.onerror = () => { xlsxLib = null; fail(new Error('No se pudo cargar el lector de Excel')); }; document.head.appendChild(sc); });
  return xlsxLib;
}
const normH = (h) => String(h || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
function fechaExcel(v) {
  if (v == null || v === '') return '';
  if (v instanceof Date && !isNaN(v)) return iso(new Date(v.getFullYear(), v.getMonth(), v.getDate()));
  if (typeof v === 'number') { const d = new Date(Math.round((v - 25569) * 86400000)); return iso(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }
  const t = String(v).trim();
  let m = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/); // dd/mm/aaaa
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = t.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  return '';
}
function importarClientes(despues) {
  let filas = [];
  dialog(`<h2 style="font-size:20px;font-weight:800">Importar clientes desde Excel</h2>
    <p class="muted small" style="margin:0">Columnas que se leen: <b>Nombres</b> y <b>Apellidos</b> (o Nombre), <b>Cédula</b> (si falta, se usa el Número de tarjeta), <b>Fecha de nacimiento</b>, <b>Teléfono</b>, <b>Correo</b> y <b>Saldo / Puntos</b>. Los puntos se redondean y vencen en 1 año. Si una cédula ya existe no se duplica ni se le suman puntos otra vez.</p>
    <div class="field"><label for="i-f">Archivo (.xlsx, .xls o .csv)</label><input class="input" id="i-f" type="file" accept=".xlsx,.xls,.csv" style="padding:12px"></div>
    <div id="i-prev" class="small"></div>`, async (dl) => {
    if (!filas.length) { toast('Primero elige un archivo con clientes.', true); return false; }
    const prev = dl.querySelector('#i-prev');
    let R = { nuevos: 0, actualizados: 0, existentes: 0, con_saldo: 0, puntos: 0 }, errores = [];
    for (let i = 0; i < filas.length; i += 500) {
      prev.innerHTML = `<b>Cargando… ${num(Math.min(i + 500, filas.length))} de ${num(filas.length)}</b>`;
      const r = await rpc('admin_importar_clientes', { p_filas: filas.slice(i, i + 500) });
      for (const k in R) R[k] += Number(r[k] || 0);
      errores = errores.concat(r.errores || []);
    }
    dialog(`<h2 style="font-size:20px;font-weight:800">Importación terminada</h2>
      <div class="vbox">
        <div class="vrow"><span>Clientes nuevos cargados</span><b class="vbig">${num(R.nuevos)}</b></div>
        <div class="vrow"><span>Con saldo de puntos</span><b>${num(R.con_saldo)}</b></div>
        <div class="vrow"><span>Puntos cargados</span><b>${num(R.puntos)}</b></div>
        <div class="vrow"><span>Ya existían (se completaron datos vacíos)</span><b>${num(R.actualizados)}</b></div>
        <div class="vrow"><span>Ya existían (sin cambios)</span><b>${num(R.existentes)}</b></div>
        <div class="vrow"><span>Filas no cargadas</span><b>${num(errores.length)}</b></div>
      </div>${errores.length ? `<div class="tbl-wrap" style="max-height:200px;overflow:auto"><table><thead><tr><th>Fila</th><th>Motivo</th></tr></thead><tbody>${errores.slice(0, 300).map((e) => `<tr><td>${e.fila}</td><td>${esc(e.motivo)}</td></tr>`).join('')}</tbody></table></div>` : ''}`, async () => {}, 'Entendido');
    const d = document.querySelector('dialog:last-of-type [data-x]'); if (d) d.remove();
    despues && despues();
  }, 'Importar');
  const inp = document.querySelector('dialog #i-f'), prev = document.querySelector('dialog #i-prev');
  const MIN = new Set(['de', 'del', 'la', 'las', 'los', 'y']);
  const titulo = (t) => t.replace(/\d+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().split(' ').map((w, i) => (i > 0 && MIN.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const celular = (v) => { let d = String(v ?? '').replace(/\.0$/, '').replace(/\D/g, ''); if (d.length === 12 && d.startsWith('57')) d = d.slice(2); return /^3\d{9}$/.test(d) ? d : ''; };
  const digitos = (v) => String(v ?? '').trim().replace(/\.0$/, '').replace(/\D/g, '');
  inp.onchange = async () => {
    const file = inp.files[0]; if (!file) return;
    prev.textContent = 'Leyendo archivo…';
    try {
      const XLSX = await cargarXLSX();
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
      if (!raw.length) { prev.textContent = 'El archivo está vacío.'; return; }
      const keys = Object.keys(raw[0]); const N = (k) => normH(k);
      const kNoms = keys.find((k) => /^nombres?$/.test(N(k))) || keys.find((k) => /nombre/.test(N(k)));
      const kApe = keys.find((k) => /apellido/.test(N(k)));
      const kCed = keys.find((k) => /^(cedula|documento|identificacion|cc|numerodedocumento)$/.test(N(k))) || keys.find((k) => /cedula|documento/.test(N(k)));
      const kTar = keys.find((k) => /tarjeta/.test(N(k)));
      const kNac = keys.find((k) => /nacimiento|cumple|fechanac/.test(N(k)));
      const kTels = keys.filter((k) => /telefono|celular|movil/.test(N(k)));
      const kMail = keys.find((k) => /correo|email|mail/.test(N(k)));
      const kPts = keys.find((k) => /saldo|puntos/.test(N(k)));
      if (!kNoms || !(kCed || kTar)) { prev.innerHTML = `<span style="color:var(--coral-t)">No encontré las columnas de nombre y cédula. Columnas del archivo: ${esc(keys.join(', '))}</span>`; filas = []; return; }
      filas = raw.map((r, i) => {
        let nac = kNac ? fechaExcel(r[kNac]) : '';
        if (!/^(19\d\d|20(0\d|1[0-2]))-\d\d-\d\d$/.test(nac)) nac = ''; // fechas imposibles o de menores: vacías
        const pts = kPts ? Math.max(0, Math.round(Number(String(r[kPts]).replace(',', '.')) || 0)) : 0;
        return { fila: i + 2, nombre: titulo(String(r[kNoms] || '') + ' ' + (kApe ? String(r[kApe] || '') : '')), cedula: digitos(kCed ? r[kCed] : '') || digitos(kTar ? r[kTar] : ''),
          nacimiento: nac, celular: kTels.map((k) => celular(r[k])).find(Boolean) || '', correo: kMail ? String(r[kMail] || '').trim() : '', puntos: pts };
      }).filter((r) => r.nombre || r.cedula);
      const conPts = filas.filter((r) => r.puntos > 0), total = conPts.reduce((a, r) => a + r.puntos, 0);
      prev.innerHTML = `<div class="stack" style="gap:8px"><b>${num(filas.length)} clientes listos para importar</b>
        <span class="muted">${num(conPts.length)} con puntos · ${num(total)} puntos en total · ${num(filas.filter((r) => r.nacimiento).length)} con fecha de nacimiento · ${num(filas.filter((r) => r.celular).length)} con celular</span>
        <div class="tbl-wrap" style="max-height:180px;overflow:auto"><table><thead><tr><th>Nombre</th><th>Cédula</th><th>Nacimiento</th><th>Celular</th><th style="text-align:right">Puntos</th></tr></thead><tbody>${filas.slice(0, 8).map((r) => `<tr><td>${esc(r.nombre)}</td><td>${esc(r.cedula)}</td><td>${r.nacimiento ? fdate(r.nacimiento) : '—'}</td><td>${esc(r.celular || '—')}</td><td style="text-align:right">${num(r.puntos)}</td></tr>`).join('')}</tbody></table></div></div>`;
    } catch (er) { prev.innerHTML = `<span style="color:var(--coral-t)">${esc(er.message || 'No se pudo leer el archivo.')}</span>`; filas = []; }
  };
}
function alertaErrores(errores) {
  dialog(`<h2 style="font-size:20px;font-weight:800">Filas que no se importaron</h2><div class="tbl-wrap" style="max-height:300px;overflow:auto"><table><thead><tr><th>Fila</th><th>Motivo</th></tr></thead><tbody>${errores.slice(0, 300).map((e) => `<tr><td>${e.fila}</td><td>${esc(e.motivo)}</td></tr>`).join('')}</tbody></table></div>`, async () => {}, 'Entendido');
}

/* ---- Cumpleaños del mes ---- */
const MESES_L = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
let cumpleState = { mes: new Date().getMonth() + 1, tienda: null };
async function vCumple(box) {
  const st = cumpleState, tn = st.tienda ? tiendaNombre(st.tienda) : null;
  box.innerHTML = `
  <div class="row between wrap"><h1 style="font-size:30px;font-weight:800">Cumpleaños de ${MESES_L[st.mes - 1]}</h1>
    <div class="row wrap"><label for="c-mes" class="small" style="font-weight:600">Mes</label><select class="input" id="c-mes" style="width:180px;height:44px">${MESES_L.map((m, i) => `<option value="${i + 1}" ${i + 1 === st.mes ? 'selected' : ''}>${m}</option>`).join('')}</select>
    <button class="btn ghost sm" id="c-x">Exportar lista</button></div></div>
  <div class="stack" style="gap:8px"><span class="small" style="font-weight:600">Clientes de la tienda (favorita o compran allí):</span>
    <div class="row wrap" style="gap:8px"><button class="chip" data-ct="" aria-pressed="${!st.tienda}">TODAS</button>${tiendas.map((t) => `<button class="chip" data-ct="${t.id}" aria-pressed="${st.tienda === t.id}">${esc(t.nombre)}</button>`).join('')}</div></div>
  <div id="c-body"><div class="empty">Cargando…</div></div>`;
  $('#c-mes').onchange = (e) => { st.mes = Number(e.target.value); vCumple(box); };
  $$('[data-ct]').forEach((b) => b.onclick = () => { st.tienda = b.dataset.ct ? Number(b.dataset.ct) : null; vCumple(box); });
  let rows; try { rows = await rpc('admin_cumpleanos', { p_mes: st.mes, p_tienda_id: st.tienda }); } catch (e) { $('#c-body').innerHTML = `<div class="empty">${errText(e)}</div>`; return; }
  const hoyD = new Date(), esMes = st.mes === hoyD.getMonth() + 1;
  const activos = rows.filter((r) => r.activo).length;
  $('#c-x').onclick = () => csv([['Día', 'Nombre', 'Cédula', 'Celular', 'Fecha nacimiento', 'Edad que cumple', 'Tienda favorita', 'Tiendas donde compra', 'Puntos', 'App activa'], ...rows.map((r) => [r.dia, r.nombre, r.cedula, r.celular, r.fecha_nacimiento, r.edad, r.favorita, (r.tiendas || []).join(', '), r.puntos, r.activo ? 'Sí' : 'No'])], `cumpleanos-${MESES_L[st.mes - 1].toLowerCase()}${tn ? '-' + tn.toLowerCase().replace(/\s+/g, '-') : ''}.csv`);
  $('#c-body').innerHTML = `
  <div class="kpis" style="margin-bottom:20px">
    <div class="kpi"><div class="dot" style="background:var(--sun)"></div><span>Cumplen en ${MESES_L[st.mes - 1].toLowerCase()}${tn ? ' · compran en ' + esc(tn) : ''}</span><b>${num(rows.length)}</b></div>
    <div class="kpi"><div class="dot" style="background:var(--teal)"></div><span>Recibirán el mensaje (app activa)</span><b>${num(activos)}</b></div>
    ${esMes ? `<div class="kpi"><div class="dot" style="background:var(--coral)"></div><span>Cumplen hoy</span><b>${num(rows.filter((r) => r.dia === hoyD.getDate()).length)}</b></div>` : ''}
  </div>
  <div class="cols">
    <section class="card stack">
      ${rows.length ? `<div class="tbl-wrap"><table><thead><tr><th>Día</th><th>Cliente</th><th>Cumple</th><th>Favorita · compras</th><th style="text-align:right">Puntos</th></tr></thead><tbody>
      ${rows.map((r) => `<tr class="${esMes && r.dia === hoyD.getDate() ? 'sel' : ''}"><td><b style="font-size:16px">${r.dia}</b></td><td><b>${esc(r.nombre)}</b><div class="small muted">C.C. ${esc(num(r.cedula))}${r.activo ? '' : ' · sin activar'}</div></td><td>${r.edad} años</td><td class="small">${r.favorita ? `<b>★ ${esc(r.favorita)}</b><br>` : ''}${(r.tiendas || []).length ? esc(r.tiendas.join(', ')) : '<span class="muted">Sin compras aún</span>'}</td><td style="text-align:right">${num(r.puntos)}</td></tr>`).join('')}
      </tbody></table></div>` : '<div class="empty">Nadie cumple años en este mes con ese filtro.</div>'}
    </section>
    <form class="navy-card" id="c-f" novalidate>
      <h2 style="font-size:20px;font-weight:800">Enviar promoción de cumpleaños</h2>
      <p style="margin:0;color:#CFE9F0;font-size:13px">Se envía a ${activos === 1 ? 'el único cliente' : 'los ' + num(activos) + ' clientes'} de esta lista con la app activa${tn ? `, que compran en ${esc(tn)}` : ''}.</p>
      <div class="field"><label for="c-t">Título</label><input class="input" id="c-t" maxlength="60" value="¡Feliz cumpleaños! Tenemos un regalo para ti"></div>
      <div class="field"><label for="c-c">Mensaje</label><textarea class="input" id="c-c" rows="4" maxlength="300">Por tu cumpleaños tienes un descuento especial${tn ? ' en ' + esc(tn) : ' en Santana del Río'}. Válido durante tu mes de cumpleaños presentando tu cédula.</textarea></div>
      <button class="btn coral block" ${activos ? '' : 'disabled'}>Enviar a ${activos === 1 ? '1 cliente' : num(activos) + ' clientes'}</button>
    </form>
  </div>`;
  $('#c-f').onsubmit = async (e) => {
    e.preventDefault();
    const t = $('#c-t').value.trim(), c = $('#c-c').value.trim();
    if (!t || !c) return toast('Escribe el título y el mensaje.', true);
    if (!confirm(`¿Enviar la promoción a ${activos} clientes?`)) return;
    const b = $('button', $('#c-f')); b.disabled = true;
    try { const r = await rpc('admin_mensaje_cumpleanos', { p_mes: st.mes, p_tienda_id: st.tienda, p_titulo: t, p_cuerpo: c }); toast(`Promoción enviada a ${num(r.destinatarios)} clientes.`); }
    catch (er) { toast(errText(er), true); }
    b.disabled = false;
  };
}

async function vPremios(box) {
  box.innerHTML = `<div class="row between wrap"><h1 style="font-size:30px;font-weight:800">Premios redimibles</h1><button class="btn coral" id="nuevo">+ Nuevo premio</button></div><div class="admin-grid" id="pg"><div class="empty">Cargando…</div></div>`;
  const { data, error } = await sb.from('premios').select('*').order('puntos');
  if (error) { $('#pg').innerHTML = `<div class="empty">${errText(error)}</div>`; return; }
  const tints = ['#FFE7A8', '#FCD9D2', '#D3EEF4', '#E8E2F5'];
  $('#pg').innerHTML = data.map((p, i) => `<div class="pcard"><div class="ph" style="background:${tints[i % 4]}">${p.imagen_url ? `<img src="${esc(p.imagen_url)}" alt="">` : 'Sin foto'}</div>
    <div class="stack" style="padding:14px;gap:6px"><b style="font-size:15px">${esc(p.nombre)}</b><span class="small muted">${esc(p.tienda || 'Sin tienda')} · Stock: ${p.stock == null ? 'sin límite' : num(p.stock)}</span>
    <b style="font-size:18px;color:var(--coral-t)">${num(p.puntos)} pts</b>
    <div class="row between"><button class="switch" data-sw="${p.id}" aria-pressed="${p.activo}" aria-label="Visible en la app"></button><span class="small muted">${p.activo ? 'Visible' : 'Oculto'}</span><button class="btn ghost sm" data-ed="${p.id}">Editar</button></div></div></div>`).join('') || '<div class="card empty">Aún no hay premios. Crea el primero.</div>';
  $$('[data-sw]').forEach((b) => b.onclick = async () => { const on = b.getAttribute('aria-pressed') !== 'true'; const { error: e } = await sb.from('premios').update({ activo: on }).eq('id', b.dataset.sw); if (e) return toast(errText(e), true); vPremios(box); });
  const form = (p = {}) => dialog(`<h2 style="font-size:20px;font-weight:800">${p.id ? 'Editar premio' : 'Nuevo premio'}</h2>
    <div class="field"><label for="p-n">Nombre *</label><input class="input" id="p-n" value="${esc(p.nombre || '')}"></div>
    <div class="field"><label for="p-d">Descripción</label><input class="input" id="p-d" value="${esc(p.descripcion || '')}"></div>
    <div class="grid" style="grid-template-columns:1fr 1fr">
      <div class="field"><label for="p-p">Puntos *</label><input class="input" id="p-p" inputmode="numeric" value="${p.puntos ? num(p.puntos) : ''}"></div>
      <div class="field"><label for="p-s">Stock (vacío = sin límite)</label><input class="input" id="p-s" inputmode="numeric" value="${p.stock ?? ''}"></div></div>
    <div class="field"><label for="p-t">Tienda que lo entrega</label><select class="input" id="p-t"><option value="">—</option>${tiendas.map((t) => `<option ${p.tienda === t.nombre ? 'selected' : ''}>${esc(t.nombre)}</option>`).join('')}</select></div>
    <div class="field"><label for="p-f">Foto del premio</label>
      <div class="row" style="gap:14px;align-items:center"><div id="p-prev" style="width:96px;height:96px;border-radius:16px;background:#FFE7A8;overflow:hidden;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--muted)">${p.imagen_url ? `<img src="${esc(p.imagen_url)}" alt="" style="width:100%;height:100%;object-fit:cover">` : 'Sin foto'}</div>
      <div class="stack" style="gap:6px;flex:1"><input class="input" id="p-f" type="file" accept="image/*" style="padding:10px;height:auto"><span class="small muted">JPG o PNG. Se ajusta sola al tamaño correcto.</span>${p.imagen_url ? '<label class="check small"><input type="checkbox" id="p-del">Quitar la foto actual</label>' : ''}</div></div>
      <div class="stack" style="gap:6px;margin-top:6px"><span class="small" style="font-weight:600">O elige una foto de la galería:</span><div id="p-gal" class="gal"><span class="small muted">Cargando…</span></div></div></div>`, async (dl) => {
    const row = { nombre: $('#p-n', dl).value.trim(), descripcion: $('#p-d', dl).value.trim() || null, puntos: Number(digits($('#p-p', dl).value)), stock: $('#p-s', dl).value.trim() === '' ? null : Number(digits($('#p-s', dl).value)), tienda: $('#p-t', dl).value || null, imagen_url: p.imagen_url || null };
    const del = $('#p-del', dl); if (del && del.checked) row.imagen_url = null;
    const gsel = dl.querySelector('#p-gal [aria-pressed="true"]'); if (gsel) row.imagen_url = gsel.dataset.url;
    const file = $('#p-f', dl).files[0];
    if (file) row.imagen_url = await subirFotoPremio(file);
    if (!row.nombre || !row.puntos) { toast('Escribe el nombre y los puntos.', true); return false; }
    const q = p.id ? sb.from('premios').update(row).eq('id', p.id) : sb.from('premios').insert(row);
    const { error: e } = await q; if (e) throw e; toast('Premio guardado.'); vPremios(box);
  });
  const conVista = (fn) => () => {
    fn();
    const f = document.querySelector('dialog #p-f'), prev = document.querySelector('dialog #p-prev'), gal = document.querySelector('dialog #p-gal');
    if (f) f.onchange = () => { const x = f.files[0]; if (x) { prev.innerHTML = `<img src="${URL.createObjectURL(x)}" alt="" style="width:100%;height:100%;object-fit:cover">`; gal.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false')); } };
    if (gal) sb.storage.from('premios').list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } }).then(({ data: fotos, error }) => {
      const lista = (fotos || []).filter((o) => /\.(jpe?g|webp)$/i.test(o.name));
      if (error || !lista.length) { gal.innerHTML = '<span class="small muted">Aún no hay fotos en la galería.</span>'; return; }
      gal.innerHTML = lista.map((o) => { const u = sb.storage.from('premios').getPublicUrl(o.name).data.publicUrl; return `<button type="button" aria-pressed="false" data-url="${esc(u)}" aria-label="Usar ${esc(o.name)}"><img src="${esc(u)}" alt="" loading="lazy"></button>`; }).join('');
      gal.querySelectorAll('button').forEach((b) => b.onclick = () => { gal.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b)); prev.innerHTML = `<img src="${b.dataset.url}" alt="" style="width:100%;height:100%;object-fit:cover">`; if (f) f.value = ''; });
    });
  };
  $('#nuevo').onclick = conVista(() => form());
  $$('[data-ed]').forEach((b) => b.onclick = conVista(() => form(data.find((x) => x.id === b.dataset.ed))));
}

/* Sube la foto de un premio (reducida a máx. 900 px, JPG) y devuelve su enlace público */
async function subirFotoPremio(file) {
  const img = await new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => fail(new Error('No se pudo leer la imagen.')); i.src = URL.createObjectURL(file); });
  const max = 900, k = Math.min(1, max / Math.max(img.width, img.height));
  const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
  const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height);
  const blob = await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.85));
  const path = `premio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await sb.storage.from('premios').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  return sb.storage.from('premios').getPublicUrl(path).data.publicUrl;
}

async function vCupones(box) {
  box.innerHTML = `<div class="row between wrap"><h1 style="font-size:30px;font-weight:800">Cupones</h1><button class="btn coral" id="nuevo">+ Crear cupón</button></div><section class="card" id="cl"><div class="empty">Cargando…</div></section>`;
  const { data, error } = await sb.from('cupones').select('*').order('creado_en', { ascending: false });
  if (error) { $('#cl').innerHTML = `<div class="empty">${errText(error)}</div>`; return; }
  const mini = (c) => `<div style="width:56px;height:56px;border-radius:12px;background:#FFE7A8;overflow:hidden;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--muted)">${c.foto_url ? `<img src="${esc(c.foto_url)}" alt="" style="width:100%;height:100%;object-fit:cover">` : 'Sin foto'}</div>`;
  $('#cl').innerHTML = data.length ? `<div class="tbl-wrap"><table><thead><tr><th>Cupón</th><th>Tienda</th><th>Código</th><th>Válido hasta</th><th>Activo</th><th></th></tr></thead><tbody>
    ${data.map((c) => `<tr><td><div class="row" style="gap:10px;align-items:center">${mini(c)}<div><b>${esc(c.titulo)}</b>${c.descripcion ? `<div class="small muted">${esc(c.descripcion)}</div>` : ''}</div></div></td><td>${esc(c.tienda || 'Todas')}</td><td>${esc(c.codigo || '—')}</td><td>${c.valido_hasta ? fdate(c.valido_hasta) : 'Sin fecha'}</td>
    <td><button class="switch" data-sw="${c.id}" aria-pressed="${c.activo}" aria-label="Activo"></button></td>
    <td><div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn coral sm" data-push="${c.id}">Enviar push</button><button class="btn ghost sm" data-ed="${c.id}">Editar</button></div></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Aún no hay cupones.</div>';
  $$('[data-sw]').forEach((b) => b.onclick = async () => { const on = b.getAttribute('aria-pressed') !== 'true'; const { error: e } = await sb.from('cupones').update({ activo: on }).eq('id', b.dataset.sw); if (e) return toast(errText(e), true); vCupones(box); });

  const enviar = (c) => dialog(`<h2 style="font-size:20px;font-weight:800">Enviar cupón por notificación</h2>
    <div class="row" style="gap:12px;align-items:center">${mini(c)}<div><b>${esc(c.titulo)}</b><div class="small muted">${esc(c.tienda || 'Todas las tiendas')}</div></div></div>
    <div class="field"><label>¿A quién?</label>
      <label class="check"><input type="radio" name="seg" value="todos" ${c.tienda ? '' : 'checked'}><span>Todos los clientes</span></label>
      ${c.tienda ? `<label class="check"><input type="radio" name="seg" value="tienda" checked><span>Solo quienes quieren promociones de ${esc(c.tienda)} (o la tienen de favorita)</span></label>` : ''}</div>
    <p class="small muted" style="margin:0">Les llega al celular${c.foto_url ? ' con la foto' : ''} y al tocarla abre la sección Cupones. También queda en Mensajes.</p>`, async (dl) => {
    if (!c.activo) { toast('Activa el cupón antes de enviarlo.', true); return false; }
    const seg = dl.querySelector('input[name="seg"]:checked').value;
    const r = await rpc('admin_enviar_cupon', { p_cupon: c.id, p_segmento: seg });
    toast(`Cupón enviado a ${num(r.destinatarios)} clientes.`);
  }, 'Enviar');
  $$('[data-push]').forEach((b) => b.onclick = () => enviar(data.find((x) => x.id === b.dataset.push)));

  const form = (c = {}) => dialog(`<h2 style="font-size:20px;font-weight:800">${c.id ? 'Editar cupón' : 'Crear cupón'}</h2>
    <div class="field"><label for="c-t">Título *</label><input class="input" id="c-t" value="${esc(c.titulo || '')}" placeholder="Ej.: 2x1 en helados"></div>
    <div class="field"><label for="c-d">Descripción / condiciones</label><input class="input" id="c-d" value="${esc(c.descripcion || '')}"></div>
    <div class="grid" style="grid-template-columns:1fr 1fr">
      <div class="field"><label for="c-ti">Tienda</label><select class="input" id="c-ti"><option value="">Todas</option>${tiendas.map((t) => `<option ${c.tienda === t.nombre ? 'selected' : ''}>${esc(t.nombre)}</option>`).join('')}</select></div>
      <div class="field"><label for="c-c">Código</label><input class="input" id="c-c" value="${esc(c.codigo || '')}"></div>
      <div class="field"><label for="c-v">Válido hasta</label><input class="input" id="c-v" type="date" value="${esc(c.valido_hasta || '')}"></div></div>
    <div class="field"><label for="c-f">Foto del cupón</label>
      <div class="row" style="gap:14px;align-items:center"><div id="c-prev" style="width:96px;height:96px;border-radius:16px;background:#FFE7A8;overflow:hidden;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--muted)">${c.foto_url ? `<img src="${esc(c.foto_url)}" alt="" style="width:100%;height:100%;object-fit:cover">` : 'Sin foto'}</div>
      <div class="stack" style="gap:6px;flex:1"><input class="input" id="c-f" type="file" accept="image/*" style="padding:10px;height:auto"><span class="small muted">JPG o PNG. Se ajusta sola al tamaño correcto.</span>${c.foto_url ? '<label class="check small"><input type="checkbox" id="c-del">Quitar la foto actual</label>' : ''}</div></div></div>
    ${c.id ? '' : '<label class="check"><input type="checkbox" id="c-msg" checked><span>Enviarlo ya por notificación push a todos los clientes</span></label>'}`, async (dl) => {
    const row = { titulo: $('#c-t', dl).value.trim(), descripcion: $('#c-d', dl).value.trim() || null, tienda: $('#c-ti', dl).value || null, codigo: $('#c-c', dl).value.trim().toUpperCase() || null, valido_hasta: $('#c-v', dl).value || null, foto_url: c.foto_url || null };
    if (!row.titulo) { toast('Escribe el título.', true); return false; }
    const del = $('#c-del', dl); if (del && del.checked) row.foto_url = null;
    const file = $('#c-f', dl).files[0];
    if (file) row.foto_url = await subirFotoPremio(file);
    const { data: g, error: e } = c.id ? await sb.from('cupones').update(row).eq('id', c.id).select().single() : await sb.from('cupones').insert(row).select().single();
    if (e) throw e;
    const m = $('#c-msg', dl);
    if (m && m.checked) { const r = await rpc('admin_enviar_cupon', { p_cupon: g.id, p_segmento: 'todos' }); toast(`Cupón publicado y enviado a ${num(r.destinatarios)} clientes.`); }
    else toast('Cupón guardado.');
    vCupones(box);
  });
  const abrir = (c) => { form(c); const f = document.getElementById('c-f'); if (f) f.onchange = () => { const pv = document.getElementById('c-prev'); if (pv && f.files[0]) pv.innerHTML = `<img src="${URL.createObjectURL(f.files[0])}" alt="" style="width:100%;height:100%;object-fit:cover">`; }; };
  $('#nuevo').onclick = () => abrir();
  $$('[data-ed]').forEach((b) => b.onclick = () => abrir(data.find((x) => x.id === b.dataset.ed)));
}

async function vMensajes(box) {
  let pre = {}; try { pre = JSON.parse(sessionStorage.getItem('ps_msg_pre') || '{}'); sessionStorage.removeItem('ps_msg_pre'); } catch {}
  const SEG = [['todos', 'Todos los clientes'], ['elegidos', 'Clientes que yo elija'], ['cerca', 'Recompra: les falta poco para un premio'], ['por_vencer', 'Puntos por vencer (30 días)'], ['casi_sellos', 'Les falta 1 sello o menos'], ['tienda', 'Compraron en una tienda'], ['inactivos', 'Sin compras en 60 días']];
  let seg = pre.seg || 'todos';
  const elegidos = new Map(); // id -> cliente
  box.innerHTML = `<h1 style="font-size:30px;font-weight:800">Mensajes</h1>
  <div class="cols">
    <form class="card stack" id="mf" novalidate>
      <h2 style="font-size:20px;font-weight:800">Enviar mensaje</h2>
      <div class="field solo-normal"><label for="m-t">Título *</label><input class="input" id="m-t" maxlength="60" value="${esc(pre.titulo || '')}"></div>
      <div class="field solo-normal"><label for="m-c">Mensaje *</label><textarea class="input" id="m-c" rows="3" maxlength="300">${esc(pre.cuerpo || '')}</textarea></div>
      <div class="stack" style="gap:8px"><span style="font-size:13px;font-weight:600">Enviar a</span><div class="row wrap" style="gap:8px" id="segs"></div>
      <select class="input hidden" id="m-ti" aria-label="Tienda">${tiendas.map((t) => `<option>${esc(t.nombre)}</option>`).join('')}</select>
      <div class="stack hidden" id="eleg" style="gap:8px;background:#FBF7EE;border:1px solid var(--line);border-radius:16px;padding:12px">
        <div class="row" style="gap:8px"><input class="input" id="e-q" placeholder="Busca por nombre, cédula o celular" autocomplete="off" style="flex:1"><button type="button" class="btn sm" id="e-b">Buscar</button></div>
        <div id="e-res" class="stack" style="gap:6px"></div>
        <div><span class="small" style="font-weight:700" id="e-n">Elegidos: 0</span><div class="row wrap" style="gap:6px;margin-top:6px" id="e-sel"></div></div>
      </div></div>
      <div class="hidden" id="cerca-box"></div>
      <div class="stack solo-normal" style="gap:6px"><span class="small muted">Vista previa</span>
        <div style="background:var(--navy);border-radius:18px;padding:12px;display:flex;gap:10px;color:#fff;max-width:380px"><img src="${LOGO}" alt="" style="width:36px;height:36px;border-radius:9px;object-fit:cover"><div class="stack" style="gap:2px;min-width:0"><span class="small" style="color:#CFE9F0;font-weight:700">PUNTOS SANTANA · ahora</span><b style="font-size:13px" id="pv-t"></b><span class="small" style="color:#E3EAF7" id="pv-c"></span></div></div></div>
      <button class="btn coral solo-normal" style="align-self:flex-start">Enviar ahora</button>
    </form>
    <section class="card stack" id="hist"><h2 style="font-size:20px;font-weight:800">Enviados</h2><div class="empty">Cargando…</div></section>
  </div>`;
  const drawSeg = () => { $('#segs').innerHTML = SEG.map(([k, l]) => `<button type="button" class="chip" data-seg="${k}" aria-pressed="${seg === k}">${l}</button>`).join(''); $('#m-ti').classList.toggle('hidden', seg !== 'tienda'); $('#eleg').classList.toggle('hidden', seg !== 'elegidos'); const ce = seg === 'cerca'; $('#cerca-box').classList.toggle('hidden', !ce); $$('.solo-normal').forEach((x) => x.classList.toggle('hidden', ce)); if (ce && !$('#cerca-box').dataset.ok) { $('#cerca-box').dataset.ok = 1; cercaPremio($('#cerca-box')); } $$('[data-seg]').forEach((b) => b.onclick = () => { seg = b.dataset.seg; drawSeg(); }); };
  const pv = () => { $('#pv-t').textContent = $('#m-t').value || 'Título del mensaje'; $('#pv-c').textContent = $('#m-c').value || 'Texto del mensaje'; };
  const drawSel = () => {
    $('#e-n').textContent = `Elegidos: ${elegidos.size}`;
    $('#e-sel').innerHTML = [...elegidos.values()].map((c) => `<span class="pill navy" style="padding:5px 6px 5px 12px;display:inline-flex;align-items:center;gap:6px">${esc(c.nombre)}<button type="button" data-quita="${c.id}" aria-label="Quitar ${esc(c.nombre)}" style="background:rgba(255,255,255,.2);border:0;color:#fff;border-radius:50%;width:20px;height:20px;cursor:pointer;line-height:1">×</button></span>`).join('') || '<span class="small muted">Busca un cliente y toca "Agregar".</span>';
    $$('[data-quita]').forEach((b) => b.onclick = () => { elegidos.delete(b.dataset.quita); drawSel(); buscarE(true); });
  };
  let ultRes = [];
  const buscarE = async (soloPintar) => {
    const q = $('#e-q').value.trim();
    if (!soloPintar) { if (!q) { $('#e-res').innerHTML = ''; ultRes = []; return; } try { ultRes = await rpc('admin_clientes', { p_busqueda: q, p_limite: 20 }); } catch (er) { return toast(errText(er), true); } }
    $('#e-res').innerHTML = ultRes.length ? ultRes.map((c) => `<div class="row between" style="gap:8px;background:#fff;border-radius:12px;padding:8px 10px"><div style="min-width:0"><b>${esc(c.nombre)}</b><div class="small muted">C.C. ${esc(num(c.cedula))}${c.activo ? '' : ' · sin activar (aún no tiene la app)'}</div></div>${!c.activo ? '<span class="small muted">No recibe</span>' : elegidos.has(c.id) ? '<span class="small" style="font-weight:700;color:var(--teal-d)">✓ Agregado</span>' : `<button type="button" class="btn ghost sm" data-agrega="${c.id}">Agregar</button>`}</div>`).join('') : (q ? '<span class="small muted">Sin resultados.</span>' : '');
    $$('[data-agrega]').forEach((b) => b.onclick = () => { const c = ultRes.find((x) => x.id === b.dataset.agrega); if (c) elegidos.set(c.id, c); drawSel(); buscarE(true); });
  };
  drawSeg(); pv(); $('#m-t').oninput = pv; $('#m-c').oninput = pv;
  $('#e-b').onclick = () => buscarE();
  $('#e-q').onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); buscarE(); } };
  drawSel();
  $('#mf').onsubmit = async (e) => {
    e.preventDefault();
    const t = $('#m-t').value.trim(), c = $('#m-c').value.trim();
    if (!t || !c) return toast('Escribe el título y el mensaje.', true);
    if (seg === 'elegidos' && !elegidos.size) return toast('Agrega al menos un cliente.', true);
    if (!confirm('¿Enviar este mensaje?')) return;
    const b = $('button[type=submit],button:not([type])', $('#mf')); b.disabled = true;
    try { const r = await rpc('admin_enviar_mensaje', { p_titulo: t, p_cuerpo: c, p_segmento: seg, p_tienda: seg === 'tienda' ? $('#m-ti').value : null, p_clientes: seg === 'elegidos' ? [...elegidos.keys()] : null }); toast(`Mensaje enviado a ${num(r.destinatarios)} clientes.`); vMensajes(box); }
    catch (er) { toast(errText(er), true); b.disabled = false; }
  };
  const { data, error } = await sb.from('mensajes').select('id,titulo,cuerpo,segmento,segmento_tienda,enviado_en,mensajes_destinatarios(count)').order('enviado_en', { ascending: false }).limit(50);
  const segName = { ...Object.fromEntries(SEG), cumpleanos: 'Cumpleaños del mes', cerca_premio: 'Recompra (cerca de un premio)', elegidos: 'Clientes elegidos' };
  $('#hist').innerHTML = '<h2 style="font-size:20px;font-weight:800">Enviados</h2>' + (error ? `<div class="empty">${errText(error)}</div>` : (data.map((m) => `<div style="border-top:1px solid var(--line);padding-top:10px" class="stack" ><div class="row between" style="gap:8px;align-items:flex-start"><b>${esc(m.titulo)}</b><span class="small muted" style="flex:0 0 auto">${fdate(m.enviado_en)}</span></div><span class="small muted">${esc(m.cuerpo)}</span><span class="small">${esc(segName[m.segmento] || m.segmento)}${m.segmento_tienda ? ': ' + esc(m.segmento_tienda) : ''} · ${num(m.mensajes_destinatarios?.[0]?.count || 0)} clientes</span></div>`).join('') || '<div class="empty">Aún no has enviado mensajes.</div>'));
}

async function vAjustes(box) {
  const { data } = await sb.from('config').select('*'); const c = Object.fromEntries((data || []).map((r) => [r.clave, r.valor]));
  box.innerHTML = `<h1 style="font-size:30px;font-weight:800">Ajustes del programa</h1>
  <form class="card stack" id="af" style="max-width:640px" novalidate>
    <div class="field"><label for="a-r">Regalo por completar los sellos</label><input class="input" id="a-r" value="${esc(c.regalo_sellos || '')}"></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
      <div class="field"><label for="a-p">Puntos por cada $1.000</label><input class="input" id="a-p" inputmode="numeric" value="${esc(c.puntos_por_mil)}"></div>
      <div class="field"><label for="a-s">Sellos para el regalo</label><input class="input" id="a-s" inputmode="numeric" value="${esc(c.sellos_meta)}"></div>
      <div class="field"><label for="a-v">Vigencia de puntos (meses)</label><input class="input" id="a-v" inputmode="numeric" value="${esc(c.vigencia_meses)}"></div>
      <div class="field"><label for="a-h">Costo de un helado de cumpleaños ($)</label><input class="input" id="a-h" inputmode="numeric" value="${c.costo_helado != null ? esc(c.costo_helado) : ''}" placeholder="Sin definir"></div></div>
    <p class="small muted" style="margin:0">Los cambios en puntos y vigencia aplican a compras nuevas; las anteriores conservan sus puntos y su fecha de vencimiento.</p>
    <button class="btn coral" style="align-self:flex-start">Guardar ajustes</button>
  </form>`;
  $('#af').onsubmit = async (e) => {
    e.preventDefault();
    const rows = [{ clave: 'regalo_sellos', valor: $('#a-r').value.trim() || '[REGALO POR DEFINIR]' }, { clave: 'puntos_por_mil', valor: Number(digits($('#a-p').value)) || 25 }, { clave: 'sellos_meta', valor: Number(digits($('#a-s').value)) || 8 }, { clave: 'vigencia_meses', valor: Number(digits($('#a-v').value)) || 12 }];
    rows.push({ clave: 'costo_helado', valor: digits($('#a-h').value) ? Number(digits($('#a-h').value)) : null });
    const { error } = await sb.from('config').upsert(rows);
    if (error) return toast(errText(error), true);
    config = Object.fromEntries(rows.map((r) => [r.clave, r.valor])); toast('Ajustes guardados.');
  };
  box.insertAdjacentHTML('beforeend', `<div class="card stack" style="max-width:640px;margin-top:18px">
    <div class="row between wrap" style="gap:10px"><div><b>Copias de seguridad</b><div class="small muted">Se hacen solas cada domingo a las 3:00 a.m. y se guardan 12 semanas. Cada archivo abre en Excel.</div></div>
    <button class="btn ghost sm" id="bk-ya">Hacer copia ahora</button></div><div id="bk-lista" class="small muted">Cargando…</div></div>`);
  const cargarCopias = async () => {
    const st = sb.storage.from('respaldos');
    const { data: fechas, error } = await st.list('', { limit: 100, sortBy: { column: 'name', order: 'desc' } });
    if (error) { $('#bk-lista').textContent = errText(error); return; }
    const dias = (fechas || []).filter((f) => /^\d{4}-\d{2}-\d{2}$/.test(f.name));
    if (!dias.length) { $('#bk-lista').textContent = 'Todavía no hay copias.'; return; }
    $('#bk-lista').innerHTML = dias.map((d, i) => `<details ${i ? '' : 'open'} style="margin:6px 0"><summary><b>${esc(d.name)}</b></summary><div class="row wrap" data-dia="${esc(d.name)}" style="gap:6px;margin-top:6px">Cargando…</div></details>`).join('');
    for (const el of $('#bk-lista').querySelectorAll('[data-dia]')) {
      const dia = el.dataset.dia; const { data: fs } = await st.list(dia, { limit: 50 });
      el.innerHTML = (fs || []).map((f) => `<button class="btn ghost sm" data-f="${esc(dia + '/' + f.name)}">${esc(f.name.replace('.csv', ''))}</button>`).join('');
    }
    $('#bk-lista').onclick = async (e) => {
      const b = e.target.closest('[data-f]'); if (!b) return;
      const { data, error: er } = await st.createSignedUrl(b.dataset.f, 120, { download: b.dataset.f.replace('/', '_') });
      if (er) return toast(errText(er), true);
      location.href = data.signedUrl;
    };
  };
  $('#bk-ya').onclick = async () => {
    $('#bk-ya').disabled = true;
    const { error } = await sb.rpc('admin_respaldo_ahora');
    if (error) { $('#bk-ya').disabled = false; return toast(errText(error), true); }
    toast('Copia en proceso; aparece en unos segundos.');
    setTimeout(() => { $('#bk-ya').disabled = false; cargarCopias(); }, 8000);
  };
  cargarCopias();

  // Contraseñas del personal
  const { data: equipo } = await sb.from('perfiles').select('user_id,nombre,rol').order('rol');
  box.insertAdjacentHTML('beforeend', `<div class="card stack" style="max-width:640px;margin-top:18px">
    <div><b>Contraseñas del personal</b><div class="small muted">Mínimo 8 caracteres. Mezcla letras y números; no uses cédulas ni fechas.</div></div>
    ${(equipo || []).map((u) => `<form class="stack" data-u="${esc(u.user_id)}" novalidate style="border-top:1px solid #eee;padding-top:12px;gap:8px">
      <b>${esc(u.nombre)}</b>
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">
        <input class="input" type="password" autocomplete="new-password" placeholder="Contraseña nueva" name="c1">
        <input class="input" type="password" autocomplete="new-password" placeholder="Repítela" name="c2"></div>
      <label class="small row" style="gap:6px"><input type="checkbox" name="ver"> Mostrar</label>
      <button class="btn coral sm" style="align-self:flex-start">Cambiar contraseña</button></form>`).join('')}</div>`);
  box.querySelectorAll('form[data-u]').forEach((f) => {
    f.ver.onchange = () => { f.c1.type = f.c2.type = f.ver.checked ? 'text' : 'password'; };
    f.onsubmit = async (e) => {
      e.preventDefault();
      const c = f.c1.value;
      if (c.length < 8) return toast('La contraseña debe tener mínimo 8 caracteres.', true);
      if (c !== f.c2.value) return toast('Las dos contraseñas no coinciden.', true);
      const btn = f.querySelector('button'); btn.disabled = true;
      const { data, error } = await sb.functions.invoke('cambiar-clave', { body: { usuario_id: f.dataset.u, clave: c } });
      btn.disabled = false;
      let msg = data && data.error;
      if (error) { try { msg = (await error.context.json()).error; } catch { msg = 'No se pudo cambiar. Intenta de nuevo.'; } }
      if (msg) return toast(msg === 'NO_AUTORIZADO' ? 'Solo el administrador puede cambiar contraseñas.' : msg, true);
      f.reset(); f.c1.type = f.c2.type = 'password';
      toast('Contraseña cambiada.');
    };
  });
}


/* ---- Comprobante de redención para imprimir ---- */
function reciboHTML(r) {
  const f = new Date(r.fecha);
  const fila = (a, b) => `<div class="rc-row"><span>${a}</span><b style="text-align:right">${b}</b></div>`;
  return `<div class="recibo">
    <div class="rc-c"><img src="santana-logo.jpg" alt="" style="width:52px;height:52px;border-radius:50%"><div class="rc-big">PUNTOS SANTANA</div><div>Santana del Río Mall Comercial</div></div>
    <div class="rc-l"></div>
    <div class="rc-c rc-big">COMPROBANTE DE REDENCIÓN</div>
    <div class="rc-c">N° ${esc(r.comprobante)}${r.reimpresion ? ' · COPIA' : ''}</div>
    <div class="rc-l"></div>
    ${fila('Fecha', f.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }))}
    ${fila('Hora', f.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }))}
    ${fila('Entregado en', esc(r.punto))}
    <div class="rc-l"></div>
    <div>Cliente:</div><div><b style="overflow-wrap:anywhere">${esc(r.cliente)}</b></div>
    ${fila('Cédula', esc(num(r.cedula)))}
    <div class="rc-l"></div>
    <div><b>Premio:</b> ${esc(r.premio)}</div>
    ${fila('Puntos redimidos', '−' + num(r.puntos))}
    ${fila(r.reimpresion ? 'Saldo actual' : 'Saldo restante', num(r.saldo) + ' pts')}
    <div class="rc-l"></div>
    <div style="margin-top:26px;border-top:1px solid #000;padding-top:3px" class="rc-c">Firma del cliente</div>
    <div style="margin-top:22px;border-top:1px solid #000;padding-top:3px" class="rc-c">Entregó: ${esc(r.entregado_por || '')}</div>
    <div class="rc-c" style="margin-top:10px">¡Gracias por ser parte de Puntos Santana!</div>
  </div>`;
}
function imprimirRecibo(r) {
  let el = document.getElementById('recibo');
  if (!el) { el = document.createElement('div'); el.id = 'recibo'; document.body.appendChild(el); }
  el.innerHTML = reciboHTML(r);
  document.body.classList.add('imprimiendo-recibo');
  const fin = () => { document.body.classList.remove('imprimiendo-recibo'); window.removeEventListener('afterprint', fin); };
  window.addEventListener('afterprint', fin);
  const img = el.querySelector('img');
  const go = () => { window.print(); setTimeout(fin, 1500); };
  if (img && !img.complete) { img.onload = go; img.onerror = go; } else go();
}
function mostrarComprobante(r) {
  dialog(`<h2 style="font-size:20px;font-weight:800">Premio entregado</h2>
    <div style="border:1px solid #E8E1D2;border-radius:14px;padding:14px;background:#fff;max-height:52vh;overflow:auto">${reciboHTML(r)}</div>`,
    async () => { imprimirRecibo(r); return false; }, 'Imprimir comprobante');
  const dls = document.querySelectorAll('dialog'); const x = dls[dls.length - 1] && dls[dls.length - 1].querySelector('[data-x]'); if (x) x.textContent = 'Cerrar';
}

/* ---- Helado de cumpleaños (Restaurante / Punto Dulce) ---- */
function vHelado(box) {
  box.innerHTML = `<h1 style="font-size:28px;font-weight:800">Helado de cumpleaños</h1>
  <p class="muted" style="margin:0">Helado de 2 bolas para clientes inscritos en su mes de cumpleaños, una vez al año. Pide la factura de su compra con descuento de cumpleaños.</p>
  <form id="hf" class="row" novalidate style="gap:10px;margin-top:14px;max-width:620px"><input class="input" id="h-ced" inputmode="numeric" placeholder="Cédula del cliente" style="flex:1"><button class="btn navy">Buscar</button></form>
  <div id="h-res" style="margin-top:14px;max-width:620px"></div>`;
  $('#hf').onsubmit = async (e) => {
    e.preventDefault();
    const ced = digits($('#h-ced').value); if (!ced) return toast('Escribe la cédula.', true);
    let d; try { d = await rpc('helado_estado', { p_cedula: ced }); } catch (er) { $('#h-res').innerHTML = `<div class="card empty">${errText(er)}</div>`; return; }
    const cab = `<div class="stack" style="gap:2px"><b style="font-size:18px">${esc(d.nombre)}</b><span class="small">C.C. ${esc(num(d.cedula))}${d.fecha_nacimiento ? ' · Cumple el ' + fdate(d.fecha_nacimiento).replace(/ \d{4}$/, '') : ''}</span></div>`;
    const no = (t) => `<div class="card stack" style="gap:10px;border-color:var(--coral);background:#FFF5F3">${cab}<b style="color:var(--coral-t)">✕ ${t}</b></div>`;
    if (!d.activo) return $('#h-res').innerHTML = no('No tiene la cuenta activa en Puntos Santana. Actívala o inscríbelo primero.');
    if (!d.fecha_nacimiento) return $('#h-res').innerHTML = no('No tiene fecha de nacimiento registrada.');
    if (!d.cumple_mes) return $('#h-res').innerHTML = no('Este no es su mes de cumpleaños.');
    if (d.reclamado_en) return $('#h-res').innerHTML = no(`Ya recibió su helado este año (${fdate(d.reclamado_en)}, factura ${esc(d.reclamado_factura)}).`);
    $('#h-res').innerHTML = `<form class="card stack" id="hf2" novalidate style="gap:12px;border-color:#1B6B3A">${cab}
      <b style="color:#1B6B3A">✓ Puede recibir su helado de 2 bolas</b>
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px">
        <div class="field"><label for="h-f">N° de factura *</label><input class="input" id="h-f"></div>
        <div class="field"><label for="h-t">Tienda de la compra *</label><select class="input" id="h-t"><option value="">Elige…</option>${tiendas.map((t) => `<option value="${t.id}">${esc(t.nombre)}</option>`).join('')}</select></div>
        <div class="field"><label for="h-v">Valor de la compra *</label><input class="input" id="h-v" inputmode="numeric"></div></div>
      <button class="btn coral" style="height:54px">Entregar helado</button></form>`;
    $('#h-v').oninput = (ev) => { const n = digits(ev.target.value); ev.target.value = n ? num(+n) : ''; };
    $('#hf2').onsubmit = async (ev) => {
      ev.preventDefault();
      const f = $('#h-f').value.trim(), t = +$('#h-t').value, v = +digits($('#h-v').value);
      if (!f || !t || !v) return toast('Completa factura, tienda y valor.', true);
      const b = $('button', $('#hf2')); b.disabled = true;
      try { const r = await rpc('entregar_helado', { p_cedula: d.cedula, p_factura: f, p_tienda_id: t, p_valor: v });
        $('#h-res').innerHTML = `<div class="card okcard">${ic('check', 30, 2.6)}<div><b style="font-size:18px">Helado entregado</b><div class="small">${esc(r.nombre)} · factura ${esc(f.toUpperCase())}</div></div></div>`; $('#h-ced').value = ''; $('#h-ced').focus();
      } catch (er) { toast(errText(er), true); b.disabled = false; }
    };
  };
  $('#h-ced').focus();
}

let heladoMes = null;
async function vHelados(box) {
  const hoy = new Date(); heladoMes = heladoMes || { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
  const st = heladoMes;
  box.innerHTML = `<div class="row between wrap" style="gap:10px"><h1 style="font-size:30px;font-weight:800">Helados de cumpleaños</h1>
    <div class="row" style="gap:8px"><button class="btn ghost sm" id="hm-a">‹</button><b id="hm-t" style="min-width:150px;text-align:center"></b><button class="btn ghost sm" id="hm-s">›</button><button class="btn ghost sm" id="hm-x">Descargar Excel</button></div></div>
    <div id="hm" class="stack" style="margin-top:12px"><div class="empty">Cargando…</div></div>`;
  $('#hm-t').textContent = `${MESES_L[st.mes - 1]} ${st.anio}`;
  const mover = (k) => { let m = st.mes + k, a = st.anio; if (m < 1) { m = 12; a--; } if (m > 12) { m = 1; a++; } heladoMes = { anio: a, mes: m }; vHelados(box); };
  $('#hm-a').onclick = () => mover(-1); $('#hm-s').onclick = () => mover(1);
  let d; try { d = await rpc('admin_informe_helados', { p_anio: st.anio, p_mes: st.mes }); } catch (e) { $('#hm').innerHTML = `<div class="empty">${errText(e)}</div>`; return; }
  const dif = d.entregados - d.mes_anterior;
  const kpi = (t, v, sub = '') => `<div class="card stack" style="gap:4px"><span class="small muted">${t}</span><b style="font-size:28px">${v}</b>${sub ? `<span class="small">${sub}</span>` : ''}</div>`;
  $('#hm').innerHTML = `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px">
      ${kpi('Helados entregados', num(d.entregados), `${dif === 0 ? 'Igual que' : dif > 0 ? '+' + num(dif) + ' vs' : num(dif) + ' vs'} el mes anterior (${num(d.mes_anterior)})`)}
      ${kpi('Cumpleañeros inscritos', num(d.cumpleaneros), d.cumpleaneros ? `Reclamaron ${Math.round(d.entregados / d.cumpleaneros * 100)}%` : '')}
      ${kpi('Ventas con descuento de cumpleaños', money(d.ventas), d.entregados ? `Promedio ${money(Math.round(d.ventas / d.entregados))} por factura` : '')}
      ${kpi('Inversión en helados', d.costo_helado != null ? money(d.costo_helado * d.entregados) : '—', d.costo_helado != null ? `${money(d.costo_helado)} por helado` : 'Define el costo en Ajustes')}</div>
    <section class="card"><h2 style="font-size:18px;font-weight:800;margin-bottom:8px">Por tienda donde compraron</h2>
      ${d.por_tienda.length ? `<div class="tbl-wrap"><table><thead><tr><th>Tienda</th><th>Helados</th><th>Ventas</th></tr></thead><tbody>${d.por_tienda.map((t) => `<tr><td>${esc(t.tienda || '—')}</td><td>${num(t.helados)}</td><td>${money(t.ventas)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Sin entregas este mes.</div>'}</section>
    <section class="card"><h2 style="font-size:18px;font-weight:800;margin-bottom:8px">Detalle</h2>
      ${d.lista.length ? `<div class="tbl-wrap"><table><thead><tr><th>Fecha</th><th>Cliente</th><th>Cédula</th><th>Factura</th><th>Tienda</th><th>Valor</th><th>Entregó</th></tr></thead><tbody>${d.lista.map((x) => `<tr><td>${fdate(x.fecha)}</td><td>${esc(x.cliente)}</td><td>${esc(num(x.cedula))}</td><td>${esc(x.factura)}</td><td>${esc(x.tienda || '—')}</td><td>${money(x.valor)}</td><td>${esc(x.entregado_por)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Sin entregas este mes.</div>'}</section>`;
  $('#hm-x').onclick = () => csv([['Fecha', 'Cliente', 'Cédula', 'Factura', 'Tienda de la compra', 'Valor compra', 'Entregó'], ...d.lista.map((x) => [(x.fecha || '').slice(0, 16).replace('T', ' '), x.cliente, x.cedula, x.factura, x.tienda, x.valor, x.entregado_por])], `helados-cumpleanos-${st.anio}-${String(st.mes).padStart(2, '0')}.csv`);
}

/* ---- Alertas de facturas repetidas (solo administrador) ---- */
async function contarAlertas() {
  try {
    const { count } = await sb.from('alertas').select('id', { count: 'exact', head: true }).eq('revisada', false);
    const b = document.getElementById('al-badge'); if (!b) return;
    if (count) { b.textContent = count; b.style.display = 'inline-block'; } else b.style.display = 'none';
    const c = document.getElementById('content');
    if (count && c && !location.hash.includes('alertas') && !document.getElementById('al-banner')) c.insertAdjacentHTML('afterbegin', `<a id="al-banner" href="#/personal/alertas" class="card row between wrap" style="border-color:var(--coral);background:#FFF5F3;text-decoration:none;color:inherit;margin-bottom:14px;gap:10px"><b style="color:var(--coral-t)">⚠ ${count === 1 ? 'Hay 1 factura para revisar' : 'Hay ' + count + ' facturas para revisar'}</b><span class="btn coral sm">Revisar</span></a>`);
  } catch {}
}
async function activarAlertasPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'no-soportado';
  if (esIOS() && !esStandalone()) return 'instalar-primero';
  const perm = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
  if (perm !== 'granted') return perm;
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64aUint8(CFG.vapidPublic) });
  await rpc('admin_guardar_push', { p_suscripcion: sub.toJSON() });
  return 'ok';
}
async function vAlertas(box) {
  box.innerHTML = `<div class="row between wrap"><h1 style="font-size:30px;font-weight:800">Alertas</h1><button class="btn ghost sm" id="al-push">Recibir alertas en este dispositivo</button></div>
  <p class="muted" style="margin:0">Cuando alguien intenta registrar una factura que ya estaba registrada (mismo número en la misma tienda, o mismo número, valor y cliente), la app no suma puntos y te avisa aquí. Solo el administrador ve estas alertas.</p>
  <div id="al-list" class="stack" style="margin-top:14px"><div class="empty">Cargando…</div></div>`;
  $('#al-push').onclick = async () => {
    const b = $('#al-push'); b.disabled = true;
    try {
      const r = await activarAlertasPush();
      if (r === 'ok') { toast('Listo: las alertas te llegarán a este dispositivo.'); b.textContent = 'Alertas activadas en este dispositivo'; return; }
      toast(r === 'instalar-primero' ? 'En iPhone primero instala la app en la pantalla de inicio y ábrela desde el ícono.' : r === 'denied' ? 'Las notificaciones están bloqueadas en este navegador.' : 'Este navegador no permite notificaciones.', true);
    } catch (e) { toast(errText(e), true); }
    b.disabled = false;
  };
  let list; try { list = await rpc('admin_alertas'); } catch (e) { $('#al-list').innerHTML = `<div class="empty">${errText(e)}</div>`; return; }
  const hora = (d) => new Date(d).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
  $('#al-list').innerHTML = list.map((a) => `<div class="card stack" style="gap:10px;${a.revisada ? 'opacity:.6' : 'border-color:var(--coral);background:#FFF5F3'}">
    <div class="row between wrap" style="gap:8px"><b style="font-size:17px">${a.tipo === 'helado_repetido' ? (a.revisada ? 'Revisada: helado repetido' : 'Helado de cumpleaños repetido') : (a.revisada ? 'Revisada' : 'Revisar factura') + ' ' + esc(a.factura)}</b>
      <span class="pill ${a.revisada ? '' : 'sun'}">${fdate(a.creada_en)} · ${hora(a.creada_en)}</span></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px">
      <div class="stack" style="gap:2px"><span class="small muted">Cliente</span><b>${esc(a.cliente)}</b><span class="small">C.C. ${esc(num(a.cedula))}</span></div>
      <div class="stack" style="gap:2px"><span class="small muted">Intento repetido</span><b>${money(a.valor)} en ${esc(a.tienda || '—')}</b><span class="small">Por: ${esc(a.intento_por)}</span></div>
      <div class="stack" style="gap:2px"><span class="small muted">Registro original</span><b>${money(a.original_valor)} en ${esc(a.original_tienda || '—')}</b><span class="small">${a.original_fecha ? fdate(a.original_fecha) + ' · ' + hora(a.original_fecha) : '—'} · Por: ${esc(a.original_por)}${a.tipo === 'helado_repetido' ? ' · Factura ' + esc(a.original_factura || '—') : ' · +' + num(a.original_puntos) + ' pts'}</span></div>
    </div>
    ${a.revisada ? '' : `<button class="btn coral sm" style="align-self:flex-start" data-rev="${a.id}">Marcar como revisada</button>`}
  </div>`).join('') || '<div class="card empty">No hay alertas. Todo en orden.</div>';
  $$('[data-rev]').forEach((b) => b.onclick = async () => { b.disabled = true; try { await rpc('admin_revisar_alerta', { p_alerta: b.dataset.rev }); toast('Alerta marcada como revisada.'); contarAlertas(); vAlertas(box); } catch (e) { toast(errText(e), true); b.disabled = false; } });
}

/* ---------- notificaciones push ---------- */
const soportaPush = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
function b64aUint8(b64) { const p = '='.repeat((4 - b64.length % 4) % 4); const r = atob((b64 + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); }
async function activarPush(silencioso) {
  if (!tok()) return 'no-soportado';
  const diag = (res) => { try { clientCall('cliente_diag_push', { p_navegador: navigator.userAgent, p_permiso: ('Notification' in window) ? Notification.permission : 'sin-api', p_resultado: res }).catch(() => {}); } catch {} };
  if (!soportaPush()) { diag('no-soportado'); return 'no-soportado'; }
  if (esIOS() && !esStandalone()) return 'instalar-primero';
  try {
    let perm = Notification.permission;
    if (perm === 'default' && !silencioso) perm = await Notification.requestPermission();
    if (perm !== 'granted') { if (!silencioso) diag('permiso:' + perm); return perm; }
    const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((_, no) => setTimeout(() => no(new Error('service worker no listo')), 10000))]);
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64aUint8(CFG.vapidPublic) });
    await rpc('cliente_guardar_push', { p_token: tok(), p_suscripcion: sub.toJSON() });
    diag('ok');
    return 'ok';
  } catch (e) { diag('error: ' + (e && (e.name + ' ' + e.message))); return 'error'; }
}
// En la pantalla de ingreso (app ya instalada): pedir el permiso de notificaciones antes de entrar
function tarjetaNotifLogin() {
  if (!soportaPush() || !esStandalone() || Notification.permission !== 'default') return '';
  return `<div class="card stack" id="notif-card" style="gap:8px;border-color:var(--yellow);background:#FFFBEA;padding:14px;position:relative;z-index:1">
    <b>Antes de entrar: activa las notificaciones</b><span class="small muted">Así te llegan tus promociones, cupones y avisos de puntos.</span>
    <button type="button" class="btn coral" id="notif-login">🔔 Activar notificaciones</button></div>`;
}
function mostrarQRCliente() {
  setTimeout(() => {
    dialog(`<h2 style="font-size:20px;font-weight:800;margin:0">Ahora: que el cliente escanee este QR</h2>
      <div class="center"><img src="qr-app.png" alt="QR para descargar la app Puntos Santana" style="width:240px;height:240px;border-radius:12px;border:1px solid var(--line)"></div>
      <ol style="margin:0;padding-left:20px;display:grid;gap:6px;font-size:14px">
        <li>Que escanee el QR con la <b>cámara</b> de su celular.</li>
        <li>Que instale la app: <b>Instalar la app en mi celular</b> (Android) o <b>Compartir → Agregar a inicio</b> (iPhone).</li>
        <li>Que la abra <b>desde el ícono</b>, toque <b>Activar notificaciones</b> y luego <b>Permitir</b>.</li>
        <li>Ahora sí: que entre con su <b>cédula y PIN</b>.</li>
      </ol>`, async () => {}, 'Listo');
    const d = document.querySelector('dialog:last-of-type [data-x]'); if (d) d.remove();
  }, 300);
}
function tarjetaPush(activo) {
  if (!soportaPush() && !esIOS()) return '';
  if (activo) return '';
  const iosSinInstalar = esIOS() && !esStandalone();
  const negado = soportaPush() && Notification.permission === 'denied';
  return `<div class="card row between wrap" id="push-card" style="gap:10px;border-color:var(--yellow);background:#FFFBEA">
    <div style="flex:1;min-width:200px"><b>${negado ? 'Notificaciones bloqueadas' : 'Activa las notificaciones'}</b><div class="small muted">${iosSinInstalar ? 'En iPhone primero instala la app en tu pantalla de inicio y ábrela desde el ícono.' : negado ? 'Las bloqueaste en este celular. Actívalas en los ajustes del navegador para este sitio.' : 'Entérate de tus promociones, cupones y puntos por vencer.'}</div></div>
    ${iosSinInstalar || negado ? '' : '<button class="btn coral sm" id="push-on">Activar</button>'}</div>`;
}

/* ---------- instalar la app en el celular ---------- */
let promptInstalar = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); promptInstalar = e; document.querySelectorAll('.btn-instalar').forEach((x) => x.classList.remove('hidden')); });
window.addEventListener('appinstalled', () => { promptInstalar = null; document.querySelectorAll('.btn-instalar').forEach((x) => x.classList.add('hidden')); toast('¡Listo! Puntos Santana quedó en tu pantalla de inicio.'); });
const esStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function botonInstalar() {
  if (esStandalone()) return '';
  const visible = promptInstalar || esIOS();
  return `<button type="button" class="btn teal block btn-instalar ${visible ? '' : 'hidden'}" style="position:relative;z-index:1">${ic('plus', 20)} Instalar la app en mi celular</button>`;
}
document.addEventListener('click', async (e) => {
  const b = e.target.closest('.btn-instalar'); if (!b) return;
  if (promptInstalar) { promptInstalar.prompt(); try { await promptInstalar.userChoice; } catch {} promptInstalar = null; return; }
  dialog(`<h2 style="font-size:20px;font-weight:800">Instalar en iPhone</h2>
    <ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:10px;font-size:15px">
      <li>Abre esta página en <b>Safari</b>.</li>
      <li>Toca el botón <b>Compartir</b> (el cuadro con la flecha hacia arriba), abajo en la pantalla.</li>
      <li>Elige <b>“Agregar a pantalla de inicio”</b> y toca <b>Agregar</b>.</li>
    </ol>
    <p class="small muted" style="margin:0">Verás el ícono de Puntos Santana junto a tus otras apps.</p>`, async () => {}, 'Entendido');
});

/* ---------- arranque ---------- */
// Actualización automática: busca versión nueva cada 5 minutos y recarga cuando no hay nada abierto
if ('serviceWorker' in navigator) {
  const habiaControl = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').then((reg) => { setInterval(() => reg.update().catch(() => {}), 5 * 60 * 1000); }).catch(() => {});
  let recargando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!habiaControl || recargando) return;
    const intentar = () => {
      if (document.querySelector('dialog[open]') || (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && document.activeElement.value)) return setTimeout(intentar, 20000);
      recargando = true; location.reload();
    };
    intentar();
  });
}
route();
})();

// Si la cajera deja un cliente en pantalla 3 minutos sin tocar nada, se borra (privacidad en caja)
(() => {
  let ultimo = Date.now();
  ['click', 'keydown', 'input', 'touchstart'].forEach((ev) => document.addEventListener(ev, () => { ultimo = Date.now(); }, { passive: true, capture: true }));
  setInterval(() => {
    if (!ficha || !location.hash.startsWith('#/personal') || document.querySelector('dialog[open]')) return;
    if (Date.now() - ultimo > 3 * 60 * 1000) { ficha = null; ultimo = Date.now(); route(); }
  }, 20000);
})();
