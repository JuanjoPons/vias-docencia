/* Simulador personal de acceso: formulario en 5 pasos con validación. */
(function () {
  'use strict';
  const App = window.App, { esc, icon } = App;
  const UNIV = ['grado', 'diplomatura', 'licenciatura', 'master', 'doctorado'];
  const PASOS = ['Titulación', 'Formación pedagógica', 'Experiencia', 'Requisitos adicionales', 'Resultados'];
  const ISLAS = ['Mallorca', 'Menorca', 'Eivissa', 'Formentera'];

  const nuevo = () => ({
    nivel: null, otra: '', titulacionId: null, titulacionTexto: '', familia: '', anio: '', rama: '', ambito: '', universidad: '', mencion: '',
    habilitaMaestro: false, ects30: 'nose', otroFP: '',
    ped: {}, exp: { tiene: false, anios: 0, familia: '', docente: false, horasDocencia: 0, centrosFormacion: false, tutorDual: false, docPublica: 0, enBolsa: false },
    idiomas: { catalan: 'ninguno', exencion0597: false, otros: '', nacionalidad: '', disponible: 'si', islas: [] }
  });
  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  const setPath = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); const t = ks.reduce((a, k) => (a[k] = a[k] || {}), o); t[last] = v; };

  App.views.simulador = (view, args) => {
    const S = App.state;
    if (!S.borrador) S.borrador = S.perfil ? JSON.parse(JSON.stringify(S.perfil)) : nuevo();
    if (args[0] === 'nuevo') { S.borrador = nuevo(); S.paso = 1; }
    const B = S.borrador;
    B.exp = B.exp || {}; B.ped = B.ped || {}; B.idiomas = B.idiomas || { islas: [] }; B.idiomas.islas = B.idiomas.islas || [];
    const D = App.data, T = D.titulaciones;
    let errors = {};

    const sel = (k, opts, ph, extra = '') => `<select class="input ${errors[k] ? 'err' : ''}" data-k="${k}" ${extra}><option value="">${esc(ph)}</option>${opts.map(o => `<option value="${esc(o.id)}" ${getPath(B, k) === o.id ? 'selected' : ''}>${esc(o.nombre)}</option>`).join('')}</select>${errors[k] ? `<span class="err-msg">${esc(errors[k])}</span>` : ''}`;
    const seg = (k, opts) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button type="button" data-seg="${k}" data-v="${v}" class="${String(getPath(B, k)) === String(v) ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>`;
    const chk = (k, title, sub) => `<label class="check ${getPath(B, k) ? 'on' : ''}"><input type="checkbox" data-k="${k}" ${getPath(B, k) ? 'checked' : ''}><span><b>${esc(title)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</span></label>`;
    const num = (k, min, max, step = 1) => `<input class="input ${errors[k] ? 'err' : ''}" type="number" inputmode="decimal" min="${min}" max="${max}" step="${step}" data-k="${k}" value="${esc(getPath(B, k) ?? '')}">${errors[k] ? `<span class="err-msg">${esc(errors[k])}</span>` : ''}`;
    const txt = (k, ph) => `<input class="input" type="text" data-k="${k}" value="${esc(getPath(B, k) || '')}" placeholder="${esc(ph || '')}">`;

    function titulosPara() {
      let list = T.titulaciones;
      if (B.nivel === 'tsfp') list = list.filter(t => t.nivel === 'tsfp' && (!B.familia || t.familia === B.familia));
      else if (B.nivel === 'grado') list = list.filter(t => t.nivel === 'grado' && (!B.ambito || B.ambito === 'otro' || t.ambito === B.ambito));
      else if (B.nivel === 'diplomatura' || B.nivel === 'licenciatura') list = list.filter(t => t.nivel === B.nivel);
      else if (UNIV.includes(B.nivel)) list = list.filter(t => ['grado', 'licenciatura', 'diplomatura'].includes(t.nivel));
      else list = [];
      return list;
    }

    function paso1() {
      const niv = T.niveles.map(n => `<button type="button" class="choice ${B.nivel === n.id ? 'on' : ''}" data-nivel="${n.id}">
        <span class="tile sm" style="--tc:${n.grupo === 'fp' ? 'var(--c-fp)' : n.grupo === 'univ' ? 'var(--c-esp)' : 'var(--c-unv)'}">${icon(n.grupo === 'fp' ? 'wrench' : n.grupo === 'univ' ? 'graduation' : 'award')}</span>
        <span><b>${esc(n.nombre)}</b><small>${esc(n.detalle)}</small></span></button>`).join('');
      let det = '';
      const buscador = (label) => `<div class="field ac"><label for="acInput">${label}</label>
        <input id="acInput" class="input ${errors.titulacionTexto ? 'err' : ''}" autocomplete="off" data-ac value="${esc(B.titulacionTexto || '')}" placeholder="Escribe el nombre completo de tu título…" role="combobox" aria-expanded="false" aria-controls="acList">
        <div class="ac-list" id="acList" role="listbox" hidden></div>
        ${errors.titulacionTexto ? `<span class="err-msg">${esc(errors.titulacionTexto)}</span>` : ''}
        <span class="hint">${B.titulacionId ? `${icon('check')} Título del catálogo seleccionado.` : 'Si tu título no aparece, escríbelo completo: se marcará como «pendiente de verificación oficial».'}</span></div>`;
      if (B.nivel === 'tsfp') {
        det = `<div class="grid g2"><div class="field"><label>Familia profesional</label>${sel('familia', T.familias, 'Selecciona la familia…', 'data-rerender')}</div>
          <div class="field"><label>Año de obtención (opcional)</label>${num('anio', 1970, 2030)}</div></div>
          <div class="mt">${buscador('Ciclo formativo · denominación exacta del título')}</div>`;
      } else if (UNIV.includes(B.nivel)) {
        const ambs = T.ambitos.filter(a => !B.rama || a.rama === B.rama || a.rama === '*');
        const usaAmbito = ['grado', 'master', 'doctorado'].includes(B.nivel);
        det = `${['master', 'doctorado'].includes(B.nivel) ? `<div class="notice info mb">${icon('info')}<div>Para calcular tus especialidades se usa tu <b>título de acceso</b> (Grado o Licenciatura). Indícalo a continuación.</div></div>` : ''}
          <div class="grid g2"><div class="field"><label>Rama de conocimiento</label>${sel('rama', T.ramas, 'Selecciona la rama…', 'data-rerender')}</div>
          ${usaAmbito ? `<div class="field"><label>Ámbito de conocimiento del Grado</label>${sel('ambito', ambs, 'Selecciona el ámbito…', 'data-rerender')}<span class="hint">Orientativo: el ámbito oficial de tu título consta en el ${App.link('ruct')}.</span></div>` : '<div></div>'}</div>
          <div class="mt">${buscador('Denominación exacta del título')}</div>
          <div class="grid g2 mt"><div class="field"><label>Universidad (opcional)</label>${txt('universidad', 'p. ej. Universitat de les Illes Balears')}</div>
          <div class="field"><label>Especialidad o mención (si existe)</label>${txt('mencion')}</div></div>
          <div class="grid g2 mt">${chk('habilitaMaestro', 'Mi título habilita como Maestro/a de Infantil o Primaria', 'Afecta a FOL, Intervención Sociocomunitaria y Servicios a la Comunidad')}
          <div class="field"><span class="lbl">¿Has cursado al menos 30 ECTS básicos u obligatorios afines a la especialidad que te interesa?</span>${seg('ects30', [['si', 'Sí'], ['no', 'No'], ['nose', 'No lo sé']])}<span class="hint">Algunos ámbitos del Anexo 4 los exigen (no cuentan optativas ni TFG).</span></div></div>
          <div class="field mt"><label>¿Tienes además un título de Técnico o Técnico Superior? (familia)</label>${sel('otroFP', T.familias, 'No / no aplica')}</div>`;
      } else if (B.nivel === 'otra') {
        det = `<div class="choice-grid">${T.otrasOpciones.map(o => `<button type="button" class="choice ${B.otra === o.id ? 'on' : ''}" data-otra="${o.id}"><span><b>${esc(o.nombre)}</b></span></button>`).join('')}</div>
          ${errors.otra ? `<p class="err-msg">${esc(errors.otra)}</p>` : ''}
          ${['tecnico', 'cp2', 'cp3'].includes(B.otra) ? `<div class="grid g2 mt"><div class="field"><label>Familia profesional</label>${sel('familia', T.familias, 'Selecciona la familia…')}</div><div class="field"><label>Denominación del título o certificado</label>${txt('titulacionTexto')}</div></div>` : ''}`;
      }
      return `<fieldset class="fs"><legend>¿Cuál es tu titulación académica más alta?</legend><div class="choice-grid">${niv}</div>${errors.nivel ? `<p class="err-msg">${esc(errors.nivel)}</p>` : ''}</fieldset>
        ${det ? `<fieldset class="fs"><legend>Detalles de tu titulación</legend>${det}</fieldset>` : ''}`;
    }

    function paso2() {
      return `<fieldset class="fs"><legend>Formación pedagógica · marca todo lo que tengas</legend><div class="grid g2">
        ${chk('ped.master', '¿Tienes el Máster de Formación del Profesorado?', 'Máster art. 100.2 LOE (ESO, Bachillerato, FP e idiomas)')}
        ${chk('ped.cofpde', 'Curso de formación pedagógica equivalente (60 ECTS)', 'Para Técnicos Superiores (Orden EDU/2645/2011)')}
        ${chk('ped.cap', 'CAP, Título de Especialización Didáctica o Cert. de Cualificación Pedagógica', 'Titulación equivalente o reconocida')}
        ${B.ped.cap ? chk('ped.capAntes2009', '…obtenido antes del 01/10/2009', 'Exime del Máster') : ''}
        ${chk('ped.tituloPedAntes2009', 'Título de Maestro, Pedagogía o Psicopedagogía anterior al 01/10/2009', 'Exención del Máster')}
        ${chk('ped.docenciaAntes2009', '12 meses (o 2 cursos) de docencia reglada antes del 01/10/2009', 'Exención del Máster')}
        ${chk('ped.docenciaAntes2014', '12 meses (o 2 cursos) de docencia reglada antes del 01/09/2014', 'Exención del Curso 60 ECTS (cuerpo 0598)')}
        ${chk('ped.ssce', 'Certificado de habilitación para la docencia en grados A, B y C (SSCE0110)', 'Nuevo certificado profesional')}
        ${chk('ped.cpDocencia', 'Antiguo certificado de profesionalidad de Docencia de la FP para el empleo', 'SSCE0110 anterior')}
        ${chk('ped.tituloPedagogia', 'Grado/Licenciatura o posgrado en Pedagogía, Psicopedagogía o Magisterio', 'Exime del SSCE0110')}
        </div>
        <div class="field mt"><label>¿Otra acreditación de competencia docente?</label>${txt('ped.otra', 'Descríbela (se marcará como «por comprobar»)')}</div></fieldset>`;
    }

    function paso3() {
      const e = B.exp;
      return `<fieldset class="fs"><legend>Experiencia profesional</legend>
        <div class="field"><span class="lbl">¿Tienes experiencia profesional en el sector relacionado con tu titulación?</span>${seg('exp.tiene', [[true, 'Sí'], [false, 'No']])}</div>
        ${e.tiene ? `<div class="grid g2 mt"><div class="field"><label>Años de experiencia</label>${num('exp.anios', 0, 50, .5)}</div>
          <div class="field"><label>Sector profesional (familia)</label>${sel('exp.familia', T.familias, 'Selecciona el sector…')}</div></div>` : ''}</fieldset>
        <fieldset class="fs"><legend>Experiencia docente</legend><div class="grid g2">
        <div class="field"><span class="lbl">¿Tienes experiencia como docente o formador/a?</span>${seg('exp.docente', [[true, 'Sí'], [false, 'No']])}</div>
        ${e.docente ? `<div class="field"><label>Horas de docencia en los últimos 10 años</label>${num('exp.horasDocencia', 0, 20000, 10)}<span class="hint">600 h eximen del SSCE0110.</span></div>` : '<div></div>'}
        <div class="field"><span class="lbl">¿Has trabajado en centros de formación?</span>${seg('exp.centrosFormacion', [[true, 'Sí'], [false, 'No']])}</div>
        <div class="field"><span class="lbl">¿Has sido tutor/a de empresa en FP dual?</span>${seg('exp.tutorDual', [[true, 'Sí'], [false, 'No']])}</div>
        <div class="field"><label>Años de docencia en centros públicos</label>${num('exp.docPublica', 0, 45, .5)}</div>
        <div class="field"><span class="lbl">¿Formas parte ya de la bolsa de interinos 2026-2027?</span>${seg('exp.enBolsa', [[true, 'Sí'], [false, 'No']])}</div>
        </div></fieldset>`;
    }

    function paso4() {
      const I = B.idiomas;
      const cat = [['ninguno', 'Sin certificado'], ['A2', 'A2'], ['B1', 'B1'], ['B2', 'B2'], ['C1', 'C1'], ['C2', 'C2'], ['ccs', 'CCS (Capacitación Secundaria) o equivalente']].map(([id, n]) => ({ id, nombre: n }));
      return `<fieldset class="fs"><legend>Idiomas</legend><div class="grid g2">
        <div class="field"><label>Nivel de catalán acreditado</label>${sel('idiomas.catalan', cat, 'Selecciona…')}<span class="hint">Para la docencia pública en Baleares se exige el CCS; el C1 por sí solo no basta.</span></div>
        <div class="field"><label>Otros idiomas</label>${txt('idiomas.otros', 'p. ej. Inglés B2')}</div>
        ${chk('idiomas.exencion0597', 'He trabajado como docente en el cuerpo de Maestros en Baleares desde el 01/09/2020', 'Exención del CCS para el resto de cuerpos')}
        </div></fieldset>
        <fieldset class="fs"><legend>Requisitos administrativos</legend><div class="grid g2">
        <div class="field"><label>Nacionalidad</label>${sel('idiomas.nacionalidad', [{ id: 'es', nombre: 'Española' }, { id: 'ue', nombre: 'De un Estado de la UE' }, { id: 'otra', nombre: 'Otra' }], 'Prefiero no indicarla')}<span class="hint">Solo se usa en las vías de la función pública.</span></div>
        <div class="field"><span class="lbl">¿Disponibilidad para trabajar en las Illes Balears?</span>${seg('idiomas.disponible', [['si', 'Sí'], ['no', 'No'], ['quiza', 'Quizá']])}</div>
        </div>
        <div class="field mt"><span class="lbl">Isla de preferencia</span><div class="row">${ISLAS.map(i => `<button type="button" class="chip ${I.islas.includes(i) ? 'on' : ''}" data-isla="${i}">${icon('pin')} ${i}</button>`).join('')}</div></div></fieldset>
        <fieldset class="fs"><legend>Privacidad</legend>
        ${`<label class="check ${S.consent ? 'on' : ''}"><input type="checkbox" id="consent" ${S.consent ? 'checked' : ''}><span><b>Recordar mi perfil en este navegador</b><span>Se guarda solo en este dispositivo (almacenamiento local). Puedes borrarlo cuando quieras.</span></span></label>`}</fieldset>`;
    }

    function resumenPerfil(p) {
      const t = p.titulacionId ? D.idx.titulaciones[p.titulacionId] : null;
      const niv = p.nivel === 'otra' ? (T.otrasOpciones.find(o => o.id === p.otra) || {}).nombre : (T.niveles.find(n => n.id === p.nivel) || {}).nombre;
      const fam = id => (D.idx.familias[id] || {}).nombre;
      const ped = Object.entries(p.ped || {}).filter(([k, v]) => v === true).length;
      return [
        ['Titulación', niv || '—'], ['Título', (t ? t.nombre : p.titulacionTexto) || '—'],
        p.ambito ? ['Ámbito', (D.idx.ambitos[p.ambito] || {}).nombre] : null,
        p.familia ? ['Familia', fam(p.familia)] : null,
        ['Formación pedagógica', ped ? `${ped} acreditación(es)` : 'Ninguna'],
        ['Experiencia', p.exp && p.exp.tiene ? `${p.exp.anios} años · ${fam(p.exp.familia) || '—'}` : 'Sin experiencia en el sector'],
        ['Catalán', (p.idiomas && p.idiomas.catalan === 'ccs') ? 'CCS' : (p.idiomas && p.idiomas.catalan) || '—']
      ].filter(Boolean);
    }

    function paso5() {
      return `<div class="notice info">${icon('info')}<div>Revisa tus datos. Al continuar se calcularán tus vías de acceso y especialidades a partir de la base documental. Los resultados <b>no son un dictamen oficial</b>: confírmalos con el organismo competente.</div></div>
        <dl class="kv mt">${resumenPerfil(B).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
        <div class="row mt"><button class="btn cta lg" data-finish>${icon('target')} Ver mis resultados</button></div>`;
    }

    function validar(n) {
      errors = {};
      if (n === 1) {
        if (!B.nivel) errors.nivel = 'Selecciona tu nivel de titulación.';
        else if (B.nivel === 'tsfp' && !(B.titulacionTexto || '').trim()) errors.titulacionTexto = 'Indica la denominación de tu título.';
        else if (UNIV.includes(B.nivel) && !(B.titulacionTexto || '').trim() && !B.ambito) errors.titulacionTexto = 'Indica tu título o, al menos, el ámbito de conocimiento.';
        else if (B.nivel === 'otra' && !B.otra) errors.otra = 'Elige una opción.';
      }
      if (n === 3 && B.exp.tiene) {
        if (!(Number(B.exp.anios) > 0)) errors['exp.anios'] = 'Indica los años (mayor que 0).';
        if (!B.exp.familia) errors['exp.familia'] = 'Selecciona el sector.';
      }
      ['exp.anios', 'exp.horasDocencia', 'exp.docPublica'].forEach(k => { const v = getPath(B, k); if (v !== '' && v != null && (isNaN(v) || Number(v) < 0)) errors[k] = 'Valor no válido.'; });
      return !Object.keys(errors).length;
    }

    function render() {
      const p = S.paso;
      const body = [paso1, paso2, paso3, paso4, paso5][p - 1]();
      const pct = Math.round(((p - 1) / 4) * 100);
      view.innerHTML = `<div class="section-head"><div><h1 style="font-size:1.7rem">Simulador personal de acceso</h1><p>${esc(PASOS[p - 1])} · paso ${p} de 5</p></div>
        <div class="row"><button class="btn sm ghost" data-reset>${icon('trash')} Empezar de cero</button></div></div>
        <div class="progress mb" aria-label="Progreso del formulario"><span style="width:${pct}%"></span></div>
        <nav class="stepper" aria-label="Pasos">${PASOS.map((t, i) => `<button type="button" class="st ${i + 1 === p ? 'on' : ''} ${i + 1 < p ? 'done' : ''}" data-goto="${i + 1}"><span class="n">${i + 1 < p ? icon('check') : i + 1}</span><span class="tx">${esc(t)}</span></button>`).join('')}</nav>
        <div class="sim-layout"><form class="glass panel" novalidate onsubmit="return false">${body}
          <div class="sim-nav"><button type="button" class="btn" data-prev ${p === 1 ? 'disabled' : ''}>${icon('chevL')} Anterior</button>
          ${p < 5 ? `<button type="button" class="btn primary" data-next>Siguiente ${icon('chevR')}</button>` : ''}</div></form>
          <aside class="sim-aside glass panel"><h3>${icon('user')} Tu perfil</h3><dl class="kv small" style="grid-template-columns:1fr">${resumenPerfil(B).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
          ${S.perfil ? `<hr class="sep"><a class="btn sm" href="#/resultados">${icon('target')} Ver últimos resultados</a>` : ''}</aside></div>`;
      bind();
      const first = view.querySelector('.err');
      if (first) first.focus();
    }

    function bind() {
      const form = App.$('form', view);
      form.addEventListener('input', onInput);
      form.addEventListener('change', onInput);
      App.$$('[data-nivel]', view).forEach(b => b.onclick = () => { if (B.nivel !== b.dataset.nivel) { B.nivel = b.dataset.nivel; B.titulacionId = null; B.titulacionTexto = ''; B.ambito = ''; B.otra = ''; } errors = {}; render(); });
      App.$$('[data-otra]', view).forEach(b => b.onclick = () => { B.otra = b.dataset.otra; render(); });
      App.$$('[data-seg]', view).forEach(b => b.onclick = () => { let v = b.dataset.v; if (v === 'true') v = true; if (v === 'false') v = false; setPath(B, b.dataset.seg, v); render(); });
      App.$$('[data-isla]', view).forEach(b => b.onclick = () => { const a = B.idiomas.islas; const i = a.indexOf(b.dataset.isla); i >= 0 ? a.splice(i, 1) : a.push(b.dataset.isla); render(); });
      const c = App.$('#consent', view); if (c) c.onchange = () => { S.consent = c.checked; if (!c.checked) App.store.clear(); c.closest('.check').classList.toggle('on', c.checked); };
      App.$$('[data-goto]', view).forEach(b => b.onclick = () => { const to = +b.dataset.goto; if (to < S.paso || validar(S.paso)) { S.paso = to; } render(); });
      const prev = App.$('[data-prev]', view); if (prev) prev.onclick = () => { S.paso = Math.max(1, S.paso - 1); render(); };
      const next = App.$('[data-next]', view); if (next) next.onclick = () => { if (validar(S.paso)) S.paso++; render(); };
      const fin = App.$('[data-finish]', view); if (fin) fin.onclick = () => {
        for (let i = 1; i <= 4; i++) if (!validar(i)) { S.paso = i; render(); App.toast('Revisa los datos marcados'); return; }
        const perfil = JSON.parse(JSON.stringify(B)); delete perfil.demo;
        App.setPerfil(perfil);
        App.go(App.state.volverA || '#/resultados'); App.state.volverA = null;
      };
      App.$('[data-reset]', view).onclick = () => { S.borrador = nuevo(); S.paso = 1; errors = {}; render(); };
      setupAC();
    }

    function onInput(e) {
      const el = e.target; const k = el.dataset && el.dataset.k;
      if (!k) return;
      let v = el.type === 'checkbox' ? el.checked : el.type === 'number' ? (el.value === '' ? '' : Number(el.value)) : el.value;
      setPath(B, k, v);
      if (el.type === 'checkbox') { el.closest('.check') && el.closest('.check').classList.toggle('on', el.checked); if (k === 'ped.cap') render(); }
      if (e.type === 'change' && el.hasAttribute('data-rerender')) {
        if (k === 'familia' || k === 'ambito' || k === 'rama') { const t = B.titulacionId && D.idx.titulaciones[B.titulacionId]; if (t && ((k === 'familia' && t.familia !== v) || (k === 'ambito' && t.ambito !== v))) { B.titulacionId = null; } }
        render();
      }
    }

    function setupAC() {
      const inp = App.$('[data-ac]', view), list = App.$('#acList', view);
      if (!inp) return;
      let hi = -1, items = [];
      const show = () => {
        const q = App.norm(inp.value);
        items = titulosPara().filter(t => !q || App.norm(t.nombre + ' ' + (t.alias || []).join(' ')).includes(q)).slice(0, 40);
        if (!items.length) { list.hidden = true; inp.setAttribute('aria-expanded', 'false'); return; }
        list.innerHTML = items.map((t, i) => `<div class="ac-item ${i === hi ? 'hi' : ''}" role="option" data-i="${i}"><span>${esc(t.nombre)}</span><small>${esc(t.familia ? (D.idx.familias[t.familia] || {}).nombre : (D.idx.ambitos[t.ambito] || {}).nombre || '')}</small></div>`).join('');
        list.hidden = false; inp.setAttribute('aria-expanded', 'true');
        App.$$('.ac-item', list).forEach(it => it.onmousedown = ev => { ev.preventDefault(); pick(items[+it.dataset.i]); });
      };
      const pick = t => {
        B.titulacionId = t.id; B.titulacionTexto = t.nombre;
        if (t.familia) B.familia = t.familia;
        if (t.ambito) { B.ambito = t.ambito; const a = D.idx.ambitos[t.ambito]; if (a && a.rama !== '*') B.rama = a.rama; }
        B.habilitaMaestro = !!t.habilitaMaestro;
        list.hidden = true; render();
      };
      inp.addEventListener('focus', show);
      inp.addEventListener('input', () => { B.titulacionTexto = inp.value; B.titulacionId = null; hi = -1; show(); });
      inp.addEventListener('blur', () => setTimeout(() => { list.hidden = true; }, 150));
      inp.addEventListener('keydown', e => {
        if (list.hidden) return;
        if (e.key === 'ArrowDown') { hi = Math.min(items.length - 1, hi + 1); show(); e.preventDefault(); }
        if (e.key === 'ArrowUp') { hi = Math.max(0, hi - 1); show(); e.preventDefault(); }
        if (e.key === 'Enter' && hi >= 0) { pick(items[hi]); e.preventDefault(); }
        if (e.key === 'Escape') list.hidden = true;
      });
    }

    render();
  };
})();
