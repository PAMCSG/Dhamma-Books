# Azure Burmese Read-Aloud Trial

This trial applies only to `daily-chants-burmese.html`. Other Dhamma Books retain
their existing browser-native read-aloud behaviour.

## Azure resource

- Resource: `pamc-dhamma-books-speech`
- Region: Southeast Asia (`southeastasia`)
- Pricing tier: Free F0
- Trial voice: `my-MM-NilarNeural` (female)

## Cloudflare Pages secrets

Never place an Azure key in HTML, JavaScript committed to GitHub, a screenshot,
or a chat message.

After the Azure Speech resource has deployed:

1. In Azure, open the Speech resource and then **Keys and Endpoint**.
2. Copy **KEY 1** privately.
3. In Cloudflare, open the Dhamma-Books Pages project.
4. Open **Settings → Variables and Secrets**.
5. Add `AZURE_SPEECH_KEY` as an encrypted secret and paste KEY 1 there.
6. Add `AZURE_SPEECH_REGION` with the value `southeastasia`.
7. Apply both variables to Production (and Preview if the trial is tested on a
   preview deployment), then redeploy the latest Dhamma-Books commit.

## Implementation

- `functions/api/burmese-tts.js` accepts same-origin POST requests only.
- Input must contain Burmese script and is limited to 500 characters.
- The Azure secret remains server-side.
- Generated MP3 passages are cached by a SHA-256 hash of their voice and text.
- The reader sends short chunks and reuses cached audio for repeated passages.
- Speed changes are performed in the browser, so changing speed does not incur
  another Azure synthesis request.

If the service is not configured or Azure rejects a request, the reader stops
and displays a Burmese error instead of moving the highlight without sound.
