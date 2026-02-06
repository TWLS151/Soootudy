# 멤버 추가 가이드

새 멤버를 추가할 때 수정해야 하는 파일 목록입니다.

## 필수 수정 파일

### 1. `members.json` (루트)

멤버 정보를 추가합니다.

```json
{
  "아이디": { "name": "이름", "github": "깃허브아이디" }
}
```

**규칙**:
- **아이디**: 성 초성 + 이름 초성 (예: 장수철 → jsc, 조다영 → jdy)
- **정렬**: 이름 가나다 순으로 정렬 (ㄱ → ㅎ)

**예시** (조다영 추가 시):
```json
{
  "kgm": { "name": "김광민", "github": "GwangMinKim26" },
  "pse": { "name": "박세은", "github": "pse3048-ui" },
  ...
  "jsc": { "name": "장수철", "github": "Apple7575" },
  "jdy": { "name": "조다영", "github": "gomi102981" },  // ← 장수철 다음, 조희주 전
  "jhj": { "name": "조희주", "github": "heemesama" },
  ...
}
```

## 자동으로 처리되는 항목

- 프로필 이미지: GitHub 프로필에서 자동으로 가져옴
- 사이드바 멤버 목록: `members.json` 기준으로 자동 표시
- 로그인 권한: GitHub 로그인 시 `members.json`의 github 아이디로 팀원 여부 확인

## 새 멤버가 해야 할 일

1. GitHub 계정으로 사이트 로그인
2. 코드 제출 시 자동으로 `{아이디}/{주차}/` 폴더 생성됨

## 파일 구조

```
Sootudy/
├── members.json          # 멤버 정보 (수정 필요, 가나다 순 정렬)
├── {memberId}/           # 멤버별 코드 폴더 (자동 생성)
│   └── {week}/
│       └── {source}-{number}-v{version}.py
└── web/                  # 웹 애플리케이션
```
