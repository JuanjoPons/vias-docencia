/* «Explora las vías de acceso»: mapa general, recorrido interactivo por vía (modo aula / alumno) y matriz comparativa. */
(function () {
  'use strict';
  const App = window.App, { esc, icon } = App;
  const st = { node: null, revealed: null, via: null };

  const MATRIZ = {
    experiencia: { si: ['y', 'alert', 'Obligatoria'], no: ['n', 'check', 'No exigida'], cond: ['c', 'help', 'Según título'] },
    catalan: { si: ['y', 'alert', 'CCS obligatorio'], flex: ['f', 'info', 'Flexible'], no: ['n', 'check', 'No exigido'], cond: ['c', 'help', 'Según centro o convocatoria'] }
  };

  App.fichaViaHtml = v => {
    const f = v.ficha, org = App.data.idx.organismos[f.organismo];
    const salidas = v.diagrama.nodos.filter(n => n.tipo === 'resultado').map(n => n.titulo);
    const items = [
      ['users', 'A quién va dirigida', esc(f.destinatarios)],
      ['graduation', 'Titulaciones requeridas', esc(f.titulaciones)],
      ['book', 'Formación pedagógica', esc(f.pedagogica)],
      ['briefcase', 'Experiencia profesional', esc(f.experiencia)],
      ['lang', 'Requisitos lingüísticos', esc(f.linguistico)],
      ['file', 'Documentación necesaria', `<ul style="margin:0;padding-left:18px">${f.documentacion.map(d => `<li>${esc(d)}</li>`).join('')}</ul>`],
      ['clipboard', 'Procedimiento', `<ol style="margin:0;padding-left:18px">${f.procedimiento.map(d => `<li>${esc(d)}</li>`).join('')}</ol>`],
      ['landmark', 'Organismo responsable', org ? `<a href="#/organismos/${org.id}">${esc(org.nombre)}</a>` : '—'],
      ['external', 'Enlaces oficiales', f.enlaces.map(k => App.link(k)).join('<br>')],
      ['award', 'Salidas profesionales', esc(salidas.join(' · '))],
      ['shield', 'Normativa aplicable', f.normativa.map(n => App.norma(n)).join('<br>')]
    ];
    return `<div class="grid g2">${items.map((it, i) => `<div class="card" style="padding:14px"><div class="row" style="gap:10px;margin-bottom:6px"><span class="tile sm" style="--tc:${App.viaColor(v)}">${icon(it[0])}</span><b class="small">${i < 9 ? (i + 1) + '. ' : ''}${it[1]}</b></div><div class="small">${it[2]}</div></div>`).join('')}</div>
      ${f.nota ? `<div class="notice info mt">${icon('info')}<div class="small">${esc(f.nota)}</div></div>` : ''}`;
  };

  App.fichaVia = id => {
    const v = App.data.idx.vias[id];
    App.modal(`<span class="tile" style="--tc:${App.viaColor(v)}">${icon(v.icono)}</span><div><div class="tiny muted" style="font-weight:700">${esc(App.data.idx.familias[v.familia].nombre.toUpperCase())}</div><h2 style="margin:0">${esc(v.nombre)}</h2><p class="small muted" style="margin:0">${esc(v.lema)}</p></div>`,
      `${App.fichaViaHtml(v)}<div class="row mt"><a class="btn primary" href="#/vias/${v.id}" data-close>${icon('route')} Ver el diagrama</a><button class="btn" data-check="${v.id}">${icon('user')} Comprobar mi perfil</button></div>`,
      m => { App.$('[data-check]', m).onclick = () => { App.closeModal(); App.comprobarVia(v.id); }; });
  };

  App.comprobarVia = id => {
    const R = App.state.resultado;
    if (!R) { App.state.volverA = '#/vias/' + id; App.toast('Completa tu perfil y volverás a esta vía'); App.go('#/simulador'); return; }
    const ev = R.vias.find(x => x.via.id === id);
    App.modal(`<div><div class="tiny muted" style="font-weight:700">TU PERFIL EN ESTA VÍA</div><h2 style="margin:0">${esc(ev.via.corto)}</h2></div>`, App.viaCard(ev));
  };

  App.views.vias = (view, args) => {
    const D = App.data;
    const sub = args[0] || (App.state.modo === 'aula' ? D.vias.vias[0].id : 'mapa');
    const tab = sub === 'mapa' ? 'mapa' : sub === 'matriz' ? 'matriz' : 'via';
    const aula = App.state.modo === 'aula';
    const head = `<div class="section-head"><div><h1 style="font-size:1.7rem">Explora las vías de acceso</h1><p>${aula ? 'Modo aula: proyecta y explica cada recorrido etapa a etapa.' : 'Modo alumno: los diagramas muestran tu situación en cada etapa.'}</p></div>
      <div class="row"><div class="mode-switch" style="width:220px">${['aula', 'alumno'].map(m => `<button data-m="${m}" class="${App.state.modo === m ? 'on' : ''}">${icon(m === 'aula' ? 'present' : 'user')} ${m === 'aula' ? 'Aula' : 'Alumno'}</button>`).join('')}</div></div></div>
      <div class="pill-tabs mb" role="tablist"><a role="tab" href="#/vias/mapa" class="${tab === 'mapa' ? 'on' : ''}">${icon('map')} Mapa general</a><a role="tab" href="#/vias/${tab === 'via' ? sub : D.vias.vias[0].id}" class="${tab === 'via' ? 'on' : ''}">${icon('route')} Recorrido por vía</a><a role="tab" href="#/vias/matriz" class="${tab === 'matriz' ? 'on' : ''}">${icon('columns')} Matriz comparativa</a></div>`;
    view.innerHTML = head + '<div id="vbody"></div>';
    App.$$('[data-m]', view).forEach(b => b.onclick = () => App.setModo(b.dataset.m));
    const body = App.$('#vbody', view);
    if (tab === 'mapa') mapa(body);
    else if (tab === 'matriz') matriz(body);
    else recorrido(body, D.idx.vias[sub] || D.vias.vias[0]);
  };

  /* ---------- Recorrido por vía ---------- */
  function recorrido(body, via) {
    const D = App.data, vias = D.vias.vias, aula = App.state.modo === 'aula';
    if (st.via !== via.id) { st.via = via.id; st.node = via.diagrama.nodos[0].id; st.revealed = aula ? 1 : null; }
    if (!aula) st.revealed = null; else if (st.revealed == null) st.revealed = 1;
    const ev = App.state.resultado && !aula ? App.state.resultado.vias.find(x => x.via.id === via.id) : null;
    const maxPaso = Math.max(...via.diagrama.nodos.map(n => n.paso));
    const i = vias.indexOf(via), color = App.viaColor(via), fam = D.idx.familias[via.familia];

    body.innerHTML = `<nav class="via-tabs" aria-label="Vías">${vias.map(v => `<a class="via-tab ${v.id === via.id ? 'on' : ''}" style="--vc:${App.viaColor(v)}" href="#/vias/${v.id}"><span class="sw"></span>${esc(v.corto)}</a>`).join('')}</nav>
      <div class="dg-layout">
        <section class="glass dg-stage" style="--via:${color}">
          <div class="dg-head"><span class="tile" style="--tc:${color}">${icon(via.icono)}</span>
            <div style="flex:1;min-width:200px"><div class="tiny muted" style="font-weight:700">${esc(fam.nombre.toUpperCase())} · VÍA ${i + 1} DE ${vias.length}</div><h2 style="margin:0">${esc(via.nombre)}</h2><p class="small muted" style="margin:0">${esc(via.lema)}</p></div>
            ${ev ? App.badge(ev.estado) : ''}
          </div>
          <div class="row mb no-print">
            <button class="btn sm" data-present>${icon('expand')} ${document.body.classList.contains('presenting') ? 'Salir de presentación' : 'Presentar'}</button>
            <button class="btn sm" data-check>${icon('user')} Comprobar mi perfil en esta vía</button>
            <button class="btn sm" data-ficha>${icon('info')} Ficha completa</button>
            <span style="flex:1"></span>
            <a class="btn sm icon" href="#/vias/${vias[(i - 1 + vias.length) % vias.length].id}" aria-label="Vía anterior">${icon('chevL')}</a>
            <a class="btn sm icon" href="#/vias/${vias[(i + 1) % vias.length].id}" aria-label="Vía siguiente">${icon('chevR')}</a>
          </div>
          <div id="dgHost"></div>
          <div class="dg-controls">
            ${aula ? `<span class="chip">${icon('layers')} Etapa ${st.revealed} de ${maxPaso}</span>
              <button class="btn sm" data-rev="-1" ${st.revealed <= 1 ? 'disabled' : ''}>${icon('chevL')} Etapa anterior</button>
              <button class="btn sm primary" data-rev="1" ${st.revealed >= maxPaso ? 'disabled' : ''}>Siguiente etapa ${icon('chevR')}</button>
              <button class="btn sm ghost" data-rev="all">Mostrar todo</button>`
              : `<div class="legend"><span><span class="badge info" style="padding:1px 6px">OBLIGATORIO</span></span><span><span class="badge warn" style="padding:1px 6px">CONDICIONAL</span></span><span>— — rama condicional</span>${ev ? '<span>Las etiquetas inferiores muestran tu situación</span>' : '<span><a href="#/simulador">Completa tu perfil</a> para ver tu situación en cada etapa</span>'}</div>`}
          </div>
        </section>
        <aside class="glass dg-detail" id="dgDetail" aria-live="polite"></aside>
      </div>
      <div class="section-head mt"><div><h2>Ficha de la vía</h2><p>Toda la información de referencia en un vistazo.</p></div></div>
      ${App.fichaViaHtml(via)}`;

    const host = App.$('#dgHost', body), det = App.$('#dgDetail', body);
    const showDetail = () => {
      det.innerHTML = App.Diagram.detail(via, st.node, ev);
      App.$$('[data-step]', det).forEach(b => b.onclick = () => select(via.diagrama.nodos[+b.dataset.step].id));
    };
    const draw = animate => App.Diagram.render(host, via, { estadoVia: ev, revealed: st.revealed, selected: st.node, animate, onSelect: select });
    function select(id) {
      st.node = id;
      const n = via.diagrama.nodos.find(x => x.id === id);
      if (st.revealed != null && n.paso > st.revealed) st.revealed = n.paso;
      draw(false); showDetail(); syncCtl();
    }
    function syncCtl() {
      const c = App.$('.chip', App.$('.dg-controls', body));
      if (c && aula) c.innerHTML = `${icon('layers')} Etapa ${st.revealed} de ${maxPaso}`;
      App.$$('[data-rev]', body).forEach(b => { if (b.dataset.rev === '-1') b.disabled = st.revealed <= 1; if (b.dataset.rev === '1') b.disabled = st.revealed >= maxPaso; });
    }
    const step = d => {
      if (d === 'all') st.revealed = maxPaso; else st.revealed = Math.min(maxPaso, Math.max(1, st.revealed + d));
      const first = via.diagrama.nodos.find(n => n.paso === st.revealed);
      if (first && d !== 'all') st.node = first.id;
      draw(true); showDetail(); syncCtl();
    };
    draw(true); showDetail();
    App.$$('[data-rev]', body).forEach(b => b.onclick = () => step(b.dataset.rev === 'all' ? 'all' : +b.dataset.rev));
    App.$('[data-check]', body).onclick = () => App.comprobarVia(via.id);
    App.$('[data-ficha]', body).onclick = () => App.fichaVia(via.id);
    App.$('[data-present]', body).onclick = () => {
      const on = !document.body.classList.contains('presenting');
      document.body.classList.toggle('presenting', on);
      if (on) { if (App.state.modo !== 'aula') App.setModo('aula'); try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); } catch { } }
      else { try { document.fullscreenElement && document.exitFullscreen(); } catch { } }
      App.route();
    };
    App._viaKeys = e => {
      if (App.current !== 'vias' || e.target.closest('input,select,textarea') || App.$('.modal-scrim')) return;
      if (aula && (e.key === 'ArrowRight' || e.key === ' ')) { e.preventDefault(); if (st.revealed < maxPaso) step(1); else App.go('#/vias/' + vias[(i + 1) % vias.length].id); }
      if (aula && e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      if (e.key === 'Escape' && document.body.classList.contains('presenting')) { document.body.classList.remove('presenting'); App.route(); }
    };
  }
  document.addEventListener('keydown', e => App._viaKeys && App._viaKeys(e));
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.body.classList.contains('presenting')) { document.body.classList.remove('presenting'); if (App.current === 'vias') App.route(); } });

  /* ---------- Mapa general ---------- */
  const PERFILES_MAPA = {
    univ: { nombre: 'Universitario/a', perfiles: [{ nivel: 'grado', ambito: 'economia' }, { nivel: 'grado', ambito: 'ing_industrial' }, { nivel: 'grado', ambito: 'biologia' }] },
    ts: { nombre: 'Técnico/a Superior', perfiles: [{ nivel: 'tsfp', titulacionId: 'ts_dir_cocina', exp: { tiene: true, anios: 3, familia: 'HOT' } }, { nivel: 'tsfp', titulacionId: 'ts_asir', exp: { tiene: true, anios: 3, familia: 'IFC' } }] },
    tec: { nombre: 'Técnico/a o certificado profesional', perfiles: [{ nivel: 'otra', otra: 'tecnico', exp: { tiene: true, anios: 3, familia: 'ELE' } }] },
    exp: { nombre: 'Sin titulación, con experiencia', perfiles: [{ nivel: 'otra', otra: 'ninguna', exp: { tiene: true, anios: 5, familia: 'MAP' } }] }
  };
  function viasPara(key) {
    if (key === 'mi') return App.state.resultado ? new Set(App.state.resultado.vias.filter(v => v.estado !== 'no_aplica').map(v => v.via.id)) : null;
    if (!PERFILES_MAPA[key]) return null;
    const s = new Set();
    PERFILES_MAPA[key].perfiles.forEach(p => App.Engine.evaluar({ ped: {}, idiomas: {}, ...p, exp: p.exp || {} }).vias.forEach(v => { if (v.estado !== 'no_aplica') s.add(v.via.id); }));
    return s;
  }
  function mapa(body) {
    const D = App.data;
    let filtro = App.state.resultado ? 'mi' : 'todos';
    const W = 1100, H = 680, cx = 550, cy = 340;
    const ang = { publica: -135, interinidad: -45, laboral: 45, sistemafp: 135 };
    const draw = () => {
      const on = viasPara(filtro);
      let edges = '', nodes = '', hubs = '';
      D.vias.familias.forEach(f => {
        const a0 = ang[f.id] * Math.PI / 180;
        const hx = cx + Math.cos(a0) * 175, hy = cy + Math.sin(a0) * 120;
        const vs = D.vias.vias.filter(v => v.familia === f.id);
        const famOn = !on || vs.some(v => on.has(v.id));
        edges += `<path class="m-edge ${famOn ? 'on' : ''}" style="--ec:${f.color}" d="M${cx},${cy} L${hx},${hy}"/>`;
        vs.forEach((v, k) => {
          const spread = vs.length === 1 ? 0 : (k / (vs.length - 1) - .5) * (vs.length === 3 ? 56 : 40);
          const a = (ang[f.id] + spread) * Math.PI / 180;
          const x = cx + Math.cos(a) * 430, y = cy + Math.sin(a) * 275;
          const isOn = !on || on.has(v.id);
          edges += `<path class="m-edge ${isOn ? 'on' : ''}" style="--ec:${f.color}" d="M${hx},${hy} Q${(hx + x) / 2},${(hy + y) / 2 + (y > cy ? -20 : 20)} ${x},${y}"/>`;
          nodes += `<g class="m-node ${isOn ? '' : 'off'}" style="--ec:${f.color}" tabindex="0" role="button" data-via="${v.id}" aria-label="${esc(v.nombre)}">
            <rect x="${x - 105}" y="${y - 28}" width="210" height="56" rx="16"/><circle cx="${x - 84}" cy="${y}" r="7" fill="${f.color}"/>
            <text x="${x - 68}" y="${y - 3}">${esc(v.corto)}</text><text class="sub" x="${x - 68}" y="${y + 14}">${esc(v.matriz.modo)}</text></g>`;
        });
        hubs += `<g class="m-hub" style="--ec:${f.color}"><circle cx="${hx}" cy="${hy}" r="9"/><text x="${hx}" y="${hy + (hy < cy ? -16 : 26)}" text-anchor="middle">${esc(f.nombre)}</text></g>`;
      });
      const centerLabel = filtro === 'mi' ? 'Tu perfil' : filtro === 'todos' ? 'Tu titulación' : PERFILES_MAPA[filtro].nombre;
      body.innerHTML = `<div class="row mb" role="group" aria-label="Filtrar por perfil académico">
          <span class="small muted" style="font-weight:700">Mostrar vías para:</span>
          ${[['todos', 'Todas'], ['univ', 'Universitario'], ['ts', 'Técnico Superior'], ['tec', 'Técnico / CP'], ['exp', 'Solo experiencia']].map(([k, l]) => `<button class="chip ${filtro === k ? 'on' : ''}" data-fm="${k}">${l}</button>`).join('')}
          ${App.state.resultado ? `<button class="chip ${filtro === 'mi' ? 'on' : ''}" data-fm="mi">${icon('user')} Mi perfil</button>` : ''}</div>
        <div class="glass map-wrap"><svg class="map-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa de vías de acceso a la docencia">
          ${edges}${hubs}
          <g><circle cx="${cx}" cy="${cy}" r="62" fill="var(--surface-solid)" stroke="var(--line-strong)"/><circle cx="${cx}" cy="${cy}" r="70" fill="none" stroke="var(--c-esp)" stroke-dasharray="3 6" opacity=".7"/>
          <text x="${cx}" y="${cy - 4}" text-anchor="middle" style="fill:var(--text);font-weight:800;font-size:15px">${esc(centerLabel)}</text>
          <text x="${cx}" y="${cy + 16}" text-anchor="middle" style="fill:var(--muted);font-size:11px;font-weight:600">${on ? on.size : D.vias.vias.length} vías posibles</text></g>
          ${nodes}</svg></div>
        <div class="legend mt">${D.vias.familias.map(f => `<span><span class="chip"><span class="sw" style="--sw:${f.color}"></span>${esc(f.nombre)}</span></span>`).join('')}<span>Pulsa una vía para abrir su ficha.</span></div>
        ${filtro !== 'todos' && filtro !== 'mi' ? '<p class="tiny muted mt">El filtro se calcula con perfiles tipo y el mismo motor del simulador; no sustituye a la comprobación de tu caso.</p>' : ''}`;
      App.$$('[data-fm]', body).forEach(b => b.onclick = () => { filtro = b.dataset.fm; draw(); });
      App.$$('[data-via]', body).forEach(g => { g.onclick = () => App.fichaVia(g.dataset.via); g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); App.fichaVia(g.dataset.via); } }; });
    };
    draw();
  }

  /* ---------- Matriz ---------- */
  function matriz(body) {
    const D = App.data, R = App.state.resultado;
    const cell = (tipo, val) => { const m = MATRIZ[tipo][val]; return m ? `<span class="${m[0]}">${icon(m[1])} ${m[2]}</span>` : esc(val); };
    body.innerHTML = `<div class="table-wrap glass"><table class="t mx"><thead><tr><th>Vía de acceso</th><th>Titulación</th><th>Formación pedagógica</th><th>Experiencia</th><th>Catalán</th><th>Acceso mediante</th><th>Docencia que permite</th><th>Tipo de centro</th><th>Organismo</th>${R ? '<th>Tu situación</th>' : ''}</tr></thead>
      <tbody>${D.vias.vias.map(v => { const m = v.matriz, ev = R && R.vias.find(x => x.via.id === v.id); return `<tr>
        <td><a href="#/vias/${v.id}" class="row" style="gap:8px;flex-wrap:nowrap;text-decoration:none;color:var(--text)"><span class="chip" style="padding:3px"><span class="sw" style="--sw:${App.viaColor(v)}"></span></span><b>${esc(v.corto)}</b></a></td>
        <td>${esc(m.titulacion)}</td><td>${esc(m.pedagogia)}</td><td>${cell('experiencia', m.experiencia)}</td><td>${cell('catalan', m.catalan)}</td>
        <td><span class="chip">${esc(m.modo)}</span></td><td>${esc(m.docencia)}</td><td>${esc(m.centro)}</td><td>${esc(m.organismo)}</td>${R ? `<td>${App.badge(ev.estado)}</td>` : ''}</tr>`; }).join('')}</tbody></table></div>
      <div class="legend mt"><span><span class="mx"><span class="y">${icon('alert')}</span></span> Requisito exigido</span><span><span class="mx"><span class="n">${icon('check')}</span></span> No exigido</span><span><span class="mx"><span class="c">${icon('help')}</span></span> Depende</span><span><a href="#/comparador">Comparar 2-4 vías en detalle ${icon('arrowR')}</a></span></div>`;
  }
})();
