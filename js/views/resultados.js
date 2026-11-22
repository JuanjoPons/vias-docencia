/* Resultados personalizados («Mis posibilidades») y «Mi hoja de ruta». */
(function () {
  'use strict';
  const App = window.App, { esc, icon } = App;

  const fechaConsulta = () => App.data.correspondencias._meta.fechaConsulta;
  const viaChip = id => { const v = App.data.idx.vias[id]; return v ? `<a class="chip" href="#/vias/${id}"><span class="sw" style="--sw:${App.viaColor(v)}"></span>${esc(v.corto)}</a>` : ''; };

  App.espCard = (e, opts = {}) => {
    const D = App.data, cu = D.idx.cuerpos[e.esp.cuerpo];
    const color = e.estado === 'verificado' ? 'var(--c-ok)' : e.estado === 'condicionado' ? 'var(--c-warn)' : 'var(--c-unv)';
    const fuentes = e.corr ? e.corr.fuente.map(f => App.norma(f, true)).join(' · ') : (e.esp.normativa || []).map(f => App.norma(f, true)).join(' · ');
    return `<article class="card edge" style="--edge:${color}">
      <div class="card-head"><span class="tile sm" style="--tc:var(--c-esp)">${icon('graduation')}</span>
        <div class="grow"><div class="tiny muted" style="font-weight:700">${esc(e.esp.id)} · ${esc(cu ? cu.nombre : '')}</div><h3>${esc(e.esp.nombre)}</h3></div></div>
      <div class="status-line row" style="margin:10px 0">${App.badge(e.estado)}${e.por ? `<span class="chip">${icon('search')} Coincidencia por ${esc(e.por)}</span>` : ''}</div>
      ${e.estado === 'no_verificado' ? `<p class="small"><b>Correspondencia pendiente de verificación oficial.</b> ${e.corr && e.corr.observaciones ? esc(e.corr.observaciones) : ''}</p>` : ''}
      ${e.cond ? `<div class="list-check small"><li>${App.stIco(e.cond.estado === 'cumplida' ? 'cumplido' : e.cond.estado === 'pendiente' ? 'pendiente' : 'comprobar')}<span>${e.condDef ? `<b>${esc(e.condDef.nombre)}.</b> ` : ''}${esc(e.cond.texto)}</span></li></div>` : ''}
      ${e.corr ? `<p class="tiny muted" style="margin:10px 0 0">${icon('file')} ${esc(e.corr.articulo)} · Consulta: ${esc(fechaConsulta())} · Ref. ${esc(e.corr.id)}</p>` : ''}
      <p class="tiny" style="margin:4px 0 0">${fuentes}</p>
      ${opts.noActions ? '' : `<div class="card-actions">${(e.esp.vias || []).slice(0, 4).map(viaChip).join('')}${!e.sintetico ? `<button class="btn sm" data-ficha="${esc(e.esp.id)}">${icon('info')} Ficha</button>` : `<a class="btn sm" href="${App.data.normativa.enlaces.inclusion.u}" target="_blank" rel="noopener">${icon('external')} Inclusión Anexo 4</a>`}</div>`}
    </article>`;
  };

  App.viaCard = (ev) => {
    const v = ev.via, color = App.viaColor(v), fam = App.data.idx.familias[v.familia];
    const cumpl = ev.requisitos.filter(r => r.estado === 'cumplido');
    const pend = ev.requisitos.filter(r => r.estado !== 'cumplido');
    const reqName = id => (App.data.idx.requisitos[id] || {}).nombre || id;
    const esp = ev.especialidades;
    return `<article class="card edge via-card" style="--edge:${color}">
      <div class="card-head"><span class="tile" style="--tc:${color}">${icon(v.icono)}</span>
        <div class="grow"><div class="tiny muted" style="font-weight:700">${esc(fam.nombre.toUpperCase())}</div><h3>${esc(v.nombre)}</h3></div></div>
      <div class="status-line">${App.badge(ev.estado)}</div>
      ${ev.estado === 'no_aplica' ? `<p class="small muted">${esc(ev.motivo)}</p>` : `
      ${esp.length ? `<div class="small"><b>Especialidad o ámbito:</b></div><div class="esp-chips">${esp.slice(0, 6).map(e => `<span class="chip" title="${esc(e.esp.nombre)}"><span class="sw" style="--sw:${e.estado === 'verificado' ? 'var(--c-ok)' : e.estado === 'condicionado' ? 'var(--c-warn)' : 'var(--c-unv)'}"></span>${esc(e.esp.id.length > 7 ? e.esp.nombre : e.esp.id + ' ' + e.esp.nombre)}</span>`).join('')}${esp.length > 6 ? `<span class="chip">+${esp.length - 6}</span>` : ''}</div>` : ''}
      <div class="req-cols"><div><h4>REQUISITOS CUMPLIDOS</h4><ul class="list-check">${cumpl.length ? cumpl.map(r => `<li>${App.stIco('cumplido')}<span>${esc(reqName(r.id))}</span></li>`).join('') : '<li class="muted small">Ninguno todavía</li>'}</ul></div>
      <div><h4>PENDIENTES O POR COMPROBAR</h4><ul class="list-check">${pend.length ? pend.map(r => `<li>${App.stIco(r.estado)}<span><b>${esc(reqName(r.id))}</b><br><span class="tiny muted">${esc(r.detalle)}</span></span></li>`).join('') : '<li class="muted small">Nada pendiente</li>'}</ul></div></div>
      ${ev.formacion.length ? `<p class="small mt" style="margin-bottom:0"><b>Formación adicional necesaria:</b> ${ev.formacion.map(esc).join(' · ')}</p>` : ''}
      <p class="small" style="margin:6px 0 0"><b>Experiencia exigida:</b> ${esc(v.ficha.experiencia)}</p>`}
      <div class="card-actions"><a class="btn sm primary" href="#/vias/${v.id}">${icon('route')} Ver el recorrido</a>
        ${ev.estado !== 'no_aplica' ? `<a class="btn sm" href="#/ruta/${v.id}">${icon('flag')} Qué me falta</a>` : ''}
        ${v.ficha.normativa.slice(0, 1).map(n => `<span class="small">${App.norma(n, true)}</span>`).join('')}
        ${v.ficha.enlaces[0] ? `<span class="small">${App.link(v.ficha.enlaces[0])}</span>` : ''}</div>
    </article>`;
  };

  App.demoBanner = () => App.state.perfil && App.state.perfil.demo ? `<div class="notice mb">${icon('alert')}<div><b>Perfil de ejemplo ficticio: ${esc(App.state.perfil.demo)}.</b> Sirve para explicar itinerarios; no es un dictamen oficial. <a href="#/simulador/nuevo">Introduce tu propio perfil</a>.</div></div>` : '';

  App.views.resultados = view => {
    const R = App.state.resultado;
    if (!R) return App.needPerfil(view, 'Tu informe de posibilidades');
    const s = R.resumen;
    let filtro = 'todas';
    const draw = () => {
      const vias = R.vias.filter(v => filtro === 'todas' || v.estado === filtro);
      const espOrden = R.especialidades;
      view.innerHTML = `${App.demoBanner()}
      <div class="section-head"><div><h1 style="font-size:1.7rem">Mis posibilidades</h1><p>Informe calculado con la base documental · consulta ${esc(fechaConsulta())}</p></div>
        <div class="row no-print"><a class="btn sm" href="#/simulador">${icon('edit')} Editar perfil</a><a class="btn sm" href="#/ruta">${icon('flag')} Mi hoja de ruta</a>
        <button class="btn sm cta" data-pdf>${icon('download')} Exportar PDF</button><button class="btn sm" data-print>${icon('printer')} Imprimir</button></div></div>
      <div class="summary">
        <div class="glass summary-text"><p>Tu perfil permite explorar <strong>${s.viasExplorables} ${s.viasExplorables === 1 ? 'vía' : 'vías'} de acceso</strong> y tiene <strong>${s.verificadas} ${s.verificadas === 1 ? 'especialidad' : 'especialidades'} con correspondencia documental confirmada</strong>.</p>
          <p class="small muted">«No verificado» no significa «no permitido»: indica que la base documental no permite confirmarlo.</p></div>
        <div class="glass stat"><span class="num" style="color:var(--c-ok)">${s.verificadas}</span><span class="lab">Especialidades verificadas</span></div>
        <div class="glass stat"><span class="num" style="color:var(--c-warn)">${s.condicionadas}</span><span class="lab">Condicionadas</span></div>
        <div class="glass stat"><span class="num" style="color:var(--c-unv)">${s.noVerificadas}</span><span class="lab">No verificadas</span></div>
      </div>
      <div class="section-head mt"><div><h2>Tus vías de acceso</h2><p>${s.viasDisponibles} disponibles · ${s.viasExplorables - s.viasDisponibles} condicionadas · ${R.vias.length - s.viasExplorables} no aplican a tu perfil</p></div>
        <div class="pill-tabs" role="tablist">${[['todas', 'Todas'], ['disponible', 'Disponibles'], ['condicionada', 'Condicionadas'], ['no_aplica', 'No aplican']].map(([k, l]) => `<button role="tab" class="${filtro === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div></div>
      <div class="grid auto">${vias.map(App.viaCard).join('') || '<p class="muted">Sin vías en este filtro.</p>'}</div>
      <div class="section-head mt"><div><h2>Tus especialidades y ámbitos docentes</h2><p>Cada tarjeta indica la fuente y el artículo o anexo que la respalda.</p></div>
        <div class="legend">${['verificado', 'condicionado', 'no_verificado'].map(e => App.badge(e)).join('')}</div></div>
      <div class="grid auto">${espOrden.map(e => App.espCard(e)).join('') || '<p class="muted">No hay correspondencias en la base documental para este perfil.</p>'}</div>
      ${R.excluidas.length ? `<details class="acc mt"><summary>${App.badge('no_permite')} <span>${R.excluidas.length} especialidad(es) que la fuente excluye expresamente</span><span class="chev">${icon('chevR')}</span></summary>
        <div class="acc-body"><ul class="list-check">${R.excluidas.map(x => `<li>${App.stIco('pendiente')}<span><b>${esc(x.nombre)}</b><br><span class="small muted">${esc(x.motivo)} (${esc(x.articulo)})</span></span></li>`).join('')}</ul></div></details>` : ''}
      <details class="acc mt"><summary>${icon('info')} ¿Cómo se calcula este informe?<span class="chev">${icon('chevR')}</span></summary><div class="acc-body">
        <p>1. Tu título se compara con las correspondencias registradas (título exacto, ámbito de conocimiento del Grado, nivel o sector de experiencia). Nunca por parecido de nombre.</p>
        <p>2. Cada correspondencia lleva su fuente (convocatoria, anexo, artículo) y su estado documental.</p>
        <p>3. Para cada vía se evalúan sus requisitos propios con lo que has declarado. Lo que declaras deberás acreditarlo documentalmente.</p>
        <p class="muted small">El indicador de progreso no es una probabilidad de obtener plaza.</p></div></details>`;
      App.$$('[data-f]', view).forEach(b => b.onclick = () => { filtro = b.dataset.f; draw(); });
      App.$$('[data-ficha]', view).forEach(b => b.onclick = () => App.fichaEsp(b.dataset.ficha));
      App.$('[data-pdf]', view).onclick = () => App.Report.resultados();
      App.$('[data-print]', view).onclick = () => App.Report.resultados();
    };
    draw();
  };

  App.views.ruta = (view, args) => {
    const R = App.state.resultado;
    if (!R) return App.needPerfil(view, 'Tu hoja de ruta');
    const D = App.data;
    let filtroVia = args[0] && D.idx.vias[args[0]] ? args[0] : '';
    const draw = () => {
      let items;
      if (filtroVia) {
        const ev = R.vias.find(v => v.via.id === filtroVia);
        items = ev.requisitos.map(r => ({ ...r, vias: [filtroVia] }));
      } else items = R.ruta;
      const order = { pendiente: 0, comprobar: 1, opcional: 2, cumplido: 3, no_aplica: 4 };
      items = [...items].sort((a, b) => order[a.estado] - order[b.estado]);
      const cuenta = items.filter(i => i.estado !== 'opcional' && i.estado !== 'no_aplica');
      const ok = cuenta.filter(i => i.estado === 'cumplido').length;
      const pct = cuenta.length ? Math.round(ok / cuenta.length * 100) : 0;
      const viasExpl = R.vias.filter(v => v.estado !== 'no_aplica');
      view.innerHTML = `${App.demoBanner()}
      <div class="section-head"><div><h1 style="font-size:1.7rem">Mi hoja de ruta</h1><p>Qué cumples, qué te falta y cómo conseguirlo.</p></div>
        <div class="row"><label class="sr-only" for="rv">Vía</label><select id="rv" class="input" style="width:auto"><option value="">Todas las vías que puedes explorar</option>${viasExpl.map(v => `<option value="${v.via.id}" ${filtroVia === v.via.id ? 'selected' : ''}>${esc(v.via.corto)}</option>`).join('')}</select>
        <button class="btn sm" data-print>${icon('printer')} Imprimir</button></div></div>
      <div class="glass panel mb"><div class="row" style="justify-content:space-between"><b>${ok} de ${cuenta.length} requisitos cumplidos</b><span class="small muted">${icon('info')} Indicador de avance: no es la probabilidad de conseguir plaza.</span></div>
        <div class="progress mt"><span style="width:${pct}%"></span></div>
        <div class="legend mt"><span>${App.stIco('cumplido')} Cumplido</span><span>${App.stIco('pendiente')} Pendiente</span><span>${App.stIco('comprobar')} Por comprobar</span><span>${App.stIco('opcional')} No imprescindible</span></div></div>
      <div>${items.map(it => {
        const d = D.idx.requisitos[it.id] || { nombre: it.id };
        const org = d.organismo && D.idx.organismos[d.organismo];
        return `<details class="acc" ${it.estado === 'pendiente' ? 'open' : ''}><summary>${App.stIco(it.estado)}<span>${esc(d.nombre)}<span class="tiny muted" style="display:block;font-weight:500">${esc(App.stLabel(it.estado))} · ${esc(it.detalle || '')}</span></span><span class="chev">${icon('chevR')}</span></summary>
          <div class="acc-body"><dl class="kv"><dt>Qué significa</dt><dd>${esc(d.que || '')}</dd><dt>Por qué se necesita</dt><dd>${esc(d.porque || '')}</dd>
          <dt>Cómo conseguirlo</dt><dd>${esc(d.como || '')}</dd><dt>Dónde realizar el trámite</dt><dd>${esc(d.donde || '')}${org ? ` · <a href="#/organismos/${org.id}">${esc(org.siglas || org.nombre)}</a>` : ''}</dd>
          <dt>Enlace oficial</dt><dd>${d.enlace ? App.link(d.enlace) : '—'}</dd>
          <dt>Normativa</dt><dd>${(d.normativa || []).map(n => App.norma(n, true)).join(' · ')}</dd>
          ${it.vias && it.vias.length ? `<dt>Vías afectadas</dt><dd class="row">${it.vias.map(viaChip).join('')}</dd>` : ''}</dl></div></details>`;
      }).join('')}</div>`;
      App.$('#rv', view).onchange = e => { filtroVia = e.target.value; history.replaceState(null, '', '#/ruta' + (filtroVia ? '/' + filtroVia : '')); draw(); };
      App.$('[data-print]', view).onclick = () => App.Report.resultados();
    };
    draw();
  };
})();
