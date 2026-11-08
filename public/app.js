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
  NO_ES_RECAUDADOR: 'Solo Pilatos o Derek pueden entregar premios.',
  SOLO_ACUMULACIONES: 'Solo se pueden editar compras.',
  FACTURA_REQUERIDA: 'Escribe el número de la factura.',
  FACTURA_USADA: 'Esa factura ya se usó para un sello.',
  FECHA_REQUERIDA: 'Escribe la fecha de la factura.',
  FECHA_FUTURA: 'La fecha de la factura no puede ser futura.',
  FACTURA_VENCIDA: 'Esa factura tiene más de un año: sus puntos ya estarían vencidos.',
  NOMBRE_NO_COINCIDE: 'La factura no está a nombre de este cliente. Solo el titular puede acumular sus facturas.',
  FACTURA_YA_ACUMULADA: 'Esa factura ya fue registrada en esa tienda.',
  SELLO_HOY: 'Este cliente ya recibió su sello hoy (máximo 1 por día).',
  TARJETA_LLENA: 'La tarjeta ya está completa: entrega el regalo primero.',
  SIN_ACTIVAR: 'Tu cuenta aún no está activa. Acércate a Pilatos o Derek con tu cédula para activarla y crear tu PIN.',
  YA_ACTIVO: 'Este cliente ya tiene su cuenta activa.',
  CELULAR_INVALIDO: 'Escribe un celular válido.',
  NACIMIENTO_INVALIDO: 'Revisa la fecha de nacimiento.'
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

/* ---------- router ---------- */
function route() {
  const h = location.hash.replace(/^#/, '') || '/';
  if (h.startsWith('/personal')) return staffRoute(h.split('/')[2] || '');
  return clientRoute(h.split('/')[1] || '');
}
window.addEventListener('hashchange', route);

/* =====================================================
   CLIENTE
   ===================================================== */
const TK = 'ps_cliente_token';
const tok = () => { try { return localStorage.getItem(TK); } catch { return null; } };
const setTok = (v) => { try { v ? localStorage.setItem(TK, v) : localStorage.removeItem(TK); } catch {} };
let cInicio = null;

async function clientCall(fn, extra) {
  try { return await rpc(fn, { p_token: tok(), ...(extra || {}) }); }
  catch (e) {
    if (String(e.message).includes('SESION_INVALIDA')) { setTok(null); cInicio = null; location.hash = '#/'; toast(ERR.SESION_INVALIDA, true); route(); throw e; }
    throw e;
  }
}

function clientRoute(tab) {
  document.title = 'Puntos Santana';
  if (!tok()) return clientLogin();
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
      <div style="flex:1;min-height:120px"></div><p class="center small" style="margin:0;color:#fff">¿Aún no estás inscrito u olvidaste tu PIN? Acércate a Pilatos o Derek con tu cédula.</p>
    </form>
  </div>`;
  $('#ced').focus();
  $('#f').onsubmit = async (e) => {
    e.preventDefault();
    const b = $('button', $('#f')); b.disabled = true; $('#err').textContent = '';
    try {
      const r = await rpc('cliente_ingresar', { p_cedula: digits($('#ced').value), p_pin: $('#pin').value });
      setTok(r.token); route();
    } catch (er) { $('#err').textContent = errText(er); b.disabled = false; }
  };
}

async function loadInicio() { cInicio = await clientCall('cliente_inicio'); return cInicio; }

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
  if (llena) pie = quien === 'cliente' ? `<div class="sc-done">¡Tarjeta completa! Reclama tu regalo en caja: <b>${esc(d.regalo_sellos)}</b></div>` : `<div class="sc-done">Tarjeta completa. Entrega el regalo: <b>${esc(d.regalo_sellos)}</b></div>`;
  else pie = `<div class="sc-foot">${faltan === 1 ? 'Te falta <b>1 sello</b>' : `Te faltan <b>${faltan} sellos</b>`} para tu regalo: ${esc(d.regalo_sellos)}</div>`;
  if (quien !== 'cliente' && !llena) pie = pie.replace('Te falta', 'Le falta').replace('Te faltan', 'Le faltan').replace('tu regalo', 'el regalo');
  return `<section class="stampcard" aria-label="Tarjeta de sellos">
    <header><img src="${LOGO}" alt=""><div><b>Tarjeta de sellos</b><span>Restaurante · Santana del Río</span></div><em>${n}/${meta}</em></header>
    <div class="slots">${slots}</div>
    ${pie}
    <div class="sc-rules">Presenta tu factura en caja para recibir tu sello · Máximo 1 sello por día${d.regalos_recibidos ? ` · Regalos recibidos: ${d.regalos_recibidos}` : ''}</div>
  </section>`;
}

async function clientInicio() {
  app.innerHTML = `<div class="phone"><div class="phone-body"><div class="empty">Cargando…</div></div>${tabbar('inicio')}</div>`;
  let d; try { d = await loadInicio(); } catch (e) { if (tok()) toast(errText(e), true); return; }
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
      <span class="small">Reclámalo en <b>Pilatos</b> o <b>Derek</b> con tu cédula y tu PIN.</span>
      <button class="btn ghost sm" data-cancel="${s.id}" style="align-self:flex-start">Cancelar solicitud</button>
    </div>`).join('');
  app.innerHTML = `
  <div class="phone"><div class="phone-body">
    <div class="row between">
      <div><span class="muted" style="font-size:13px">¡Hola!</span><h1 style="font-size:22px;font-weight:800">${esc(d.nombre)}</h1></div>
      <button class="btn ghost sm" id="salir" aria-label="Cerrar sesión">${ic('logout', 18)}Salir</button>
    </div>
    <section class="balance" aria-label="Tus puntos">${SUN}
      <span class="lbl">Tus puntos disponibles</span>
      <span class="num">${num(d.puntos)}</span>
      <span class="lbl" style="font-size:12px">Ganas 25 puntos por cada $1.000 de compra</span>
      ${pv && pv.puntos ? `<div class="warn">${ic('clock', 20).replace('currentColor', '#FFD23F')}<span>${num(pv.puntos)} pts vencen el <b>${fdate(pv.fecha)}</b></span></div>` : ''}
    </section>
    ${stampCard(d, 'cliente')}
    ${pend ? `<section class="stack" style="gap:10px"><h2 style="font-size:16px;font-weight:800">Premios por reclamar</h2>${pend}</section>` : ''}
    <section class="stack" style="gap:10px"><h2 style="font-size:16px;font-weight:800">Últimos movimientos</h2>${mov}</section>
  </div>${tabbar('inicio')}</div>`;
  $('#salir').onclick = async () => { try { await rpc('cliente_salir', { p_token: tok() }); } catch {} setTok(null); cInicio = null; route(); };
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
          : ok ? `<button class="btn coral sm" data-quiero="${p.id}" data-nombre="${esc(p.nombre)}" style="align-self:flex-start">Lo quiero</button>`
          : `<div class="bar"><div style="width:${pct}%"></div></div><span class="small muted">Te faltan ${num(p.puntos - Math.max(0, disp))} pts</span>`}
      </div></div>`;
  }).join('') || '<div class="empty">Pronto publicaremos los premios.</div>';
  app.innerHTML = `
  <div class="phone"><div class="phone-body">
    <div class="row between"><h1 style="font-size:24px;font-weight:800">Premios</h1><span class="pill navy" style="font-size:13px;padding:6px 14px">${num(d.puntos)} pts</span></div>
    ${reservado ? `<p class="small muted" style="margin:0">Tienes ${num(reservado)} pts apartados en premios por reclamar.</p>` : ''}
    ${items}
    <p class="small muted center" style="margin:0">Elige tu premio aquí y reclámalo en Pilatos o Derek con tu cédula y PIN.</p>
  </div>${tabbar('premios')}</div>`;
  $$('[data-quiero]').forEach((b) => b.onclick = async () => {
    if (!confirm(`¿Quieres redimir "${b.dataset.nombre}"? Lo reclamas en Pilatos o Derek.`)) return;
    b.disabled = true;
    try { await clientCall('cliente_solicitar', { p_premio: b.dataset.quiero }); toast('¡Listo! Reclámalo en Pilatos o Derek.'); location.hash = '#/'; }
    catch (e) { toast(errText(e), true); b.disabled = false; }
  });
}

async function clientCupones() {
  app.innerHTML = `<div class="phone"><div class="phone-body"><div class="empty">Cargando…</div></div>${tabbar('cupones')}</div>`;
  let list; try { list = await clientCall('cliente_cupones'); } catch (e) { if (tok()) toast(errText(e), true); return; }
  const colors = ['var(--coral)', 'var(--teal)', 'var(--sun)', 'var(--navy)'];
  app.innerHTML = `
  <div class="phone"><div class="phone-body">
    <h1 style="font-size:24px;font-weight:800">Cupones</h1>
    ${list.map((c, i) => `<div class="coupon"><div class="l" style="background:${colors[i % 4]}">${ic('ticket', 34, 2)}</div>
      <div class="r"><b style="font-size:15px">${esc(c.titulo)}</b>
      ${c.descripcion ? `<span class="small muted">${esc(c.descripcion)}</span>` : ''}
      ${c.tienda ? `<span class="small">${esc(c.tienda)}</span>` : ''}
      ${c.valido_hasta ? `<span class="small muted">Válido hasta ${fdate(c.valido_hasta)}</span>` : ''}
      ${c.codigo ? `<span class="code">${esc(c.codigo)}</span>` : ''}</div></div>`).join('') || '<div class="empty">No hay cupones activos por ahora.</div>'}
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

async function loadStaff() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { perfil = null; return null; }
  if (perfil && perfil.user_id === session.user.id) return perfil;
  const [{ data: p }, { data: t }, { data: c }] = await Promise.all([
    sb.from('perfiles').select('*').eq('user_id', session.user.id).maybeSingle(),
    sb.from('tiendas').select('*').order('orden'),
    sb.from('config').select('*')
  ]);
  if (!p) { await sb.auth.signOut(); return null; }
  perfil = p; tiendas = t || []; config = Object.fromEntries((c || []).map((r) => [r.clave, r.valor]));
  return perfil;
}
const tiendaNombre = (id) => (tiendas.find((t) => t.id === id) || {}).nombre || '';

async function staffRoute(view) {
  document.title = 'Puntos Santana · Personal';
  const p = await loadStaff();
  if (!p) return staffLogin();
  const isAdmin = p.rol === 'admin';
  if (!view) view = isAdmin ? 'dashboard' : 'acumular';
  const adminOnly = ['dashboard', 'clientes', 'cumpleanos', 'premios', 'cupones', 'mensajes', 'ajustes'];
  if (!isAdmin && adminOnly.includes(view)) view = 'acumular';
  staffShell(view);
  const box = $('#content');
  const views = { acumular: vAcumular, nuevo: vNuevo, redimir: vRedimir, sellos: vSellos, dashboard: vDashboard, clientes: vClientes, cumpleanos: vCumple, premios: vPremios, cupones: vCupones, mensajes: vMensajes, ajustes: vAjustes };
  (views[view] || vAcumular)(box);
}

function staffLogin() {
  app.innerHTML = `
  <div class="login-staff"><form class="card" id="f" novalidate>
    <div class="brand" style="color:var(--navy)"><img src="${LOGO}" alt=""><div><b>PUNTOS <span style="color:var(--coral)">SANTANA</span></b><small class="muted">Acceso del personal</small></div></div>
    <div class="field"><label for="u">Usuario</label><input class="input" id="u" autocomplete="username" autocapitalize="none" placeholder="admin, pilatos o derek" required></div>
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
    ? `<nav class="side admin" aria-label="Menú">${L('dashboard', 'chart', 'Dashboard')}${L('clientes', 'users', 'Clientes y transacciones')}${L('cumpleanos', 'gift', 'Cumpleaños del mes')}${L('premios', 'gift', 'Premios')}${L('cupones', 'ticket', 'Cupones')}${L('mensajes', 'send', 'Mensajes')}${L('ajustes', 'gear', 'Ajustes')}<div class="sep"></div>${L('acumular', 'plus', 'Acumular')}${L('sellos', 'check', 'Marcar sello')}${L('nuevo', 'user', 'Cliente nuevo')}${L('redimir', 'gift', 'Entregar premio')}</nav>`
    : `<nav class="side" aria-label="Acciones">${L('nuevo', 'user', 'Cliente nuevo')}${L('acumular', 'plus', 'Acumular')}${L('sellos', 'check', 'Marcar sello')}${L('redimir', 'gift', 'Entregar premio')}</nav>`;
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
  $('#logout').onclick = async () => { await sb.auth.signOut(); perfil = null; ficha = null; location.hash = '#/personal'; route(); };
}

/* ---- buscador de cliente compartido ---- */
function clientBar(f) {
  if (!f) return '';
  const meta = f.sellos_meta || 8;
  const cumple = f.cumple_hoy ? '<span class="pill sun">¡Cumple hoy!</span>' : (f.cumple_mes ? '<span class="pill sun">Cumple este mes</span>' : '');
  const act = f.activo ? '' : `
  <form class="card stack" id="actf" novalidate style="border-color:var(--yellow);background:#FFFBEA">
    <div><b style="font-size:17px">Cliente sin activar</b><div class="small muted">Viene de la base de datos del mall. Puede acumular, pero para entrar a la app y redimir debe activar su cuenta: celular, PIN y autorización de datos.</div></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
      <div class="field"><label for="a-cel">Celular *</label><input class="input" id="a-cel" inputmode="tel"></div>
      <div class="field"><label for="a-mail">Correo (opcional)</label><input class="input" id="a-mail" type="email"></div>
      ${f.fecha_nacimiento ? '' : '<div class="field"><label for="a-nac">Fecha de nacimiento</label><input class="input" id="a-nac" type="date"></div>'}
      <div class="field"><label for="a-pin">PIN (4 números) *</label><input class="input pin" id="a-pin" type="password" inputmode="numeric" maxlength="4"></div>
      <div class="field"><label for="a-pin2">Repetir PIN *</label><input class="input pin" id="a-pin2" type="password" inputmode="numeric" maxlength="4"></div>
    </div>
    <label class="check"><input type="checkbox" id="a-ok"><span>El cliente autoriza a Santana del Río Mall Comercial el tratamiento de sus datos personales para el programa Puntos Santana (Ley 1581 de 2012).</span></label>
    <button class="btn coral" style="align-self:flex-start">Activar cuenta</button>
  </form>`;
  return `<div class="card client-bar">
    <div class="avatar">${esc(ini(f.nombre))}</div>
    <div style="flex:1;min-width:160px"><div class="row wrap" style="gap:8px"><b style="font-size:18px">${esc(f.nombre)}</b>${cumple}${f.activo ? '' : '<span class="pill" style="background:#FFE7A8">Sin activar</span>'}</div><div class="small muted">C.C. ${esc(num(f.cedula))}${f.celular_fin ? ' · Cel. ••• ' + esc(f.celular_fin) : ''}</div></div>
    <div class="kv"><span>Puntos</span><b>${num(f.puntos)}</b></div>
    <div class="kv"><span>Sellos</span><b style="color:var(--coral-t)">${f.sellos}/${meta}</b></div>
  </div>${act}`;
}
// Activación de clientes importados (formulario dentro de la ficha)
document.addEventListener('submit', async (e) => {
  if (e.target.id !== 'actf') return;
  e.preventDefault();
  const f = e.target, v = (id) => (f.querySelector('#' + id) || {}).value || '';
  if (digits(v('a-cel')).length < 7) return toast('Escribe el celular del cliente.', true);
  if (!/^\d{4}$/.test(v('a-pin'))) return toast(ERR.PIN_INVALIDO, true);
  if (v('a-pin') !== v('a-pin2')) return toast('Los dos PIN no coinciden.', true);
  if (!f.querySelector('#a-ok').checked) return toast(ERR.SIN_AUTORIZACION_DATOS, true);
  const b = f.querySelector('button'); b.disabled = true;
  try {
    ficha = await rpc('activar_cliente', { p_cedula: ficha.cedula, p_celular: v('a-cel'), p_correo: v('a-mail'), p_pin: v('a-pin'), p_acepta: true, p_nacimiento: v('a-nac') || null });
    toast('Cuenta activada. Ya puede entrar a la app con su cédula y PIN.');
    route();
  } catch (er) { toast(errText(er), true); b.disabled = false; }
});
function searchBox(onFound) {
  return {
    html: `<form class="row wrap" id="sf" style="align-items:flex-end" novalidate>
      <div class="field" style="flex:1;min-width:220px"><label for="sced">Cédula del cliente</label><input class="input" id="sced" inputmode="numeric" value="${ficha ? esc(ficha.cedula) : ''}"></div>
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
    </div>
    <label class="check"><input type="checkbox" id="n-ok"><span>El cliente autoriza a Santana del Río Mall Comercial el tratamiento de sus datos personales para el programa Puntos Santana (Ley 1581 de 2012).</span></label>
    <p id="err" class="small" style="color:var(--coral-t);margin:0;min-height:18px"></p>
    <button class="btn coral" style="align-self:flex-start">Inscribir cliente</button>
  </form>`;
  $('#nf').onsubmit = async (e) => {
    e.preventDefault();
    const err = $('#err'); err.textContent = '';
    const v = (id) => $('#' + id).value.trim();
    if (!digits(v('n-ced')) || !v('n-nom') || digits(v('n-cel')).length < 7) { err.textContent = 'Completa cédula, nombre y celular.'; return; }
    if (!/^\d{4}$/.test(v('n-pin'))) { err.textContent = ERR.PIN_INVALIDO; return; }
    if (v('n-pin') !== v('n-pin2')) { err.textContent = 'Los dos PIN no coinciden.'; return; }
    if (!v('n-nac')) { err.textContent = 'Escribe la fecha de nacimiento: con ella le enviamos su promoción de cumpleaños.'; return; }
    if (!$('#n-ok').checked) { err.textContent = ERR.SIN_AUTORIZACION_DATOS; return; }
    const b = $('button', $('#nf')); b.disabled = true;
    try {
      ficha = await rpc('crear_cliente', { p_cedula: v('n-ced'), p_nombre: v('n-nom'), p_celular: v('n-cel'), p_correo: v('n-mail'), p_pin: v('n-pin'), p_acepta: true, p_nacimiento: v('n-nac') });
      toast('Cliente inscrito. Ya puedes acumular su compra.');
      location.hash = '#/personal/acumular';
    } catch (er) { err.textContent = errText(er); b.disabled = false; }
  };
}

function vAcumular(box) {
  const s = searchBox(() => draw());
  const ppm = Number(config.puntos_por_mil || 25), meses = Number(config.vigencia_meses || 12);
  let tienda = null, valor = 0, fnum = '', ffecha = iso(new Date()), fnom = '';
  box.innerHTML = `<h1 style="font-size:28px;font-weight:800">Acumular compra</h1>
  <p class="muted" style="margin:0">Siempre con la factura en la mano. La factura debe estar <b>a nombre del cliente</b>: no se acumulan facturas de otra persona.</p>${s.html}<div id="acc"></div>`;
  s.bind();
  function vence() { const d = new Date(ffecha + 'T12:00:00'); d.setMonth(d.getMonth() + meses); return fdate(d); }
  function ready() { return tienda && valor > 0 && fnum.trim() && ffecha && fnom.trim(); }
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
          <div class="field"><label for="f-fecha">Fecha de la factura</label><input class="input" id="f-fecha" type="date" max="${iso(new Date())}" value="${esc(ffecha)}"></div>
        </div>
        <div class="field"><label for="f-nom">Nombre que aparece en la factura</label><input class="input" id="f-nom" autocomplete="off" value="${esc(fnom)}" placeholder="Debe coincidir con: ${esc(ficha.nombre)}"></div>
        <label for="valor" style="font-size:13px;font-weight:600">Valor de la factura</label>
        <div class="money"><span>$</span><input id="valor" inputmode="numeric" autocomplete="off" value="${valor ? num(valor) : ''}"></div>
        <div style="background:rgba(255,255,255,.1);border-radius:16px;padding:14px" class="stack">
          <span class="small" style="color:#CFE9F0">Puntos a acumular</span>
          <span class="big" id="pts">+${num(Math.floor(valor / 1000) * ppm)}</span>
          <span class="small" style="color:#CFE9F0" id="vence">${ppm} pts por cada $1.000 · vencen el ${vence()}</span>
        </div>
        ${t && t.da_sellos ? `<a href="#/personal/sellos" style="background:var(--sun);color:var(--navy);border-radius:14px;padding:12px 14px;font-size:13px;font-weight:700;text-decoration:none">Compra en el Restaurante: recuerda marcar el sello con la factura →</a>` : ''}
        <button class="btn coral block" id="reg" style="height:60px;font-size:17px" ${ready() ? '' : 'disabled'}>Registrar compra</button>
      </section>
    </div>`;
    const upd = () => { $('#reg').disabled = !ready(); };
    $$('[data-t]').forEach((b) => b.onclick = () => { tienda = Number(b.dataset.t); draw(); });
    const vi = $('#valor');
    vi.oninput = () => { valor = Number(digits(vi.value)); vi.value = valor ? num(valor) : ''; $('#pts').textContent = '+' + num(Math.floor(valor / 1000) * ppm); upd(); };
    $('#f-num').oninput = (e) => { fnum = e.target.value; upd(); };
    $('#f-nom').oninput = (e) => { fnom = e.target.value; upd(); };
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
          ${fila('Nombre en la factura', esc(fnom.trim()))}
          ${fila('Valor de la factura', money(valor), true)}
          ${fila('Puntos que gana', '+' + num(pts), true)}
        </div>`, async () => {
        const r = await rpc('acumular', { p_cedula: ficha.cedula, p_tienda_id: tienda, p_valor: valor, p_factura_numero: fnum, p_factura_fecha: ffecha, p_factura_nombre: fnom });
        const nombre = r.cliente.nombre, total = r.cliente.puntos, fac = fnum.trim().toUpperCase();
        // Formulario en blanco: cliente, cédula y factura
        ficha = null; valor = 0; fnum = ''; fnom = ''; tienda = null; ffecha = iso(new Date());
        $('#sced').value = ''; $('#sres').innerHTML = '';
        $('#acc').innerHTML = `<div class="card okcard">${ic('check', 30, 2.6)}<div><b style="font-size:18px">Compra registrada</b><div class="small">Factura ${esc(fac)} · +${num(r.puntos_ganados)} puntos para ${esc(nombre)} · Total: ${num(total)} pts</div><div class="small muted">El formulario quedó en blanco para la siguiente compra.</div></div></div>`;
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
  <p class="muted" style="margin:0">El cliente presenta su factura del Restaurante. Buscas su cédula, escribes el número de la factura y marcas el sello. Máximo 1 sello por día.</p>${s.html}<div id="sel"></div>`;
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
          <h2 style="font-size:20px;font-weight:800">Entregar regalo</h2>
          <p style="margin:0;color:#CFE9F0;font-size:14px">Regalo: <b style="color:#fff">${esc(ficha.regalo_sellos)}</b>. Pide al cliente su PIN para confirmar.</p>
          <div class="field"><label for="g-pin">PIN del cliente</label><input class="input pin" id="g-pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></div>
          <button class="btn coral block" style="height:56px">Confirmar entrega del regalo</button>
          <span class="small" style="color:#CFE9F0">La tarjeta vuelve a empezar desde cero.</span>
        </form>`
      : `<form class="navy-card" id="sf2" novalidate>
          <h2 style="font-size:20px;font-weight:800">Nuevo sello</h2>
          ${ficha.sello_hoy ? '<div style="background:var(--sun);color:var(--navy);border-radius:14px;padding:12px 14px;font-size:14px;font-weight:700">Hoy ya recibió su sello. Puede volver mañana.</div>' : `
          <div class="field"><label for="fac">Número de la factura</label><input class="input" id="fac" autocomplete="off" style="text-transform:uppercase" placeholder="Ej.: FE-10234"></div>
          <button class="btn coral block" style="height:60px;font-size:17px">Marcar sello</button>`}
        </form>`}
    </div>`;
    const sf2 = $('#sf2');
    if (sf2 && $('#fac')) {
      $('#fac').focus();
      sf2.onsubmit = async (e) => {
        e.preventDefault();
        const f = $('#fac').value.trim(); if (!f) return toast(ERR.FACTURA_REQUERIDA, true);
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
  const s = searchBox(() => draw());
  box.innerHTML = `<h1 style="font-size:28px;font-weight:800">Entregar premio</h1>
  <p class="muted" style="margin:0">El cliente elige el premio en su celular (Premios → Lo quiero). Aquí lo buscas, confirmas con su PIN y le entregas el premio.</p>${s.html}<div id="red"></div>`;
  s.bind();
  function draw() {
    const red = $('#red');
    if (!ficha) { red.innerHTML = ''; return; }
    $('#sres').innerHTML = clientBar(ficha);
    const sol = ficha.solicitudes || [];
    red.innerHTML = sol.length ? `<div class="cols">${sol.map((x) => `
      <form class="card stack" data-s="${x.id}" novalidate>
        <div class="row between wrap"><b style="font-size:18px">${x.tipo === 'sellos' ? 'Regalo de sellos' : esc(x.premio)}</b>${x.tipo === 'premio' ? `<span class="pill navy" style="font-size:13px">${num(x.puntos)} pts</span>` : ''}</div>
        <span class="small muted">${x.tipo === 'sellos' ? esc(ficha.regalo_sellos) : esc(x.tienda || '')} · solicitado el ${fdate(x.creada_en)}</span>
        ${x.tipo === 'premio' ? `<span class="small">Le quedarán <b>${num(ficha.puntos - x.puntos)}</b> puntos.</span>` : ''}
        <div class="field"><label for="pin-${x.id}">PIN del cliente</label><input class="input pin" id="pin-${x.id}" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></div>
        <button class="btn coral">Confirmar entrega</button>
      </form>`).join('')}</div>`
      : '<div class="card empty">Este cliente no tiene premios solicitados. Debe elegirlo primero en su celular.</div>';
    $$('form[data-s]').forEach((f) => f.onsubmit = async (e) => {
      e.preventDefault();
      const b = $('button', f); b.disabled = true;
      try {
        const r = await rpc('entregar_solicitud', { p_solicitud: f.dataset.s, p_pin: $('input', f).value });
        ficha = r.cliente; toast('Premio entregado. Puntos descontados.'); draw();
      } catch (er) { toast(errText(er), true); b.disabled = false; $('input', f).value = ''; $('input', f).focus(); }
    });
  }
  if (ficha) draw();
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
  <div id="dash"><div class="empty">Cargando…</div></div>`;
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
async function vClientes(box) {
  box.innerHTML = `
  <div class="row between wrap"><h1 style="font-size:30px;font-weight:800">Clientes y transacciones</h1>
  <div class="row wrap"><button class="btn coral sm" id="imp">Importar clientes (Excel)</button><button class="btn ghost sm" id="x-cli">Exportar clientes</button><button class="btn ghost sm" id="x-tx">Exportar transacciones</button></div></div>
  <form class="row wrap" id="qf" novalidate><label for="q" class="hidden">Buscar</label><input class="input" id="q" placeholder="Buscar por cédula, nombre o celular" style="flex:1;min-width:240px"><button class="btn">Buscar</button></form>
  <div class="cols"><section class="card stack" id="lista"><div class="empty">Cargando…</div></section><section id="det"></section></div>`;
  const load = async (q) => {
    let rows; try { rows = await rpc('admin_clientes', { p_busqueda: q || '', p_limite: 200 }); } catch (e) { $('#lista').innerHTML = `<div class="empty">${errText(e)}</div>`; return; }
    $('#lista').innerHTML = `<h2 style="font-size:17px;font-weight:800">Clientes (${rows.length}${rows.length === 200 ? '+' : ''})</h2>` + (rows.length ? `<div class="tbl-wrap"><table><thead><tr><th>Nombre</th><th>Cédula</th><th>Nacimiento</th><th style="text-align:right">Puntos</th><th style="text-align:right">Sellos</th></tr></thead><tbody>
      ${rows.map((c) => `<tr class="clic ${selCliente === c.id ? 'sel' : ''}" data-c="${c.id}" tabindex="0"><td><b>${esc(c.nombre)}</b>${c.activo ? '' : ' <span class="pill" style="background:#FFE7A8;padding:2px 8px;font-size:10px">Sin activar</span>'}</td><td>${esc(num(c.cedula))}</td><td>${c.fecha_nacimiento ? fdate(c.fecha_nacimiento) : '—'}</td><td style="text-align:right;font-weight:700">${num(c.puntos)}</td><td style="text-align:right">${c.sellos}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Sin resultados.</div>');
    $$('[data-c]').forEach((tr) => { const go = () => { selCliente = tr.dataset.c; $$('[data-c]').forEach((x) => x.classList.toggle('sel', x === tr)); detalle(rows.find((x) => x.id === selCliente)); }; tr.onclick = go; tr.onkeydown = (e) => { if (e.key === 'Enter') go(); }; });
    if (selCliente) { const c = rows.find((x) => x.id === selCliente); if (c) detalle(c); }
  };
  $('#qf').onsubmit = (e) => { e.preventDefault(); load($('#q').value.trim()); };
  $('#imp').onclick = () => importarClientes(() => load(''));
  $('#x-cli').onclick = async () => {
    try { const rows = await rpc('admin_clientes', { p_busqueda: '', p_limite: 100000 });
      csv([['Cédula', 'Nombre', 'Fecha nacimiento', 'Celular', 'Correo', 'Activo', 'Puntos', 'Sellos', 'Inscrito en', 'Fecha inscripción'], ...rows.map((c) => [c.cedula, c.nombre, c.fecha_nacimiento, c.celular, c.correo, c.activo ? 'Sí' : 'No', c.puntos, c.sellos, c.tienda_registro, (c.creado_en || '').slice(0, 10)])], 'clientes-puntos-santana.csv');
    } catch (e) { toast(errText(e), true); }
  };
  $('#x-tx').onclick = async () => {
    const { data, error } = await sb.from('transacciones').select('fecha,tipo,factura_numero,factura_fecha,factura_nombre,valor_compra,puntos,puntos_restantes,vence_en,anulada,detalle,clientes(cedula,nombre),tienda:tiendas!transacciones_tienda_id_fkey(nombre),recaudador:tiendas!transacciones_recaudador_tienda_id_fkey(nombre)').order('fecha', { ascending: false }).limit(100000);
    if (error) return toast(errText(error), true);
    csv([['Fecha registro', 'Tipo', 'Cédula', 'Cliente', 'Tienda compra', 'Registrado en', 'N° factura', 'Fecha factura', 'Nombre en factura', 'Valor', 'Puntos', 'Puntos vigentes', 'Vence', 'Anulada', 'Detalle'], ...data.map((t) => [(t.fecha || '').slice(0, 16).replace('T', ' '), t.tipo, t.clientes?.cedula, t.clientes?.nombre, t.tienda?.nombre, t.recaudador?.nombre, t.factura_numero, t.factura_fecha, t.factura_nombre, t.valor_compra, t.puntos, t.puntos_restantes, t.vence_en, t.anulada ? 'Sí' : 'No', t.detalle])], 'transacciones-puntos-santana.csv');
  };
  async function detalle(c) {
    const det = $('#det');
    det.innerHTML = '<div class="card empty">Cargando…</div>';
    let tx; try { tx = await rpc('admin_transacciones', { p_cliente: c.id }); } catch (e) { det.innerHTML = `<div class="card empty">${errText(e)}</div>`; return; }
    det.innerHTML = `<div class="card stack">
      <div class="row between wrap"><div><b style="font-size:18px">${esc(c.nombre)}</b><div class="small muted">C.C. ${esc(num(c.cedula))} · ${esc(c.celular)}${c.correo ? ' · ' + esc(c.correo) : ''}${c.tienda_registro ? ' · inscrito en ' + esc(c.tienda_registro) : ''}</div></div>
      <span class="pill navy" style="padding:6px 14px">${num(c.puntos)} pts · ${c.sellos}/${config.sellos_meta || 8} sellos</span></div>
      <div class="row wrap"><button class="btn ghost sm" id="ed-cli">Editar datos</button><button class="btn ghost sm" id="rs-pin">Restablecer PIN</button></div>
      <div class="tbl-wrap"><table><thead><tr><th>Fecha factura</th><th>Movimiento</th><th>Valor</th><th>Puntos</th><th>Vence</th><th></th></tr></thead><tbody>
      ${tx.map((t) => `<tr class="${t.anulada ? 'tag-anulada' : ''}"><td>${fdate(t.factura_fecha || t.fecha)}</td><td><b>${esc(t.tipo === 'redencion' ? (t.detalle || 'Redención') : t.tienda)}</b>${t.factura_numero ? `<div class="small muted">Factura ${esc(t.factura_numero)} · ${esc(t.factura_nombre || '')}</div>` : ''}${t.con_sello ? ' · sello' : ''}${t.registrada_en ? `<div class="small muted">en ${esc(t.registrada_en)}</div>` : ''}${t.ediciones ? `<div class="small muted">editada ${t.ediciones}×</div>` : ''}</td>
        <td>${t.valor_compra ? money(t.valor_compra) : '—'}</td><td style="font-weight:800;color:${t.puntos < 0 ? 'var(--coral-t)' : 'var(--teal-d)'}">${t.puntos > 0 ? '+' : ''}${num(t.puntos)}</td><td>${t.vence_en ? fdate(t.vence_en) : '—'}</td>
        <td style="white-space:nowrap;text-align:right">${t.tipo === 'acumulacion' && !t.anulada ? `<button class="btn ghost sm" data-ed="${t.id}">Editar</button> <button class="btn ghost sm" data-an="${t.id}">Anular</button>` : (t.anulada ? '<span class="small">Anulada</span>' : '')}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">Sin movimientos.</td></tr>'}
      </tbody></table></div>
      <p class="small muted" style="margin:0">Cada edición o anulación queda en el historial con fecha, usuario y motivo. Los puntos se recalculan solos.</p></div>`;
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
    <p class="muted small" style="margin:0">El archivo debe tener columnas con estos títulos: <b>Nombre</b>, <b>Cédula</b> y <b>Fecha de nacimiento</b> (día/mes/año). Si una cédula ya existe, no se duplica.</p>
    <div class="field"><label for="i-f">Archivo (.xlsx, .xls o .csv)</label><input class="input" id="i-f" type="file" accept=".xlsx,.xls,.csv" style="padding:12px"></div>
    <div id="i-prev" class="small"></div>`, async (dl) => {
    if (!filas.length) { toast('Primero elige un archivo con clientes.', true); return false; }
    let nuevos = 0, act = 0, errores = [];
    for (let i = 0; i < filas.length; i += 500) {
      const r = await rpc('admin_importar_clientes', { p_filas: filas.slice(i, i + 500) });
      nuevos += r.nuevos; act += r.actualizados; errores = errores.concat(r.errores || []);
    }
    toast(`Importados: ${num(nuevos)} nuevos, ${num(act)} actualizados${errores.length ? `, ${errores.length} filas con error` : ''}.`);
    if (errores.length) setTimeout(() => alertaErrores(errores), 400);
    despues && despues();
  }, 'Importar');
  const inp = document.querySelector('dialog #i-f'), prev = document.querySelector('dialog #i-prev');
  inp.onchange = async () => {
    const file = inp.files[0]; if (!file) return;
    prev.textContent = 'Leyendo archivo…';
    try {
      const XLSX = await cargarXLSX();
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
      if (!raw.length) { prev.textContent = 'El archivo está vacío.'; return; }
      const keys = Object.keys(raw[0]);
      const kNom = keys.find((k) => /nombre|cliente/.test(normH(k)));
      const kCed = keys.find((k) => /cedula|documento|identificacion|^cc$|^id$/.test(normH(k)));
      const kNac = keys.find((k) => /nacimiento|cumple|fechanac/.test(normH(k)));
      if (!kNom || !kCed) { prev.innerHTML = `<span style="color:var(--coral-t)">No encontré las columnas de nombre y cédula. Columnas del archivo: ${esc(keys.join(', '))}</span>`; filas = []; return; }
      filas = raw.map((r, i) => ({ fila: i + 2, nombre: String(r[kNom] || '').trim(), cedula: String(r[kCed] || '').replace(/\D/g, ''), nacimiento: kNac ? fechaExcel(r[kNac]) : '' })).filter((r) => r.nombre || r.cedula);
      const conNac = filas.filter((r) => r.nacimiento).length;
      prev.innerHTML = `<div class="stack" style="gap:8px"><b>${num(filas.length)} clientes listos para importar</b><span class="muted">Columnas: ${esc(kNom)} · ${esc(kCed)}${kNac ? ' · ' + esc(kNac) : ' · (sin columna de nacimiento)'} — ${num(conNac)} con fecha de nacimiento.</span>
        <div class="tbl-wrap" style="max-height:180px;overflow:auto"><table><thead><tr><th>Nombre</th><th>Cédula</th><th>Nacimiento</th></tr></thead><tbody>${filas.slice(0, 8).map((r) => `<tr><td>${esc(r.nombre)}</td><td>${esc(r.cedula)}</td><td>${r.nacimiento ? fdate(r.nacimiento) : '—'}</td></tr>`).join('')}</tbody></table></div></div>`;
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
  <div class="stack" style="gap:8px"><span class="small" style="font-weight:600">Clientes que compran en:</span>
    <div class="row wrap" style="gap:8px"><button class="chip" data-ct="" aria-pressed="${!st.tienda}">TODAS</button>${tiendas.map((t) => `<button class="chip" data-ct="${t.id}" aria-pressed="${st.tienda === t.id}">${esc(t.nombre)}</button>`).join('')}</div></div>
  <div id="c-body"><div class="empty">Cargando…</div></div>`;
  $('#c-mes').onchange = (e) => { st.mes = Number(e.target.value); vCumple(box); };
  $$('[data-ct]').forEach((b) => b.onclick = () => { st.tienda = b.dataset.ct ? Number(b.dataset.ct) : null; vCumple(box); });
  let rows; try { rows = await rpc('admin_cumpleanos', { p_mes: st.mes, p_tienda_id: st.tienda }); } catch (e) { $('#c-body').innerHTML = `<div class="empty">${errText(e)}</div>`; return; }
  const hoyD = new Date(), esMes = st.mes === hoyD.getMonth() + 1;
  const activos = rows.filter((r) => r.activo).length;
  $('#c-x').onclick = () => csv([['Día', 'Nombre', 'Cédula', 'Celular', 'Fecha nacimiento', 'Edad que cumple', 'Tiendas preferidas', 'Puntos', 'App activa'], ...rows.map((r) => [r.dia, r.nombre, r.cedula, r.celular, r.fecha_nacimiento, r.edad, (r.tiendas || []).join(', '), r.puntos, r.activo ? 'Sí' : 'No'])], `cumpleanos-${MESES_L[st.mes - 1].toLowerCase()}${tn ? '-' + tn.toLowerCase().replace(/\s+/g, '-') : ''}.csv`);
  $('#c-body').innerHTML = `
  <div class="kpis" style="margin-bottom:20px">
    <div class="kpi"><div class="dot" style="background:var(--sun)"></div><span>Cumplen en ${MESES_L[st.mes - 1].toLowerCase()}${tn ? ' · compran en ' + esc(tn) : ''}</span><b>${num(rows.length)}</b></div>
    <div class="kpi"><div class="dot" style="background:var(--teal)"></div><span>Recibirán el mensaje (app activa)</span><b>${num(activos)}</b></div>
    ${esMes ? `<div class="kpi"><div class="dot" style="background:var(--coral)"></div><span>Cumplen hoy</span><b>${num(rows.filter((r) => r.dia === hoyD.getDate()).length)}</b></div>` : ''}
  </div>
  <div class="cols">
    <section class="card stack">
      ${rows.length ? `<div class="tbl-wrap"><table><thead><tr><th>Día</th><th>Cliente</th><th>Cumple</th><th>Tiendas preferidas</th><th style="text-align:right">Puntos</th></tr></thead><tbody>
      ${rows.map((r) => `<tr class="${esMes && r.dia === hoyD.getDate() ? 'sel' : ''}"><td><b style="font-size:16px">${r.dia}</b></td><td><b>${esc(r.nombre)}</b><div class="small muted">C.C. ${esc(num(r.cedula))}${r.activo ? '' : ' · sin activar'}</div></td><td>${r.edad} años</td><td class="small">${(r.tiendas || []).length ? esc(r.tiendas.join(', ')) : '<span class="muted">Sin compras aún</span>'}</td><td style="text-align:right">${num(r.puntos)}</td></tr>`).join('')}
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
    <div class="field"><label for="p-i">Enlace de la foto (opcional)</label><input class="input" id="p-i" type="url" value="${esc(p.imagen_url || '')}" placeholder="https://…"></div>`, async (dl) => {
    const row = { nombre: $('#p-n', dl).value.trim(), descripcion: $('#p-d', dl).value.trim() || null, puntos: Number(digits($('#p-p', dl).value)), stock: $('#p-s', dl).value.trim() === '' ? null : Number(digits($('#p-s', dl).value)), tienda: $('#p-t', dl).value || null, imagen_url: $('#p-i', dl).value.trim() || null };
    if (!row.nombre || !row.puntos) { toast('Escribe el nombre y los puntos.', true); return false; }
    const q = p.id ? sb.from('premios').update(row).eq('id', p.id) : sb.from('premios').insert(row);
    const { error: e } = await q; if (e) throw e; toast('Premio guardado.'); vPremios(box);
  });
  $('#nuevo').onclick = () => form();
  $$('[data-ed]').forEach((b) => b.onclick = () => form(data.find((x) => x.id === b.dataset.ed)));
}

async function vCupones(box) {
  box.innerHTML = `<div class="row between wrap"><h1 style="font-size:30px;font-weight:800">Cupones</h1><button class="btn coral" id="nuevo">+ Crear cupón</button></div><section class="card" id="cl"><div class="empty">Cargando…</div></section>`;
  const { data, error } = await sb.from('cupones').select('*').order('creado_en', { ascending: false });
  if (error) { $('#cl').innerHTML = `<div class="empty">${errText(error)}</div>`; return; }
  $('#cl').innerHTML = data.length ? `<div class="tbl-wrap"><table><thead><tr><th>Cupón</th><th>Tienda</th><th>Código</th><th>Válido hasta</th><th>Activo</th><th></th></tr></thead><tbody>
    ${data.map((c) => `<tr><td><b>${esc(c.titulo)}</b>${c.descripcion ? `<div class="small muted">${esc(c.descripcion)}</div>` : ''}</td><td>${esc(c.tienda || 'Todas')}</td><td>${esc(c.codigo || '—')}</td><td>${c.valido_hasta ? fdate(c.valido_hasta) : 'Sin fecha'}</td>
    <td><button class="switch" data-sw="${c.id}" aria-pressed="${c.activo}" aria-label="Activo"></button></td><td><button class="btn ghost sm" data-ed="${c.id}">Editar</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Aún no hay cupones.</div>';
  $$('[data-sw]').forEach((b) => b.onclick = async () => { const on = b.getAttribute('aria-pressed') !== 'true'; const { error: e } = await sb.from('cupones').update({ activo: on }).eq('id', b.dataset.sw); if (e) return toast(errText(e), true); vCupones(box); });
  const form = (c = {}) => dialog(`<h2 style="font-size:20px;font-weight:800">${c.id ? 'Editar cupón' : 'Crear cupón'}</h2>
    <div class="field"><label for="c-t">Título *</label><input class="input" id="c-t" value="${esc(c.titulo || '')}" placeholder="Ej.: 2x1 en helados"></div>
    <div class="field"><label for="c-d">Descripción / condiciones</label><input class="input" id="c-d" value="${esc(c.descripcion || '')}"></div>
    <div class="grid" style="grid-template-columns:1fr 1fr">
      <div class="field"><label for="c-ti">Tienda</label><select class="input" id="c-ti"><option value="">Todas</option>${tiendas.map((t) => `<option ${c.tienda === t.nombre ? 'selected' : ''}>${esc(t.nombre)}</option>`).join('')}</select></div>
      <div class="field"><label for="c-c">Código</label><input class="input" id="c-c" value="${esc(c.codigo || '')}"></div>
      <div class="field"><label for="c-v">Válido hasta</label><input class="input" id="c-v" type="date" value="${esc(c.valido_hasta || '')}"></div></div>
    ${c.id ? '' : '<label class="check"><input type="checkbox" id="c-msg" checked><span>Avisar a todos los clientes con un mensaje</span></label>'}`, async (dl) => {
    const row = { titulo: $('#c-t', dl).value.trim(), descripcion: $('#c-d', dl).value.trim() || null, tienda: $('#c-ti', dl).value || null, codigo: $('#c-c', dl).value.trim().toUpperCase() || null, valido_hasta: $('#c-v', dl).value || null };
    if (!row.titulo) { toast('Escribe el título.', true); return false; }
    const { error: e } = c.id ? await sb.from('cupones').update(row).eq('id', c.id) : await sb.from('cupones').insert(row);
    if (e) throw e;
    const m = $('#c-msg', dl);
    if (m && m.checked) { const r = await rpc('admin_enviar_mensaje', { p_titulo: 'Tienes un cupón nuevo', p_cuerpo: row.titulo + (row.tienda ? ' en ' + row.tienda : '') + '. Míralo en la sección Cupones.', p_segmento: 'todos', p_tienda: null }); toast(`Cupón publicado y avisado a ${num(r.destinatarios)} clientes.`); }
    else toast('Cupón guardado.');
    vCupones(box);
  });
  $('#nuevo').onclick = () => form();
  $$('[data-ed]').forEach((b) => b.onclick = () => form(data.find((x) => x.id === b.dataset.ed)));
}

async function vMensajes(box) {
  let pre = {}; try { pre = JSON.parse(sessionStorage.getItem('ps_msg_pre') || '{}'); sessionStorage.removeItem('ps_msg_pre'); } catch {}
  const SEG = [['todos', 'Todos los clientes'], ['por_vencer', 'Puntos por vencer (30 días)'], ['casi_sellos', 'Les falta 1 sello o menos'], ['tienda', 'Compraron en una tienda'], ['inactivos', 'Sin compras en 60 días']];
  let seg = pre.seg || 'todos';
  box.innerHTML = `<h1 style="font-size:30px;font-weight:800">Mensajes</h1>
  <div class="cols">
    <form class="card stack" id="mf" novalidate>
      <h2 style="font-size:20px;font-weight:800">Enviar mensaje</h2>
      <div class="field"><label for="m-t">Título *</label><input class="input" id="m-t" maxlength="60" value="${esc(pre.titulo || '')}"></div>
      <div class="field"><label for="m-c">Mensaje *</label><textarea class="input" id="m-c" rows="3" maxlength="300">${esc(pre.cuerpo || '')}</textarea></div>
      <div class="stack" style="gap:8px"><span style="font-size:13px;font-weight:600">Enviar a</span><div class="row wrap" style="gap:8px" id="segs"></div>
      <select class="input hidden" id="m-ti" aria-label="Tienda">${tiendas.map((t) => `<option>${esc(t.nombre)}</option>`).join('')}</select></div>
      <div class="stack" style="gap:6px"><span class="small muted">Vista previa</span>
        <div style="background:var(--navy);border-radius:18px;padding:12px;display:flex;gap:10px;color:#fff;max-width:380px"><img src="${LOGO}" alt="" style="width:36px;height:36px;border-radius:9px;object-fit:cover"><div class="stack" style="gap:2px;min-width:0"><span class="small" style="color:#CFE9F0;font-weight:700">PUNTOS SANTANA · ahora</span><b style="font-size:13px" id="pv-t"></b><span class="small" style="color:#E3EAF7" id="pv-c"></span></div></div></div>
      <button class="btn coral" style="align-self:flex-start">Enviar ahora</button>
    </form>
    <section class="card stack" id="hist"><h2 style="font-size:20px;font-weight:800">Enviados</h2><div class="empty">Cargando…</div></section>
  </div>`;
  const drawSeg = () => { $('#segs').innerHTML = SEG.map(([k, l]) => `<button type="button" class="chip" data-seg="${k}" aria-pressed="${seg === k}">${l}</button>`).join(''); $('#m-ti').classList.toggle('hidden', seg !== 'tienda'); $$('[data-seg]').forEach((b) => b.onclick = () => { seg = b.dataset.seg; drawSeg(); }); };
  const pv = () => { $('#pv-t').textContent = $('#m-t').value || 'Título del mensaje'; $('#pv-c').textContent = $('#m-c').value || 'Texto del mensaje'; };
  drawSeg(); pv(); $('#m-t').oninput = pv; $('#m-c').oninput = pv;
  $('#mf').onsubmit = async (e) => {
    e.preventDefault();
    const t = $('#m-t').value.trim(), c = $('#m-c').value.trim();
    if (!t || !c) return toast('Escribe el título y el mensaje.', true);
    if (!confirm('¿Enviar este mensaje?')) return;
    const b = $('button[type=submit],button:not([type])', $('#mf')); b.disabled = true;
    try { const r = await rpc('admin_enviar_mensaje', { p_titulo: t, p_cuerpo: c, p_segmento: seg, p_tienda: seg === 'tienda' ? $('#m-ti').value : null }); toast(`Mensaje enviado a ${num(r.destinatarios)} clientes.`); vMensajes(box); }
    catch (er) { toast(errText(er), true); b.disabled = false; }
  };
  const { data, error } = await sb.from('mensajes').select('id,titulo,cuerpo,segmento,segmento_tienda,enviado_en,mensajes_destinatarios(count)').order('enviado_en', { ascending: false }).limit(50);
  const segName = { ...Object.fromEntries(SEG), cumpleanos: 'Cumpleaños del mes' };
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
      <div class="field"><label for="a-v">Vigencia de puntos (meses)</label><input class="input" id="a-v" inputmode="numeric" value="${esc(c.vigencia_meses)}"></div></div>
    <p class="small muted" style="margin:0">Los cambios en puntos y vigencia aplican a compras nuevas; las anteriores conservan sus puntos y su fecha de vencimiento.</p>
    <button class="btn coral" style="align-self:flex-start">Guardar ajustes</button>
  </form>`;
  $('#af').onsubmit = async (e) => {
    e.preventDefault();
    const rows = [{ clave: 'regalo_sellos', valor: $('#a-r').value.trim() || '[REGALO POR DEFINIR]' }, { clave: 'puntos_por_mil', valor: Number(digits($('#a-p').value)) || 25 }, { clave: 'sellos_meta', valor: Number(digits($('#a-s').value)) || 8 }, { clave: 'vigencia_meses', valor: Number(digits($('#a-v').value)) || 12 }];
    const { error } = await sb.from('config').upsert(rows);
    if (error) return toast(errText(error), true);
    config = Object.fromEntries(rows.map((r) => [r.clave, r.valor])); toast('Ajustes guardados.');
  };
}

/* ---------- arranque ---------- */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
route();
})();
