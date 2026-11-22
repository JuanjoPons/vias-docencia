/* Motor de evaluación del perfil.
   Toda decisión sobre correspondencias sale de data/correspondencias.json.
   Aquí solo se aplican reglas a los datos: nunca se deducen correspondencias por similitud de nombres. */
(function () {
  'use strict';
  const App = window.App;
  const UNIV = ['grado', 'diplomatura', 'licenciatura', 'master', 'doctorado'];

  /* Hechos derivados del perfil */
  function hechos(p) {
    const D = App.data;
    const tit = p.titulacionId ? D.idx.titulaciones[p.titulacionId] : null;
    const nivel = p.nivel === 'otra' ? (p.otra || 'ninguna') : p.nivel;
    const isUniv = UNIV.includes(nivel);
    // Nivel del título de acceso (para Máster/Doctorado se usa el título base si se ha indicado)
    let baseNivel = tit ? tit.nivel : nivel;
    if ((nivel === 'master' || nivel === 'doctorado') && !tit) baseNivel = 'grado';
    const ambito = (isUniv && (baseNivel === 'grado')) ? (p.ambito || (tit && tit.ambito) || null) : null;
    const ped = p.ped || {}, exp = p.exp || {}, idi = p.idiomas || {};
    const habilitaMaestro = !!(p.habilitaMaestro || (tit && tit.habilitaMaestro));
    const tituloPedagogico = !!(tit && tit.pedagogica) || !!ped.tituloPedagogia;
    const master = !!(ped.master || (ped.cap && ped.capAntes2009) || ped.tituloPedAntes2009 || ped.docenciaAntes2009);
    const cofpde = !!(ped.cofpde || ped.docenciaAntes2014);
    const horas = Number(exp.horasDocencia || 0);
    const ssceMotivo = ped.ssce ? 'Tienes el certificado SSCE0110'
      : ped.cpDocencia ? 'Tienes el antiguo certificado de docencia de la FP para el empleo (SSCE0110)'
      : tituloPedagogico ? 'Exento: titulación de Pedagogía, Psicopedagogía o Magisterio'
      : (isUniv && ped.cap) ? 'Exento: titulación universitaria + CAP/TED/CCP'
      : ped.master ? 'Exento: Máster de Profesorado'
      : ped.cofpde ? 'Exento: Curso de formación pedagógica equivalente (60 ECTS)'
      : horas >= 600 ? 'Exento: 600 h de docencia en los últimos 10 años (a acreditar)'
      : null;
    return {
      p, tit, nivel, baseNivel, isUniv, isTS: nivel === 'tsfp', ambito, habilitaMaestro,
      familia: p.familia || (tit && tit.familia) || null,
      master, cofpde, ssce: !!ssceMotivo, ssceMotivo,
      pedOk: isUniv ? master : cofpde,
      ccs: idi.catalan === 'ccs' || !!idi.exencion0597,
      catalan: idi.catalan || 'ninguno',
      nacionalidad: idi.nacionalidad || '',
      expTiene: !!exp.tiene, expAnios: Number(exp.anios || 0), expFam: exp.familia || null,
      docPublica: Number(exp.docPublica || 0), enBolsa: !!exp.enBolsa,
      ects30: p.ects30 || 'nose', otroFP: p.otroFP || null, customTitle: !tit && !!(p.titulacionTexto || '').trim()
    };
  }

  /* Evalúa la condición de una correspondencia → {estado: cumplida|pendiente|comprobar, texto} */
  function condicion(c, h) {
    if (!c) return null;
    const fam = f => App.data.idx.familias[f] ? App.data.idx.familias[f].nombre : f;
    switch (c.tipo) {
      case 'exp2': {
        const ok = h.expTiene && c.familias.includes(h.expFam);
        if (ok && h.expAnios >= 2) return { estado: 'cumplida', texto: `Declaras ${h.expAnios} años en ${fam(h.expFam)}: deberás acreditarlos (vida laboral y contratos).` };
        if (ok) return { estado: 'pendiente', texto: `Te faltan ${(2 - h.expAnios).toFixed(1).replace('.0', '')} año(s) de experiencia en ${fam(h.expFam)} (se exigen 2).` };
        return { estado: 'pendiente', texto: `Necesitas 2 años de experiencia laboral en ${c.familias.map(fam).join(' o ')}.` };
      }
      case 'alt4': {
        if (h.expTiene && h.expFam === c.familia && h.expAnios >= 2) return { estado: 'cumplida', texto: `Cumples la alternativa de 2 años de experiencia en ${fam(c.familia)}.` };
        if (h.otroFP === c.familia) return { estado: 'cumplida', texto: `Cumples la alternativa de título de Técnico/TS de ${fam(c.familia)}.` };
        if (h.ects30 === 'si') return { estado: 'cumplida', texto: 'Declaras 30 ECTS afines: se comprobarán en tu certificación académica.' };
        if (h.docPublica >= 1) return { estado: 'comprobar', texto: `Declaras docencia pública: comprueba que sea ≥1 año en la familia ${fam(c.familia)}.` };
        return { estado: h.ects30 === 'nose' ? 'comprobar' : 'pendiente', texto: `Necesitas 1 de 4: 2 años de experiencia en ${fam(c.familia)}, 1 año de docencia pública en la familia, título de FP de la familia o 30 ECTS afines.` };
      }
      case 'ects30':
        if (h.ects30 === 'si') return { estado: 'cumplida', texto: 'Declaras 30 ECTS afines: se comprobarán en tu certificación académica.' };
        if (h.ects30 === 'no') return { estado: 'pendiente', texto: `Se exigen 30 ECTS básicos/obligatorios afines${c.detalle ? ' (' + c.detalle + ')' : ''}.` };
        return { estado: 'comprobar', texto: `Comprueba si tu expediente suma 30 ECTS básicos/obligatorios afines${c.detalle ? ' (' + c.detalle + ')' : ''}.` };
      case 'exp_sector':
        return { estado: 'comprobar', texto: `Declaras ${h.expAnios} año(s) en ${fam(h.expFam)}: la experiencia mínima la fijan las bases de cada convocatoria.` };
      case 'contenidos':
        return { estado: 'comprobar', texto: 'Comprueba en el real decreto de cada certificado que tu titulación figura como requisito del formador.' };
      case 'exp4':
        return h.expAnios >= 4 ? { estado: 'cumplida', texto: `Declaras ${h.expAnios} años de experiencia (se exigen 4 ajustados al estándar).` }
          : { estado: 'pendiente', texto: `Se exigen 4 años de experiencia profesional (declaras ${h.expAnios}).` };
    }
    return null;
  }

  function coincide(c, h) {
    if (c.titulos && h.p.titulacionId && c.titulos.includes(h.p.titulacionId)) return 'título exacto';
    if (c.ambitos && h.ambito && c.ambitos.includes(h.ambito)) return 'ámbito de conocimiento';
    if (c.niveles && c.niveles.includes(h.nivel)) return 'nivel de titulación';
    if (c.expFamilias && h.expTiene && h.expAnios > 0 && c.expFamilias.includes(h.expFam)) return 'experiencia en el sector';
    return null;
  }

  const RANK = { verificado: 3, condicionado: 2, no_verificado: 1 };

  function evaluar(p) {
    const D = App.data, h = hechos(p);
    const espMap = {}, excluidas = [];
    // 1. Correspondencias explícitas de exclusión
    const noPermite = new Set();
    D.correspondencias.correspondencias.forEach(c => {
      if (c.estado !== 'no_permite') return;
      const por = coincide(c, h);
      if (!por) return;
      c.especialidades.forEach(e => {
        noPermite.add(e);
        const esp = D.idx.especialidades[e];
        excluidas.push({ id: e, nombre: e === 'cuerpo:0590' ? 'Cuerpo 0590 · todas las especialidades (Secundaria y FP)' : (esp ? `${esp.id} ${esp.nombre}` : e), motivo: c.observaciones, articulo: c.articulo, fuente: c.fuente });
      });
    });
    // 2. Correspondencias positivas
    D.correspondencias.correspondencias.forEach(c => {
      if (c.estado === 'no_permite') return;
      const por = coincide(c, h);
      if (!por) return;
      if (c.excluyeMaestro && h.habilitaMaestro) return; // excluido expresamente (ver C41)
      const cond = condicion(c.condicion, h);
      let estado;
      if (c.estado === 'no_verificado') estado = 'no_verificado';
      else if (c.estado === 'verificado') estado = 'verificado';
      else estado = (cond && cond.estado === 'cumplida' && !['exp_sector', 'contenidos'].includes(c.condicion.tipo)) ? 'verificado' : 'condicionado';
      c.especialidades.forEach(e => {
        if (noPermite.has(e) || (e.startsWith('0590') && noPermite.has('cuerpo:0590'))) return;
        const esp = D.idx.especialidades[e];
        if (!esp) return;
        const prev = espMap[e];
        const item = { esp, estado, por, corr: c, cond, condDef: c.condicion ? D.correspondencias.condiciones[c.condicion.tipo] : null };
        if (!prev || RANK[estado] > RANK[prev.estado]) espMap[e] = item;
      });
    });
    let especialidades = Object.values(espMap).sort((a, b) => RANK[b.estado] - RANK[a.estado] || a.esp.id.localeCompare(b.esp.id));

    // 3. Sin correspondencia documental para la titulación → pendiente de verificación oficial
    const hayCuerpo = especialidades.some(x => ['0590', '0598'].includes(x.esp.cuerpo));
    const pendienteVerif = !hayCuerpo && (h.isUniv || (h.isTS && h.customTitle));
    if (pendienteVerif) {
      especialidades.push({
        esp: { id: '—', nombre: h.isTS ? 'Especialidad del cuerpo 0598 (si tu título corresponde a una de las 10)' : 'Especialidades de los cuerpos 0590 / 0598', cuerpo: h.isTS ? '0598' : '0590', categoria: h.isTS ? 'C' : 'B', vias: ['bolsa'], normativa: ['boib15_2026'] },
        estado: 'no_verificado', sintetico: true, por: h.customTitle ? 'título no catalogado' : 'sin coincidencias',
        cond: { estado: 'comprobar', texto: 'Correspondencia pendiente de verificación oficial. Consulta el Anexo 4 o solicita la inclusión de tu titulación (60 ECTS afines).' }
      });
    }

    const res = { h, especialidades, excluidas, pendienteVerif };
    res.vias = D.vias.vias.map(v => evaluarVia(v, res));
    res.resumen = {
      viasExplorables: res.vias.filter(v => v.estado !== 'no_aplica').length,
      viasDisponibles: res.vias.filter(v => v.estado === 'disponible').length,
      verificadas: especialidades.filter(e => e.estado === 'verificado' && !e.sintetico).length,
      condicionadas: especialidades.filter(e => e.estado === 'condicionado').length,
      noVerificadas: especialidades.filter(e => e.estado === 'no_verificado').length
    };
    res.ruta = hojaDeRuta(res);
    return res;
  }

  /* ---------- Evaluación por vía ---------- */
  const R = (id, estado, detalle, bloquea) => ({ id, estado, detalle, bloquea: bloquea !== undefined ? bloquea : (estado === 'pendiente' || estado === 'comprobar') });

  function reqGenerales(h) {
    if (h.nacionalidad === 'es' || h.nacionalidad === 'ue') return R('req_generales', 'comprobar', 'Nacionalidad válida. Prepara el certificado negativo de delitos sexuales y el resto de requisitos generales.', false);
    if (h.nacionalidad === 'otra') return R('req_generales', 'comprobar', 'Comprueba si tu nacionalidad está incluida en los tratados internacionales aplicables.', true);
    return R('req_generales', 'comprobar', 'Nacionalidad, edad, capacidad funcional, no inhabilitación y certificado de delitos sexuales.', false);
  }
  function reqPed(h, id = 'req_pedagogica') {
    if (h.isUniv) return h.master ? R(id, 'cumplido', 'Máster de Profesorado o exención declarada.') : R(id, 'pendiente', 'Necesitas el Máster de Formación del Profesorado.');
    return h.cofpde ? R(id, 'cumplido', 'Curso de 60 ECTS o exención declarada.') : R(id, 'pendiente', 'Necesitas el Curso Oficial de Formación Pedagógica y Didáctica Equivalente (60 ECTS).');
  }
  function reqCCS(h) {
    if (h.ccs) return R('req_ccs', 'cumplido', h.p.idiomas && h.p.idiomas.exencion0597 ? 'Exención por servicios en el cuerpo de Maestros desde 01/09/2020.' : 'Tienes el CCS o equivalente.');
    const extra = ['C1', 'C2'].includes(h.catalan) ? ` Tu ${h.catalan} no basta para ser admitido.` : '';
    return R('req_ccs', 'pendiente', 'Necesitas el certificado CCS.' + extra);
  }
  function peorCond(items) {
    const conds = items.filter(i => i.cond).map(i => i.cond);
    if (!conds.length) return null;
    // si alguna correspondencia no tiene condición o la cumple, la condición está satisfecha
    if (items.some(i => !i.cond || i.cond.estado === 'cumplida')) {
      const c = items.find(i => i.cond && i.cond.estado === 'cumplida');
      return R('req_condicion', 'cumplido', c ? c.cond.texto : 'Al menos una especialidad no exige acreditación adicional.');
    }
    const comp = conds.find(c => c.estado === 'comprobar');
    return comp ? R('req_condicion', 'comprobar', comp.texto) : R('req_condicion', 'pendiente', conds[0].texto);
  }

  function evaluarVia(v, res) {
    const h = res.h;
    const espV = res.especialidades.filter(e => (e.esp.vias || []).includes(v.id));
    const cuerpo = espV.filter(e => ['0590', '0598'].includes(e.esp.cuerpo));
    const reqs = [];
    let estado = null, motivo = '';
    const anexo4 = () => {
      const real = cuerpo.filter(e => !e.sintetico);
      if (real.some(e => e.estado === 'verificado')) return R('req_anexo4', 'cumplido', `${real.filter(e => e.estado === 'verificado').length} especialidad(es) con correspondencia confirmada.`);
      if (real.length) return R('req_anexo4', 'comprobar', 'Tu titulación figura con condiciones o con listado no verificado literalmente.');
      return R('req_anexo4', 'pendiente', 'No consta tu titulación en el Anexo 4 de la base documental: comprueba el Anexo 4 o solicita la inclusión (60 ECTS afines).');
    };
    const condReq = () => peorCond(cuerpo.filter(e => !e.sintetico));
    const tsSinCuerpo = h.isTS && !h.customTitle && !cuerpo.some(e => !e.sintetico);

    switch (v.id) {
      case 'opos0590':
        if (!h.isUniv) { estado = 'no_aplica'; motivo = 'El cuerpo 0590 exige titulación universitaria (LOE).'; break; }
        reqs.push(reqGenerales(h));
        reqs.push(h.baseNivel === 'diplomatura'
          ? R('req_tit_opos', 'comprobar', 'Diplomatura / Ing. Técnica: solo especialidades del Anexo V del RD 276/2007.')
          : R('req_tit_opos', 'cumplido', 'Nivel de Grado o superior: puedes presentarte (en oposición no se exige afinidad, salvo especialidades con requisitos propios).'));
        reqs.push(reqPed(h, 'req_master'));
        reqs.push(reqCCS(h));
        break;
      case 'bolsa': case 'extraordinaria':
        if (!h.isUniv && !h.isTS) { estado = 'no_aplica'; motivo = 'Exige titulación universitaria o de Técnico Superior incluida en el Anexo 4.'; break; }
        if (tsSinCuerpo) { estado = 'no_aplica'; motivo = 'Tu título de TS no corresponde a ninguna de las 10 especialidades del cuerpo 0598, y el 0590 exige titulación universitaria.'; break; }
        reqs.push(reqGenerales(h));
        reqs.push(anexo4());
        reqs.push(reqPed(h));
        { const c = condReq(); if (c) reqs.push(c); }
        if (v.id === 'bolsa') {
          reqs.push(reqCCS(h));
          reqs.push(h.enBolsa ? R('req_inscripcion', 'cumplido', 'Ya formas parte de la bolsa 2026-2027.') : R('req_inscripcion', 'pendiente', 'Presenta solicitud en la próxima convocatoria anual.'));
        } else {
          reqs.push(h.ccs ? R('req_ccs_excluidos', 'cumplido', 'Con CCS: lista de admitidos.') : R('req_ccs_excluidos', 'opcional', 'Sin CCS puedes entrar en la lista de excluidos por catalán.', false));
        }
        break;
      case 'urgencia':
        if (!h.isUniv && !h.isTS) { estado = 'no_aplica'; motivo = 'Exige una titulación del Anexo 4.'; break; }
        if (tsSinCuerpo) { estado = 'no_aplica'; motivo = 'Tu título de TS no figura en el Anexo 4 de la base documental.'; break; }
        reqs.push(reqGenerales(h));
        reqs.push(anexo4());
        reqs.push(h.pedOk ? R('req_pedagogica_prioridad', 'cumplido', 'Tienes prioridad en el orden de prelación.') : R('req_pedagogica_prioridad', 'comprobar', 'Sin formación pedagógica, solo en especialidades de difícil cobertura autorizadas (orientativo, según resolución de adjudicación).'));
        reqs.push(h.ccs ? R('req_ccs_flex', 'cumplido', 'Con CCS tienes prioridad.') : R('req_ccs_flex', 'opcional', 'Sin CCS puede adjudicarse si no hay admitidos disponibles.', false));
        break;
      case 'singulares0598': {
        const e98 = cuerpo.filter(e => e.esp.cuerpo === '0598');
        if (!h.isUniv && !h.isTS) { estado = 'no_aplica'; motivo = 'Exige título de Técnico Superior o titulación universitaria equivalente.'; break; }
        if (!e98.length) { estado = 'no_aplica'; motivo = h.isTS ? 'Tu título no corresponde a ninguna de las 10 especialidades del cuerpo 0598.' : 'Tu titulación no figura en las correspondencias del cuerpo 0598 de la base documental.'; break; }
        reqs.push(reqGenerales(h));
        const real = e98.filter(e => !e.sintetico);
        reqs.push(real.some(e => e.estado === 'verificado') ? R('req_tit_0598', 'cumplido', 'Correspondencia confirmada con al menos una especialidad.')
          : R('req_tit_0598', 'comprobar', real.length ? 'Correspondencia condicionada o no verificada literalmente.' : 'Título no catalogado: comprueba el Anexo 4.'));
        reqs.push(reqPed(h));
        { const c = peorCond(real); if (c) reqs.push(c); }
        reqs.push(reqCCS(h));
        break;
      }
      case 'expertos': {
        const ex = espV.filter(e => e.esp.cuerpo === 'experto');
        if (!ex.length) {
          estado = 'no_aplica';
          motivo = h.expTiene && h.expAnios > 0 ? 'Tu sector de experiencia no coincide con las especialidades de expertos convocadas (marítimo-pesquera, electricidad, instalación y mantenimiento, fabricación mecánica, vehículos, informática).' : 'Requiere experiencia profesional en el sector productivo.';
          break;
        }
        reqs.push(R('req_exp_sector', 'comprobar', `Declaras ${h.expAnios} año(s) de experiencia: el mínimo lo fijan las bases de cada convocatoria.`));
        reqs.push(h.ccs ? R('req_catalan_convocatoria', 'cumplido', 'Tienes el CCS.') : R('req_catalan_convocatoria', 'comprobar', 'Consulta el requisito de catalán en la convocatoria específica.', false));
        break;
      }
      case 'gradosABC': case 'fpempleo': {
        const titOk = h.isUniv || ['tsfp', 'tecnico', 'cp2', 'cp3'].includes(h.nivel);
        if (titOk) reqs.push(R('req_tit_abc', 'cumplido', ['tecnico', 'cp2'].includes(h.nivel) ? 'Tu titulación permite impartir certificados de nivel 1 y 2 relacionados.' : 'Tu titulación permite impartir módulos relacionados (nivel 3 con FP superior o universitaria).'));
        else if (h.expAnios >= 4) reqs.push(R('req_tit_abc', 'cumplido', `Vía de experto (art. 168.1.c): declaras ${h.expAnios} años de experiencia.`));
        else reqs.push(R('req_tit_abc', 'pendiente', 'Necesitas una titulación relacionada o 4 años de experiencia profesional.'));
        reqs.push(h.ssce ? R('req_ssce0110', 'cumplido', h.ssceMotivo) : R('req_ssce0110', 'pendiente', 'Necesitas el certificado SSCE0110 (o una de sus exenciones).'));
        reqs.push(R('req_contenidos', 'comprobar', 'El centro verifica que tu titulación o experiencia se relaciona con el módulo.', false));
        break;
      }
      case 'privados': {
        if (!h.isUniv && !h.isTS) { estado = 'no_aplica'; motivo = 'Exige la misma titulación que los centros públicos.'; break; }
        if (tsSinCuerpo) { estado = 'no_aplica'; motivo = 'Un TS solo es habilitante para las 10 especialidades del cuerpo 0598.'; break; }
        const real = cuerpo.filter(e => !e.sintetico);
        reqs.push(real.some(e => e.estado === 'verificado') ? R('req_habilitacion', 'cumplido', 'Correspondencia confirmada con al menos una especialidad.')
          : R('req_habilitacion', real.length ? 'comprobar' : 'pendiente', real.length ? 'Correspondencia condicionada: revisa los requisitos adicionales.' : 'No consta correspondencia en la base documental: verifica tu titulación.'));
        reqs.push(reqPed(h));
        reqs.push(h.ccs ? R('req_ccs_concertados', 'cumplido', 'Tienes el CCS.') : R('req_ccs_concertados', 'opcional', 'En centros concertados se exige el CCS.', false));
        break;
      }
    }
    if (!estado) estado = reqs.some(r => r.bloquea) ? 'condicionada' : 'disponible';
    const formacion = reqs.filter(r => r.estado === 'pendiente').map(r => r.id === 'req_pedagogica' ? App.Engine.formacionPed(h) : FORMACION[r.id]).filter(Boolean);
    return { via: v, estado, motivo, requisitos: reqs, especialidades: espV.filter(e => !e.sintetico), formacion: [...new Set(formacion)] };
  }

  const FORMACION = {
    req_master: 'Máster de Formación del Profesorado', req_pedagogica: null, req_ccs: 'Certificado CCS de catalán',
    req_ssce0110: 'Certificado profesional SSCE0110', req_condicion: 'Acreditación adicional (experiencia o ECTS)'
  };
  // req_pedagogica depende del nivel: se resuelve en la vista con App.Engine.formacionPed(h)
  App.Engine = {
    evaluar, hechos,
    formacionPed: h => h.isUniv ? 'Máster de Formación del Profesorado' : 'Curso de formación pedagógica equivalente (60 ECTS)'
  };

  function hojaDeRuta(res) {
    const map = new Map();
    res.vias.filter(v => v.estado !== 'no_aplica').forEach(v => v.requisitos.forEach(r => {
      const k = r.id;
      if (!map.has(k)) map.set(k, { ...r, vias: [v.via.id] });
      else {
        const m = map.get(k); m.vias.push(v.via.id);
        const order = { pendiente: 0, comprobar: 1, opcional: 2, cumplido: 3 };
        if (order[r.estado] < order[m.estado]) Object.assign(m, { estado: r.estado, detalle: r.detalle });
      }
    }));
    const items = [...map.values()];
    // Especialidad docente: resumen de correspondencias
    const r = res.resumen || {};
    const esp = res.especialidades.filter(e => !e.sintetico);
    items.unshift({ id: 'req_correspondencia', estado: esp.some(e => e.estado === 'verificado') ? 'cumplido' : esp.length ? 'comprobar' : 'pendiente',
      detalle: esp.length ? `${esp.filter(e => e.estado === 'verificado').length} confirmada(s), ${esp.filter(e => e.estado === 'condicionado').length} condicionada(s), ${esp.filter(e => e.estado === 'no_verificado').length} no verificada(s).` : 'Correspondencia pendiente de verificación oficial.', vias: [] });
    return items;
  }
})();
