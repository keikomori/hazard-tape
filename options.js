(function () {
  'use strict';
  const R = globalThis.TarjaRules;
  const D = globalThis.TarjaRender;
  const $ = (id) => document.getElementById(id);

  let rules = [];
  let selectedId = null;
  let saveTimer = null;

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
      s.textContent = 'Salvo ✓';
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
  fillSelect($('f-target'), R.TARGETS);
  fillSelect($('f-matchType'), R.MATCH_TYPES);
  fillSelect($('f-style'), R.STYLES);
  fillSelect($('f-position'), R.POSITIONS);

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
      toggle.title = r.enabled ? 'Desativar' : 'Ativar';
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
      name.textContent = r.name || 'Sem nome';
      const pats = document.createElement('span');
      pats.className = 'muted small';
      const list = R.splitPatterns(r.patterns);
      pats.textContent = list.length ? list.slice(0, 2).join(', ') + (list.length > 2 ? ' …' : '') : 'sem padrão';
      text.append(name, pats);

      const moves = document.createElement('div');
      moves.className = 'moves';
      const up = mkMove('↑', 'Subir prioridade', i > 0, () => move(i, -1));
      const down = mkMove('↓', 'Descer prioridade', i < rules.length - 1, () => move(i, 1));
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
    $('regexErr').textContent = err ? 'Regex inválida: ' + err : '';
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
      out.textContent = 'Endereço inválido'; out.classList.add('no'); return;
    }
    const hit = R.ruleMatches(Object.assign({}, r, { enabled: true }), loc);
    const winner = R.findMatch(rules, loc);
    if (!hit) { out.textContent = '✗ Não casa'; out.classList.add('no'); return; }
    if (winner && winner.id !== r.id) {
      out.textContent = '⚠ Casa, mas "' + winner.name + '" tem prioridade';
      out.classList.add('warn');
      return;
    }
    out.textContent = r.enabled ? '✓ Casa — esta tarja aparece' : '✓ Casa (regra desativada)';
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
    const r = R.defaultRule(overrides);
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
    const copy = Object.assign({}, r, { id: R.uid(), name: r.name + ' (cópia)' });
    rules.splice(rules.indexOf(r) + 1, 0, copy);
    save(true);
    select(copy.id);
  });

  $('del').addEventListener('click', () => {
    const r = current();
    if (!r) return;
    if (!confirm('Excluir a regra "' + r.name + '"?')) return;
    const i = rules.indexOf(r);
    rules.splice(i, 1);
    save(true);
    select(rules[Math.min(i, rules.length - 1)] ? rules[Math.min(i, rules.length - 1)].id : null);
  });

  $('reset').addEventListener('click', () => {
    if (!confirm('Adicionar as regras de exemplo (Local, Homologação, Produção) ao fim da lista?')) return;
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
      const replace = confirm(
        imported.length + ' regra(s) no arquivo.\n\nOK = substituir as regras atuais\nCancelar = adicionar ao fim da lista'
      );
      const ids = new Set(rules.map((r) => r.id));
      imported.forEach((r) => { if (!replace && ids.has(r.id)) r.id = R.uid(); });
      rules = replace ? imported : rules.concat(imported);
      save(true);
      select(imported[0] ? imported[0].id : null);
    } catch (err) {
      alert('Não consegui importar: ' + err.message);
    }
  });

  // Mantém a tela em dia se as regras mudarem em outra aba
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[R.STORAGE_KEY]) return;
    const incoming = changes[R.STORAGE_KEY].newValue || [];
    if (JSON.stringify(incoming) === JSON.stringify(rules)) return;
    rules = incoming;
    select(rules.some((r) => r.id === selectedId) ? selectedId : rules[0] && rules[0].id);
  });

  /* ---------- início ---------- */
  (async function init() {
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
