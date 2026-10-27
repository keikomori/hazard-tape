/*
 * Tarja de Ambiente — modelo de regras e lógica de casamento.
 * Compartilhado entre content script, popup e página de opções.
 * Também funciona em Node (module.exports) para os testes.
 */
(function (root) {
  'use strict';

  const STORAGE_KEY = 'rules';

  const MATCH_TYPES = {
    contains: 'Contém',
    prefix: 'Começa com',
    suffix: 'Termina com',
    exact: 'Igual a',
    wildcard: 'Curinga (*)',
    regex: 'Expressão regular'
  };

  const TARGETS = {
    host: 'Domínio (host)',
    url: 'URL completa (host + caminho)'
  };

  const STYLES = {
    ribbon: 'Fita diagonal no canto',
    bar: 'Faixa horizontal',
    triangle: 'Triângulo no canto',
    frame: 'Só moldura na tela'
  };

  const POSITIONS = {
    'top-right': 'Superior direito',
    'top-left': 'Superior esquerdo',
    'bottom-right': 'Inferior direito',
    'bottom-left': 'Inferior esquerdo',
    top: 'Topo (faixa)',
    bottom: 'Rodapé (faixa)'
  };

  function uid() {
    return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function defaultRule(overrides) {
    return Object.assign(
      {
        id: uid(),
        enabled: true,
        name: 'Novo ambiente',
        target: 'host',
        matchType: 'contains',
        patterns: '',
        label: 'TESTE',
        bg: '#e8590c',
        fg: '#ffffff',
        style: 'ribbon',
        position: 'top-right',
        frame: false,
        opacity: 0.92,
        titlePrefix: '',
        stripes: false
      },
      overrides || {}
    );
  }

  function presets() {
    return [
      defaultRule({
        name: 'Local',
        matchType: 'regex',
        patterns: '^(localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0)(:\\d+)?$',
        label: 'LOCAL',
        bg: '#2b8a3e',
        style: 'ribbon',
        position: 'top-right',
        titlePrefix: '[LOCAL] '
      }),
      defaultRule({
        name: 'Homologação / Staging',
        matchType: 'contains',
        patterns: 'staging\nhomolog\nhml.\n-stg.\nqa.',
        label: 'HOMOLOGAÇÃO',
        bg: '#e8590c',
        style: 'bar',
        position: 'top',
        stripes: true,
        frame: true,
        titlePrefix: '[HML] '
      }),
      defaultRule({
        name: 'Produção (exemplo — desligado)',
        enabled: false,
        matchType: 'exact',
        patterns: 'erp.suaempresa.com.br',
        label: 'PRODUÇÃO',
        bg: '#c92a2a',
        style: 'triangle',
        position: 'top-left'
      })
    ];
  }

  /** Quebra o campo de padrões em uma lista (uma por linha ou separada por vírgula). */
  function splitPatterns(raw) {
    return String(raw || '')
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function wildcardToRegex(p) {
    const esc = p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp('^' + esc + '$', 'i');
  }

  /** Texto contra o qual a regra é testada. */
  function targetText(rule, loc) {
    const host = (loc.host || '').toLowerCase(); // inclui porta, se houver
    if (rule.target === 'url') {
      return host + (loc.pathname || '/') + (loc.search || '') + (loc.hash || '');
    }
    return host;
  }

  function testPattern(matchType, pattern, text) {
    const t = text.toLowerCase();
    const p = pattern.toLowerCase();
    switch (matchType) {
      case 'prefix':
        return t.startsWith(p);
      case 'suffix':
        return t.endsWith(p);
      case 'exact':
        return t === p;
      case 'wildcard':
        return wildcardToRegex(pattern).test(text);
      case 'regex':
        try {
          return new RegExp(pattern, 'i').test(text);
        } catch (e) {
          return false;
        }
      case 'contains':
      default:
        return t.includes(p);
    }
  }

  function ruleMatches(rule, loc) {
    if (!rule || !rule.enabled) return false;
    const text = targetText(rule, loc);
    if (!text) return false;
    return splitPatterns(rule.patterns).some((p) => testPattern(rule.matchType, p, text));
  }

  /** Primeira regra ativa que casa, na ordem da lista (a ordem define a prioridade). */
  function findMatch(rules, loc) {
    if (!Array.isArray(rules)) return null;
    for (const r of rules) if (ruleMatches(r, loc)) return r;
    return null;
  }

  /** Valida um padrão regex para mostrar erro na tela de opções. */
  function regexError(rule) {
    if (rule.matchType !== 'regex') return null;
    for (const p of splitPatterns(rule.patterns)) {
      try {
        new RegExp(p);
      } catch (e) {
        return p + ' → ' + e.message;
      }
    }
    return null;
  }

  /** Normaliza regras importadas (JSON) preenchendo campos ausentes. */
  function normalize(list) {
    if (!Array.isArray(list)) throw new Error('O arquivo precisa conter uma lista de regras.');
    return list.map((r) => {
      const n = defaultRule(r);
      if (!n.id || typeof n.id !== 'string') n.id = uid();
      if (Array.isArray(r.patterns)) n.patterns = r.patterns.join('\n');
      if (!MATCH_TYPES[n.matchType]) n.matchType = 'contains';
      if (!TARGETS[n.target]) n.target = 'host';
      if (!STYLES[n.style]) n.style = 'ribbon';
      if (!POSITIONS[n.position]) n.position = 'top-right';
      n.opacity = Math.min(1, Math.max(0.2, Number(n.opacity) || 0.92));
      return n;
    });
  }

  const api = {
    STORAGE_KEY,
    MATCH_TYPES,
    TARGETS,
    STYLES,
    POSITIONS,
    uid,
    defaultRule,
    presets,
    splitPatterns,
    targetText,
    testPattern,
    ruleMatches,
    findMatch,
    regexError,
    normalize
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TarjaRules = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
