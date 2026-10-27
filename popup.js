(function () {
  'use strict';
  const R = globalThis.TarjaRules;
  const $ = (id) => document.getElementById(id);

  let tab = null;
  let url = null;

  function show(id) {
    ['matched', 'unmatched', 'unsupported'].forEach((k) => ($(k).hidden = k !== id));
  }

  function paintMatch(rule, hidden) {
    const chip = $('chip');
    chip.textContent = rule.label || 'TESTE';
    chip.style.background = rule.bg;
    chip.style.color = rule.fg;
    $('ruleName').textContent = 'Regra: ' + rule.name;
    $('hide').checked = !!hidden;
    show('matched');
  }

  async function init() {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try { url = tab && tab.url ? new URL(tab.url) : null; } catch (e) { url = null; }

    if (!url || !/^https?:$/.test(url.protocol)) {
      $('host').textContent = url ? url.protocol.replace(':', '') + '://' : '—';
      $('addRule').disabled = true;
      show('unsupported');
      return;
    }
    $('host').textContent = url.host;

    // Pergunta ao content script (sabe se a tarja foi ocultada nesta aba)
    let status = null;
    try { status = await chrome.tabs.sendMessage(tab.id, { type: 'tarja:status' }); } catch (e) { status = null; }

    if (status) {
      status.match ? paintMatch(status.match, status.hidden) : show('unmatched');
      return;
    }

    // Aba aberta antes da instalação: calcula pelas regras salvas
    const data = await chrome.storage.local.get(R.STORAGE_KEY);
    const match = R.findMatch(data[R.STORAGE_KEY] || [], url);
    if (match) {
      paintMatch(match, false);
      $('hide').disabled = true;
      $('ruleName').textContent += ' · recarregue a aba para ver a tarja';
    } else {
      show('unmatched');
    }
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

  init();
})();
