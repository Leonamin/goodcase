import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  Code2,
  Download,
  Layers,
  Menu as MenuIcon,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { entries } from "./catalog";
import { downloadSource, filesFor, sourceFiles } from "./catalog/source";
import type { CatalogEntry } from "./catalog/types";

const tabs = [
  { id: "preview", label: "미리보기" },
  { id: "contract", label: "동작 계약" },
  { id: "source", label: "코드" },
  { id: "migration", label: "가져오기" },
];
const groups = [
  { id: "foundation", label: "기반 · 토큰과 배치" },
  { id: "basic", label: "기본 컴포넌트" },
  { id: "composed", label: "조합형 컴포넌트" },
];

function readLocation() {
  const query = new URLSearchParams(window.location.search);
  return {
    id: query.get("component") ?? "button",
    tab: query.get("tab") ?? "preview",
  };
}
function readReviews(): string[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem("goodcase-reviewed") ?? "[]",
    );
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (id): id is string =>
                typeof id === "string" &&
                entries.some((entry) => entry.id === id),
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}

export function App({
  initialId,
  initialTab,
}: { initialId?: string; initialTab?: string } = {}) {
  const [location, setLocation] = useState(() => ({
    id: initialId ?? readLocation().id,
    tab: initialTab ?? readLocation().tab,
  }));
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState("reference");
  const [density, setDensity] = useState("comfortable");
  const [colorMode, setColorMode] = useState("light");
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [reviews, setReviews] = useState(readReviews);
  const [revision, setRevision] = useState(0);
  const sidebarRef = useRef<HTMLElement>(null);
  const entry = entries.find((item) => item.id === location.id) ?? entries[0];
  const activeTab = tabs.some((tab) => tab.id === location.tab)
    ? location.tab
    : "preview";
  const visible = entries.filter((item) =>
    `${item.name} ${item.summary}`.toLowerCase().includes(query.toLowerCase()),
  );
  const isReviewed = reviews.includes(entry.id);

  useEffect(() => {
    const handler = () => setLocation(readLocation());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);
  // Apply preview tokens at document scope because accessible overlay content is portalled to body.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.colorMode = colorMode;
    document.documentElement.dataset.density = density;
  }, [theme, density, colorMode]);
  useEffect(() => {
    if (!isNavOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not(:disabled), input:not(:disabled)",
        ) ?? [],
      );
    focusable()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsNavOpen(false);
      }
      if (event.key === "Tab") {
        const items = focusable();
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isNavOpen]);
  function navigate(id: string, tab = "preview") {
    setLocation({ id, tab });
    const url = new URL(window.location.href);
    url.searchParams.set("component", id);
    url.searchParams.set("tab", tab);
    window.history.pushState(null, "", url);
    setIsNavOpen(false);
  }
  function toggleReview() {
    const next = isReviewed
      ? reviews.filter((id) => id !== entry.id)
      : [...reviews, entry.id];
    setReviews(next);
    localStorage.setItem("goodcase-reviewed", JSON.stringify(next));
  }

  return (
    <div className="gallery-shell">
      <aside
        ref={sidebarRef}
        className={`gallery-sidebar ${isNavOpen ? "is-open" : ""}`}
        aria-label="컴포넌트 목록"
        role={isNavOpen ? "dialog" : undefined}
        aria-modal={isNavOpen ? true : undefined}
      >
        <a
          className="gallery-brand"
          href="?component=button"
          onClick={(event) => {
            event.preventDefault();
            navigate("button");
          }}
        >
          <Layers size={23} strokeWidth={1.8} />
          <span>
            goodcase<span className="brand-version">v0.1</span>
          </span>
        </a>
        <div className="sidebar-intro">
          직접 써보고, 가져다 쓰는
          <br />
          나의 컴포넌트 라이브러리.
        </div>
        <label className="gallery-search">
          <Search size={16} aria-hidden />
          <input
            aria-label="컴포넌트 검색"
            placeholder="컴포넌트 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <nav>
          {groups.map((group) => (
            <section className="nav-group" key={group.id}>
              <h2>
                {group.label}
                <span>
                  {entries.filter((item) => item.category === group.id).length}
                </span>
              </h2>
              {visible
                .filter((item) => item.category === group.id)
                .map((item) => (
                  <a
                    className={`nav-item ${entry.id === item.id ? "is-current" : ""}`}
                    href={`?component=${item.id}`}
                    aria-current={entry.id === item.id ? "page" : undefined}
                    key={item.id}
                    onClick={(event) => {
                      event.preventDefault();
                      navigate(item.id);
                    }}
                  >
                    <span>{item.name}</span>
                    {reviews.includes(item.id) ? (
                      <Check size={14} aria-label="검토 완료" />
                    ) : entry.id === item.id ? (
                      <ChevronRight size={14} />
                    ) : null}
                  </a>
                ))}
            </section>
          ))}
          {visible.length === 0 && (
            <p className="nav-empty">검색 결과가 없어요.</p>
          )}
        </nav>
        <div className="sidebar-footer">
          <span>{entries.length}개 항목</span>
          <span>
            검토 {reviews.length} / {entries.length}
          </span>
        </div>
      </aside>
      {isNavOpen && (
        <button
          className="nav-backdrop"
          tabIndex={-1}
          aria-label="목록 닫기"
          onClick={() => setIsNavOpen(false)}
        />
      )}
      <main className="gallery-main" inert={isNavOpen}>
        <header className="gallery-topbar">
          <div className="topbar-path">
            <button
              className="gallery-icon-button mobile-nav-toggle"
              aria-label={isNavOpen ? "목록 닫기" : "목록 열기"}
              onClick={() => setIsNavOpen(!isNavOpen)}
            >
              {isNavOpen ? <X size={18} /> : <MenuIcon size={18} />}
            </button>
            <span>라이브러리</span>
            <ChevronRight size={13} />
            <strong>{entry.name}</strong>
          </div>
          <span className="topbar-note">React · TypeScript</span>
        </header>
        <div className="gallery-content">
          <div className="component-heading">
            <div>
              <div className="component-category">
                {groups.find((group) => group.id === entry.category)?.label}
              </div>
              <h1>{entry.name}</h1>
              <p>{entry.summary}</p>
            </div>
            <button
              className={`review-button ${isReviewed ? "is-reviewed" : ""}`}
              onClick={toggleReview}
            >
              <Check size={16} />
              {isReviewed ? "검토 완료" : "검토 표시"}
            </button>
          </div>
          <div
            className="gallery-tabs"
            role="navigation"
            aria-label="컴포넌트 문서"
          >
            {tabs.map((tab) => (
              <a
                key={tab.id}
                aria-current={activeTab === tab.id ? "page" : undefined}
                href={`?component=${entry.id}&tab=${tab.id}`}
                className={activeTab === tab.id ? "is-active" : ""}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(entry.id, tab.id);
                }}
              >
                {tab.label}
              </a>
            ))}
          </div>
          {activeTab === "preview" && (
            <>
              <div className="preview-toolbar">
                <div>
                  <label>
                    테마
                    <select
                      aria-label="테마"
                      value={theme}
                      onChange={(event) => setTheme(event.target.value)}
                    >
                      <option value="reference">기본 · Blue</option>
                      <option value="forest">변형 · Forest</option>
                    </select>
                  </label>
                  <label>
                    색상 모드
                    <select
                      aria-label="색상 모드"
                      value={colorMode}
                      onChange={(event) => setColorMode(event.target.value)}
                    >
                      <option value="light">라이트</option>
                      <option value="dark">다크</option>
                    </select>
                  </label>
                  <label>
                    밀도
                    <select
                      aria-label="밀도"
                      value={density}
                      onChange={(event) => setDensity(event.target.value)}
                    >
                      <option value="comfortable">기본</option>
                      <option value="compact">조밀하게</option>
                    </select>
                  </label>
                </div>
                <button
                  onClick={() => setRevision(revision + 1)}
                  className="text-button"
                >
                  <RotateCcw size={14} />
                  초기화
                </button>
              </div>
              <section
                className="preview-canvas"
                aria-label={`${entry.name} 실습`}
              >
                <entry.Demo key={`${entry.id}-${revision}`} />
              </section>
              <div className="preview-footer">
                <span>마우스와 키보드로 직접 조작해보세요.</span>
                <span>상태는 예제 안에서만 유지됩니다.</span>
              </div>
              <section className="usage-section">
                <h2>
                  <Code2 size={17} />
                  사용 예제
                </h2>
                <pre>
                  <code>{entry.usage}</code>
                </pre>
              </section>
            </>
          )}
          {activeTab === "contract" && (
            <div className="document-panel">
              <h2>기본 동작</h2>
              <ul>
                {entry.contracts.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
              <div className="doc-columns">
                <section>
                  <h2>지원 상태</h2>
                  <ul>
                    {entry.states.map((text) => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h2>키보드 · 접근성</h2>
                  <ul>
                    {entry.keyboard.map((text) => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                </section>
              </div>
              <div className="document-note">
                이식 후에도 유지할 기준입니다. 프로젝트 요구로 동작을 바꾸면
                계약과 예제도 함께 갱신하세요.
              </div>
            </div>
          )}
          {activeTab === "source" && (
            <SourcePanel key={entry.id} entry={entry} />
          )}
          {activeTab === "migration" && (
            <div className="document-panel">
              <div className="migration-heading">
                <div>
                  <h2>프로젝트로 가져오기</h2>
                  <p>
                    코드와 동작을 가져온 뒤, 프로젝트의 디자인 토큰에
                    연결하세요.
                  </p>
                </div>
                <button
                  className="download-button"
                  onClick={() => downloadSource(entry)}
                >
                  <Download size={16} />
                  소스 ZIP
                </button>
              </div>
              <ol className="migration-steps">
                {entry.migration.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ol>
              <h2>포함 파일</h2>
              <ul className="file-list">
                {filesFor(entry).map((path) => (
                  <li key={path}>
                    <code>{path}</code>
                  </li>
                ))}
              </ul>
              <p className="muted">
                공유 파일의 다른 export와 스타일도 포함됩니다. ZIP의
                MIGRATION.md에서 필요한 부분을 확인하세요.
              </p>
              <h2>의존성</h2>
              <p>{entry.dependencies.join(" · ") || "React · TypeScript"}</p>
              <h2>토큰 연결 예시</h2>
              <pre>
                <code>{`:root {\n  --gc-accent: var(--project-primary);\n  --gc-text: var(--project-text);\n  --gc-surface: var(--project-surface);\n  --gc-font-sans: var(--project-font);\n  --gc-radius: var(--project-radius);\n}`}</code>
              </pre>
              <h2>이식 후 확인</h2>
              <ul>
                <li>
                  기존 프로젝트에 같은 책임의 컴포넌트가 있는지 확인하고
                  통합합니다.
                </li>
                <li>
                  global.css의 문서 기본 스타일은 그대로 덮어쓰지 않고 필요한
                  규칙만 병합합니다.
                </li>
                <li>
                  키보드·포커스·긴 콘텐츠·모바일·오류 상태를 원본 예제와
                  비교합니다.
                </li>
                <li>
                  비동기 데모의 로컬 시뮬레이션은 실제 API callback으로
                  교체합니다.
                </li>
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SourcePanel({ entry }: { entry: CatalogEntry }) {
  const files = filesFor(entry);
  const [file, setFile] = useState(files[0]);
  const [copyStatus, setCopyStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(sourceFiles[file]);
      setCopyStatus("복사했어요");
    } catch {
      setCopyStatus("복사 실패 · 코드를 직접 선택해 복사하세요");
    }
  }
  return (
    <section className="source-panel">
      <div className="source-toolbar">
        <label>
          파일
          <select
            aria-label="소스 파일"
            value={file}
            onChange={(event) => {
              setFile(event.target.value);
              setCopyStatus("");
            }}
          >
            {files.map((path) => (
              <option key={path}>{path}</option>
            ))}
          </select>
        </label>
        <button className="text-button" onClick={copy}>
          코드 복사
        </button>
        <button className="text-button" onClick={() => downloadSource(entry)}>
          <Download size={15} />
          ZIP
        </button>
      </div>
      <p role="status" className="copy-status">
        {copyStatus}
      </p>
      <pre>
        <code>{sourceFiles[file] ?? "파일을 선택하세요."}</code>
      </pre>
    </section>
  );
}
