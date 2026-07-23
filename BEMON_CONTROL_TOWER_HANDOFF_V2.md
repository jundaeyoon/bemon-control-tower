# BEMON Control Tower — 인수인계 & 현황 문서 V2

## 📌 프로젝트 개요
- **이름**: BEMON Control Tower
- **목적**: 베몽 팀 전체 협업 중심 프로젝트 관리 앱
- **배포 URL**: https://bemon-control-tower.vercel.app
- **GitHub**: https://github.com/jundaeyoon/bemon-control-tower
- **로컬 경로**: `C:\Users\user\Desktop\베몽 프로그램 실행 파일\프로그램 모음\bemon-control-tower`
- **PWA**: 홈화면 추가 가능 (올리브그린 BEMON 아이콘)

---

## 👥 팀원 (현재)
| 이름 | 역할 | 색상 |
|------|------|------|
| JUN | 대표 (CEO) | 살몬핑크 #E8896A |
| SURI | 디자인/관리자 | 올리브그린 #6B7C45 |
| SUNNY! | 아이디어/주문처리 | 머스타드 #F59E0B |
| LENA | 올라운더/모델 | 하늘색 #0284C7 |

> ⚠️ ZIN 퇴사 완료 — UI 전체에서 제거됨 (DB 데이터는 유지)
> 새 팀원 입사 시 memberColors.js에 추가 필요

---

## 🛠 기술 스택
| 분류 | 기술 |
|------|------|
| 프레임워크 | React 19 + Vite 8 |
| 마인드맵 | @xyflow/react (React Flow v12) |
| 스케치 UI | Rough.js v4 |
| 인증/DB | Supabase (PostgreSQL) |
| 배포 | Vercel (GitHub 자동 배포) |
| 폰트 | Pretendard Regular |
| 스타일 | CSS Modules + CSS 변수 토큰 |
| AI | Anthropic Claude API (MACHOMAN) |

---

## 🎨 디자인 시스템
- **브랜드 컬러**: 올리브그린 #6B7C45 / 살몬핑크 #E8896A / 다크브라운 #4A3728
- **배경**: 크림색 #FAF8F4, 도트 그리드
- **노드 스타일**: Rough.js 스케치 스타일 (roughness 2.5, bowing 2)
- **공통 컴포넌트**: RoughCard, RoughButton, RoughInput, RoughStrikethrough

---

## 🗂 마인드맵 구조 (전체)

```
BEMON (허브 - 원형) → 클릭 시 "누구시죠?" 체크인 팝업
│
├── 왼쪽
│   ├── 🏆 프로젝트 완수! (그린 #4CAF50) — 보관된 완료 프로젝트 목록
│   ├── 📂 프로젝트 (살몬핑크) — 진행중 프로젝트
│   ├── 💡 브레인스토밍 (올리브그린) — 세션별 할일/피드백/회의록
│   └── 🎮 이달의 퀘스트! (OKR) (머스타드) — 월간 OKR 관리
│
└── 오른쪽
    ├── 💡 이건 대박! (핫핑크 #EC4899) — 아이디어 뱅크 (연결선 있음)
    ├── 📅 베몽 달력 (하늘색 #0284C7) — 월간 캘린더
    ├── 🧭 BEMON 나침반 (보라색 #7C3AED) — 비전하우스 CCMV
    ├── 🙏 땡큐 베리 머치 (살몬코럴 #E8896A) — 익명 감사 포스트잇
    └── 🎬 바지에 미친 사람들! (컨텐츠) (레드 #EF4444) — 컨텐츠 임무 관리
```

---

## ✅ 구현 완료 기능 (전체)

### 🔵 BEMON 허브
- 클릭 시 "누구시죠?" 팝업 → 팀원 선택 → 해당 팀원 업무 현황
- 업무 현황: 프로젝트 태스크 + 개인 업무 + 데드라인 표시
- 완료된 업무는 맨 아래 접힌 섹션으로 분리
- 업무 클릭 → 오른쪽 슬라이드 패널 연결
- "확인 완료!" 버튼으로 닫기

### 📂 프로젝트
- 프로젝트 추가/수정/삭제
- 태스크 추가/수정/삭제/완료
- 담당자, 마감일, 진행률, 메모, 이미지 첨부
- 모든 태스크 완료 시 → 그린 색상 + 🎊피드백 버튼 + 📦보관하기 버튼
- 피드백: 성과/준비/재미 3가지 항목
- 보관하기 → 프로젝트 완수! 브랜치로 이동
- **DB**: projects, tasks 테이블

### 🏆 프로젝트 완수!
- 보관된 프로젝트 슬라이드 패널로 표시
- 각 프로젝트 카드에 피드백 작성/열람 가능
- **DB**: project_feedbacks 테이블

### 💡 브레인스토밍
- 세션 추가 (날짜 + 제목)
- 할일 탭: 추가/완료/삭제, 담당자, 상태, 메모, **제목 인라인 수정**
- 피드백 탭: 할일별 피드백 (✅/🔄/❌)
- 회의록 탭: 파일 업로드 UI
- **DB**: brainstorm_sessions, brainstorm_todos, brainstorm_feedbacks, brainstorm_recordings

### 🎮 이달의 퀘스트! (OKR)
- 월 선택 (이전/다음 달 이동)
- 퀘스트 (Objective) 입력
- 클리어 조건 (Key Results) 최대 3개 — 목표값/현재값 → 달성률 자동 계산
- 파이터 배정 탭 — 팀원 선택 + 역할 입력
- 잘하고있나!! 탭 — 데일리/주간/월간 체크
- 우리가 해냈나? 탭 — 월말 결과 기록
- 마인드맵 노드 — 날짜 + 퀘스트 텍스트 미리보기, 삭제 버튼
- **DB**: goals 테이블

### 🧭 BEMON 나침반
- 트리 구조 노드:
  ```
  나침반 브랜치
  └── 🌍 미션
        ├── 🔥 Team Spirit → 🌴 JUN의 약속 (하와이 워크샵!)
        └── 🌟 비전
              ├── 💪 핵심역량
              └── ⚡ 핵심가치
  ```
- 각 노드 클릭 → 해당 탭 슬라이드 패널
- 저장 버튼 + 자동저장
- **DB**: vision_house 테이블

### 📅 베몽 달력
- 월간 캘린더 뷰
- 일정 추가: 제목 + 담당자 + 반복(없음/매주/매월)
- 담당자 색상으로 구분
- 프로젝트 태스크 📂 + 개인 업무 👤 연동 표시
- 완료된 항목 취소선
- **DB**: schedules 테이블

### 🙏 땡큐 베리 머치
- 익명 감사 메시지 포스트잇 벽
- 접힌 상태: 색상만 표시 / 펼치면 내용 보임
- 받는 사람 지정 → 팀원 고유 색상 / 팀 전체 → 흰색
- ❤️ 하트 투표
- 이달의 MVP 자동 집계
- "이 메시지는 익명으로 전달됩니다" 안내
- **DB**: thanks 테이블

### 💡 이건 대박! (아이디어 뱅크)
- 아이디어 제목 + 내용 등록
- 👍 찬성 / 👎 반대 투표
- 작성자 표시
- **DB**: brainstorm_ideas 테이블 (session_id nullable)

### 🎬 바지에 미친 사람들! (컨텐츠)
- 컨텐츠 임무 관리 (구 SURI 인플루언서 만들기!)
- 임무 카드 아코디언 방식 (접기/펼치기)
- 유형: 릴스 / 게시물 선택
- 제목 + 내용 분리
- 업로드 날짜
- 레퍼런스 이미지 업로드 (클릭 시 큰화면 팝업)
- 레퍼런스 링크 (클릭 시 새 탭)
- 완료 체크
- 담당자 지정 및 수정 가능
- 작성자 표시
- 모든 팀원 임무 추가/삭제 가능
- **DB**: influencer_missions 테이블

### 👤 팀원 아바타 (헤더)
- 클릭 시 해당 팀원 업무 팝업
- 프로젝트 태스크 + 개인 업무 + 마감일 표시
- 완료된 업무 별도 섹션 (접힘)
- 업무 클릭 → 슬라이드 패널
- 마초맨 대화 기록 섹션
- **레벨업 시스템**: Lv.1🌱→Lv.2🔥→Lv.3⚡→Lv.4💎→Lv.5👑
- 게이지바 + 레벨 + 칭호 표시
- **DB**: member_xp, personal_tasks, machoman_chats 테이블

### 🤖 MACHOMAN (AI 어시스턴트)
- 우측 하단 플로팅 버튼 (항상 표시)
- 채팅창 열 때 이름 선택 (localStorage 저장)
- 베몽 데이터 기반 AI 답변
- 닫을 때 대화 저장 여부 확인
- 4자리 비밀번호로 대화 보호
- 팀원 아바타에서 대화 기록 열람/삭제
- **API**: ANTHROPIC_API_KEY 필요 (Vercel 환경변수 설정 완료)
- **DB**: machoman_chats 테이블

---

## 🗄 Supabase DB 전체 구조

```sql
-- 프로젝트
projects (id, name, pm, description, archived, archived_at, created_at)
tasks (id, project_id, name, assignee, deadline, progress, completed, memo, created_at)
project_feedbacks (id, project_id, achievement, preparation, fun, created_at)

-- 브레인스토밍
brainstorm_sessions (id, title, date, created_at)
brainstorm_todos (id, session_id, content, assignee, status, memo, created_at)
brainstorm_feedbacks (id, session_id, todo_id, content, assignee, status, created_at)
brainstorm_ideas (id, session_id nullable, title, content, author, votes, voters, downvotes, downvoters, created_at)
brainstorm_recordings (id, session_id, file_name, file_url, summary, created_at)

-- OKR
goals (id, year_month, quest, clear_conditions jsonb, fighters jsonb, check_daily, check_weekly, check_monthly, golden_rule, result, created_at, updated_at)

-- 비전하우스
vision_house (id, mission, vision, competency, values, team_spirit, jun_promise, created_at, updated_at)

-- 달력
schedules (id, title, date, assignee, repeat, created_at)

-- 감사
thanks (id, to_member, message, hearts, hearts_by jsonb, created_at)

-- 개인업무
personal_tasks (id, assignee, content, deadline, completed, memo, created_at)

-- 레벨업
member_xp (id, member, xp, created_at, updated_at)

-- MACHOMAN
machoman_chats (id, member, messages jsonb, password_hash, created_at)

-- 컨텐츠 임무
influencer_missions (id, type, title, content, scheduled_date, completed, ref_images jsonb, ref_links jsonb, author, assignee, created_at, updated_at)
```

### 주의사항
- 모든 테이블 RLS **비활성화** 상태
- 이미지는 **base64** DB 저장 (Supabase Storage 미사용)

---

## 🌐 환경변수 (Vercel 설정 완료)
```
VITE_SUPABASE_URL=https://hjfamnptgnmkkmddcrhp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
ANTHROPIC_API_KEY=sk-ant-... (MACHOMAN용, 크레딧 충전 필요)
```

---

## 📁 프로젝트 구조
```
bemon-control-tower/
├── src/
│   ├── components/
│   │   ├── mindmap/
│   │   │   ├── MindmapCanvas.jsx      ← 핵심 마인드맵 캔버스
│   │   │   ├── mindmapConfig.js       ← 브랜치 위치/색상 설정
│   │   │   ├── NodePanel.jsx
│   │   │   ├── nodes/
│   │   │   │   ├── HubNode.jsx
│   │   │   │   ├── BranchNode.jsx
│   │   │   │   ├── ProjectNode.jsx
│   │   │   │   ├── TaskNode.jsx
│   │   │   │   ├── SessionNode.jsx
│   │   │   │   ├── QuestNode.jsx
│   │   │   │   └── CompassNode.jsx
│   │   │   └── edges/RoughEdge.jsx
│   │   ├── panels/
│   │   │   ├── BrainstormSlidePanel.jsx
│   │   │   ├── CalendarPanel.jsx
│   │   │   ├── CompletedPanel.jsx
│   │   │   ├── InfluencerPanel.jsx
│   │   │   ├── IdeaBankPanel.jsx
│   │   │   ├── QuestSlidePanel.jsx
│   │   │   ├── TaskDetailPanel.jsx
│   │   │   ├── ThankYouPanel.jsx
│   │   │   └── VisionHousePanel.jsx
│   │   ├── modals/
│   │   │   ├── AddProjectModal.jsx
│   │   │   ├── AddTaskModal.jsx
│   │   │   ├── AddThankYouModal.jsx
│   │   │   ├── BemonDashboardPopup.jsx (제거됨)
│   │   │   ├── EditProjectModal.jsx
│   │   │   ├── FeedbackModal.jsx
│   │   │   ├── HubCheckinPopup.jsx
│   │   │   ├── IdeaDetailModal.jsx
│   │   │   ├── MachoMan.jsx
│   │   │   └── TodoDetailModal.jsx
│   │   ├── rough/                     ← Rough.js 공통 컴포넌트
│   │   └── ui/
│   │       ├── Header.jsx
│   │       ├── LevelUpToast.jsx
│   │       └── MemberTasksModal.jsx
│   ├── hooks/
│   │   ├── useBrainstorm.js
│   │   ├── useGoals.js
│   │   ├── useIdeaBank.js
│   │   ├── useInfluencer.js
│   │   ├── useMemberXP.js
│   │   ├── usePersonalTasks.js
│   │   ├── useProjects.js
│   │   ├── useSchedule.js
│   │   ├── useThankYou.js
│   │   ├── useTimeCapsule.js (제거됨)
│   │   └── useVisionHouse.js
│   ├── constants/
│   │   └── memberColors.js
│   ├── lib/
│   │   └── supabase.js
│   └── styles/
│       ├── tokens.css
│       └── global.css
├── api/
│   ├── machoman.js                    ← MACHOMAN AI 서버리스
│   └── summarize.js                   ← 회의록 요약 서버리스
├── public/
│   ├── manifest.json                  ← PWA 설정
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
└── vercel.json
```

---

## 🚀 로컬 개발 방법
```bash
# Claude Code 바로가기
바탕화면/BEMON 컨트롤타워.bat 더블클릭

# 또는 터미널에서
cd "C:\Users\user\Desktop\베몽 프로그램 실행 파일\프로그램 모음\bemon-control-tower"
claude

# 배포
git add .
git commit -m "커밋 메시지"
git push
# → Vercel 자동 배포
```

---

## 🔧 미완성 / 다음 작업 후보
- **MACHOMAN**: Anthropic API 크레딧 충전 시 즉시 활성화
- **레벨업 시스템**: 툴팁 위치 아래로 수정 완료, 추가 튜닝 가능
- **베몽 주간 리포트**: 미구현
- **이달의 MVP**: 땡큐 베리 머치 하트 집계 (미구현)
- **새 팀원 추가**: memberColors.js에 추가 필요

---

## 💡 베몽 브랜드 정보
- **브랜드명**: BEMON (베몽)
- **슬로건**: Never Stop Children's MOVE!
- **카테고리**: 아동복 바지 전문
- **판매 채널**: Cafe24(bemon.kr), 쿠팡, 네이버 스마트스토어, 무신사
- **자체 공장**: 소규모 봉제 공장 보유

## 🌴 JUN의 약속
> "우리 모두가 해내면, 온 가족 다같이 하와이로 여행 겸 워크샵 간다!"

---

## 📝 새 채팅방에서 이 문서 사용법

이 MD 파일을 새 채팅방에 업로드하면서 아래 문구를 함께 입력하세요:

```
첨부한 BEMON_CONTROL_TOWER_HANDOFF_V2.md 파일을 완벽히 숙지해줘.
나는 베몽(BEMON) 대표 대윤(JUN)이야.
이 프로젝트를 계속 업그레이드할 거야.
파일에 있는 모든 내용을 기억하고 바로 작업 가능한 상태로 있어줘.
```

그러면 바로 이전과 동일하게 작업 이어갈 수 있어요!
