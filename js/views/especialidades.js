/* Explorador de especialidades docentes con buscador, filtros, ficha y comparación. */
(function () {
  'use strict';
  const App = window.App, { esc, icon } = App;
  const FUENTE = { verificado: ['verificado', 'LISTADO VERIFICADO'], parcial: ['condicionado', 'LISTADO PARCIAL'], no_verificado: ['no_verificado', 'TITULACIONES NO DETALLADAS'] };

  let INDEX = null;
  function indice() {
    if (INDEX) return INDEX;
    const D = App.data; INDEX = {};
    D.especialidades.especialidades.forEach(e => {
      const corrs = D.correspondencias.correspondencias.filter(c => c.especialidades.includes(e.id) || (c.especialidades.includes('cuerpo:0590') && e.cuerpo === '0590'));
      const titulos = new Set(), ambitos = new Set(), ramas = new Set();
      corrs.forEach(c => { (c.titulos || []).forEach(t => titulos.add(t)); (c.ambitos || []).forEach(a => { ambitos.add(a); const am = D.idx.ambitos[a]; if (am) ramas.add(am.rama); }); });
      const fam = e.familia ? (D.idx.familias[e.familia] || {}).nombre : '';
      INDEX[e.id] = {
        corrs, ramas,
        text: App.norm([e.id, e.nombre, e.sector, fam, (D.idx.cuerpos[e.cuerpo] || {}).nombre, e.titulacionesTexto,
          ...[...titulos].map(t => (D.idx.titulaciones[t] || {}).nombre), ...[...ambitos].map(a => (D.idx.ambitos[a] || {}).nombre)].join(' '))
      };
    });
    return INDEX;
  }

  App.fichaEsp = id => {
    const D = App.data, e = D.idx.especialidades[id];
    if (!e) return;
    const ix = indice()[id], cu = D.idx.cuerpos[e.cuerpo];
    const mine = App.state.resultado && App.state.resultado.especialidades.find(x => x.esp.id === id);
    const corrRows = ix.corrs.map(c => {
      const quien = [...(c.titulos || []).map(t => (D.idx.titulaciones[t] || {}).nombre), ...(c.ambitos || []).map(a => 'Grados del ámbito ' + (D.idx.ambitos[a] || {}).nombre), ...(c.niveles ? ['Nivel: ' + c.niveles.join(', ')] : []), ...(c.expFamilias ? ['Experiencia en: ' + c.expFamilias.map(f => (D.idx.familias[f] || {}).nombre).join(', ')] : [])];
      const cond = c.condicion ? D.correspondencias.condiciones[c.condicion.tipo] : null;
      return `<tr><td>${App.badge(c.estado)}</td><td class="small">${quien.map(esc).join('; ')}</td><td class="small">${cond ? esc(cond.nombre) : '—'}</td><td class="small">${esc(c.articulo)}<br><span class="tiny muted">Ref. ${c.id} · ${esc(D.correspondencias._meta.fechaConsulta)}</span></td></tr>`;
    }).join('');
    App.modal(`<span class="tile" style="--tc:var(--c-esp)">${icon('graduation')}</span><div><div class="tiny muted" style="font-weight:700">${esc(e.id)} · CATEGORÍA ${esc(e.categoria)}</div><h2 style="margin:0">${esc(e.nombre)}</h2><div class="row" style="margin-top:6px">${App.badge(FUENTE[e.estadoFuente][0], FUENTE[e.estadoFuente][1])}${mine ? App.badge(mine.estado, 'TU PERFIL: ' + App.badge(mine.estado).replace(/<[^>]+>/g, '')) : ''}</div></div>`,
      `<dl class="kv"><dt>Nombre oficial</dt><dd>${esc(e.nombre)} (${esc(e.id)})</dd>
        <dt>Cuerpo docente</dt><dd>${esc(cu ? cu.nombre + ' · ' + cu.grupo : e.cuerpo)}</dd>
        <dt>Titulaciones admitidas</dt><dd>${esc(e.titulacionesTexto)}</dd>
        <dt>Formación pedagógica</dt><dd>${esc(e.pedagogica)}</dd>
        <dt>Requisitos de experiencia</dt><dd>${esc(e.experiencia)}</dd>
        <dt>Requisitos lingüísticos</dt><dd>${esc(e.linguistico)}</dd>
        <dt>Vías de acceso</dt><dd class="row">${e.vias.map(v => { const vv = D.idx.vias[v]; return `<a class="chip" href="#/vias/${v}" data-close><span class="sw" style="--sw:${App.viaColor(vv)}"></span>${esc(vv.corto)}</a>`; }).join('')}</dd>
        <dt>Normativa de referencia</dt><dd>${e.normativa.map(n => App.norma(n)).join('<br>')}</dd>
        <dt>Fuente oficial</dt><dd>${App.link('interinos')}</dd>
        <dt>Observaciones</dt><dd>${esc(e.observaciones || '—')}</dd></dl>
      ${corrRows ? `<h3 class="mt">Correspondencias registradas</h3><div class="table-wrap"><table class="t"><thead><tr><th>Estado</th><th>Titulación / criterio</th><th>Condición</th><th>Fuente</th></tr></thead><tbody>${corrRows}</tbody></table></div>` : '<div class="notice mt">' + icon('help') + '<div>Sin correspondencias registradas en la base documental para esta especialidad: <b>correspondencia pendiente de verificación oficial</b>.</div></div>'}`);
  };

  App.views.especialidades = view => {
    const D = App.data, R = App.state.resultado;
    const F = App.state.fEsp = App.state.fEsp || { q: '', cat: '', cuerpo: '', familia: '', rama: '', mias: false };
    const ix = indice();
    const familiasUsadas = [...new Set(D.especialidades.especialidades.map(e => e.familia).filter(Boolean))].map(f => D.idx.familias[f]).filter(Boolean).sort((a, b) => a.nombre.localeCompare(b.nombre));
    const sel = (k, opts, ph) => `<select class="input" data-f="${k}"><option value="">${ph}</option>${opts.map(o => `<option value="${esc(o.id)}" ${F[k] === o.id ? 'selected' : ''}>${esc(o.nombre)}</option>`).join('')}</select>`;

    view.innerHTML = `<div class="section-head"><div><h1 style="font-size:1.7rem">¿A qué especialidades puedo acceder?</h1><p>Busca por titulación, familia, rama, especialidad, cuerpo o sector.</p></div></div>
      <div class="glass panel mb"><div class="filters">
        <div class="field"><label for="q">Buscar</label><div class="ac"><input id="q" class="input" type="search" placeholder="p. ej. Psicología, Automoción, 0590105, Sanidad…" value="${esc(F.q)}"></div></div>
        <div class="field"><label>Cuerpo</label>${sel('cuerpo', D.especialidades.cuerpos, 'Todos')}</div>
        <div class="field"><label>Familia / sector</label>${sel('familia', familiasUsadas, 'Todas')}</div>
        <div class="field"><label>Rama universitaria</label>${sel('rama', D.titulaciones.ramas, 'Todas')}</div>
        <label class="check ${F.mias ? 'on' : ''}" style="padding:10px 12px" title="${R ? '' : 'Completa tu perfil para usar este filtro'}"><input type="checkbox" id="mias" ${F.mias ? 'checked' : ''} ${R ? '' : 'disabled'}><span><b>Solo compatibles</b><span>con mi titulación</span></span></label>
      </div></div>
      <div class="pill-tabs mb" role="tablist"><button data-cat="" class="${!F.cat ? 'on' : ''}">Todas</button>${D.especialidades.categorias.map(c => `<button data-cat="${c.id}" class="${F.cat === c.id ? 'on' : ''}" title="${esc(c.detalle)}">${c.id}. ${esc(c.nombre)}</button>`).join('')}</div>
      <div id="espList"></div><div id="cmpBar"></div>`;

    const list = App.$('#espList', view);
    const draw = () => {
      const q = App.norm(F.q).split(/\s+/).filter(Boolean);
      const mineMap = R ? App.by(R.especialidades.filter(x => !x.sintetico).map(x => ({ id: x.esp.id, estado: x.estado }))) : {};
      const items = D.especialidades.especialidades.filter(e =>
        (!F.cat || e.categoria === F.cat) && (!F.cuerpo || e.cuerpo === F.cuerpo) && (!F.familia || e.familia === F.familia || (e.familiasSector || []).includes(F.familia)) &&
        (!F.rama || ix[e.id].ramas.has(F.rama)) && (!F.mias || mineMap[e.id]) && q.every(w => ix[e.id].text.includes(w)));
      const groups = D.especialidades.categorias.map(c => ({ c, es: items.filter(e => e.categoria === c.id) })).filter(g => g.es.length);
      list.innerHTML = groups.length ? groups.map(g => `<div class="section-head"><div><h2>${g.c.id}. ${esc(g.c.nombre)}</h2><p>${esc(g.c.detalle)} · ${g.es.length}</p></div></div>
        <div class="grid auto mb">${g.es.map(e => {
          const m = mineMap[e.id], cu = D.idx.cuerpos[e.cuerpo];
          return `<article class="card click edge" style="--edge:${e.cuerpo === '0598' || e.categoria === 'D' ? 'var(--c-fp)' : 'var(--c-esp)'}" data-open="${esc(e.id)}" tabindex="0" role="button">
            <div class="card-head"><div class="grow"><div class="tiny muted" style="font-weight:700">${esc(e.id)} · ${esc(cu ? cu.nombre : '')}</div><h3>${esc(e.nombre)}</h3><p class="small muted" style="margin:0">${esc(e.sector)}</p></div></div>
            <div class="row" style="margin-top:10px">${App.badge(FUENTE[e.estadoFuente][0], FUENTE[e.estadoFuente][1])}${m ? App.badge(m.estado, 'TU PERFIL: ' + { verificado: 'VERIFICADO', condicionado: 'CONDICIONADO', no_verificado: 'NO VERIFICADO' }[m.estado]) : ''}</div>
            <label class="row small" style="margin-top:12px;gap:8px;cursor:pointer" data-stop><input type="checkbox" data-cmp="${esc(e.id)}" ${App.state.cmpEsp.includes(e.id) ? 'checked' : ''}> Comparar</label></article>`;
        }).join('')}</div>`).join('') : `<div class="glass panel" style="text-align:center"><p>No hay especialidades con estos filtros.</p><p class="small muted">Si tu titulación no aparece, puede que la base documental no la recoja: <b>correspondencia pendiente de verificación oficial</b>.</p></div>`;
      App.$$('[data-open]', list).forEach(c => { c.onclick = ev => { if (ev.target.closest('[data-stop]')) return; App.fichaEsp(c.dataset.open); }; c.onkeydown = ev => { if (ev.key === 'Enter') App.fichaEsp(c.dataset.open); }; });
      App.$$('[data-cmp]', list).forEach(cb => cb.onchange = () => {
        const a = App.state.cmpEsp, i = a.indexOf(cb.dataset.cmp);
        if (cb.checked && i < 0) { if (a.length >= 4) { cb.checked = false; App.toast('Máximo 4 especialidades'); return; } a.push(cb.dataset.cmp); }
        if (!cb.checked && i >= 0) a.splice(i, 1);
        bar();
      });
      bar();
    };
    const bar = () => {
      const a = App.state.cmpEsp, el = App.$('#cmpBar', view);
      el.innerHTML = a.length ? `<div class="glass compare-bar"><b>${a.length} seleccionada(s)</b><span class="small muted">${a.map(esc).join(' · ')}</span><span style="flex:1"></span><button class="btn sm ghost" data-clear>Limpiar</button><button class="btn sm cta" data-go ${a.length < 2 ? 'disabled' : ''}>${icon('columns')} Comparar</button></div>` : '';
      if (!a.length) return;
      App.$('[data-clear]', el).onclick = () => { App.state.cmpEsp = []; draw(); };
      App.$('[data-go]', el).onclick = comparar;
    };
    const comparar = () => {
      const es = App.state.cmpEsp.map(id => D.idx.especialidades[id]);
      const rows = [['Cuerpo', e => (D.idx.cuerpos[e.cuerpo] || {}).nombre], ['Categoría', e => e.categoria], ['Titulaciones admitidas', e => e.titulacionesTexto], ['Formación pedagógica', e => e.pedagogica], ['Experiencia', e => e.experiencia], ['Catalán', e => e.linguistico], ['Vías', e => e.vias.map(v => D.idx.vias[v].corto).join(', ')], ['Fiabilidad de la fuente', e => FUENTE[e.estadoFuente][1]]];
      if (R) rows.push(['Tu perfil', e => { const m = R.especialidades.find(x => x.esp.id === e.id); return m ? m.estado.replace('_', ' ').toUpperCase() : 'Sin correspondencia'; }]);
      App.modal(`<div><h2 style="margin:0">Comparar especialidades</h2><p class="small muted" style="margin:0">Las celdas marcadas difieren entre las especialidades.</p></div>`,
        `<div class="table-wrap"><table class="t"><thead><tr><th></th>${es.map(e => `<th>${esc(e.id)}<br>${esc(e.nombre)}</th>`).join('')}</tr></thead><tbody>${rows.map(([l, f]) => { const vals = es.map(f); const diff = new Set(vals).size > 1; return `<tr><th class="rowh">${l}</th>${vals.map(v => `<td class="${diff ? 'diff' : ''} small">${esc(v)}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div>`);
    };
    App.$('#q', view).oninput = e => { F.q = e.target.value; draw(); };
    App.$$('[data-f]', view).forEach(s => s.onchange = () => { F[s.dataset.f] = s.value; draw(); });
    App.$$('[data-cat]', view).forEach(b => b.onclick = () => { F.cat = b.dataset.cat; App.$$('[data-cat]', view).forEach(x => x.classList.toggle('on', x === b)); draw(); });
    const m = App.$('#mias', view); m.onchange = () => { F.mias = m.checked; m.closest('.check').classList.toggle('on', m.checked); draw(); };
    draw();
  };
})();
