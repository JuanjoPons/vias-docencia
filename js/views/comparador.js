/* Comparador de vías (hasta 4) con diferencias y requisitos que el usuario ya cumple. */
(function () {
  'use strict';
  const App = window.App, { esc, icon } = App;
  const FILAS = [
    ['Titulación', v => v.ficha.titulaciones, 'titulacion'],
    ['Formación pedagógica', v => v.ficha.pedagogica, 'pedagogica'],
    ['Experiencia profesional', v => v.ficha.experiencia, 'experiencia'],
    ['Catalán', v => v.ficha.linguistico, 'linguistico'],
    ['Procedimiento', v => v.ficha.procedimiento.join(' → '), 'procedimiento'],
    ['Tipo de centro', v => v.matriz.centro, null],
    ['Organismo responsable', v => (App.data.idx.organismos[v.ficha.organismo] || {}).nombre, null]
  ];
  const KEYS = { titulacion: 'titulacion', pedagogica: 'pedagogica', experiencia: 'experiencia', linguistico: 'catalan', procedimiento: 'modo' };

  App.cmpTable = ids => {
    const D = App.data, R = App.state.resultado;
    const vs = ids.map(id => D.idx.vias[id]);
    const mio = (v, grupo) => {
      if (!R || !grupo) return '';
      const ev = R.vias.find(x => x.via.id === v.id);
      if (ev.estado === 'no_aplica') return `<div class="tiny muted mt">${App.stIco('no_aplica')} No aplica a tu perfil</div>`;
      const rs = ev.requisitos.filter(r => (D.idx.requisitos[r.id] || {}).grupo === grupo);
      if (!rs.length) return '';
      const peor = ['pendiente', 'comprobar', 'opcional', 'cumplido'].find(s => rs.some(r => r.estado === s));
      const txt = { cumplido: 'Lo cumples', pendiente: 'Te falta', comprobar: 'Por comprobar', opcional: 'No imprescindible' }[peor];
      return `<div class="row small" style="margin-top:8px;gap:6px;font-weight:700">${App.stIco(peor)} ${txt}</div>`;
    };
    return `<div class="table-wrap glass"><table class="t"><thead><tr><th class="rowh">Vía de acceso</th>${vs.map(v => `<th style="border-top:3px solid ${App.viaColor(v)}"><a href="#/vias/${v.id}">${esc(v.corto)}</a>${R ? '<div style="margin-top:6px">' + App.badge(R.vias.find(x => x.via.id === v.id).estado) + '</div>' : ''}</th>`).join('')}</tr></thead>
      <tbody>${FILAS.map(([l, f, g]) => {
        const k = KEYS[g];
        const cmpVals = vs.map(v => k ? v.matriz[k] : f(v));
        const diff = vs.length > 1 && new Set(cmpVals).size > 1;
        return `<tr><th class="rowh">${l}${diff ? `<div class="tiny" style="color:var(--c-warn);font-weight:700">DIFERENTE</div>` : ''}</th>${vs.map(v => `<td class="small ${diff ? 'diff' : ''}">${esc(f(v))}${mio(v, g === 'procedimiento' ? null : g)}</td>`).join('')}</tr>`;
      }).join('')}</tbody></table></div>`;
  };

  App.views.comparador = view => {
    const D = App.data;
    const sel = App.state.cmpVias.length ? App.state.cmpVias : (App.state.cmpVias = ['opos0590', 'gradosABC']);
    const draw = () => {
      view.innerHTML = `<div class="section-head"><div><h1 style="font-size:1.7rem">Comparador de vías de acceso</h1><p>Selecciona de 2 a 4 vías. Se destacan las diferencias${App.state.resultado ? ' y lo que ya cumples' : ''}.</p></div>
        <a class="btn sm" href="#/vias/matriz">${icon('columns')} Matriz de todas las vías</a></div>
        <div class="row mb">${D.vias.vias.map(v => `<button class="chip ${sel.includes(v.id) ? 'on' : ''}" data-v="${v.id}"><span class="sw" style="--sw:${App.viaColor(v)}"></span>${esc(v.corto)}</button>`).join('')}</div>
        ${!App.state.resultado ? `<div class="notice info mb">${icon('info')}<div class="small"><a href="#/simulador">Completa tu perfil</a> para ver qué requisitos ya cumples en cada vía.</div></div>` : ''}
        ${sel.length ? App.cmpTable(sel) : '<p class="muted">Selecciona al menos una vía.</p>'}`;
      App.$$('[data-v]', view).forEach(b => b.onclick = () => {
        const i = sel.indexOf(b.dataset.v);
        if (i >= 0) sel.splice(i, 1); else if (sel.length < 4) sel.push(b.dataset.v); else App.toast('Máximo 4 vías');
        draw();
      });
    };
    draw();
  };
})();
