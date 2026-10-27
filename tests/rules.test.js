const test = require('node:test');
const assert = require('node:assert');
const R = require('../lib/rules.js');
const L = (u) => new URL(u);
const rule = (o) => R.defaultRule(o);

test('contém, por host', () => {
  const r = rule({ patterns: 'staging' });
  assert.ok(R.ruleMatches(r, L('https://erp-staging.empresa.com/web')));
  assert.ok(!R.ruleMatches(r, L('https://erp.empresa.com/web')));
});
test('não olha o caminho quando o alvo é host', () => {
  const r = rule({ patterns: 'staging' });
  assert.ok(!R.ruleMatches(r, L('https://erp.empresa.com/staging')));
});
test('URL completa casa pelo caminho e pelo hash', () => {
  const r = rule({ target: 'url', patterns: '/web#action=42' });
  assert.ok(R.ruleMatches(r, L('https://erp.empresa.com/web#action=42&model=x')));
  const r2 = rule({ target: 'url', matchType: 'prefix', patterns: 'erp.empresa.com/odoo/test' });
  assert.ok(R.ruleMatches(r2, L('https://erp.empresa.com/odoo/test/abc')));
  assert.ok(!R.ruleMatches(r2, L('https://erp.empresa.com/odoo/prod')));
});
test('sufixo, exato, curinga, regex e porta', () => {
  assert.ok(R.ruleMatches(rule({ matchType: 'suffix', patterns: '.dev.odoo.com' }), L('https://abc-123.dev.odoo.com')));
  assert.ok(R.ruleMatches(rule({ matchType: 'exact', patterns: 'localhost:8069' }), L('http://localhost:8069/web')));
  assert.ok(!R.ruleMatches(rule({ matchType: 'exact', patterns: 'localhost' }), L('http://localhost:8069/web')));
  assert.ok(R.ruleMatches(rule({ matchType: 'wildcard', patterns: '*-stg.*.com.br' }), L('https://loja-stg.cliente.com.br')));
  assert.ok(!R.ruleMatches(rule({ matchType: 'wildcard', patterns: '*-stg.*.com.br' }), L('https://loja.cliente.com.br')));
  const local = R.presets()[0];
  assert.ok(R.ruleMatches(local, L('http://localhost:8069/odoo')));
  assert.ok(R.ruleMatches(local, L('http://127.0.0.1/')));
  assert.ok(!R.ruleMatches(local, L('https://localhost.empresa.com/')));
});
test('vários padrões, maiúsculas e regex inválida', () => {
  const r = rule({ patterns: 'homolog, HML.\n  qa. ' });
  assert.ok(R.ruleMatches(r, L('https://HML.empresa.com')));
  assert.ok(R.ruleMatches(r, L('https://qa.empresa.com')));
  const bad = rule({ matchType: 'regex', patterns: '([' });
  assert.ok(!R.ruleMatches(bad, L('https://x.com')));
  assert.ok(R.regexError(bad));
});
test('desativada não casa; ordem define a prioridade', () => {
  const a = rule({ name: 'A', patterns: 'empresa', enabled: false });
  const b = rule({ name: 'B', patterns: 'staging' });
  const c = rule({ name: 'C', patterns: 'empresa' });
  assert.equal(R.findMatch([a, b, c], L('https://staging.empresa.com')).name, 'B');
  assert.equal(R.findMatch([a, c, b], L('https://staging.empresa.com')).name, 'C');
  assert.equal(R.findMatch([a], L('https://empresa.com')), null);
});
test('normalize preenche campos e aceita lista de padrões', () => {
  const [n] = R.normalize([{ name: 'X', patterns: ['a', 'b'], style: 'xpto', opacity: 5 }]);
  assert.equal(n.patterns, 'a\nb');
  assert.equal(n.style, 'ribbon');
  assert.equal(n.opacity, 1);
  assert.ok(n.id);
  assert.throws(() => R.normalize({}));
});
