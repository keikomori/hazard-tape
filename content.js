/*
 * Hazard Tape — content script.
 * Lê as regras, descobre se a página atual casa com alguma e desenha a tarja.
 * Reage a mudanças nas regras (sem recarregar) e a navegação em SPAs.
 */
(function () {
  'use strict';
  if (window.top !== window) return; // só na janela principal

  const R = globalThis.TarjaRules;
  const D = globalThis.TarjaRender;
  const HIDE_KEY = '__tarja_oculta';

  let rules = [];
  let current = null; // regra aplicada
  let host = null;    // elemento da tarja
  let lastHref = location.href;
  let titleObserver = null;

  function isHiddenForTab() {
    try { return sessionStorage.getItem(HIDE_KEY) === '1'; } catch (e) { return false; }
  }
  function setHiddenForTab(v) {
    try { v ? sessionStorage.setItem(HIDE_KEY, '1') : sessionStorage.removeItem(HIDE_KEY); } catch (e) {}
  }

  /* ---------- prefixo no título da aba ---------- */
  function applyTitle(rule) {
    stopTitle();
    const prefix = rule && rule.titlePrefix;
    if (!prefix) return;
    const fix = () => {
      if (document.title && !document.title.startsWith(prefix)) document.title = prefix + document.title;
    };
    fix();
    titleObserver = new MutationObserver(fix);
    const watch = () => {
      const el = document.querySelector('head > title') || document.head;
      if (el) titleObserver.observe(el, { childList: true, characterData: true, subtree: true });
    };
    if (document.head) watch();
    else document.addEventListener('DOMContentLoaded', () => { fix(); watch(); }, { once: true });
  }
  function stopTitle() {
    if (titleObserver) { titleObserver.disconnect(); titleObserver = null; }
    if (current && current.titlePrefix && document.title.startsWith(current.titlePrefix)) {
      document.title = document.title.slice(current.titlePrefix.length);
    }
  }

  /* ---------- tarja ---------- */
  function unmount() {
    if (host) { host.remove(); host = null; }
  }

  function render() {
    const match = R.findMatch(rules, location);
    const hidden = isHiddenForTab();
    const sameRule = match && current && JSON.stringify(match) === JSON.stringify(current);

    if (!sameRule) {
      stopTitle();
      unmount();
      current = match;
      if (match) applyTitle(match);
    }

    if (match && !hidden) {
      if (!document.documentElement) {
        // página ainda sem <html>: tenta de novo assim que o DOM existir
        document.addEventListener('readystatechange', render, { once: true });
      } else if (!host || !host.isConnected) {
        unmount();
        host = D.mount(match);
      }
    } else {
      unmount();
    }

    notifyBadge(match, hidden);
  }

  let lastBadge = '';
  function notifyBadge(match, hidden) {
    const payload = match
      ? { type: 'tarja:badge', label: match.label, bg: match.bg, hidden }
      : { type: 'tarja:badge', label: '', bg: '' };
    const key = JSON.stringify(payload);
    if (key === lastBadge) return;
    lastBadge = key;
    try { chrome.runtime.sendMessage(payload).catch(() => {}); } catch (e) { /* extensão recarregada */ }
  }

  /* ---------- dados ---------- */
  function load() {
    chrome.storage.local.get(R.STORAGE_KEY, (data) => {
      rules = Array.isArray(data[R.STORAGE_KEY]) ? data[R.STORAGE_KEY] : [];
      render();
    });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[R.STORAGE_KEY]) {
      rules = changes[R.STORAGE_KEY].newValue || [];
      render();
    }
  });

  /* ---------- mensagens do popup ---------- */
  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (!msg || typeof msg.type !== 'string') return;
    if (msg.type === 'tarja:status') {
      reply({ match: current, hidden: isHiddenForTab(), host: location.host, href: location.href });
    } else if (msg.type === 'tarja:hide') {
      setHiddenForTab(!!msg.hidden);
      render();
      reply({ ok: true });
    }
  });

  /* ---------- navegação em SPA (pushState/hash) ---------- */
  function onMaybeNavigate() {
    if (location.href !== lastHref) { lastHref = location.href; render(); }
  }
  if (window.navigation && typeof window.navigation.addEventListener === 'function') {
    window.navigation.addEventListener('navigatesuccess', onMaybeNavigate);
  }
  window.addEventListener('popstate', onMaybeNavigate);
  window.addEventListener('hashchange', onMaybeNavigate);
  // rede de segurança: URL mudou sem evento, ou o site removeu a tarja do DOM
  setInterval(() => {
    onMaybeNavigate();
    if (current && !isHiddenForTab() && (!host || !host.isConnected)) render();
  }, 1500);

  load();
})();
