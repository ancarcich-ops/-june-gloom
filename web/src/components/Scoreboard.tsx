import type { Season, TeamId } from "../lib/types";
import { TEAMS } from "../lib/teams";
import { Crest, Ic, type CrestVariant } from "./icons";
import Count from "./Count";

function TeamPanel({
  teamId,
  pts,
  rec,
  crown,
  streak,
  crest,
  run,
}: {
  teamId: TeamId;
  pts: number;
  rec: string;
  crown: boolean;
  streak: string | null;
  crest: CrestVariant;
  run: boolean;
}) {
  const t = TEAMS[teamId];
  return (
    <div className={`jb-team ${teamId}`}>
      <div className="glow" style={{ background: t.glow }} />
      <div className="col col-id">
        <div className="jb-crest"><Crest team={teamId} variant={crest} size={104} /></div>
        <div>
          <div className="jb-name">{t.name}</div>
          <div className="jb-who">{t.who} · {t.tagline}</div>
        </div>
      </div>
      <div className="col col-pts">
        <Count className="jb-pts led" value={pts} run={run} style={{ color: t.c3 }} />
        <div className="jb-ptslbl">Season points</div>
        <div className="jb-rec">
          <span className="jb-recpill" style={{ color: t.c3 }}>{rec}</span>
          <span className="jb-reclbl">W–L</span>
          {crown && (
            <span className="jb-crown" style={{ background: t.glow, color: teamId === "dogs" ? "#7a4d06" : "#2b3a52" }}>
              <Ic.Crown width="13" height="13" /> Lead
            </span>
          )}
          {streak && (
            <span className="jb-streak" style={{ color: t.c3 }}>
              <Ic.Flame width="12" height="12" />{streak}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Scoreboard({
  season,
  crest,
  run,
}: {
  season: Season;
  crest: CrestVariant;
  run: boolean;
}) {
  const { gloomWins: gW, dogWins: dW, gloomPoints: gP, dogPoints: dP } = season;
  const leader: TeamId | null = gW === dW ? null : gW > dW ? "gloom" : "dogs";
  const totalW = gW + dW;
  const gloomShare = totalW > 0 ? (gW / totalW) * 100 : 50;
  const streakLabel = season.streakLen > 0 ? `W${season.streakLen}` : null;

  const dayNum = season.todaysGame?.dayOfMonth ?? season.finalsPlayed;
  const live = !!season.today;

  return (
    <div className="jg-card solid jb jg-rise">
      <div className="jb-strip">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="jg-eyebrow">{season.year} Season</span>
          <span className="jb-daychip">Day {dayNum} of 30</span>
        </div>
        {live && <span className="jg-live"><span className="dot" />Live now</span>}
      </div>

      <div className="jb-grid">
        <TeamPanel
          teamId="dogs"
          pts={dP}
          rec={`${dW}–${gW}`}
          crown={leader === "dogs"}
          streak={season.streakTeam === "dogs" ? streakLabel : null}
          crest={crest}
          run={run}
        />
        <div className="jb-center">
          <div className="jb-vs">VS</div>
          <div className="jb-daychip">Season series</div>
        </div>
        <TeamPanel
          teamId="gloom"
          pts={gP}
          rec={`${gW}–${dW}`}
          crown={leader === "gloom"}
          streak={season.streakTeam === "gloom" ? streakLabel : null}
          crest={crest}
          run={run}
        />
      </div>

      <div className="jb-series">
        <div className="jb-series-lbls">
          <span style={{ color: TEAMS.dogs.c3 }}>Big Dogs · {dW}</span>
          <span style={{ color: TEAMS.gloom.c3 }}>{gW} · Gloom</span>
        </div>
        <div className="jg-tug">
          <i style={{ left: 0, width: `${100 - gloomShare}%`, background: `linear-gradient(90deg, ${TEAMS.dogs.c4}, ${TEAMS.dogs.c2})` }} />
          <i style={{ left: "auto", right: 0, width: `${gloomShare}%`, background: `linear-gradient(90deg, ${TEAMS.gloom.c3}, ${TEAMS.gloom.c4})` }} />
          <span className="mid" />
        </div>
      </div>
    </div>
  );
}
