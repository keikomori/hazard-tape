(function () {
  'use strict';
  const R = globalThis.TarjaRules;
  const I = globalThis.HazardI18n;
  const $ = (id) => document.getElementById(id);

  let tab = null;
  let url = null;
  let lang = 'pt';
  let view = null;

  function tr(key, vars) {
    return I.t(lang, key, vars);
  }

  function show(id) {
    ['matched', 'unmatched', 'unsupported'].forEach((k) => ($(k).hidden = k !== id));
  }

  function applyLang() {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = tr(el.dataset.i18n);
    });
    const group = $('langSwitch');
    if (group) group.setAttribute('aria-label', tr('language'));
    document.querySelectorAll('.lang-btn').forEach((b) => {
      const on = b.dataset.lang === lang;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (view) renderView();
  }

  function paintMatch(rule, hidden, reload) {
    const chip = $('chip');
    chip.textContent = rule.label || 'TESTE';
    chip.style.background = rule.bg;
    chip.style.color = rule.fg;
    $('ruleName').textContent = tr('rulePrefix') + rule.name + (reload ? tr('reloadHint') : '');
    $('hide').checked = !!hidden;
    $('hide').disabled = !!reload;
    show('matched');
  }

  function renderView() {
    if (!view) return;
    if (view.kind === 'matched') paintMatch(view.rule, view.hidden, view.reload);
    else show(view.kind);
  }

  async function init() {
    const stored = await chrome.storage.local.get(I.LANG_KEY);
    lang = I.pick(stored[I.LANG_KEY]);
    applyLang();

    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try { url = tab && tab.url ? new URL(tab.url) : null; } catch (e) { url = null; }

    if (!url || !/^https?:$/.test(url.protocol)) {
      $('host').textContent = url ? url.protocol.replace(':', '') + '://' : '—';
      $('addRule').disabled = true;
      view = { kind: 'unsupported' };
      renderView();
      return;
    }
    $('host').textContent = url.host;

    // Pergunta ao content script (sabe se a tarja foi ocultada nesta aba)
    let status = null;
    try { status = await chrome.tabs.sendMessage(tab.id, { type: 'tarja:status' }); } catch (e) { status = null; }

    if (status) {
      view = status.match
        ? { kind: 'matched', rule: status.match, hidden: status.hidden, reload: false }
        : { kind: 'unmatched' };
      renderView();
      return;
    }

    // Aba aberta antes da instalação: calcula pelas regras salvas
    const data = await chrome.storage.local.get(R.STORAGE_KEY);
    const match = R.findMatch(data[R.STORAGE_KEY] || [], url);
    if (match) {
      view = { kind: 'matched', rule: match, hidden: false, reload: true };
    } else {
      view = { kind: 'unmatched' };
    }
    renderView();
  }

  $('hide').addEventListener('change', async (e) => {
    try { await chrome.tabs.sendMessage(tab.id, { type: 'tarja:hide', hidden: e.target.checked }); } catch (err) {}
  });

  $('addRule').addEventListener('click', () => {
    const q = url ? '?novo=' + encodeURIComponent(url.host) : '';
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html' + q) });
    window.close();
  });

  $('openOptions').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  document.querySelectorAll('.lang-btn').forEach((b) => {
    b.addEventListener('click', async () => {
      if (b.dataset.lang === lang) return;
      lang = b.dataset.lang;
      await chrome.storage.local.set({ [I.LANG_KEY]: lang });
      applyLang();
    });
  });

  init();
})();
