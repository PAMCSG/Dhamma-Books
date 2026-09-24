const MAX_TEXT_LENGTH = 500;

function json(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

function escapeXml(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[character]);
}

async function cacheKey(text) {
  const bytes = new TextEncoder().encode(`my-MM-NilarNeural\n${text}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return new Request(`https://pamc-burmese-tts-cache.invalid/${hash}.mp3`);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const requestUrl = new URL(request.url);
  const origin = request.headers.get('Origin');
  if (origin && origin !== requestUrl.origin) return json('Cross-origin requests are not allowed.', 403);
  if (!env.AZURE_SPEECH_KEY) return json('Speech service is not configured.', 503);

  let body;
  try { body = await request.json(); } catch (_) { return json('Invalid JSON.'); }
  const text = typeof body?.text === 'string' ? body.text.replace(/\s+/g, ' ').trim() : '';
  if (!text || text.length > MAX_TEXT_LENGTH || !/[က-႟]/u.test(text)) return json('Invalid Burmese text.');

  const key = await cacheKey(text);
  const cached = await caches.default.match(key);
  if (cached) return cached;

  const region = env.AZURE_SPEECH_REGION || 'southeastasia';
  const ssml = `<speak version="1.0" xml:lang="my-MM"><voice name="my-MM-NilarNeural">${escapeXml(text)}</voice></speak>`;
  const azureResponse = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'PAMC-Dhamma-Books'
    },
    body: ssml
  });
  if (!azureResponse.ok) return json('Azure Speech request failed.', 502);

  const response = new Response(azureResponse.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff'
    }
  });
  context.waitUntil(caches.default.put(key, response.clone()));
  return response;
}

export function onRequest() {
  return json('Method not allowed.', 405);
}
