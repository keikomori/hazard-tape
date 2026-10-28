/*
 * Hazard Tape — background.
 * Chrome executa este arquivo como service worker. Firefox executa a lista
 * em background.scripts (rules, i18n e este arquivo) como página de evento.
 * Instala as regras de exemplo na primeira vez e mantém o selo do ícone.
 */
if (typeof importScripts === 'function') {
  importScripts('lib/rules.js', 'lib/i18n.js');
}
const R = globalThis.TarjaRules;
const I = globalThis.HazardI18n;

chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.local.get(R.STORAGE_KEY, (data) => {
    if (!Array.isArray(data[R.STORAGE_KEY])) {
      chrome.storage.local.set({ [R.STORAGE_KEY]: R.presets() });
    }
  });
  if (details.reason === 'install') chrome.runtime.openOptionsPage();
});

function badgeText(label) {
  const clean = String(label || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]/g, '');
  return clean.slice(0, 4).toUpperCase();
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || msg.type !== 'tarja:badge' || !sender.tab) return;
  const tabId = sender.tab.id;
  const text = msg.label ? badgeText(msg.label) : '';
  chrome.action.setBadgeText({ tabId, text });
  if (text) {
    chrome.action.setBadgeBackgroundColor({ tabId, color: msg.hidden ? '#868e96' : msg.bg || '#e8590c' });
    if (chrome.action.setBadgeTextColor) chrome.action.setBadgeTextColor({ tabId, color: '#ffffff' });
    chrome.storage.local.get(I.LANG_KEY, (data) => {
      const note = msg.hidden ? ' ' + I.t(I.pick(data[I.LANG_KEY]), 'hiddenOnTab') : '';
      chrome.action.setTitle({ tabId, title: 'Hazard Tape — ' + msg.label + note });
    });
  } else {
    chrome.action.setTitle({ tabId, title: 'Hazard Tape' });
  }
});
