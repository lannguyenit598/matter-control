// Pure/client-function probes only: no real token, HTTP, IdP or product database.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve('.');
const ts = require(path.join(root, 'apps/frontend/node_modules/typescript'));
const cache = new Map();
function load(relative) {
  if (cache.has(relative)) return cache.get(relative);
  const filename = path.join(root, 'apps/frontend/src/lib', relative);
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022
  }}).outputText;
  const module = {exports: {}};
  function localRequire(name) {
    if (name === 'server-only') return {};
    if (name === '@/lib/auth') return {requireSession: async () => ({accessToken: 'SYNTHETIC-NOT-A-TOKEN'})};
    if (name === '@/lib/env') return {serverEnv: {API_MODE: 'rest', API_BASE_URL: 'http://synthetic.invalid/api/v1', API_TIMEOUT_MS: 100}};
    if (name === './errors') return load('mc/errors.ts');
    assert.equal(name, 'node:crypto');
    return require(name);
  }
  new Function('require', 'module', 'exports', 'console', compiled)(localRequire, module, module.exports,
    {log() {}, warn() {}, error() {}});
  cache.set(relative, module.exports);
  return module.exports;
}

(async () => {
  const flow = load('oidc/flow.ts');
  assert.equal(flow.safeReturnTo('//attacker.invalid'), '/workspaces');
  const input = new URL('http://localhost:3000/api/auth/login?returnTo=' + encodeURIComponent('/\t/attacker.invalid')).searchParams.get('returnTo');
  const accepted = flow.safeReturnTo(input);
  const redirect = new URL(accepted, 'http://localhost:3000').href;
  assert.equal(new URL(redirect).origin, 'http://attacker.invalid');

  const {McError} = load('mc/errors.ts');
  const {toMcFailure} = load('mc/action-result.ts');
  const membershipUnknown = toMcFailure(new McError('outcome-unknown', 503));
  assert.equal(membershipUnknown.retrySameKey, true);
  assert.match(membershipUnknown.error, /same request is safe to send again/);

  const {mcRequest} = load('mc/client.ts');
  global.fetch = async () => ({
    ok: true, status: 201, headers: new Headers(),
    async text() { throw new TypeError('Synthetic truncated response stream'); }
  });
  let bodyError;
  try {
    await mcRequest('/workspaces', {method: 'POST', body: {name: 'Synthetic workspace'},
      idempotencyKey: 'synthetic-intent', schema: {safeParse: data => ({success: true, data})}});
  } catch (e) { bodyError = e; }
  assert(bodyError instanceof TypeError);
  const bodyFailure = toMcFailure(bodyError);
  assert.equal(bodyFailure.kind, 'error');
  console.log(JSON.stringify({
    return_to: {input: JSON.stringify(input), accepted: JSON.stringify(accepted), redirect,
      result: 'cross-origin redirect after URL whitespace normalization'},
    non_receipted_membership_unknown: {kind: membershipUnknown.kind,
      retrySameKey: membershipUnknown.retrySameKey, message: membershipUnknown.error,
      callsite_binding: 'Grant membership uses IntentForm; repository sends no idempotency key.'},
    truncated_command_response: {status_before_body_read: 201, thrown_name: bodyError.name,
      action_kind: bodyFailure.kind, message: bodyFailure.error},
    limits: 'Actual reviewed functions with synthetic stubs only; no live request, browser, IdP or DB.'
  }, null, 2));
})().catch(e => {console.error(e); process.exitCode = 1;});
