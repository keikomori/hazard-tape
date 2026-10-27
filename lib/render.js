/*
 * Tarja de Ambiente — desenho da tarja.
 * Tudo fica dentro de um Shadow DOM fechado, com pointer-events: none,
 * para não herdar CSS do site, não quebrar layout e não bloquear cliques.
 */
(function (root) {
  'use strict';

  const TAG = 'tarja-ambiente';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function safeColor(c, fallback) {
    return /^#[0-9a-f]{3,8}$/i.test(String(c || '')) ? c : fallback;
  }

  function css(rule, contained) {
    const bg = safeColor(rule.bg, '#e8590c');
    const fg = safeColor(rule.fg, '#ffffff');
    const op = Math.min(1, Math.max(0.2, Number(rule.opacity) || 0.92));
    const pos = contained ? 'absolute' : 'fixed';
    const stripes = rule.stripes
      ? `background-image: repeating-linear-gradient(-45deg, rgba(0,0,0,.16) 0 10px, transparent 10px 20px);`
      : '';

    return `
      :host { all: initial; }
      * { box-sizing: border-box; }
      .layer {
        position: ${pos}; inset: 0; pointer-events: none;
        z-index: 2147483647; overflow: hidden;
        font: 700 12px/1 system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        letter-spacing: .08em; text-transform: uppercase;
      }
      .mark {
        position: absolute; color: ${fg}; background-color: ${bg}; opacity: ${op};
        ${stripes}
        box-shadow: 0 2px 8px rgba(0,0,0,.28);
        white-space: nowrap; text-align: center;
      }
      .frame {
        position: absolute; inset: 0;
        box-shadow: inset 0 0 0 4px ${bg};
        opacity: ${op};
      }

      /* Fita diagonal */
      .ribbon { width: 220px; padding: 7px 0; }
      .ribbon.top-right    { top: 34px;    right: -56px; transform: rotate(45deg); }
      .ribbon.top-left     { top: 34px;    left: -56px;  transform: rotate(-45deg); }
      .ribbon.bottom-right { bottom: 34px; right: -56px; transform: rotate(-45deg); }
      .ribbon.bottom-left  { bottom: 34px; left: -56px;  transform: rotate(45deg); }

      /* Faixa horizontal */
      .bar { left: 0; right: 0; padding: 5px 12px; font-size: 11px; }
      .bar.top    { top: 0; }
      .bar.bottom { bottom: 0; }

      /* Triângulo */
      .triangle { width: 0; height: 0; background: none; box-shadow: none; }
      .triangle .tri {
        position: absolute; width: 96px; height: 96px; background-color: ${bg}; ${stripes}
      }
      .triangle .txt {
        position: absolute; width: 96px; top: 26px; font-size: 10px; color: ${fg};
      }
      .triangle.top-left     { top: 0; left: 0; }
      .triangle.top-left .tri     { clip-path: polygon(0 0, 100% 0, 0 100%); }
      .triangle.top-left .txt     { left: -14px; transform: rotate(-45deg); }
      .triangle.top-right    { top: 0; right: 0; }
      .triangle.top-right .tri    { right: 0; clip-path: polygon(0 0, 100% 0, 100% 100%); }
      .triangle.top-right .txt    { right: -14px; transform: rotate(45deg); }
      .triangle.bottom-left  { bottom: 0; left: 0; }
      .triangle.bottom-left .tri  { bottom: 0; clip-path: polygon(0 0, 0 100%, 100% 100%); }
      .triangle.bottom-left .txt  { bottom: 26px; top: auto; left: -14px; transform: rotate(45deg); }
      .triangle.bottom-right { bottom: 0; right: 0; }
      .triangle.bottom-right .tri { bottom: 0; right: 0; clip-path: polygon(100% 0, 0 100%, 100% 100%); }
      .triangle.bottom-right .txt { bottom: 26px; top: auto; right: -14px; transform: rotate(-45deg); }
    `;
  }

  /** Posição efetiva: faixa só usa topo/rodapé; cantos só usam cantos. */
  function effectivePosition(rule) {
    const p = rule.position || 'top-right';
    if (rule.style === 'bar') return p.startsWith('bottom') ? 'bottom' : 'top';
    if (p === 'top') return 'top-right';
    if (p === 'bottom') return 'bottom-right';
    return p;
  }

  function markup(rule) {
    const label = esc(rule.label || 'TESTE');
    const pos = effectivePosition(rule);
    const frame = rule.frame || rule.style === 'frame' ? '<div class="frame"></div>' : '';
    let mark = '';
    if (rule.style === 'ribbon') mark = `<div class="mark ribbon ${pos}">${label}</div>`;
    else if (rule.style === 'bar') mark = `<div class="mark bar ${pos}">${label}</div>`;
    else if (rule.style === 'triangle')
      mark = `<div class="mark triangle ${pos}"><div class="tri"></div><div class="txt">${label}</div></div>`;
    return `<div class="layer" role="note" aria-label="Ambiente: ${label}">${frame}${mark}</div>`;
  }

  /**
   * Monta a tarja. `container` padrão é o <html> da página (posição fixa);
   * se for outro elemento, a tarja fica contida nele (usado no preview).
   * Retorna o elemento host.
   */
  function mount(rule, container) {
    const contained = !!container;
    const parent = container || document.documentElement;
    const host = document.createElement(TAG);
    host.setAttribute('data-tarja', rule.id || '');
    const shadow = host.attachShadow({ mode: contained ? 'open' : 'closed' });
    shadow.innerHTML = `<style>${css(rule, contained)}</style>${markup(rule)}`;
    parent.appendChild(host);
    return host;
  }

  const api = { TAG, mount, effectivePosition };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TarjaRender = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
