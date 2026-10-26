import { EXPECTATIONS, FOOTER, POSTURE_DISCLAIMER, PROFILE, PROGRESSION } from "../data/plan";
import { Icon } from "../components/Icon";
import { href } from "../lib/router";

export function GuideScreen() {
  return (
    <div className="stack-lg">
      <header className="page-head">
        <h1 className="display t-lg">Guide</h1>
        <p className="muted measure">{PROFILE.intro}</p>
      </header>

      <section className="panel prose" aria-labelledby="prog-title">
        <h2 id="prog-title" className="display t-md">
          Progression and tracking
        </h2>
        <ul className="rules">
          {PROGRESSION.map((r) => (
            <li key={r}>
              <Icon name="check" size={20} />
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <p className="muted small">
          The app applies these rules for you on <a href={href("progress")}>Progress</a> and flags a heavier load on <a href={href("today")}>Today</a>.
        </p>
      </section>

      <section className="panel prose" aria-labelledby="posture-title">
        <h2 id="posture-title" className="display t-md">
          Cardio and posture
        </h2>
        <p>
          Monday and Friday pair a treadmill session with an 8-minute posture routine. Keep the treadmill at a pace where you can still speak in full sentences.
        </p>
        <p className="callout">{POSTURE_DISCLAIMER}</p>
      </section>

      <section className="panel prose" aria-labelledby="expect-title">
        <h2 id="expect-title" className="display t-md">
          Timeline and expectations
        </h2>
        {EXPECTATIONS.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </section>

      <p className="faint small footnote">{FOOTER}</p>
    </div>
  );
}
