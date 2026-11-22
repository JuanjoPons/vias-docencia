/* Arranque: carga de datos (bundle.js o JSON), índices, preferencias y router. */
(function () {
  'use strict';
  const App = window.App;
  const FILES = ['titulaciones', 'especialidades', 'correspondencias', 'vias', 'requisitos', 'normativa', 'convocatorias', 'organismos', 'perfiles'];

  async function cargar() {
    if (window.APP_DATA) return window.APP_DATA;
    // Sin bundle: carga directa de los JSON (requiere servidor web)
    const out = {};
    await Promise.all(FILES.map(async f => { const r = await fetch(`data/${f}.json`); if (!r.ok) throw new Error(f + '.json'); out[f] = await r.json(); }));
    return out;
  }

  function indices(D) {
    // Nota: familias de FP (ADG, HOT…) y familias de vías (publica, interinidad…) comparten índice; sus id no coinciden.
    D.idx = {
      titulaciones: App.by(D.titulaciones.titulaciones), ambitos: App.by(D.titulaciones.ambitos),
      familias: { ...App.by(D.titulaciones.familias), ...App.by(D.vias.familias) },
      especialidades: App.by(D.especialidades.especialidades), cuerpos: App.by(D.especialidades.cuerpos),
      vias: App.by(D.vias.vias), requisitos: App.by(D.requisitos.requisitos), normativa: App.by(D.normativa.normativa),
      organismos: App.by(D.organismos.organismos)
    };
  }

  function shell() {
    App.$('#modeSwitch').innerHTML = ['aula', 'alumno'].map(m => `<button data-mode="${m}">${App.icon(m === 'aula' ? 'present' : 'user')} ${App.t(m)}</button>`).join('');
    App.$$('#modeSwitch button').forEach(b => b.onclick = () => App.setModo(b.dataset.mode));
    App.$('#themeBtn').onclick = () => App.setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
    App.$('#menuBtn').onclick = () => document.body.classList.toggle('nav-open');
    document.addEventListener('click', e => { if (document.body.classList.contains('nav-open') && !e.target.closest('.sidebar') && !e.target.closest('#menuBtn')) document.body.classList.remove('nav-open'); });
    App.$('#clearBtn').onclick = () => {
      if (!confirm('¿Borrar tu perfil y tus respuestas de este navegador?')) return;
      App.store.clear(); App.state.consent = false; App.state.perfil = null; App.state.resultado = null; App.state.borrador = null; App.state.actividad = {}; App.state.paso = 1;
      App.toast('Datos borrados'); App.go('#/inicio');
    };
    App.$$('#langSel [data-lang]').forEach(b => b.onclick = () => { if (b.dataset.lang !== App.lang) App.toast('La versión en catalán estará disponible próximamente'); });
  }

  async function init() {
    App.setTheme(App.store.pref('theme') || 'dark');
    try {
      App.data = await cargar();
      indices(App.data);
    } catch (err) {
      App.$('#view').innerHTML = `<div class="notice">${App.icon('alert')}<div><b>No se han podido cargar los datos.</b> Ejecuta <code>node tools/build-data.mjs</code> para generar <code>data/bundle.js</code>, o abre la web desde un servidor local. (${App.esc(err.message)})</div></div>`;
      return;
    }
    shell();
    const m = App.store.pref('modo'); if (m === 'aula' || m === 'alumno') { App.state.modo = m; document.body.classList.toggle('aula', m === 'aula'); }
    const saved = App.store.get();
    if (saved && saved.consent) {
      App.state.consent = true; App.state.actividad = saved.actividad || {};
      if (saved.perfil) { try { App.setPerfil(saved.perfil, true); } catch (e) { console.warn('Perfil guardado no válido', e); } }
    }
    window.addEventListener('hashchange', App.route);
    App.route();
  }
  init();
})();
