# Goodcase UI

디자인과 동작을 직접 확인하고, 프로젝트에 가져다 쓰는 React + TypeScript UI 라이브러리.

갤러리에서 컴포넌트를 조작하고 키보드·포커스·오류 처리 기준을 확인합니다. 코드와 디자인 토큰을 직접 가져오거나, `use-goodcase-ui` 스킬을 설치해 AI 에이전트가 같은 자료로 화면을 구현하도록 할 수 있습니다.

[미리보기](#미리보기) · [스킬 설치](#스킬-설치) · [스킬 배포](#스킬로-묶어서-배포하기) · [개발](#개발) · [문서](#문서)

## 주요 기능

- **실행 가능한 예제** — 입력·표시·배치부터 Tabs, Toast, Dialog, DataTable, FileUploader, ImageViewer까지 직접 조작합니다.
- **동작 계약** — 지원 상태, 키보드 조작, 포커스 복귀, 중복 실행 방지, 실패·재시도 기준을 코드와 함께 확인합니다.
- **디자인 토큰** — 테마·라이트/다크·밀도를 비교하고, `--gc-*` 토큰을 기존 프로젝트의 디자인에 연결합니다.
- **코드와 스킬 배포** — 컴포넌트별 소스 ZIP 또는 코드·스타일·사용법을 동봉한 AI 스킬로 가져갑니다.

## 미리보기

**준비:** Node.js 22.12 이상, pnpm 11.10.0, Git.

```sh
git clone https://github.com/Leonamin/goodcase.git
cd goodcase
pnpm install --frozen-lockfile
pnpm dev
```

[http://localhost:5179](http://localhost:5179)에서 갤러리를 엽니다. 왼쪽 목록에서 컴포넌트를 고른 뒤 다음 탭을 탐색하세요.

| 탭        | 확인할 내용                              |
| --------- | ---------------------------------------- |
| 미리보기  | 예제 조작, 테마·색상 모드·밀도 변경      |
| 동작 계약 | 기본 동작, 지원 상태, 키보드·접근성 기준 |
| 코드      | 원본 파일 탐색과 복사                    |
| 가져오기  | 이식 절차, 의존성, 소스 ZIP 다운로드     |

[Tabs 미리보기](http://localhost:5179/?component=tabs)처럼 선택한 항목을 URL로 공유할 수 있습니다. 같은 네트워크의 기기에서는 `http://<컴퓨터의 LAN IP>:5179`로 접속합니다. 포트가 사용 중이면 터미널에 표시된 주소를 확인하세요.

Storybook은 별도 터미널에서 `pnpm storybook`을 실행한 뒤 [http://localhost:6019](http://localhost:6019)에서 확인합니다.

> [!NOTE]
> 저장·삭제·목록 조회·업로드 등 비동기 데모는 로컬 시뮬레이션입니다. 제품에 적용할 때 실제 API·라우터·업로드 서비스를 연결하세요.

## 스킬 설치

대상 프로젝트 폴더에서 아래 출처 중 **하나**를 선택합니다.

```sh
# Goodcase 저장소
pnpm dlx skills add Leonamin/goodcase --skill use-goodcase-ui -a codex -y

# 또는 중앙 스킬 저장소
pnpm dlx skills add Leonamin/leonamin-skills --skill use-goodcase-ui -a codex -y
```

Codex 프로젝트 스킬은 `.agents/skills/`에 설치됩니다. 모든 프로젝트에서 사용하려면 `-g`를 추가하고, Claude Code에는 `-a claude-code`를 사용합니다. 스킬을 읽는 새 Codex 세션에서 다음처럼 요청하세요.

```text
$use-goodcase-ui로 설정 화면을 만들어줘.
기존 브랜드 색은 유지하고 Tabs와 Toast를 활용해줘.
```

스킬에는 재사용 코드·스타일·토큰·동작 계약이 포함됩니다. 설치 후에는 Goodcase 원본 경로 없이 사용할 수 있습니다. 필요한 React·React DOM·Radix·아이콘 패키지는 대상 프로젝트에 준비하며, 컴포넌트별 문서와 `manifest.json`에서 의존성을 확인합니다. 다른 프레임워크에서는 디자인과 동작 계약을 바탕으로 재구현합니다.

직접 이식하려면 갤러리의 **가져오기 → 소스 ZIP**을 사용하세요. 기존 공용 컴포넌트와 통합하고 디자인 토큰을 연결하는 절차는 [코드 이식 안내](docs/GETTING_STARTED.md#코드-이식)에 있습니다.

## 스킬로 묶어서 배포하기

Goodcase에서 원본을 관리하고 두 저장소에 같은 배포본을 반영합니다. 컴포넌트·스타일·카탈로그 또는 `skill-source/`의 지침을 수정한 뒤, Goodcase 루트에서 실행합니다.

```sh
pnpm build:skill
pnpm test:skill
```

| 결과물                          | 용도                                   |
| ------------------------------- | -------------------------------------- |
| `skills/use-goodcase-ui/`       | Goodcase 저장소에 커밋하는 설치용 스킬 |
| `artifacts/use-goodcase-ui.zip` | 전체 스킬 폴더를 담은 수동 공유용 ZIP  |

`leonamin-skills`에도 배포하려면 출력 경로를 지정합니다. 아래 경로는 중앙 저장소 또는 해당 워크트리의 실제 절대 경로로 바꾸세요.

```sh
pnpm build:skill --output /absolute/path/to/leonamin-skills/use-goodcase-ui
```

각 저장소의 스킬 폴더를 검토·커밋하고 기본 브랜치에 반영하면 위의 설치 명령으로 받을 수 있습니다. 생성된 파일은 직접 편집하지 않고 원본을 수정해 다시 생성합니다.

두 저장소와 사용자 설치본은 각각 갱신해야 합니다. 버전 관리, 배포본 비교, 두 저장소의 반영 범위, 수동 설치는 [스킬 배포 안내](docs/SKILL_BUNDLE.md)를 참고하세요.

## 개발

| 명령                   | 설명                                      |
| ---------------------- | ----------------------------------------- |
| `pnpm typecheck`       | TypeScript 타입 검사                      |
| `pnpm build`           | 타입 검사와 갤러리 빌드 → `dist/`         |
| `pnpm test`            | Playwright 브라우저 테스트                |
| `pnpm build-storybook` | Storybook 빌드 → `storybook-static/`      |
| `pnpm build:skill`     | 스킬 폴더와 ZIP 생성                      |
| `pnpm test:skill`      | 스킬 재현성·이식 빌드·수동 수정 보호 검증 |

Playwright 브라우저가 없으면 `pnpm exec playwright install chromium`으로 설치합니다. 테스트는 `5179`의 실행 중인 서버를 재사용하므로, 워크트리에서 검증할 때 해당 서버의 작업본을 확인하세요.

```text
src/components/     재사용 UI 구현
src/styles/         디자인 토큰과 스타일
src/catalog/        컴포넌트 설명·동작 계약·예제
skill-source/       스킬 지침 원본
skills/             생성된 설치용 스킬
scripts/            스킬 생성기와 검증
tests/              브라우저 테스트
```

## 문서

- [시작과 코드 이식](docs/GETTING_STARTED.md)
- [스킬 생성·배포·설치](docs/SKILL_BUNDLE.md)
- [디자인 원칙](DESIGN.md)
- [검증 기록](docs/VERIFICATION.md)
