export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY가 서버에 설정되지 않았습니다.' });

  const { member, messages, projects, quest } = req.body ?? {};
  if (!messages?.length) return res.status(400).json({ error: 'messages가 비어있습니다.' });

  const projectSummary = (projects ?? [])
    .filter(p => !p.archived)
    .map(p => {
      const pending = (p.tasks ?? []).filter(t => !t.completed).length;
      return `- ${p.name} (미완료 태스크 ${pending}개)`;
    })
    .join('\n') || '진행 중인 프로젝트 없음';

  const systemPrompt = `당신은 MACHOMAN, 베몽의 AI 직원입니다.
베몽은 아동복 바지 전문 브랜드, 슬로건 'Never Stop Children's MOVE!'
팀원: JUN(대표), SURI(디자인/관리), SUNNY!(아이디어/주문), ZIN(고객소통), LENA(올라운더/모델)
지금 대화하는 사람: ${member ?? '알 수 없음'}
현재 프로젝트:
${projectSummary}
이달의 퀘스트: ${quest ?? '없음'}
규칙:
- 이름만 부르기 (JUN, SURI 등 존칭 없이)
- 친근하고 재미있게
- 핵심만 짧고 임팩트있게
- 이모지 적극 활용
- 베몽 응원단처럼 에너지 넘치게`;

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
        max_tokens: 512,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Claude API 오류 (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? '';
    res.status(200).json({ reply });
  } catch (err) {
    console.error('[api/machoman] 에러:', err);
    res.status(500).json({ error: err.message });
  }
}
