# Goodcase UI

직접 써보고 가져다 쓰는 UI 참조 라이브러리. React + TypeScript 컴포넌트의 디자인, 키보드·포커스·오류 처리 동작을 갤러리에서 확인하고 다른 프로젝트로 가져갑니다.

## 스킬 설치

대상 프로젝트에서 한 번 실행합니다.

```sh
pnpm dlx skills add Leonamin/goodcase --skill use-goodcase-ui -a codex -y
```

```text
$use-goodcase-ui로 설정 화면 만들어줘.
기존 브랜드 색은 유지하고 Tabs와 Toast를 활용해줘.
```

스킬에는 컴포넌트, 스타일·토큰, 사용법과 동작 계약이 포함됩니다. 웹 갤러리와 데모 코드는 포함하지 않습니다. 설치 후에는 Goodcase 원본 경로나 GitHub 접근 없이 사용할 수 있습니다. 필요한 React·Radix·아이콘 패키지는 구현 대상 프로젝트에서 확인합니다.

전체 프로젝트에서 사용하려면 설치 명령에 `-g`를 추가하고, Claude Code에는 `-a claude-code`를 사용합니다. [설치·갱신·중앙 저장소 배포 방법](docs/SKILL_BUNDLE.md)

## 개발

Node.js 22.12+와 pnpm 11.10.0을 사용합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev`는 `0.0.0.0:5179`에 바인딩합니다. 이 컴퓨터에서는 `http://localhost:5179`, 같은 네트워크의 다른 기기에서는 `http://<컴퓨터의 LAN IP>:5179`로 접속합니다. `pnpm storybook`으로 실행하는 Storybook은 `http://localhost:6019`입니다. 저장·업로드 등 갤러리의 비동기 예제는 로컬 시뮬레이션입니다.

```sh
pnpm build
pnpm test
pnpm build:skill
pnpm test:skill
```

원본은 `src/components`, `src/styles`, `src/catalog`에서 관리합니다. `pnpm build:skill`은 `skills/use-goodcase-ui/`와 `artifacts/use-goodcase-ui.zip`을 생성합니다. 생성된 스킬 폴더를 함께 커밋해 GitHub에서 바로 설치할 수 있게 유지합니다.

[시작 안내](docs/GETTING_STARTED.md) · [디자인 원칙](DESIGN.md) · [검증 기록](docs/VERIFICATION.md)
