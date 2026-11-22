(function () {
  'use strict';
  const App = window.App, { esc, icon } = App;

  App.views.inicio = view => {
    const D = App.data;
    const fams = D.vias.familias.map(f => {
      const vs = D.vias.vias.filter(v => v.familia === f.id);
      return `<a class="hv-item" href="#/vias/${vs[0].id}" style="--tc:${f.color}">
        <span class="tile sm" style="--tc:${f.color}">${icon(vs[0].icono)}</span>
        <span class="hv-tx"><b>${esc(f.nombre)}</b><small>${vs.map(v => esc(v.corto)).join(' · ')}</small></span>
        <span class="hv-n">${vs.length}</span></a>`;
    }).join('');
    const access = [
      ['graduation', 'var(--c-esp)', 'Comprueba tus especialidades', 'Qué especialidades docentes abre tu título, con su respaldo documental.', '#/especialidades'],
      ['route', 'var(--c-publica)', 'Descubre las vías de acceso', 'Oposición, bolsas, urgencias, expertos, grados A-B-C y centros privados.', '#/vias'],
      ['flag', 'var(--c-interinidad)', 'Consulta los requisitos', 'Qué cumples, qué te falta y cómo conseguirlo, paso a paso.', '#/ruta'],
      ['calendar', 'var(--c-sistemafp)', 'Encuentra convocatorias y trámites', 'Procedimientos documentados, organismos y enlaces oficiales.', '#/convocatorias']
    ].map(a => `<a class="card click access edge" style="--edge:${a[1]}" href="${a[4]}"><span class="tile" style="--tc:${a[1]}">${icon(a[0])}</span><h3>${a[2]}</h3><p>${a[3]}</p><span class="go">Abrir ${icon('arrowR')}</span></a>`).join('');
    const demos = D.perfiles.perfiles.map(p => `<button class="card click" data-demo="${p.id}" style="text-align:left">
      <div class="card-head"><span class="tile sm" style="--tc:var(--c-esp)">${icon(p.icono)}</span><div class="grow"><span class="demo-tag">EJEMPLO FICTICIO</span><h3 style="font-size:.95rem">${esc(p.titulo)}</h3></div></div>
      <p class="small muted" style="margin:8px 0 0">${esc(p.resumen)}</p></button>`).join('');

    view.innerHTML = `
    <section class="glass hero">
      <div style="position:relative;z-index:1">
        <span class="chip" style="margin-bottom:14px">${icon('pin')} España · especial atención a las Illes Balears</span>
        <h1>¿Quieres ser docente?<br><span>Descubre tus vías de acceso</span></h1>
        <p class="lead">Indica tu titulación y descubre a qué especialidades puedes acceder, qué requisitos necesitas y cómo empezar.</p>
        <div class="row" style="margin-top:20px">
          <a class="btn cta lg" href="#/simulador">${icon('play')} COMPROBAR MI ACCESO</a>
          <a class="btn lg" href="#/vias">${icon('route')} Ver las vías</a>
        </div>
        <p class="tiny muted" style="margin-top:16px">${icon('shield')} Resultados basados solo en normativa y convocatorias documentadas. Lo que no está confirmado se marca como «no verificado».</p>
      </div>
      <div class="hero-viz glass panel" style="padding:16px">
        <div class="pill-tabs" style="margin-bottom:12px"><span class="on" style="padding:6px 12px">Familias de acceso</span><a href="#/vias/mapa">Mapa</a><a href="#/vias/matriz">Matriz</a></div>
        <div class="hv-list">${fams}</div>
        <div class="row" style="justify-content:space-between;margin-top:12px"><span class="tiny muted">${D.vias.vias.length} vías · ${D.especialidades.especialidades.length} especialidades y ámbitos</span><a class="btn sm cta" href="#/vias">Explorar</a></div>
      </div>
    </section>

    <div class="access-grid mt">${access}</div>

    <div class="section-head mt"><div><h2>¿Cómo vas a usar la web?</h2><p>Dos modos: explicar en clase o investigar tu propio caso.</p></div></div>
    <div class="grid g2">
      <button class="card click edge" data-mode="aula" style="--edge:var(--c-publica);text-align:left">
        <div class="card-head"><span class="tile" style="--tc:var(--c-publica)">${icon('present')}</span><div class="grow"><h3>Modo aula · explicar las vías</h3>
        <p class="small muted" style="margin:0">Para proyectar: diagramas grandes, etapas que se revelan una a una y navegación entre vías.</p></div></div></button>
      <button class="card click edge" data-mode="alumno" style="--edge:var(--c-laboral);text-align:left">
        <div class="card-head"><span class="tile" style="--tc:var(--c-laboral)">${icon('user')}</span><div class="grow"><h3>Modo alumno · investiga tu acceso</h3>
        <p class="small muted" style="margin:0">Introduce tu titulación y descubre especialidades, vías, requisitos y qué te falta.</p></div></div></button>
    </div>

    <div class="section-head mt"><div><h2>Perfiles de ejemplo</h2><p>Ficticios, para explicar itinerarios. No son dictámenes oficiales: se calculan con el mismo motor que el simulador.</p></div></div>
    <div class="demo-strip">${demos}</div>`;

    App.$$('[data-mode]', view).forEach(b => b.onclick = () => { App.setModo(b.dataset.mode); App.go(b.dataset.mode === 'aula' ? '#/vias' : '#/simulador'); });
    App.$$('[data-demo]', view).forEach(b => b.onclick = () => {
      const p = D.perfiles.perfiles.find(x => x.id === b.dataset.demo);
      App.setPerfil({ ...JSON.parse(JSON.stringify(p.perfil)), demo: p.titulo }, true);
      App.toast('Perfil de ejemplo cargado: ' + p.titulo);
      App.go('#/resultados');
    });
  };
})();
