import CopyEmail from "@/components/CopyEmail";
import Director from "@/components/Director";
import Finish from "@/components/Finish";
import Hud from "@/components/Hud";
import Lights from "@/components/Lights";
import Reveal from "@/components/Reveal";
import Systems from "@/components/Systems";
import TyreSwitch from "@/components/TyreSwitch";
import Scene from "@/gl/SceneLoader";
import { driver, licences, links, profile, projects, season, stats } from "@/lib/content";
import { getGithub } from "@/lib/github";

const month = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
const tidy = (name: string) => name.replace(/[-_]+/g, " ").trim();

export default async function Home() {
  const github = await getGithub();
  const number = String(driver.number);

  return (
    <>
      <Director />
      <Scene />
      <Lights />
      <Hud />

      <header className="bar">
        <a href="#grid" className="bar__id" aria-label="Back to the start line">
          <b>{number}</b>
          <span>
            {driver.firstName} {driver.lastName}
          </span>
        </a>
        <nav className="bar__links mono" aria-label="Main">
          <a href="#driver">Driver</a>
          <a href="#car">Car</a>
          <a href="#season">Season</a>
          <a href="#work">Grid</a>
          <a href="#radio">Radio</a>
        </nav>
        <TyreSwitch />
      </header>

      <main>
        {/* 00 · Lights out */}
        <section id="grid" className="hero" data-chapter>
          <p className="hero__num" aria-hidden="true">
            {number}
          </p>
          <div className="hero__copy">
            <p className="tag mono">
              <i /> {driver.status} · {driver.base}
            </p>
            <h1 className="hero__name">
              <span>{driver.firstName}</span>
              <span>{driver.lastName}</span>
            </h1>
            <p className="hero__role">
              {driver.role} <b>/</b> {driver.team}
            </p>
            <p className="hero__intro">{driver.intro}</p>
            <div className="hero__cta">
              <a className="btn btn--solid" href="#work">
                See the grid
              </a>
              <a className="btn" href="#radio">
                Team radio
              </a>
            </div>
          </div>
          <div className="hero__strip mono" aria-hidden="true">
            <span>
              <b>P1</b>
            </span>
            <span>
              <b>{number}</b> S. Singh
            </span>
            <span>{driver.base.split(",")[0]}</span>
            <span>
              {github.repoCount} <small>repos</small>
            </span>
            <span>
              {projects.length} <small>on the grid</small>
            </span>
            <span className="hero__go">Scroll to drive ↓</span>
          </div>
        </section>

        {/* T1 · Driver */}
        <section id="driver" className="scene scene--right" data-chapter>
          <div className="scene__body">
            <p className="eyebrow mono reveal">
              <b>T1</b> Driver
            </p>
            <h2 className="title reveal">
              The driver <em>behind the wheel.</em>
            </h2>
            <p className="lead reveal">{driver.bio}</p>
            <dl className="sheet">
              {profile.map((row) => (
                <div className="reveal" key={row.label}>
                  <dt className="mono">{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="scene__note mono reveal">Car {number} · Side elevation</p>
        </section>

        {/* Telemetry: the numbers from the resume. */}
        <section className="band" aria-label="In numbers">
          <ul className="telemetry">
            {stats.map((s) => (
              <li className="reveal" key={s.label}>
                <span className="telemetry__value" data-count={s.value} data-decimals={s.decimals} data-suffix={s.suffix}>
                  {s.value.toFixed(s.decimals)}
                  {s.suffix}
                </span>
                <span className="telemetry__label mono">{s.label}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* T4 · The car, taken apart */}
        <section id="car" className="scene scene--left" data-chapter>
          <div className="scene__body">
            <p className="eyebrow mono reveal">
              <b>T4</b> The car
            </p>
            <h2 className="title reveal">
              Built <em>part by part.</em>
            </h2>
            <p className="lead lead--small reveal">Every skill is a system on the car. Pick one to see where it sits.</p>
            <Systems />
          </div>
        </section>

        {/* T7 · Season */}
        <section id="season" className="wide" data-chapter>
          <header className="wide__head">
            <p className="eyebrow mono reveal">
              <b>T7</b> Season
            </p>
            <h2 className="title reveal">
              Race <em>results.</em>
            </h2>
          </header>
          <ol className="rounds">
            {season.map((stint) => (
              <li className="round reveal" key={stint.team}>
                <div className="round__tag">
                  <span className="mono">Round</span>
                  <b>{stint.round}</b>
                  {stint.live && <span className="live mono">Live</span>}
                </div>
                <div className="round__main">
                  <h3>
                    {stint.url ? (
                      <a href={stint.url} target="_blank" rel="noreferrer">
                        {stint.team} <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      stint.team
                    )}
                  </h3>
                  <p className="round__role">{stint.role}</p>
                  {stint.path && (
                    <ol className="path mono">
                      {stint.path.map((step) => (
                        <li key={step.role}>
                          <b>{step.from}</b> {step.role}
                        </li>
                      ))}
                    </ol>
                  )}
                  <ul className="round__points">
                    {stint.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                </div>
                <p className="round__when mono">{stint.period}</p>
              </li>
            ))}
          </ol>
          <ul className="licences">
            <li className="mono licences__title">Super licence</li>
            {licences.map((l) => (
              <li className="reveal" key={l.name}>
                {l.href ? (
                  <a href={l.href} target="_blank" rel="noreferrer">
                    {l.name} ↗
                  </a>
                ) : (
                  l.name
                )}
                <small className="mono">{l.by}</small>
              </li>
            ))}
          </ul>
        </section>

        {/* T10 · The grid: projects, with live details from GitHub */}
        <section id="work" className="wide" data-chapter>
          <header className="wide__head">
            <p className="eyebrow mono reveal">
              <b>T10</b> The grid
            </p>
            <h2 className="title reveal">
              Projects <em>on the grid.</em>
            </h2>
            <p className="lead lead--small reveal">
              Project summaries from the resume; repository details {github.live ? "live" : "last read"} from GitHub.
            </p>
          </header>
          <div className="startgrid">
            {projects.map((p, i) => {
              const repo = github.featured[p.repo];
              return (
                <article className="slot reveal" key={p.repo}>
                  <div className="slot__box" aria-hidden="true">
                    <b>P{i + 1}</b>
                  </div>
                  <div className="slot__card">
                    <p className="mono slot__kind">
                      {p.kind} · {p.period}
                    </p>
                    <h3 className="slot__name">{p.name}</h3>
                    <p className="slot__stat">
                      <b>{p.stat.value}</b>
                      <span className="mono">{p.stat.label}</span>
                    </p>
                    <ul className="slot__points">
                      {p.points.map((pt) => (
                        <li key={pt}>{pt}</li>
                      ))}
                    </ul>
                    <ul className="slot__stack mono">
                      {p.stack.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                    {repo && (
                      <div className="slot__repo mono">
                        {repo.languages && (
                          <div className="langbar" title={repo.languages.map((l) => `${l.name} ${Math.round(l.share * 100)}%`).join(", ")}>
                            {repo.languages.map((l, n) => (
                              <i key={l.name} style={{ flexGrow: Math.max(l.share, 0.02), opacity: 1 - n * 0.24 }} />
                            ))}
                          </div>
                        )}
                        <span>{repo.languages?.[0]?.name ?? repo.language ?? "Code"}</span>
                        <span>Last push {month(repo.pushed)}</span>
                        <a href={repo.url} target="_blank" rel="noreferrer">
                          {driver.github}/{repo.name} ↗
                        </a>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="paddock">
            <p className="mono paddock__title reveal">
              In the paddock <span>Latest from github.com/{driver.github}</span>
            </p>
            <ol className="paddock__list">
              {github.others.map((r, i) => (
                <li className="reveal" key={r.name}>
                  <a href={r.url} target="_blank" rel="noreferrer">
                    <span className="mono paddock__pos">{String(i + 4).padStart(2, "0")}</span>
                    <span className="paddock__name">{tidy(r.name)}</span>
                    <span className="mono paddock__lang">{r.language}</span>
                    <span className="mono paddock__when">{month(r.pushed)}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* T13 · Pit wall */}
        <section id="radio" className="radio" data-chapter>
          <p className="eyebrow mono reveal">
            <b>T13</b> Pit wall
          </p>
          <h2 className="radio__call reveal">
            Box, box. <em>Let&rsquo;s talk.</em>
          </h2>
          <div className="radio__wave reveal" aria-hidden="true">
            {Array.from({ length: 36 }, (_, i) => (
              <i key={i} style={{ "--n": i } as React.CSSProperties} />
            ))}
          </div>
          <p className="lead reveal">Hiring, or building something that needs to be quick? Open the radio.</p>
          <a className="radio__email reveal" href={`mailto:${driver.email}`}>
            {driver.email}
          </a>
          <div className="radio__links reveal">
            <CopyEmail email={driver.email} />
            {links.map((l) => (
              <a className="btn" key={l.label} href={l.href} target="_blank" rel="noreferrer">
                {l.label} ↗
              </a>
            ))}
          </div>
          <Finish />
          <footer className="foot mono">
            <span>
              © 2026 {driver.firstName} {driver.lastName}
            </span>
            <span>Car {number} · Built with Next.js and three.js</span>
            <span>Not affiliated with Formula 1</span>
          </footer>
        </section>
      </main>

      <Reveal />
    </>
  );
}
