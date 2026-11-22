/* Núcleo: estado, utilidades, iconos, modal, almacenamiento y router. */
(function () {
  'use strict';
  const App = window.App = {
    data: null, views: {}, state: {
      perfil: null, resultado: null, modo: 'alumno', borrador: null, paso: 1,
      actividad: {}, cmpEsp: [], cmpVias: [], consent: false
    }
  };

  /* ---------- i18n (preparado para catalán) ---------- */
  const STR = {
    es: {
      inicio: 'Inicio', simulador: 'Comprobar mi acceso', resultados: 'Mis posibilidades', ruta: 'Mi hoja de ruta',
      actividad: 'Descubre tu camino', vias: 'Explora las vías', especialidades: 'Especialidades', comparador: 'Comparador de vías',
      convocatorias: 'Convocatorias', organismos: 'Organismos', fuentes: 'Fuentes y fiabilidad',
      grpCaso: 'Mi caso', grpExplorar: 'Explorar', grpConsultar: 'Consultar',
      aula: 'Aula', alumno: 'Alumno'
    }
  };
  App.lang = 'es';
  App.t = k => (STR[App.lang] && STR[App.lang][k]) || STR.es[k] || k;

  /* ---------- Utilidades DOM ---------- */
  App.$ = (s, r = document) => r.querySelector(s);
  App.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  App.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
  App.norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  App.by = (arr, key = 'id') => Object.fromEntries((arr || []).map(x => [x[key], x]));

  /* ---------- Iconos (trazos propios estilo línea) ---------- */
  const P = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    alert: '<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4"/><path d="M12 17.5v.01"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7"/><path d="M12 17v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.01"/>',
    map: '<path d="M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
    route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    wrench: '<path d="M14.5 6.5a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8-1.5-1.5a4 4 0 0 0-5-5L14 6z"/><path d="M3 21l6-6"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
    blocks: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"/><path d="M10 21v-3h4v3"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.5 0 4 1.5 4.5 4"/>',
    landmark: '<path d="M3 9l9-5 9 5"/><path d="M5 9v9M9.5 9v9M14.5 9v9M19 9v9"/><path d="M3 21h18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    columns: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
    printer: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    download: '<path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M4 20h16"/>',
    chevR: '<path d="M9 5l7 7-7 7"/>',
    chevL: '<path d="M15 5l-7 7 7 7"/>',
    arrowR: '<path d="M4 12h16"/><path d="M14 6l6 6-6 6"/>',
    arrowD: '<path d="M12 4v16"/><path d="M6 14l6 6 6-6"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    present: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    save: '<path d="M5 3h11l3 3v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M8 3v5h7V3"/><path d="M8 21v-7h8v7"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20"/>',
    graduation: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/><path d="M22 9v6"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14l-1.5 7 5-3 5 3-1.5-7"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4"/><path d="M9 11l2 2 4-4"/><path d="M9 17h6"/>',
    chef: '<path d="M7 14a4 4 0 1 1 1.5-7.7A4 4 0 0 1 15.5 6 4 4 0 1 1 17 14"/><path d="M7 14v6h10v-6"/><path d="M7 17h10"/>',
    chart: '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-5M12 16V8M16 16v-3"/>',
    brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3 3 3 0 0 1-3-3"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/><path d="M8 9l2 2-2 2M12 13h4"/>',
    anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14"/><path d="M5 13a7 7 0 0 0 14 0"/><path d="M8 11h8"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    lang: '<path d="M4 5h9M8.5 3v2M6 5c.5 3 2.5 5.5 5 7"/><path d="M11 5c-.5 3-3 6-6.5 8"/><path d="M13 21l4-9 4 9M14.5 18h5"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="2"/>'
  };
  App.icon = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || P.info}</svg>`;

  /* ---------- Componentes reutilizables ---------- */
  const EST = {
    verificado: ['ok', 'VERIFICADO', 'check'], condicionado: ['warn', 'CONDICIONADO', 'alert'],
    no_verificado: ['unv', 'NO VERIFICADO', 'help'], no_permite: ['bad', 'NO HABILITA (según la fuente)', 'x'],
    disponible: ['ok', 'DISPONIBLE', 'check'], condicionada: ['warn', 'CONDICIONADA', 'alert'], no_aplica: ['unv', 'NO APLICA A TU PERFIL', 'minus'],
    abierta: ['ok', 'ABIERTA', 'check'], cerrada: ['bad', 'CERRADA', 'x'], pendiente: ['warn', 'PENDIENTE DE CONFIRMAR', 'help'], informativa: ['info', 'INFORMATIVA', 'info']
  };
  App.badge = (estado, txt) => { const e = EST[estado] || ['info', estado, 'info']; return `<span class="badge ${e[0]}">${App.icon(e[2])}${App.esc(txt || e[1])}</span>`; };
  const RS = { cumplido: ['check', 'Cumplido'], pendiente: ['alert', 'Pendiente'], comprobar: ['help', 'Por comprobar'], opcional: ['info', 'No imprescindible'], no_aplica: ['minus', 'No aplica'] };
  App.stIco = st => `<span class="st-ico st-${st}" title="${RS[st] ? RS[st][1] : st}">${App.icon(RS[st] ? RS[st][0] : 'info')}</span>`;
  App.stLabel = st => RS[st] ? RS[st][1] : st;

  App.link = (key, cls = '') => {
    const L = App.data.normativa.enlaces[key];
    if (!L) return '';
    return `<a class="${cls}" href="${App.esc(L.u)}" target="_blank" rel="noopener">${App.icon('external')} ${App.esc(L.t)}</a>`;
  };
  App.norma = (id, short) => {
    const n = App.data.idx.normativa[id];
    if (!n) return '';
    return `<a href="${App.esc(n.url)}" target="_blank" rel="noopener" title="${App.esc(n.articulos)}">${App.esc(short ? n.nombre.split('(')[0].trim() : n.nombre)}</a>${n.origenEnlace !== 'cuaderno' ? ' <span class="tiny muted">(enlace ' + App.esc(n.origenEnlace) + ')</span>' : ''}`;
  };
  App.viaColor = via => { const f = App.data.idx.familias[via.familia]; return f ? f.color : '#4f7cff'; };

  /* ---------- Modal y avisos ---------- */
  App.modal = (headHtml, bodyHtml, onMount) => {
    App.closeModal();
    const s = document.createElement('div');
    s.className = 'modal-scrim';
    s.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><div class="modal-head">${headHtml}<button class="btn icon ghost" data-close aria-label="Cerrar" style="margin-left:auto">${App.icon('x')}</button></div><div class="modal-body">${bodyHtml}</div></div>`;
    s.addEventListener('click', e => { if (e.target === s || e.target.closest('[data-close]')) App.closeModal(); });
    document.body.appendChild(s);
    App._lastFocus = document.activeElement;
    s.querySelector('[data-close]').focus();
    if (onMount) onMount(s);
  };
  App.closeModal = () => { const m = App.$('.modal-scrim'); if (m) { m.remove(); if (App._lastFocus) App._lastFocus.focus?.(); } };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') App.closeModal(); });
  App.toast = msg => { const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); };

  /* ---------- Almacenamiento local (solo con permiso) ---------- */
  const KEY = 'vias-docencia.v1';
  App.store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } },
    save() {
      if (!App.state.consent) return;
      try { localStorage.setItem(KEY, JSON.stringify({ consent: true, perfil: App.state.perfil, actividad: App.state.actividad })); } catch { /* sin almacenamiento */ }
    },
    clear() { try { localStorage.removeItem(KEY); } catch { } },
    pref(k, v) { try { if (v === undefined) return localStorage.getItem('vd.' + k); localStorage.setItem('vd.' + k, v); } catch { return null; } }
  };

  App.setPerfil = (perfil, silent) => {
    App.state.perfil = perfil;
    App.state.resultado = perfil ? App.Engine.evaluar(perfil) : null;
    App.store.save();
    App.renderNav();
    if (!silent) App.toast('Perfil actualizado: resultados calculados');
  };

  /* ---------- Router por hash ---------- */
  const ROUTES = {
    inicio: 'inicio', simulador: 'simulador', resultados: 'resultados', ruta: 'ruta', actividad: 'actividad',
    vias: 'vias', especialidades: 'especialidades', comparador: 'comparador', convocatorias: 'convocatorias', organismos: 'organismos', fuentes: 'fuentes'
  };
  App.go = hash => { if (location.hash === hash) App.route(); else location.hash = hash; };
  App.route = () => {
    const parts = (location.hash.replace(/^#\/?/, '') || 'inicio').split('/');
    const name = ROUTES[parts[0]] ? parts[0] : 'inicio';
    App.current = name;
    const view = App.$('#view');
    view.classList.remove('view'); void view.offsetWidth; view.classList.add('view');
    document.body.classList.remove('nav-open');
    App.$('#crumb').textContent = App.t(name);
    document.title = `${App.t(name)} · Vías a la docencia`;
    App.renderNav();
    try { App.views[name](view, parts.slice(1)); }
    catch (err) { console.error(err); view.innerHTML = `<div class="notice">${App.icon('alert')} Error al mostrar esta sección: ${App.esc(err.message)}</div>`; }
    window.scrollTo({ top: 0 });
    view.focus({ preventScroll: true });
  };

  App.renderNav = () => {
    const nav = App.$('#nav');
    if (!nav) return;
    const hasPerfil = !!App.state.perfil;
    const item = (r, ic, extra = '') => `<a class="nav-link ${App.current === r ? 'active' : ''}" href="#/${r}">${App.icon(ic)}<span>${App.t(r)}</span>${extra}</a>`;
    nav.innerHTML = `
      <div class="nav-group">${item('inicio', 'home')}</div>
      <div class="nav-group"><div class="nav-group-title">${App.t('grpCaso')}</div>
        ${item('simulador', 'user', hasPerfil ? '<span class="dot" title="Perfil completado"></span>' : '')}
        ${item('resultados', 'target')}${item('ruta', 'flag')}${item('actividad', 'clipboard')}</div>
      <div class="nav-group"><div class="nav-group-title">${App.t('grpExplorar')}</div>
        ${item('vias', 'route')}${item('especialidades', 'graduation')}${item('comparador', 'columns')}</div>
      <div class="nav-group"><div class="nav-group-title">${App.t('grpConsultar')}</div>
        ${item('convocatorias', 'calendar')}${item('organismos', 'landmark')}${item('fuentes', 'shield')}</div>`;
    App.$$('#modeSwitch button').forEach(b => b.classList.toggle('on', b.dataset.mode === App.state.modo));
  };

  App.setModo = m => {
    App.state.modo = m;
    document.body.classList.toggle('aula', m === 'aula');
    App.store.pref('modo', m);
    App.renderNav();
    if (App.current === 'vias' || App.current === 'inicio') App.route();
  };

  App.setTheme = th => {
    document.documentElement.dataset.theme = th;
    App.store.pref('theme', th);
    const b = App.$('#themeBtn');
    if (b) b.innerHTML = App.icon(th === 'light' ? 'moon' : 'sun') + `<span class="sr-only">Cambiar tema</span>`;
    if (App.current === 'vias') setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
  };

  /* ---------- Requiere perfil ---------- */
  App.needPerfil = (view, what) => {
    view.innerHTML = `<div class="glass panel" style="text-align:center;max-width:640px;margin:30px auto">
      <div class="tile" style="--tc:var(--c-esp);margin:0 auto 14px">${App.icon('user')}</div>
      <h2>Primero, cuéntanos tu perfil</h2>
      <p class="muted">${App.esc(what)} se calcula a partir de tu titulación, formación pedagógica, experiencia e idiomas.</p>
      <div class="row" style="justify-content:center"><a class="btn cta lg" href="#/simulador">${App.icon('play')} Comprobar mi acceso</a>
      <button class="btn" data-demo>Probar con un perfil de ejemplo</button></div></div>`;
    App.$('[data-demo]', view).onclick = () => App.go('#/inicio');
  };
})();
