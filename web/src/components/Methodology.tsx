import { motion } from "framer-motion";
import {
  WEIGHTS,
  SOCKED_THRESHOLD,
  WIN_THRESHOLD,
  MORNING_START,
  MORNING_END,
  fmtHour,
} from "../lib/gloom";
import { STATIONS } from "../lib/openMeteo";
import { TEAMS } from "../lib/teams";

// A worked example computed with the real constants so the numbers are honest.
const EX_LOW = [95, 92, 88, 70, 40, 20]; // 6–11 AM low-cloud %
const EX_SUN = [0, 0, 0, 600, 2400, 3200]; // seconds of sun per hour
const exN = EX_LOW.length;
const exMean = EX_LOW.reduce((a, b) => a + b, 0) / exN;
const exSunFrac = EX_SUN.reduce((a, b) => a + b, 0) / (exN * 3600);
const exSocked = (100 * EX_LOW.filter((v) => v >= SOCKED_THRESHOLD).length) / exN;
const exIndex =
  WEIGHTS.lowCloud * exMean +
  WEIGHTS.sunless * (1 - exSunFrac) * 100 +
  WEIGHTS.socked * exSocked;
const exBurnHour = MORNING_START + EX_LOW.findIndex((v) => v < SOCKED_THRESHOLD);

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-glass mt-5 rounded-2xl p-5 sm:p-6">
      <h2 className="mb-3 font-display text-xl font-semibold text-white">
        {title}
      </h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-white/70">
        {children}
      </div>
    </div>
  );
}

export default function Methodology() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-3xl pb-10"
    >
      <h1 className="font-display text-3xl font-bold text-white">
        How the Gloom Index works
      </h1>
      <p className="mt-2 text-white/55">
        Every June day is a game. The{" "}
        <span className="text-gloom-400">{TEAMS.gloom.name}</span> score when the
        marine layer holds; the{" "}
        <span className="text-dogs-400">{TEAMS.dogs.name}</span> score when the
        sun wins. Here's exactly how we keep score.
      </p>

      <Section title="1. The data">
        <p>
          All weather comes from the free{" "}
          <a
            className="text-dogs-400 underline"
            href="https://open-meteo.com/"
            target="_blank"
            rel="noreferrer"
          >
            Open-Meteo
          </a>{" "}
          API, fetched live in your browser (no key, no server). We use the{" "}
          <em>forecast</em> endpoint, which serves recent hourly observations
          plus a short forecast, so today's game updates as the day unfolds.
        </p>
        <p>Two hourly variables drive everything:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong className="text-white/85">Low-cloud cover (%)</strong> — the
            marine layer is <em>low</em> cloud, so this is far more accurate than
            total cloud cover.
          </li>
          <li>
            <strong className="text-white/85">Sunshine duration</strong> —
            seconds of actual sunshine per hour, i.e. how much sun really reached
            the sand.
          </li>
        </ul>
      </Section>

      <Section title="2. The teams' turf — LA & Orange County">
        <p>
          Six coastal stations decide each day. Santa Barbara and San Diego sit
          this one out. The daily result is the <strong>average</strong> of all
          six beaches' indices.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {STATIONS.map((s) => (
            <div
              key={s.id}
              className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/75"
            >
              {s.name}
              <span className="ml-1.5 text-[10px] uppercase text-white/35">
                {s.county}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="3. The morning window">
        <p>
          June Gloom is a "night & morning low clouds" phenomenon — the question
          each day is whether it burns off. So we score the{" "}
          <strong className="text-white/85">
            {fmtHour(MORNING_START)}–{fmtHour(MORNING_END)}
          </strong>{" "}
          window. An hour counts as <em>socked in</em> when low-cloud cover is at
          or above <strong className="text-white/85">{SOCKED_THRESHOLD}%</strong>.
        </p>
      </Section>

      <Section title="4. The Gloom Index formula">
        <p>
          For each beach we blend three signals into a single 0–100 index. Higher
          = gloomier.
        </p>
        <div className="rounded-xl bg-black/30 p-4 font-mono text-sm text-white/85">
          Index ={" "}
          <span className="text-gloom-400">{WEIGHTS.lowCloud}</span> ·
          meanLowCloud
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;+ <span className="text-gloom-400">
            {WEIGHTS.sunless}
          </span>{" "}
          · (1 − sunFraction) · 100
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;+ <span className="text-gloom-400">
            {WEIGHTS.socked}
          </span>{" "}
          · pctMorningSocked
        </div>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong className="text-white/85">meanLowCloud</strong> — average
            low-cloud % across the morning (the layer's thickness).
          </li>
          <li>
            <strong className="text-white/85">sunFraction</strong> — share of the
            morning that was actually sunny (0–1). We use{" "}
            <code>1 − sunFraction</code> so "no sun" pushes the index up.
          </li>
          <li>
            <strong className="text-white/85">pctMorningSocked</strong> — % of
            morning hours at or above the {SOCKED_THRESHOLD}% threshold (how
            stubborn the layer was).
          </li>
        </ul>
        <p className="text-sm text-white/55">
          Weights sum to 1.0, so the index always lands between 0 and 100.
        </p>
      </Section>

      <Section title="5. Who wins the day">
        <p>
          The six beach indices are averaged into the day's{" "}
          <strong className="text-white/85">coastal Gloom Index</strong>. That
          number <em>is</em> the final score:
        </p>
        <div className="rounded-xl bg-black/30 p-4 font-mono text-sm text-white/85">
          {TEAMS.gloom.short} score = round(index)
          <br />
          {TEAMS.dogs.short} score = 100 − {TEAMS.gloom.short} score
        </div>
        <p>
          If the index is{" "}
          <strong className="text-white/85">≥ {WIN_THRESHOLD}</strong>, the{" "}
          <span className="text-gloom-400">{TEAMS.gloom.short}</span> win the
          game; otherwise the{" "}
          <span className="text-dogs-400">{TEAMS.dogs.short}</span> take it.
        </p>
      </Section>

      <Section title="6. Keeping the standings">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong className="text-white/85">Record (W–L)</strong> — one win for
            the team that takes each <em>finished</em> day.
          </li>
          <li>
            <strong className="text-white/85">Points</strong> — each team banks
            its daily score; the scoreboard shows the season total, so blowouts
            matter more than nail-biters.
          </li>
          <li>
            <strong className="text-white/85">Streak</strong> — consecutive
            finished days won by the same team.
          </li>
          <li>
            Today's game counts toward <strong className="text-white/85">points</strong>{" "}
            live and updates through the day, but only becomes a{" "}
            <strong className="text-white/85">win/loss</strong> at midnight
            Pacific.
          </li>
        </ul>
      </Section>

      <Section title="7. Worked example — one beach, one morning">
        <p>
          Say Santa Monica's {fmtHour(MORNING_START)}–{fmtHour(MORNING_END)} runs:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-center text-sm">
            <thead className="text-white/45">
              <tr>
                <th className="p-1.5">Hour</th>
                {EX_LOW.map((_, i) => (
                  <th key={i} className="p-1.5">
                    {fmtHour(MORNING_START + i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-white/80">
              <tr>
                <td className="p-1.5 text-white/45">Low cloud %</td>
                {EX_LOW.map((v, i) => (
                  <td key={i} className="led p-1.5">
                    {v}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-1.5 text-white/45">Sun (sec)</td>
                {EX_SUN.map((v, i) => (
                  <td key={i} className="led p-1.5">
                    {v}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="ml-5 list-disc space-y-1 text-sm">
          <li>
            meanLowCloud = <span className="led">{exMean.toFixed(1)}</span>
          </li>
          <li>
            sunFraction ={" "}
            <span className="led">{exSunFrac.toFixed(3)}</span> →{" "}
            (1 − sunFraction)·100 ={" "}
            <span className="led">{((1 - exSunFrac) * 100).toFixed(1)}</span>
          </li>
          <li>
            pctMorningSocked = <span className="led">{exSocked.toFixed(1)}</span>{" "}
            (4 of 6 hours)
          </li>
          <li>
            burn-off = first hour under {SOCKED_THRESHOLD}% ={" "}
            <span className="led">{fmtHour(exBurnHour)}</span>
          </li>
        </ul>
        <div className="rounded-xl bg-black/30 p-4 font-mono text-sm text-white/85">
          Index = {WEIGHTS.lowCloud}·{exMean.toFixed(1)} +{" "}
          {WEIGHTS.sunless}·{((1 - exSunFrac) * 100).toFixed(1)} +{" "}
          {WEIGHTS.socked}·{exSocked.toFixed(1)} ={" "}
          <span className="text-gloom-400 font-bold">
            {Math.round(exIndex)}
          </span>
        </div>
        <p>
          Final at this beach:{" "}
          <span className="text-gloom-400 font-semibold">
            {TEAMS.gloom.short} {Math.round(exIndex)}
          </span>{" "}
          –{" "}
          <span className="text-dogs-400 font-semibold">
            {100 - Math.round(exIndex)} {TEAMS.dogs.short}
          </span>
          . Average this across all six beaches to get the day's official score.
        </p>
      </Section>

      <Section title="8. Caveats">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            Today's live numbers can shift as more hourly data lands and the
            forecast firms up.
          </li>
          <li>
            Station coordinates are representative points near each beach, not
            official NWS stations.
          </li>
          <li>
            The weights are a reasonable, fixed recipe — not fit to any
            "official" gloom definition (there isn't one).
          </li>
        </ul>
      </Section>
    </motion.div>
  );
}
