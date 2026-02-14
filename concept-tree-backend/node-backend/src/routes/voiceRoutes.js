const express = require('express');
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'audio file required' });

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing ELEVENLABS_API_KEY' });

    // ElevenLabs “Create transcript” (batch STT)
    const form = new FormData();

    // model_id names come from ElevenLabs docs (Scribe v2 for batch, Scribe v2 Realtime for WS). :contentReference[oaicite:4]{index=4}
    form.append('model_id', 'scribe_v2');

    // Attach audio file
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    form.append('file', blob, req.file.originalname || 'audio.webm');

    const resp = await fetch('https://api.elevenlabs.io/v1/speech-to-text/convert', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: form
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }

    const data = await resp.json();
    // The response includes transcript text (field names depend on API response)
    return res.json({ data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
