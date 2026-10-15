# Goodcase UI 스킬 배포본

Goodcase는 컴포넌트 개발·관리와 웹 미리보기를 제공한다. `use-goodcase-ui`는 재사용 코드, 스타일, 토큰, 컴포넌트별 사용법·동작 계약, AI 적용 지침을 포함하는 설치용 배포본이다. 배포본 사용자는 Goodcase 원본 폴더나 GitHub에 접근할 필요가 없다.

## 생성과 갱신

```sh
pnpm build:skill
pnpm test:skill
```

- `skills/use-goodcase-ui/`: 설치 가능한 스킬 폴더 (GitHub에도 포함)
- `artifacts/use-goodcase-ui.zip`: 같은 폴더를 담은 공유용 ZIP

컴포넌트와 스타일의 원본은 `src/components`, `src/styles`다. 컴포넌트 설명은 `src/catalog`에서 Demo를 제외한 메타데이터만 추출한다. 지침 원본은 `skill-source/use-goodcase-ui`이며 엔트리포인트 원본은 `SKILL.template.md`다. 불완전한 원본 템플릿이 설치용 스킬로 검색되지 않도록 생성 시 `SKILL.md`로 변환한다. 원본을 수정한 뒤 다시 생성한다. 생성된 파일을 직접 편집하면 다음 생성에서 덮어쓰지 않고 중단한다.

웹 갤러리, Storybook, 데모 함수·전용 CSS 규칙, 테스트, 이미지, node_modules와 프로젝트 서비스는 배포본에 포함하지 않는다. 공유 모듈 안의 다른 컴포넌트 export는 함께 포함될 수 있다. ToastPreview는 재사용 가능한 정적 표시 API로 유지하며 갤러리 예제 함수는 제외한다.

버전은 package.json의 version을 사용하고 manifest.json에 내용 해시, 파일별 해시, 항목 수, 외부 패키지 참조 버전을 기록한다. 같은 입력은 같은 파일과 ZIP을 생성한다. 코드와 계약을 갱신한 릴리스는 package.json 버전도 함께 갱신한다. 기존 설치본은 자동 갱신되지 않는다.

## 다른 프로젝트에 설치

대상 프로젝트 폴더에서 다음 명령을 실행하면 Codex용 스킬 전체가 프로젝트의 `.agents/skills/`에 설치된다. Goodcase 원본 앱을 직접 실행하거나 의존성을 설치할 필요는 없다.

```sh
pnpm dlx skills add Leonamin/goodcase --skill use-goodcase-ui -a codex -y
```

개인 전체 프로젝트에서 쓰려면 `-g`를 추가한다. Claude Code에는 `-a claude-code`를 사용한다. 설치 범위와 에이전트 선택은 [Skills CLI 공식 문서](https://github.com/vercel-labs/skills#options)를 참고한다. 기존 설치를 갱신할 때는 변경한 파일을 먼저 보관한 뒤 같은 명령을 다시 실행한다.

중앙 스킬 저장소 `Leonamin/leonamin-skills`에서도 배포본을 제공한다. 다음 명령으로 설치할 수 있다. 두 저장소는 별도로 갱신되므로 같은 배포본인지 확인하려면 `manifest.json`의 버전과 내용 해시를 비교한다.

```sh
pnpm dlx skills add Leonamin/leonamin-skills --skill use-goodcase-ui -a codex -y
```

수동 설치는 ZIP을 풀어 나온 `use-goodcase-ui` 폴더 전체를 대상 프로젝트의 `.agents/skills/` 아래에 복사한다. SKILL.md만 복사하면 참고 자료가 빠지므로 전체 폴더를 가져간다.

```text
대상 프로젝트/
└── .agents/skills/use-goodcase-ui/
    ├── SKILL.md
    ├── agents/openai.yaml
    ├── manifest.json
    ├── references/
    └── assets/src/
```

개인 전체 프로젝트에 사용하려면 같은 폴더를 `~/.codex/skills/` 아래에 설치할 수도 있다. 이 생성 명령은 배포본만 만들며 다른 프로젝트나 개인 스킬 폴더에는 쓰지 않는다. 설치 후 스킬 목록을 새로 읽는 Codex 세션에서 다음처럼 요청한다.

```text
$use-goodcase-ui로 설정 화면을 만들어줘.
기존 브랜드 색은 유지하고 Tabs와 Toast는 Goodcase를 활용해줘.
```

스킬 내부 경로는 SKILL.md가 있는 폴더를 기준으로 한다. AI는 목록에서 필요한 컴포넌트를 찾고 해당 설명과 export 위치부터 읽는다. 실제 UI에 필요한 외부 React/Radix/아이콘 패키지는 대상 프로젝트에 별도로 있어야 한다. 다른 프레임워크는 디자인과 동작 계약을 바탕으로 재구현한다.

## 두 저장소에 배포

Goodcase 원본 수정 → 배포본 생성·검증 → 두 저장소 반영 → 설치 확인 순서로 갱신한다. `leonamin-skills`의 스킬도 Goodcase에서 생성하며, 양쪽의 생성 파일을 따로 수정하지 않는다.

### 1. Goodcase 배포본 생성

코드나 계약을 바꾸는 릴리스는 `package.json` 버전도 갱신한다. Goodcase 저장소 루트에서 실행한다.

```sh
pnpm build
pnpm build:skill
pnpm test:skill
```

### 2. 중앙 저장소에 같은 배포본 내보내기

중앙 저장소가 없다면 Goodcase 밖의 별도 경로에 복제한다. 아래 `/absolute/path/to/leonamin-skills`는 사용할 실제 경로로 바꾼다. 이미 복제한 저장소나 별도 워크트리가 있다면 그 경로를 사용한다.

```sh
git clone https://github.com/Leonamin/leonamin-skills.git /absolute/path/to/leonamin-skills
```

Goodcase 저장소 루트에서 출력 경로를 지정하고 결과를 비교한다.

```sh
SKILLS_REPO=/absolute/path/to/leonamin-skills
pnpm build:skill --output "$SKILLS_REPO/use-goodcase-ui"
diff -qr skills/use-goodcase-ui "$SKILLS_REPO/use-goodcase-ui"
git -C "$SKILLS_REPO" diff --stat -- use-goodcase-ui
```

`diff`에 출력이 없고 종료 코드가 0이면 두 폴더가 같다. `manifest.json`의 버전과 `contentHash`로도 배포본을 식별할 수 있다. `--output`은 지정한 스킬 폴더에 쓰며, ZIP은 계속 Goodcase의 `artifacts/use-goodcase-ui.zip`에 생성한다.

폴더 위치는 스크립트에 고정하지 않는다. `../leonamin-skills/use-goodcase-ui` 같은 상대 경로는 두 저장소가 나란히 있을 때만 사용하고, 별도 워크트리에서는 실제 작업본의 절대 경로를 지정한다.

### 3. 변경 검토와 GitHub 반영

각 저장소의 작업 브랜치에서 아래 변경을 검토·커밋하고 push한 뒤, 기본 브랜치로 PR을 반영한다. 커밋 전 staged diff를 확인하고 Conventional Commits 형식을 사용한다.

| 저장소            | 반영할 파일                                                  | 설치 출처                  |
| ----------------- | ------------------------------------------------------------ | -------------------------- |
| `goodcase`        | 변경한 원본, 릴리스 버전, 재생성한 `skills/use-goodcase-ui/` | `Leonamin/goodcase`        |
| `leonamin-skills` | 재생성한 루트 `use-goodcase-ui/` 전체                        | `Leonamin/leonamin-skills` |

중앙 저장소에는 Goodcase 앱이나 `node_modules`를 옮기지 않는다. 생성 명령은 GitHub 반영을 수행하지 않으며, 한쪽 저장소 반영으로 다른 쪽이 자동 갱신되지는 않는다.

### 4. 설치 확인과 사용자 갱신

기본 브랜치에 반영한 뒤 빈 임시 프로젝트에서 [설치 명령](#다른-프로젝트에-설치)을 출처별로 실행한다. `.agents/skills/use-goodcase-ui/`에 `SKILL.md`, `references/`, `assets/`, `manifest.json`이 설치되는지 확인하고 배포본의 버전과 내용 해시를 비교한다.

기존 사용자 설치본도 별도로 갱신한다. 수정한 설치 파일을 먼저 보관한 뒤 선택한 출처의 설치 명령을 다시 실행한다. 수동 배포는 ZIP 안의 `use-goodcase-ui/` 전체를 전달한다.
