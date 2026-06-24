export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── 1. API 키 확인 ───────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[machoman] ANTHROPIC_API_KEY 환경변수 없음');
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.',
      stage: 'env',
      hint: 'Vercel 대시보드 → Settings → Environment Variables에서 ANTHROPIC_API_KEY를 추가하세요.',
    });
  }

  // ── 2. 요청 바디 파싱 ────────────────────────────────────────────────────────
  const { member, messages, projects, quest } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages 배열이 비어있습니다.', stage: 'input' });
  }

  // Claude API requires strictly alternating user/assistant roles, starting with user
  const filtered = messages.filter(m => m.role === 'user' || m.role === 'assistant');
  let startIdx = 0;
  while (startIdx < filtered.length && filtered[startIdx].role !== 'user') startIdx++;

  if (startIdx >= filtered.length) {
    return res.status(400).json({
      error: 'messages 배열에 user 메시지가 없습니다.',
      stage: 'input',
    });
  }

  // Merge consecutive same-role messages to enforce strict alternation
  const apiMessages = [];
  for (let i = startIdx; i < filtered.length; i++) {
    const msg = filtered[i];
    const prev = apiMessages[apiMessages.length - 1];
    if (prev && prev.role === msg.role) {
      prev.content = prev.content + '\n' + String(msg.content);
    } else {
      apiMessages.push({ role: msg.role, content: String(msg.content) });
    }
  }

  // ── 3. 시스템 프롬프트 구성 ──────────────────────────────────────────────────
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

  // ── 4. Claude API 호출 ───────────────────────────────────────────────────────
  let claudeRes;
  let rawBody;

  try {
    claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
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
        messages: apiMessages,
      }),
    });
  } catch (networkErr) {
    console.error('[machoman] 네트워크 오류:', networkErr);
    return res.status(502).json({
      error: 'Claude API 네트워크 오류',
      stage: 'network',
      detail: networkErr.message,
    });
  }

  // ── 5. Claude API 응답 처리 ──────────────────────────────────────────────────
  try {
    rawBody = await claudeRes.text();
  } catch (readErr) {
    console.error('[machoman] 응답 읽기 실패:', readErr);
    return res.status(502).json({
      error: 'Claude API 응답을 읽을 수 없습니다.',
      stage: 'response_read',
      detail: readErr.message,
    });
  }

  if (!claudeRes.ok) {
    let parsed = null;
    try { parsed = JSON.parse(rawBody); } catch {}

    const claudeMsg = parsed?.error?.message ?? rawBody;
    const statusCode = claudeRes.status;

    const hint =
      statusCode === 401 ? 'API 키가 잘못되었거나 만료되었습니다. Vercel 환경변수를 확인하세요.' :
      statusCode === 403 ? 'API 키 권한이 없습니다.' :
      statusCode === 429 ? '요청 한도(Rate Limit)를 초과했습니다. 잠시 후 다시 시도하세요.' :
      statusCode === 400 ? '요청 형식 오류입니다. 메시지 배열 구조를 확인하세요.' :
      statusCode === 529 ? 'Claude API가 과부하 상태입니다. 잠시 후 다시 시도하세요.' :
      null;

    console.error(`[machoman] Claude API ${statusCode}:`, claudeMsg);
    return res.status(statusCode).json({
      error: `Claude API 오류 (${statusCode})`,
      stage: 'claude_api',
      detail: claudeMsg,
      ...(hint ? { hint } : {}),
    });
  }

  // ── 6. 정상 응답 파싱 ────────────────────────────────────────────────────────
  let data;
  try {
    data = JSON.parse(rawBody);
  } catch (parseErr) {
    console.error('[machoman] JSON 파싱 실패:', rawBody);
    return res.status(502).json({
      error: 'Claude API 응답 JSON 파싱 실패',
      stage: 'response_parse',
      detail: rawBody.slice(0, 200),
    });
  }

  const reply = data.content?.[0]?.text ?? '';
  if (!reply) {
    console.warn('[machoman] 빈 응답:', JSON.stringify(data));
  }

  return res.status(200).json({ reply });
}
