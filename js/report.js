/* Informes imprimibles / exportables a PDF (diálogo de impresión → «Guardar como PDF»). */
(function () {
  'use strict';
  const App = window.App, { esc } = App;
  const LBL = { verificado: ['ok', 'VERIFICADO'], condicionado: ['warn', 'CONDICIONADO'], no_verificado: ['unv', 'NO VERIFICADO'], disponible: ['ok', 'DISPONIBLE'], condicionada: ['warn', 'CONDICIONADA'], no_aplica: ['unv', 'NO APLICA'], cumplido: ['ok', 'Cumplido'], pendiente: ['warn', 'Pendiente'], comprobar: ['unv', 'Por comprobar'], opcional: ['unv', 'No imprescindible'] };
  const tag = e => `<span class="tag ${(LBL[e] || ['', e])[0]}">${(LBL[e] || ['', e])[1]}</span>`;
  const reqN = id => (App.data.idx.requisitos[id] || {}).nombre || id;
  const hoy = () => new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  function perfilTabla() {
    const p = App.state.perfil, D = App.data, fam = id => (D.idx.familias[id] || {}).nombre || '—';
    return `<table><tr><th>Titulación</th><td>${esc(p.titulacionTexto || '—')}${p.demo ? ' <b>(PERFIL DE EJEMPLO FICTICIO)</b>' : ''}</td></tr>
      <tr><th>Formación pedagógica</th><td>${Object.entries(p.ped || {}).filter(([, v]) => v === true).map(([k]) => esc(k)).join(', ') || 'Ninguna declarada'}</td></tr>
      <tr><th>Experiencia</th><td>${p.exp && p.exp.tiene ? `${esc(p.exp.anios)} años · ${esc(fam(p.exp.familia))}` : 'Sin experiencia en el sector'}</td></tr>
      <tr><th>Catalán</th><td>${esc((p.idiomas || {}).catalan || '—')}</td></tr></table>`;
  }
  function vias(R, ids) {
    return R.vias.filter(v => !ids || ids.includes(v.via.id)).map(ev => `<tr><td><b>${esc(ev.via.nombre)}</b></td><td>${tag(ev.estado)}</td>
      <td>${ev.estado === 'no_aplica' ? esc(ev.motivo) : ev.requisitos.map(r => `${tag(r.estado)} ${esc(reqN(r.id))}`).join('<br>')}</td><td>${ev.formacion.map(esc).join('<br>') || '—'}</td></tr>`).join('');
  }
  function print(html) {
    const root = document.getElementById('print-root');
    root.innerHTML = `<div class="rep">${html}<div class="disc">Informe orientativo generado con la base documental (consulta ${esc(App.data.correspondencias._meta.fechaConsulta)}). No es un dictamen oficial: confirma tu situación con el organismo competente. «No verificado» no significa «no permitido».</div></div>`;
    document.body.classList.add('printing');
    const done = () => { document.body.classList.remove('printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => { window.print(); setTimeout(done, 1500); }, 60);
    App.toast('En el diálogo, elige «Guardar como PDF»');
  }

  App.Report = {
    resultados() {
      const R = App.state.resultado, s = R.resumen;
      print(`<h1>Informe personal de acceso a la docencia</h1><p>${hoy()}</p>
        <h2>Perfil</h2>${perfilTabla()}
        <h2>Resumen</h2><p>Tu perfil permite explorar <b>${s.viasExplorables} vías de acceso</b> y tiene <b>${s.verificadas} especialidades con correspondencia documental confirmada</b> (${s.condicionadas} condicionadas, ${s.noVerificadas} no verificadas).</p>
        <h2>Vías de acceso</h2><table><tr><th>Vía</th><th>Estado</th><th>Requisitos</th><th>Formación necesaria</th></tr>${vias(R)}</table>
        <h2>Especialidades</h2><table><tr><th>Especialidad</th><th>Estado</th><th>Condición</th><th>Fuente</th></tr>${R.especialidades.map(e => `<tr><td>${esc(e.esp.id)} ${esc(e.esp.nombre)}</td><td>${tag(e.estado)}</td><td>${e.cond ? esc(e.cond.texto) : '—'}</td><td>${e.corr ? esc(e.corr.articulo) : 'Pendiente de verificación oficial'}</td></tr>`).join('')}</table>
        ${R.excluidas.length ? `<h2>Excluidas expresamente por la fuente</h2><ul>${R.excluidas.map(x => `<li>${esc(x.nombre)}: ${esc(x.motivo)}</li>`).join('')}</ul>` : ''}
        <h2>Hoja de ruta</h2><table><tr><th>Requisito</th><th>Estado</th><th>Detalle</th><th>Dónde</th></tr>${R.ruta.map(r => { const d = App.data.idx.requisitos[r.id] || {}; return `<tr><td>${esc(d.nombre || r.id)}</td><td>${tag(r.estado)}</td><td>${esc(r.detalle || '')}</td><td>${esc(d.donde || '')}</td></tr>`; }).join('')}</table>`);
    },
    actividad() {
      const R = App.state.resultado, A = App.state.actividad, D = App.data;
      if (!R) return App.toast('Completa primero tu perfil');
      const org = A.organismo && D.idx.organismos[A.organismo];
      print(`<h1>Descubre tu camino hacia la docencia</h1><p><b>Alumno/a:</b> ${esc(A.nombre || '—')} · <b>Grupo:</b> ${esc(A.grupo || '—')} · ${hoy()}</p>
        <h2>1. Titulación</h2>${perfilTabla()}
        <h2>2. Especialidades identificadas</h2>${(A.esp || []).length ? `<table><tr><th>Especialidad</th><th>Estado</th></tr>${A.esp.map(id => { const e = R.especialidades.find(x => x.esp.id === id); return e ? `<tr><td>${esc(id)} ${esc(e.esp.nombre)}</td><td>${tag(e.estado)}</td></tr>` : ''; }).join('')}</table>` : '<p>No seleccionadas.</p>'}
        <h2>3-4. Vías seleccionadas y comparación</h2>${(A.vias || []).length ? `<table><tr><th>Vía</th><th>Estado</th><th>Requisitos</th><th>Formación necesaria</th></tr>${vias(R, A.vias)}</table>` : '<p>No seleccionadas.</p>'}
        <p><b>Diferencias observadas:</b> ${esc(A.r4 || '—')}</p>
        <h2>5. Formación adicional</h2><p>${esc([...new Set(R.vias.filter(v => (A.vias || []).includes(v.via.id)).flatMap(v => v.formacion))].join(' · ') || 'Ninguna obligatoria detectada')}</p><p><b>Plan:</b> ${esc(A.r5 || '—')}</p>
        <h2>6. Organismo para confirmar</h2><p>${org ? `${esc(org.nombre)} · ${esc(org.web || '')} ${esc(org.telefono || '')}` : '—'}</p><p><b>Pregunta:</b> ${esc(A.r6 || '—')}</p>`);
    }
  };
})();
