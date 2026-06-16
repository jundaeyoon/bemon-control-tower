export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ASSEMBLYAI_API_KEY가 서버에 설정되지 않았습니다.' });

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: { authorization: apiKey },
      body: buffer,
    });
    if (!uploadRes.ok) throw new Error(`업로드 실패 (${uploadRes.status})`);
    const { upload_url } = await uploadRes.json();

    const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: { authorization: apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({ audio_url: upload_url, language_code: 'ko' }),
    });
    if (!transcriptRes.ok) throw new Error(`전사 요청 실패 (${transcriptRes.status})`);
    const { id } = await transcriptRes.json();

    let transcript = null;
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
        headers: { authorization: apiKey },
      });
      const poll = await pollRes.json();
      if (poll.status === 'completed') { transcript = poll.text; break; }
      if (poll.status === 'error') throw new Error(poll.error ?? 'AssemblyAI 전사 오류');
    }

    if (!transcript) throw new Error('전사 시간 초과');
    res.status(200).json({ transcript });
  } catch (err) {
    console.error('[api/transcribe] 에러:', err);
    res.status(500).json({ error: err.message });
  }
}
