# Azure Burmese Read-Aloud Standard

This is the standard online Burmese voice service for every Burmese reader book
that loads the shared Dhamma-Books Read Aloud module.

## Azure resource

- Resource: `pamc-dhamma-books-speech`
- Region: Southeast Asia (`southeastasia`)
- Pricing tier: Free F0
- Default voice: `my-MM-ThihaNeural` (male)
- Alternative voice: `my-MM-NilarNeural` (female)

## Cloudflare Worker and secrets

Never place an Azure key in HTML, JavaScript committed to GitHub, a screenshot,
or a chat message.

After the Azure Speech resource has deployed:

1. In Azure, open the Speech resource and then **Keys and Endpoint**.
2. Copy **KEY 1** privately.
3. In Cloudflare, open the standalone `pamc-burmese-tts` Worker.
4. Open **Settings → Variables and Secrets**.
5. Add `AZURE_SPEECH_KEY` as an encrypted secret and paste KEY 1 there.
6. Add `AZURE_SPEECH_REGION` with the value `southeastasia`.
7. Apply both variables to Production and redeploy the Worker.

## Implementation

- The standalone Worker accepts requests from `https://pamcsg.github.io` and
  exposes `/api/burmese-tts`.
- The browser sends the selected allow-listed voice name with each text chunk.
- The Worker accepts only `my-MM-ThihaNeural` or `my-MM-NilarNeural` and falls
  back to Thiha for any other value.
- Input is limited to 5,000 characters; the shared reader sends much shorter
  Burmese chunks.
- The Azure secret remains server-side.
- Speed changes are performed in the browser, so changing speed does not incur
  another Azure synthesis request.

## Reader behaviour

- Microsoft Thiha is the default Burmese voice in every Burmese book.
- Microsoft Nilar remains selectable.
- Pāli uses the independent Pāli voice setting.
- Closing the Read Aloud panel pauses active speech; reopening it allows Resume.

If the service is not configured or Azure rejects a request, the reader stops
and displays a Burmese error instead of moving the highlight without sound.
