/*
 * Tarja de Ambiente — service worker.
 * Instala as regras de exemplo na primeira vez e mantém o selo (badge)
 * do ícone da extensão com o nome do ambiente da aba.
 */
importScripts('lib/rules.js');
const R = globalThis.TarjaRules;

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
    chrome.action.setTitle({ tabId, title: 'Tarja de Ambiente — ' + msg.label + (msg.hidden ? ' (oculta nesta aba)' : '') });
  } else {
    chrome.action.setTitle({ tabId, title: 'Tarja de Ambiente' });
  }
});
