(function () {
  'use strict';
  const R = globalThis.TarjaRules;
  const D = globalThis.TarjaRender;
  const I = globalThis.HazardI18n;
  const $ = (id) => document.getElementById(id);

  let rules = [];
  let selectedId = null;
  let saveTimer = null;
  let lang = 'pt';

  function tr(key, vars) {
    return I.t(lang, key, vars);
  }

  const FIELDS = ['name', 'enabled', 'target', 'matchType', 'patterns', 'label', 'bg', 'fg',
    'style', 'position', 'opacity', 'frame', 'stripes', 'titlePrefix'];

  /* ---------- persistência ---------- */
  async function load() {
    const data = await chrome.storage.local.get(R.STORAGE_KEY);
    rules = Array.isArray(data[R.STORAGE_KEY]) ? data[R.STORAGE_KEY] : [];
  }

  function save(now) {
    clearTimeout(saveTimer);
    const run = async () => {
      await chrome.storage.local.set({ [R.STORAGE_KEY]: rules });
      const s = $('saved');
      s.textContent = tr('saved');
      s.classList.add('on');
      setTimeout(() => s.classList.remove('on'), 1200);
    };
    now ? run() : (saveTimer = setTimeout(run, 300));
  }

  /* ---------- selects ---------- */
  function fillSelect(el, map) {
    el.innerHTML = '';
    for (const [value, text] of Object.entries(map)) {
      const o = document.createElement('option');
      o.value = value;
      o.textContent = text;
      el.appendChild(o);
    }
  }
  function fillLabeledSelects() {
    const maps = I.SELECTS[lang];
    for (const [id, map] of [
      ['f-target', maps.target],
      ['f-matchType', maps.matchType],
      ['f-style', maps.style],
      ['f-position', maps.position]
    ]) {
      const el = $(id);
      const value = el.value;
      fillSelect(el, map);
      if (value) el.value = value;
    }
  }

  function applyLang() {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
    document.title = tr('docTitle');
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = tr(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = tr(el.dataset.i18nPlaceholder);
    });
    const group = $('langSwitch');
    if (group) group.setAttribute('aria-label', tr('language'));
    document.querySelectorAll('.lang-btn').forEach((b) => {
      const on = b.dataset.lang === lang;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    fillLabeledSelects();
  }

  /* ---------- lista ---------- */
  function renderList() {
    const ol = $('list');
    ol.innerHTML = '';
    $('empty').hidden = rules.length > 0;

    rules.forEach((r, i) => {
      const li = document.createElement('li');
      li.className = 'rule-item' + (r.id === selectedId ? ' sel' : '') + (r.enabled ? '' : ' off');
      li.dataset.id = r.id;

      const toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.checked = !!r.enabled;
      toggle.title = r.enabled ? tr('disable') : tr('enable');
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        r.enabled = toggle.checked;
        save(true);
        renderList();
        if (r.id === selectedId) $('f-enabled').checked = r.enabled;
      });

      const chip = document.createElement('span');
      chip.className = 'chip sm';
      chip.textContent = r.label || '—';
      chip.style.background = r.bg;
      chip.style.color = r.fg;

      const text = document.createElement('div');
      text.className = 'rule-text';
      const name = document.createElement('strong');
      name.textContent = r.name || tr('unnamed');
      const pats = document.createElement('span');
      pats.className = 'muted small';
      const list = R.splitPatterns(r.patterns);
      pats.textContent = list.length ? list.slice(0, 2).join(', ') + (list.length > 2 ? ' …' : '') : tr('noPattern');
      text.append(name, pats);

      const moves = document.createElement('div');
      moves.className = 'moves';
      const up = mkMove('↑', tr('moveUp'), i > 0, () => move(i, -1));
      const down = mkMove('↓', tr('moveDown'), i < rules.length - 1, () => move(i, 1));
      moves.append(up, down);

      li.append(toggle, chip, text, moves);
      li.addEventListener('click', () => select(r.id));
      ol.appendChild(li);
    });
  }

  function mkMove(sym, title, enabled, fn) {
    const b = document.createElement('button');
    b.className = 'icon-btn';
    b.textContent = sym;
    b.title = title;
    b.disabled = !enabled;
    b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
    return b;
  }

  function move(i, dir) {
    const j = i + dir;
    [rules[i], rules[j]] = [rules[j], rules[i]];
    save(true);
    renderList();
  }

  /* ---------- editor ---------- */
  function current() {
    return rules.find((r) => r.id === selectedId) || null;
  }

  function select(id) {
    selectedId = id;
    const r = current();
    $('editor').hidden = !r;
    renderList();
    if (!r) return;
    for (const f of FIELDS) {
      const el = $('f-' + f);
      if (el.type === 'checkbox') el.checked = !!r[f];
      else el.value = r[f] == null ? '' : r[f];
    }
    afterEdit(r);
  }

  function afterEdit(r) {
    $('opOut').textContent = Math.round(Number(r.opacity) * 100) + '%';
    const err = R.regexError(r);
    $('regexErr').hidden = !err;
    $('regexErr').textContent = err ? tr('badRegex', { msg: err }) : '';
    syncPositionOptions(r);
    renderPreview(r);
    runTest();
  }

  /** Mostra só as posições que fazem sentido para o estilo escolhido. */
  function syncPositionOptions(r) {
    const sel = $('f-position');
    const isBar = r.style === 'bar';
    for (const o of sel.options) {
      const barOpt = o.value === 'top' || o.value === 'bottom';
      o.hidden = isBar ? !barOpt : barOpt;
      o.disabled = r.style === 'frame';
    }
    const eff = D.effectivePosition(r);
    if (eff !== r.position) { r.position = eff; sel.value = eff; }
  }

  function renderPreview(r) {
    const box = $('previewPage');
    box.querySelectorAll(D.TAG).forEach((n) => n.remove());
    D.mount(Object.assign({}, r, { enabled: true }), box);
    $('previewTitle').textContent = (r.titlePrefix || '') + 'Odoo';
  }

  function runTest() {
    const out = $('testOut');
    const raw = $('testUrl').value.trim();
    const r = current();
    out.className = 'test-out';
    if (!raw || !r) { out.textContent = ''; return; }
    let loc;
    try { loc = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : 'https://' + raw); } catch (e) {
      out.textContent = tr('badUrl'); out.classList.add('no'); return;
    }
    const hit = R.ruleMatches(Object.assign({}, r, { enabled: true }), loc);
    const winner = R.findMatch(rules, loc);
    if (!hit) { out.textContent = tr('noMatch'); out.classList.add('no'); return; }
    if (winner && winner.id !== r.id) {
      out.textContent = tr('matchBut', { name: winner.name });
      out.classList.add('warn');
      return;
    }
    out.textContent = r.enabled ? tr('matchOn') : tr('matchOff');
    out.classList.add(r.enabled ? 'ok' : 'warn');
  }

  FIELDS.forEach((f) => {
    const el = $('f-' + f);
    el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => {
      const r = current();
      if (!r) return;
      r[f] = el.type === 'checkbox' ? el.checked : f === 'opacity' ? Number(el.value) : el.value;
      afterEdit(r);
      renderList();
      save();
    });
  });
  $('testUrl').addEventListener('input', runTest);

  /* ---------- ações ---------- */
  function addRule(overrides) {
    const r = R.defaultRule(Object.assign({ name: tr('newEnv') }, overrides || {}));
    rules.push(r);
    save(true);
    select(r.id);
    $('f-name').focus();
    $('f-name').select();
  }

  $('add').addEventListener('click', () => addRule());

  $('dup').addEventListener('click', () => {
    const r = current();
    if (!r) return;
    const copy = Object.assign({}, r, { id: R.uid(), name: r.name + tr('copySuffix') });
    rules.splice(rules.indexOf(r) + 1, 0, copy);
    save(true);
    select(copy.id);
  });

  $('del').addEventListener('click', () => {
    const r = current();
    if (!r) return;
    if (!confirm(tr('confirmDelete', { name: r.name }))) return;
    const i = rules.indexOf(r);
    rules.splice(i, 1);
    save(true);
    select(rules[Math.min(i, rules.length - 1)] ? rules[Math.min(i, rules.length - 1)].id : null);
  });

  $('reset').addEventListener('click', () => {
    if (!confirm(tr('confirmReset'))) return;
    const p = R.presets();
    rules.push(...p);
    save(true);
    select(p[0].id);
  });

  $('export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tarja-ambiente-regras.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  $('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const imported = R.normalize(JSON.parse(await file.text()));
      const replace = confirm(tr('confirmImport', { n: imported.length }));
      const ids = new Set(rules.map((r) => r.id));
      imported.forEach((r) => { if (!replace && ids.has(r.id)) r.id = R.uid(); });
      rules = replace ? imported : rules.concat(imported);
      save(true);
      select(imported[0] ? imported[0].id : null);
    } catch (err) {
      alert(tr('importFail', { msg: err.message }));
    }
  });

  // Mantém a tela em dia se as regras mudarem em outra aba
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes[I.LANG_KEY] && changes[I.LANG_KEY].newValue !== lang) {
      lang = I.pick(changes[I.LANG_KEY].newValue);
      applyLang();
      renderList();
      if (current()) afterEdit(current());
    }
    if (!changes[R.STORAGE_KEY]) return;
    const incoming = changes[R.STORAGE_KEY].newValue || [];
    if (JSON.stringify(incoming) === JSON.stringify(rules)) return;
    rules = incoming;
    select(rules.some((r) => r.id === selectedId) ? selectedId : rules[0] && rules[0].id);
  });

  document.querySelectorAll('.lang-btn').forEach((b) => {
    b.addEventListener('click', async () => {
      if (b.dataset.lang === lang) return;
      lang = b.dataset.lang;
      await chrome.storage.local.set({ [I.LANG_KEY]: lang });
      applyLang();
      renderList();
      if (current()) afterEdit(current());
    });
  });

  /* ---------- início ---------- */
  (async function init() {
    const stored = await chrome.storage.local.get(I.LANG_KEY);
    lang = I.pick(stored[I.LANG_KEY]);
    applyLang();
    await load();
    const novo = new URLSearchParams(location.search).get('novo');
    if (novo) {
      history.replaceState(null, '', location.pathname);
      addRule({ name: novo, matchType: 'exact', patterns: novo, label: 'TESTE' });
      $('testUrl').value = 'https://' + novo + '/';
      runTest();
      return;
    }
    renderList();
    select(rules[0] ? rules[0].id : null);
  })();
})();
