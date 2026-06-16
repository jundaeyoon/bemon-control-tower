export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY가 서버에 설정되지 않았습니다.' });

  const { transcript } = req.body ?? {};
  if (!transcript || !transcript.trim()) return res.status(400).json({ error: 'transcript가 비어있습니다.' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `다음은 회의 녹음의 텍스트입니다. 아래 형식의 한국어로 요약해줘:\n\n## 핵심 내용\n(불릿)\n\n## 결정사항\n(불릿)\n\n## 액션 아이템\n(누가 무엇을 하기로 했는지 불릿)\n\n--- 회의 텍스트 ---\n${transcript}`,
        }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Claude API 오류 (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const summary = data.content?.[0]?.text ?? '';
    res.status(200).json({ summary });
  } catch (err) {
    console.error('[api/summarize] 에러:', err);
    res.status(500).json({ error: err.message });
  }
}
