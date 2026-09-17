export function publicOrigin(configured) {
  try {
    const url = new URL(configured);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.origin;
  } catch (_) { /* Invalid or missing URL. */ }
  throw new Error('APP_URL precisa ser uma URL HTTP(S) válida para gerar links públicos.');
}
export const clientLink = (page, token, origin) => `${publicOrigin(origin)}/${page}?token=${encodeURIComponent(token || '')}`;
