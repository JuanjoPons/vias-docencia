/* Actividad final «Descubre tu camino hacia la docencia» con informe exportable. */
(function () {
  'use strict';
  const App = window.App, { esc, icon } = App;

  App.views.actividad = view => {
    const D = App.data, A = App.state.actividad, R = App.state.resultado;
    A.esp = A.esp || []; A.vias = A.vias || [];
    const save = () => App.store.save();
    const hechos = () => [!!R, A.esp.length > 0, A.vias.length === 2, A.vias.length === 2 && (A.r4 || '').trim().length > 10, (A.r5 || '').trim().length > 10, !!A.organismo];

    const draw = () => {
      const done = hechos(), n = done.filter(Boolean).length;
      const explor = R ? R.vias.filter(v => v.estado !== 'no_aplica') : [];
      const evs = A.vias.map(id => R && R.vias.find(v => v.via.id === id)).filter(Boolean);
      const formacion = [...new Set(evs.flatMap(e => e.formacion))];
      const pend = evs.flatMap(e => e.requisitos.filter(r => r.estado === 'pendiente').map(r => (D.idx.requisitos[r.id] || {}).nombre));
      const org = A.organismo && D.idx.organismos[A.organismo];
      const step = (i, titulo, html) => `<section class="glass panel act-step mb"><div class="num" style="${done[i - 1] ? 'background:color-mix(in srgb,var(--c-ok) 22%,transparent);color:var(--c-ok)' : ''}">${done[i - 1] ? icon('check') : i}</div><div><h3>${titulo}</h3>${html}</div></section>`;

      view.innerHTML = `<div class="section-head"><div><h1 style="font-size:1.7rem">Descubre tu camino hacia la docencia</h1><p>Actividad de investigación individual · ${n} de 6 pasos completados</p></div>
        <button class="btn cta" data-pdf ${R ? '' : 'disabled'}>${icon('download')} Generar informe PDF</button></div>
        <div class="progress mb"><span style="width:${Math.round(n / 6 * 100)}%"></span></div>
        <div class="glass panel mb grid g2"><div class="field"><label for="an">Nombre del alumno/a</label><input id="an" class="input" data-a="nombre" value="${esc(A.nombre || '')}"></div>
        <div class="field"><label for="ag">Grupo / curso</label><input id="ag" class="input" data-a="grupo" value="${esc(A.grupo || '')}"></div></div>
        ${step(1, 'Introduce tu titulación', R ? `<p class="small">Perfil: <b>${esc((App.state.perfil.titulacionTexto || '').trim() || 'sin título indicado')}</b>${App.state.perfil.demo ? ' <span class="demo-tag">(EJEMPLO FICTICIO)</span>' : ''}</p><a class="btn sm" href="#/simulador" data-back>${icon('edit')} Cambiar perfil</a>` : `<p class="small muted">Completa el simulador; volverás aquí al terminar.</p><a class="btn sm cta" href="#/simulador" data-back>${icon('play')} Ir al simulador</a>`)}
        ${step(2, 'Identifica tus posibles especialidades', R ? `<p class="small muted">Marca las que te interesan (con su estado documental).</p><div class="grid g2">${R.especialidades.filter(e => !e.sintetico).map(e => `<label class="check ${A.esp.includes(e.esp.id) ? 'on' : ''}"><input type="checkbox" data-esp="${esc(e.esp.id)}" ${A.esp.includes(e.esp.id) ? 'checked' : ''}><span><b>${esc(e.esp.id)} · ${esc(e.esp.nombre)}</b><span>${App.badge(e.estado)}</span></span></label>`).join('') || '<p class="small muted">No hay correspondencias registradas: anota «pendiente de verificación oficial» y consulta el paso 6.</p>'}</div>` : '<p class="small muted">Disponible tras el paso 1.</p>')}
        ${step(3, 'Selecciona dos vías de acceso', R ? `<div class="row">${explor.map(v => `<button class="chip ${A.vias.includes(v.via.id) ? 'on' : ''}" data-via="${v.via.id}"><span class="sw" style="--sw:${App.viaColor(v.via)}"></span>${esc(v.via.corto)}</button>`).join('')}</div><p class="tiny muted mt">${A.vias.length}/2 seleccionadas. <a href="#/vias">Revisa los diagramas</a> antes de elegir.</p>` : '<p class="small muted">Disponible tras el paso 1.</p>')}
        ${step(4, 'Compara sus requisitos', A.vias.length === 2 ? `${App.cmpTable(A.vias)}<div class="field mt"><label for="r4">¿Qué diferencias principales observas entre las dos vías?</label><textarea id="r4" class="input" data-a="r4">${esc(A.r4 || '')}</textarea></div>` : '<p class="small muted">Selecciona dos vías en el paso 3.</p>')}
        ${step(5, 'Identifica qué formación adicional necesitas', A.vias.length === 2 ? `<ul class="list-check">${formacion.length ? formacion.map(f => `<li>${App.stIco('pendiente')}<span>${esc(f)}</span></li>`).join('') : `<li>${App.stIco('cumplido')}<span>No se detecta formación adicional obligatoria en estas vías.</span></li>`}${[...new Set(pend)].filter(p => !formacion.length || true).map(p => `<li>${App.stIco('comprobar')}<span class="small">Requisito pendiente: ${esc(p)}</span></li>`).join('')}</ul>
          <div class="field mt"><label for="r5">¿Qué harás primero y en qué plazo?</label><textarea id="r5" class="input" data-a="r5">${esc(A.r5 || '')}</textarea></div>` : '<p class="small muted">Selecciona dos vías en el paso 3.</p>')}
        ${step(6, 'Localiza el organismo oficial donde confirmar tu situación', `<div class="grid g2"><div class="field"><label for="ao">Organismo</label><select id="ao" class="input" data-a="organismo"><option value="">Selecciona…</option>${D.organismos.organismos.map(o => `<option value="${o.id}" ${A.organismo === o.id ? 'selected' : ''}>${esc(o.nombre)}</option>`).join('')}</select>
          ${org ? `<p class="small mt">${org.web ? `<a href="${esc(org.web)}" target="_blank" rel="noopener">${icon('external')} Web oficial</a>` : ''} ${org.telefono ? ' · ' + icon('phone') + ' ' + esc(org.telefono) : ''}</p>` : ''}</div>
          <div class="field"><label for="a6">¿Qué le preguntarías?</label><textarea id="a6" class="input" data-a="r6">${esc(A.r6 || '')}</textarea></div></div><p class="tiny muted">Pista: consulta «<a href="#/organismos">¿Dónde consulto mi caso?</a>».</p>`)}
        <div class="row"><button class="btn cta lg" data-pdf ${R ? '' : 'disabled'}>${icon('download')} Generar informe PDF</button><button class="btn" data-reset>${icon('trash')} Reiniciar actividad</button></div>`;

      App.$$('[data-a]', view).forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => { A[el.dataset.a] = el.value; save(); if (el.tagName === 'SELECT') draw(); else updProgress(); }));
      App.$$('[data-esp]', view).forEach(cb => cb.onchange = () => { const i = A.esp.indexOf(cb.dataset.esp); cb.checked ? i < 0 && A.esp.push(cb.dataset.esp) : i >= 0 && A.esp.splice(i, 1); save(); draw(); });
      App.$$('[data-via]', view).forEach(b => b.onclick = () => { const i = A.vias.indexOf(b.dataset.via); if (i >= 0) A.vias.splice(i, 1); else if (A.vias.length < 2) A.vias.push(b.dataset.via); else App.toast('Elige exactamente dos vías'); save(); draw(); });
      App.$$('[data-back]', view).forEach(a => a.onclick = () => { App.state.volverA = '#/actividad'; });
      App.$$('[data-pdf]', view).forEach(b => b.onclick = () => App.Report.actividad());
      App.$('[data-reset]', view).onclick = () => { if (confirm('¿Borrar las respuestas de la actividad?')) { App.state.actividad = {}; save(); App.route(); } };
    };
    const updProgress = () => { const n = hechos().filter(Boolean).length; const s = App.$('.progress span', view); if (s) s.style.width = Math.round(n / 6 * 100) + '%'; };
    draw();
  };
})();
