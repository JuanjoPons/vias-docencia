/* Diagrama de flujo interactivo por vía: nodos en rejilla (paso × columna) y conexiones SVG calculadas. */
(function () {
  'use strict';
  const App = window.App;
  const TIPO = {
    inicio: ['flag', 'Punto de partida', 'var(--via)'], academico: ['graduation', 'Requisito académico', 'var(--c-esp)'],
    pedagogico: ['book', 'Formación pedagógica', 'var(--c-sistemafp)'], experiencia: ['briefcase', 'Experiencia profesional', 'var(--c-interinidad)'],
    linguistico: ['lang', 'Requisito lingüístico', 'var(--c-laboral)'], procedimiento: ['clipboard', 'Procedimiento', 'var(--c-publica)'],
    decision: ['help', 'Ramificación', 'var(--c-warn)'], resultado: ['award', 'Salida profesional', 'var(--c-ok)'], alternativa: ['route', 'Alternativa', 'var(--c-unv)']
  };
  const COL = { l: 1, c: 2, r: 3 };
  App.TIPO_NODO = TIPO;

  App.Diagram = {
    /* opts: { estadoVia (resultado del motor para esta vía), revealed (paso máximo visible o null), selected, onSelect } */
    render(host, via, opts = {}) {
      const nodes = via.diagrama.nodos, color = App.viaColor(via);
      const maxPaso = Math.max(...nodes.map(n => n.paso));
      const reqMap = {};
      if (opts.estadoVia) opts.estadoVia.requisitos.forEach(r => { reqMap[r.id] = r; });
      const nodeHtml = (n, mobile) => {
        const t = TIPO[n.tipo] || TIPO.procedimiento;
        const dim = opts.revealed != null && n.paso > opts.revealed;
        const pr = n.req && reqMap[n.req];
        const pst = pr ? `<span class="pst">${App.badge(pr.estado === 'cumplido' ? 'verificado' : pr.estado === 'pendiente' ? 'condicionado' : 'no_verificado', App.stLabel(pr.estado).toUpperCase())}</span>` : '';
        return `<button class="node t-${n.tipo} c-${n.caracter} ${dim ? 'dim' : ''} ${opts.selected === n.id ? 'sel' : ''} ${opts.animate && n.paso === opts.revealed ? 'reveal' : ''}"
          data-node="${n.id}" style="${mobile ? '' : `grid-row:${n.paso};grid-column:${COL[n.col] || 2};`}--nc:${t[2]}" aria-label="${App.esc(t[1] + ': ' + n.titulo)}">
          <span class="ni">${App.icon(t[0])}</span><span><span class="nk">${App.esc(t[1])}</span><span class="nt">${App.esc(n.titulo)}</span></span>${pst}</button>`;
      };
      // Vista móvil: lista por pasos
      const pasos = [...new Set(nodes.map(n => n.paso))].sort((a, b) => a - b);
      const mobile = pasos.map((p, i) => {
        const ns = nodes.filter(n => n.paso === p).sort((a, b) => COL[a.col] - COL[b.col]);
        return `${i ? `<div class="marrow">${App.icon('arrowD')}</div>` : ''}<div class="mstep">${ns.length > 1 ? '<div class="alt-label">RAMIFICACIÓN · ' + ns.length + ' opciones</div>' : ''}${ns.map(n => nodeHtml(n, true)).join('')}</div>`;
      }).join('');
      host.innerHTML = `<div class="dg" style="--via:${color}">
        <div class="dg-desktop"><svg class="dg-svg" aria-hidden="true"></svg><div class="dg-grid" style="grid-template-rows:repeat(${maxPaso}, auto)">${nodes.map(n => nodeHtml(n)).join('')}</div></div>
        <div class="dg-mobile">${mobile}</div></div>`;
      host.querySelectorAll('[data-node]').forEach(b => b.addEventListener('click', () => opts.onSelect && opts.onSelect(b.dataset.node)));
      const draw = () => this.drawEdges(host, via, opts);
      requestAnimationFrame(draw);
      if (host._ro) host._ro.disconnect();
      host._ro = new ResizeObserver(() => requestAnimationFrame(draw));
      host._ro.observe(host);
    },

    drawEdges(host, via, opts) {
      const grid = host.querySelector('.dg-grid'), svg = host.querySelector('.dg-svg');
      if (!grid || !svg || !grid.offsetParent) return;
      const base = grid.getBoundingClientRect();
      const nodes = App.by(via.diagrama.nodos);
      let html = `<defs><marker id="arr-${via.id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${App.viaColor(via)}"/></marker></defs>`;
      const labels = [];
      via.diagrama.aristas.forEach(([a, b, label]) => {
        const ea = grid.querySelector(`[data-node="${a}"]`), eb = grid.querySelector(`[data-node="${b}"]`);
        if (!ea || !eb) return;
        const ra = ea.getBoundingClientRect(), rb = eb.getBoundingClientRect();
        const sx = ra.left - base.left + ra.width / 2, sy = ra.bottom - base.top;
        const ex = rb.left - base.left + rb.width / 2, ey = rb.top - base.top - 2;
        const dy = Math.max(18, (ey - sy) / 2);
        const d = `M${sx},${sy} C${sx},${sy + dy} ${ex},${ey - dy} ${ex},${ey}`;
        const hidden = opts.revealed != null && nodes[b] && nodes[b].paso > opts.revealed;
        const cond = nodes[b] && (nodes[b].caracter === 'condicional' || nodes[b].tipo === 'alternativa');
        html += `<path d="${d}" class="${cond ? 'dashed' : ''}" marker-end="url(#arr-${via.id})" style="opacity:${hidden ? .06 : .85}"/>`;
        if (!hidden && !cond) html += `<path d="${d}" class="flow"/>`;
        if (label && !hidden) {
          const mx = sx + (ex - sx) * .35, my = sy + (ey - sy) * .35, w = label.length * 6.6 + 14;
          labels.push(`<rect class="lbl" x="${mx - w / 2}" y="${my - 10}" width="${w}" height="20" rx="10"/><text x="${mx}" y="${my + 4}" text-anchor="middle">${App.esc(label)}</text>`);
        }
      });
      svg.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`);
      svg.innerHTML = html + labels.join('');
    },

    /* Panel de detalle de una etapa */
    detail(via, nodeId, estadoVia) {
      const n = via.diagrama.nodos.find(x => x.id === nodeId) || via.diagrama.nodos[0];
      const t = TIPO[n.tipo] || TIPO.procedimiento;
      const car = { obligatorio: App.badge('info', 'OBLIGATORIO'), condicional: App.badge('condicionado', 'CONDICIONAL'), informativo: App.badge('no_verificado', 'INFORMATIVO') }[n.caracter] || '';
      let mine = '';
      if (estadoVia && n.req) {
        const r = estadoVia.requisitos.find(x => x.id === n.req);
        if (r) mine = `<div class="notice ${r.estado === 'cumplido' ? 'info' : ''} sec">${App.stIco(r.estado)}<div><b>Tu situación: ${App.esc(App.stLabel(r.estado))}</b><br><span class="small">${App.esc(r.detalle)}</span></div></div>`;
      }
      const list = (arr, tit) => arr && arr.length ? `<div class="sec"><h4>${tit}</h4><ul>${arr.map(x => `<li>${App.esc(x)}</li>`).join('')}</ul></div>` : '';
      const idx = via.diagrama.nodos.findIndex(x => x.id === n.id);
      return `<div class="row" style="gap:12px;align-items:flex-start"><div class="tile sm" style="--tc:${t[2].replace('var(--via)', App.viaColor(via))}">${App.icon(t[0])}</div>
        <div style="flex:1;min-width:0"><div class="tiny muted" style="font-weight:700">ETAPA ${n.paso} · ${App.esc(t[1].toUpperCase())}</div><h3>${App.esc(n.titulo)}</h3>${car}</div></div>
        <p class="sec">${App.esc(n.resumen)}</p>${mine}
        ${list(n.requisitos, 'Requisitos')}${list(n.documentacion, 'Documentación necesaria')}
        <div class="sec"><h4>Fuente normativa</h4><div class="small">${n.fuente ? App.norma(n.fuente) : '—'}</div></div>
        ${n.enlace ? `<div class="sec"><h4>Enlace oficial</h4><div class="small">${App.link(n.enlace)}</div></div>` : ''}
        <div class="row sec"><button class="btn sm" data-step="${idx - 1}" ${idx <= 0 ? 'disabled' : ''}>${App.icon('chevL')} Anterior</button>
        <button class="btn sm" data-step="${idx + 1}" ${idx >= via.diagrama.nodos.length - 1 ? 'disabled' : ''}>Siguiente ${App.icon('chevR')}</button></div>`;
    }
  };
})();
