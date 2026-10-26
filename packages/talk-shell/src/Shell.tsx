// The talk layout: json-render.dev's page structure in the monday template's
// palette. Shipped as source; each app lists the package in transpilePackages.
import Script from "next/script";
import data from "../examples.json";
import { ThemeToggle } from "./ThemeToggle";

export type Example = (typeof data.examples)[number];

// Runs before paint so a stored theme never flashes. Dark is the default, as
// in the deck; the same key everywhere, so the choice follows you per origin.
const THEME_SCRIPT = `try{if(localStorage.getItem("gen-ui-theme")!=="light")document.documentElement.classList.add("dark")}catch(e){document.documentElement.classList.add("dark")}`;

export function getExample(id: string): Example {
  const ex = data.examples.find((e) => e.id === id);
  if (!ex) throw new Error(`Unknown example id "${id}" (see @gen-ui/talk-shell/examples.json)`);
  return ex;
}

export function shellMetadata(id: string) {
  const ex = getExample(id);
  return { title: `${ex.id} · ${ex.title}`, description: ex.pattern };
}

export function ThemeScript() {
  return (
    <Script id="sh-theme" strategy="beforeInteractive">
      {THEME_SCRIPT}
    </Script>
  );
}

export function Logo() {
  return (
    <svg className="sh-logo" viewBox="0 0 24 24" aria-hidden="true">
      <rect className="sh-logo-a" x="2" y="2" width="9" height="9" rx="2" />
      <rect className="sh-logo-b" x="13" y="2" width="9" height="9" rx="2" />
      <rect className="sh-logo-c" x="2" y="13" width="9" height="9" rx="2" />
      <rect className="sh-logo-d" x="13.75" y="13.75" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}

export function Header({ example }: { example: Example }) {
  return (
    <header className="sh-header">
      <div className="sh-header-inner">
        <div className="sh-brand">
          <Logo />
          <span>{data.brand}</span>
          <span className="sh-slash" aria-hidden="true">/</span>
          <span>{example.id}</span>
        </div>
        <nav className="sh-nav" aria-label="Where this example sits">
          {data.axes.map((axis) => (
            <span key={axis} className="sh-nav-item" aria-current={example.depths.includes(axis) ? "true" : undefined}>
              {axis}
            </span>
          ))}
        </nav>
        <div className="sh-actions">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function Hero({ example }: { example: Example }) {
  return (
    <>
      <p className="sh-eyebrow">
        {example.depths.join(" · ")}
      </p>
      <h1 className="sh-title">{example.title}</h1>
      <p className="sh-lede">{example.pattern}</p>
    </>
  );
}

export function DemoFrame({ example, children }: { example: Example; children: React.ReactNode }) {
  return (
    <>
      <div className="sh-tabs">
        <span className="sh-tab-active">live demo</span>
        <span>{example.slug}</span>
      </div>
      <div className="shell-demo">{children}</div>
    </>
  );
}

export function ExampleIndex({ current }: { current: Example }) {
  return (
    <section className="sh-section" aria-labelledby="sh-examples">
      <div className="sh-container">
        <h2 id="sh-examples" className="sh-section-title">
          The examples
        </h2>
        <ol className="sh-grid">
          {data.examples.map((e) => (
            <li key={e.id} className="sh-step" aria-current={e.id === current.id ? "step" : undefined}>
              <div className="sh-step-id">
                {e.id}
                {e.id === current.id && <span className="sh-here">you are here</span>}
              </div>
              <h3>{e.title}</h3>
              <p>{e.pattern}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="sh-footer">
      <div className="sh-container">
        <span>{data.brand}</span>
      </div>
    </footer>
  );
}

/** The whole page: header, hero, the example in a demo frame, the index, footer. */
export function Shell({ id, children }: { id: string; children: React.ReactNode }) {
  const example = getExample(id);
  return (
    <>
      <ThemeScript />
      <Header example={example} />
      <main className="sh-main">
        <section className="sh-hero">
          <div className="sh-container">
            <Hero example={example} />
            <DemoFrame example={example}>{children}</DemoFrame>
          </div>
        </section>
        <ExampleIndex current={example} />
      </main>
      <Footer />
    </>
  );
}
