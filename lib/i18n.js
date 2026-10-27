/*
 * Hazard Tape — textos da interface (pt / en).
 * Página de opções, popup e dica do ícone.
 */
(function (root) {
  'use strict';

  const LANG_KEY = 'uiLang';

  const STR = {
    pt: {
      docTitle: 'Hazard Tape — Regras',
      tagline: 'A primeira regra ativa que casar com o endereço é a aplicada. Mude a prioridade com ↑ ↓.',
      export: 'Exportar',
      import: 'Importar',
      reset: 'Restaurar exemplos',
      rules: 'Regras',
      add: '+ Nova',
      empty: 'Nenhuma regra ainda.',
      ruleName: 'Nome da regra',
      enabled: 'Ativa',
      where: 'Onde aparece',
      compare: 'Comparar com',
      matchType: 'Tipo de comparação',
      patterns: 'Padrões',
      patternsHint: '(um por linha — basta um casar)',
      patternsPh: 'staging\nhomolog.minhaempresa.com.br',
      testUrl: 'Testar um endereço',
      appearance: 'Aparência',
      tapeText: 'Texto da tarja',
      bg: 'Fundo',
      fg: 'Texto',
      style: 'Estilo',
      position: 'Posição',
      opacity: 'Opacidade',
      frame: 'Moldura colorida em volta da tela',
      stripes: 'Listras de alerta',
      titlePrefix: 'Prefixo no título da aba',
      titlePrefixHint: '(opcional, ex.: [HML])',
      preview: 'Prévia',
      duplicate: 'Duplicar',
      delete: 'Excluir regra',
      saved: 'Salvo ✓',
      enable: 'Ativar',
      disable: 'Desativar',
      unnamed: 'Sem nome',
      noPattern: 'sem padrão',
      moveUp: 'Subir prioridade',
      moveDown: 'Descer prioridade',
      badRegex: 'Regex inválida: {msg}',
      badUrl: 'Endereço inválido',
      noMatch: '✗ Não casa',
      matchBut: '⚠ Casa, mas "{name}" tem prioridade',
      matchOn: '✓ Casa — esta tarja aparece',
      matchOff: '✓ Casa (regra desativada)',
      copySuffix: ' (cópia)',
      confirmDelete: 'Excluir a regra "{name}"?',
      confirmReset: 'Adicionar as regras de exemplo (Local, Homologação, Produção) ao fim da lista?',
      confirmImport: '{n} regra(s) no arquivo.\n\nOK = substituir as regras atuais\nCancelar = adicionar ao fim da lista',
      importFail: 'Não consegui importar: {msg}',
      newEnv: 'Novo ambiente',
      language: 'Idioma',
      hideHere: 'Ocultar a tarja nesta aba',
      noRule: 'Nenhuma regra casa com este endereço.',
      unsupported: 'Esta página não pode receber a tarja (páginas internas do navegador ou da loja de extensões).',
      addForHost: '+ Regra para este domínio',
      manage: 'Gerenciar regras',
      rulePrefix: 'Regra: ',
      reloadHint: ' · recarregue a aba para ver a tarja',
      hiddenOnTab: '(oculta nesta aba)'
    },
    en: {
      docTitle: 'Hazard Tape — Rules',
      tagline: 'The first enabled rule that matches the address is the one applied. Change priority with ↑ ↓.',
      export: 'Export',
      import: 'Import',
      reset: 'Restore examples',
      rules: 'Rules',
      add: '+ New',
      empty: 'No rules yet.',
      ruleName: 'Rule name',
      enabled: 'Enabled',
      where: 'Where it shows',
      compare: 'Compare against',
      matchType: 'Match type',
      patterns: 'Patterns',
      patternsHint: '(one per line — one match is enough)',
      patternsPh: 'staging\nstaging.example.com',
      testUrl: 'Test an address',
      appearance: 'Appearance',
      tapeText: 'Banner text',
      bg: 'Background',
      fg: 'Text',
      style: 'Style',
      position: 'Position',
      opacity: 'Opacity',
      frame: 'Colored frame around the screen',
      stripes: 'Hazard stripes',
      titlePrefix: 'Tab title prefix',
      titlePrefixHint: '(optional, e.g. [STG])',
      preview: 'Preview',
      duplicate: 'Duplicate',
      delete: 'Delete rule',
      saved: 'Saved ✓',
      enable: 'Enable',
      disable: 'Disable',
      unnamed: 'Untitled',
      noPattern: 'no pattern',
      moveUp: 'Raise priority',
      moveDown: 'Lower priority',
      badRegex: 'Invalid regular expression: {msg}',
      badUrl: 'Invalid address',
      noMatch: '✗ No match',
      matchBut: '⚠ Matches, but "{name}" has priority',
      matchOn: '✓ Matches — this banner shows',
      matchOff: '✓ Matches (rule disabled)',
      copySuffix: ' (copy)',
      confirmDelete: 'Delete the rule "{name}"?',
      confirmReset: 'Add the example rules (Local, Homologação, Produção) to the end of the list?',
      confirmImport: '{n} rule(s) in the file.\n\nOK = replace the current rules\nCancel = append to the list',
      importFail: 'Could not import: {msg}',
      newEnv: 'New environment',
      language: 'Language',
      hideHere: 'Hide the banner on this tab',
      noRule: 'No rule matches this address.',
      unsupported: 'This page cannot show the banner (browser internal pages or the extension store).',
      addForHost: '+ Rule for this domain',
      manage: 'Manage rules',
      rulePrefix: 'Rule: ',
      reloadHint: ' · reload the tab to see the banner',
      hiddenOnTab: '(hidden on this tab)'
    }
  };

  const SELECTS = {
    pt: {
      target: { host: 'Domínio (host)', url: 'URL completa (host + caminho)' },
      matchType: {
        contains: 'Contém',
        prefix: 'Começa com',
        suffix: 'Termina com',
        exact: 'Igual a',
        wildcard: 'Curinga (*)',
        regex: 'Expressão regular'
      },
      style: {
        ribbon: 'Fita diagonal no canto',
        bar: 'Faixa horizontal',
        triangle: 'Triângulo no canto',
        frame: 'Só moldura na tela'
      },
      position: {
        'top-right': 'Superior direito',
        'top-left': 'Superior esquerdo',
        'bottom-right': 'Inferior direito',
        'bottom-left': 'Inferior esquerdo',
        top: 'Topo (faixa)',
        bottom: 'Rodapé (faixa)'
      }
    },
    en: {
      target: { host: 'Domain (host)', url: 'Full URL (host + path)' },
      matchType: {
        contains: 'Contains',
        prefix: 'Starts with',
        suffix: 'Ends with',
        exact: 'Equals',
        wildcard: 'Wildcard (*)',
        regex: 'Regular expression'
      },
      style: {
        ribbon: 'Diagonal tape in the corner',
        bar: 'Horizontal bar',
        triangle: 'Corner triangle',
        frame: 'Frame only'
      },
      position: {
        'top-right': 'Top right',
        'top-left': 'Top left',
        'bottom-right': 'Bottom right',
        'bottom-left': 'Bottom left',
        top: 'Top (bar)',
        bottom: 'Bottom (bar)'
      }
    }
  };

  function pick(value) {
    if (value === 'en' || value === 'pt') return value;
    const nav = (typeof navigator !== 'undefined' && navigator.language) || '';
    return /^pt\b/i.test(nav) ? 'pt' : 'en';
  }

  function t(lang, key, vars) {
    const pack = STR[lang] || STR.en;
    let s = pack[key] != null ? pack[key] : STR.en[key] != null ? STR.en[key] : key;
    if (vars) {
      for (const k in vars) s = s.replaceAll('{' + k + '}', String(vars[k]));
    }
    return s;
  }

  const api = { LANG_KEY, STR, SELECTS, pick, t };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HazardI18n = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
