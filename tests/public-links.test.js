import test from 'node:test';
import assert from 'node:assert/strict';
import { clientLink, publicOrigin } from '../public/shared/public-links.js';

test('links públicos usam a origem configurada para o novo projeto', () => {
  const origin = 'https://agrosurinovo.vercel.app/algum-caminho';
  assert.equal(publicOrigin(origin), 'https://agrosurinovo.vercel.app');
  assert.equal(clientLink('contrato', 'abc 123', origin), 'https://agrosurinovo.vercel.app/contrato?token=abc%20123');
  assert.equal(clientLink('fatura', 'xyz', origin), 'https://agrosurinovo.vercel.app/fatura?token=xyz');
});

test('URL ausente ou inválida não aponta para outro projeto', () => {
  assert.throws(() => publicOrigin(), /APP_URL/);
  assert.throws(() => publicOrigin('https://'), /APP_URL/);
});
