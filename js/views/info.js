/* Convocatorias, directorio de organismos y fuentes/fiabilidad. */
(function () {
  'use strict';
  const App = window.App, { esc, icon } = App;

  App.views.convocatorias = view => {
    const C = App.data.convocatorias, D = App.data;
    const F = { tipo: '', estado: '', q: '' };
    view.innerHTML = `<div class="section-head"><div><h1 style="font-size:1.7rem">Convocatorias y oportunidades</h1><p>Procedimientos recogidos en la base documental, con su fuente.</p></div></div>
      <div class="notice mb">${icon('alert')}<div><b>Información documental, sin conexión en tiempo real.</b> Última verificación: ${esc(C._meta.ultimaVerificacion)}. Las fechas y plazos que no constan en la base documental se indican como tales: confirma siempre en el BOIB y en la web del organismo.</div></div>
      <div class="glass panel mb"><div class="filters" style="grid-template-columns:2fr 1fr 1fr">
        <div class="field"><label for="cq">Buscar</label><input id="cq" class="input" type="search" placeholder="Especialidad, organismo, procedimiento…"></div>
        <div class="field"><label>Tipo de procedimiento</label><select class="input" data-f="tipo"><option value="">Todos</option>${C.tipos.map(t => `<option value="${t.id}">${esc(t.nombre)}</option>`).join('')}</select></div>
        <div class="field"><label>Estado</label><select class="input" data-f="estado"><option value="">Todos</option><option value="abierta">Abierta</option><option value="cerrada">Cerrada</option><option value="pendiente">Pendiente de confirmar</option><option value="informativa">Informativa</option></select></div>
      </div></div><div id="cl" class="grid auto"></div>`;
    const draw = () => {
      const q = App.norm(F.q);
      const items = C.convocatorias.filter(c => (!F.tipo || c.tipo === F.tipo) && (!F.estado || c.estado === F.estado) && (!q || App.norm(JSON.stringify(c)).includes(q)));
      App.$('#cl', view).innerHTML = items.map(c => {
        const org = D.idx.organismos[c.organismo], v = D.idx.vias[c.via], tipo = C.tipos.find(t => t.id === c.tipo);
        return `<article class="card edge" style="--edge:${v ? App.viaColor(v) : 'var(--primary)'}">
          <div class="row" style="justify-content:space-between">${App.badge(c.estado)}<span class="chip">${esc(tipo ? tipo.nombre : c.tipo)}</span></div>
          <h3 class="mt" style="margin-top:10px">${esc(c.titulo)}</h3>
          <dl class="kv small" style="grid-template-columns:120px 1fr"><dt>Organismo</dt><dd>${org ? `<a href="#/organismos/${org.id}">${esc(org.siglas || org.nombre)}</a>` : '—'}</dd>
          <dt>Especialidad</dt><dd>${esc(c.especialidad)}</dd><dt>Publicación</dt><dd>${esc(c.publicacion)}</dd><dt>Plazo</dt><dd>${esc(c.plazo)}</dd><dt>Vigencia</dt><dd>${esc(c.vigencia)}</dd>
          <dt>Requisitos</dt><dd>${c.requisitos.map(esc).join(' · ')}</dd></dl>
          <div class="card-actions">${c.enlace ? `<a class="btn sm primary" href="${esc(c.enlace)}" target="_blank" rel="noopener">${icon('external')} Ver convocatoria</a>` : '<span class="small muted">Sin enlace en la base documental</span>'}${v ? `<a class="btn sm" href="#/vias/${v.id}">${icon('route')} ${esc(v.corto)}</a>` : ''}</div></article>`;
      }).join('') || '<p class="muted">Sin resultados.</p>';
    };
    App.$('#cq', view).oninput = e => { F.q = e.target.value; draw(); };
    App.$$('[data-f]', view).forEach(s => s.onchange = () => { F[s.dataset.f] = s.value; draw(); });
    draw();
  };

  App.fichaOrg = id => {
    const o = App.data.idx.organismos[id];
    if (!o) return;
    const tipos = App.by(App.data.organismos.tiposConsulta);
    App.modal(`<span class="tile" style="--tc:var(--c-publica)">${icon(o.icono)}</span><div><div class="tiny muted" style="font-weight:700">${esc(o.siglas)} · ${esc(o.nivel.toUpperCase())}</div><h2 style="margin:0">${esc(o.nombre)}</h2></div>`,
      `<h3>Competencias</h3><ul class="list-check">${o.competencias.map(c => `<li>${App.stIco('cumplido')}<span>${esc(c)}</span></li>`).join('')}</ul>
      <h3 class="mt">Consultas que atiende</h3><div class="row">${o.consultas.map(c => `<span class="chip">${esc(tipos[c].nombre)}</span>`).join('')}</div>
      <h3 class="mt">Contacto</h3><dl class="kv"><dt>Web</dt><dd>${o.web ? `<a href="${esc(o.web)}" target="_blank" rel="noopener">${icon('external')} ${esc(o.web.replace(/^https?:\/\//, '').split('/')[0])}</a>` : '—'}</dd>
      <dt>Dirección</dt><dd>${esc(o.direccion || 'No consta en la base documental')}</dd><dt>Teléfono</dt><dd>${o.telefono ? `<a href="tel:${esc(o.telefono.replace(/\s/g, ''))}">${esc(o.telefono)}</a>` : 'No consta en la base documental'}</dd></dl>
      <p class="tiny muted mt">Datos según la base documental (${esc(App.data.organismos._meta.fechaConsulta)}). Confírmalos en la web oficial.</p>`);
  };

  App.views.organismos = (view, args) => {
    const D = App.data, O = D.organismos;
    const F = { q: '', tipo: '' };
    view.innerHTML = `<div class="section-head"><div><h1 style="font-size:1.7rem">Directorio de ayuda y organismos</h1><p>¿Dónde confirmo mi caso? Busca por organismo o por tipo de consulta.</p></div></div>
      <div class="glass panel mb"><div class="field"><label for="oq">Buscar organismo o servicio</label><input id="oq" class="input" type="search" placeholder="DGPDoCen, SOIB, catalán, Anexo 4…"></div>
      <div class="row mt">${[['', 'Todas las consultas'], ...O.tiposConsulta.map(t => [t.id, t.nombre])].map(([k, l]) => `<button class="chip ${F.tipo === k ? 'on' : ''}" data-t="${k}">${esc(l)}</button>`).join('')}</div></div>
      <div id="ol" class="grid auto"></div>
      <div class="section-head mt"><div><h2>¿Dónde consulto mi caso?</h2><p>Supuestos frecuentes y a quién dirigirse.</p></div></div>
      <div>${O.casos.map(c => { const o = D.idx.organismos[c.organismo], v = D.idx.vias[c.via]; return `<details class="acc"><summary>${icon('help')}<span>${esc(c.pregunta)}</span><span class="chev">${icon('chevR')}</span></summary>
        <div class="acc-body"><p>${esc(c.respuesta)}</p><div class="row"><button class="btn sm" data-org="${o.id}">${icon('landmark')} ${esc(o.siglas || o.nombre)}</button>${App.link(c.enlace, 'btn sm')}${v ? `<a class="btn sm" href="#/vias/${v.id}">${icon('route')} ${esc(v.corto)}</a>` : ''}</div></div></details>`; }).join('')}</div>`;
    const draw = () => {
      const q = App.norm(F.q);
      const items = O.organismos.filter(o => (!F.tipo || o.consultas.includes(F.tipo)) && (!q || App.norm(JSON.stringify(o)).includes(q)));
      App.$('#ol', view).innerHTML = items.map(o => `<article class="card click edge" style="--edge:${o.nivel === 'Estatal' ? 'var(--c-esp)' : 'var(--c-publica)'}" data-org="${o.id}" tabindex="0" role="button">
        <div class="card-head"><span class="tile sm" style="--tc:${o.nivel === 'Estatal' ? 'var(--c-esp)' : 'var(--c-publica)'}">${icon(o.icono)}</span><div class="grow"><div class="tiny muted" style="font-weight:700">${esc(o.siglas)} · ${esc(o.nivel)}</div><h3>${esc(o.nombre)}</h3></div></div>
        <ul class="small" style="margin:10px 0 0;padding-left:18px">${o.competencias.slice(0, 2).map(c => `<li>${esc(c)}</li>`).join('')}</ul>
        <div class="row small" style="margin-top:10px;gap:14px">${o.telefono ? `<span>${icon('phone')} ${esc(o.telefono)}</span>` : ''}${o.web ? `<span>${icon('globe')} web oficial</span>` : ''}</div></article>`).join('') || '<p class="muted">Sin resultados.</p>';
      App.$$('#ol [data-org]', view).forEach(c => { c.onclick = () => App.fichaOrg(c.dataset.org); c.onkeydown = e => { if (e.key === 'Enter') App.fichaOrg(c.dataset.org); }; });
    };
    App.$('#oq', view).oninput = e => { F.q = e.target.value; draw(); };
    App.$$('[data-t]', view).forEach(b => b.onclick = () => { F.tipo = b.dataset.t; App.$$('[data-t]', view).forEach(x => x.classList.toggle('on', x === b)); draw(); });
    App.$$('.acc [data-org]', view).forEach(b => b.onclick = () => App.fichaOrg(b.dataset.org));
    draw();
    if (args[0]) App.fichaOrg(args[0]);
  };

  App.views.fuentes = view => {
    const D = App.data;
    const cnt = k => ({ titulaciones: D.titulaciones.titulaciones.length, especialidades: D.especialidades.especialidades.length, correspondencias: D.correspondencias.correspondencias.length, vias: D.vias.vias.length, normativa: D.normativa.normativa.length, convocatorias: D.convocatorias.convocatorias.length, organismos: D.organismos.organismos.length, requisitos: D.requisitos.requisitos.length, perfiles: D.perfiles.perfiles.length })[k];
    view.innerHTML = `<div class="section-head"><div><h1 style="font-size:1.7rem">Fuentes y fiabilidad</h1><p>Cómo se construyen los resultados y de dónde sale cada dato.</p></div></div>
      <div class="grid g3 mb">
        <div class="card edge" style="--edge:var(--c-ok)">${App.badge('verificado')}<p class="small mt">Existe respaldo documental suficiente: el título o su ámbito figura en la fuente sin condiciones, o cumples la condición declarada.</p></div>
        <div class="card edge" style="--edge:var(--c-warn)">${App.badge('condicionado')}<p class="small mt">La fuente lo admite si cumples un requisito adicional (asterisco del Anexo 4: experiencia, 30 ECTS…).</p></div>
        <div class="card edge" style="--edge:var(--c-unv)">${App.badge('no_verificado')}<p class="small mt">No hay información suficiente para confirmarlo. <b>No significa «no permitido».</b> Se muestra como «Correspondencia pendiente de verificación oficial».</p></div>
      </div>
      <div class="notice mb">${icon('alert')}<div>Esta web <b>no es un dictamen oficial</b> ni se conecta en tiempo real con fuentes oficiales. No genera correspondencias por inteligencia artificial: todas provienen de <code>data/correspondencias.json</code>, con su fuente y artículo. Los perfiles de la portada son <b>ejemplos ficticios</b>.</div></div>
      <div class="section-head"><div><h2>Base de datos</h2><p>Datos separados de la interfaz (carpeta <code>data/</code>). Generado: ${esc(window.APP_DATA_BUILD || 'carga directa de JSON')}</p></div></div>
      <div class="grid g4 mb">${['titulaciones', 'especialidades', 'correspondencias', 'vias', 'requisitos', 'normativa', 'convocatorias', 'organismos'].map(k => `<div class="glass stat"><span class="num">${cnt(k)}</span><span class="lab">${k}.json</span></div>`).join('')}</div>
      <div class="section-head"><div><h2>Normativa y convocatorias de referencia</h2><p>«enlace añadido» o «genérico» = no procede del cuaderno: verifícalo.</p></div></div>
      <div class="table-wrap glass"><table class="t"><thead><tr><th>Norma</th><th>Ámbito</th><th>Artículos relevantes</th><th>Tipo de fuente</th></tr></thead><tbody>
      ${D.normativa.normativa.map(n => `<tr><td>${App.norma(n.id)}</td><td>${esc(n.ambito)}</td><td class="small">${esc(n.articulos)}</td><td>${n.fiabilidad === 'normativa' ? App.badge('info', 'NORMATIVA') : App.badge('condicionado', 'CONVOCATORIA CONCRETA')}</td></tr>`).join('')}</tbody></table></div>
      <div class="section-head mt"><div><h2>Actualizar la información</h2></div></div>
      <div class="glass panel small"><ol style="margin:0;padding-left:18px"><li>Edita los archivos <code>.json</code> de <code>data/</code> (cada correspondencia necesita <code>fuente</code>, <code>articulo</code> y <code>estado</code>).</li>
      <li>Ejecuta <code>node tools/build-data.mjs</code> para regenerar <code>data/bundle.js</code>.</li><li>Actualiza <code>fechaConsulta</code> / <code>ultimaVerificacion</code>.</li></ol>
      <p class="mt" style="margin-bottom:0">Instrucciones completas en <code>INSTRUCCIONES-ACTUALIZACION.md</code>.</p></div>`;
  };
})();
