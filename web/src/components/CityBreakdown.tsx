import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Season, DayResult } from "../lib/types";
import { TEAMS } from "../lib/teams";
import { WIN_THRESHOLD } from "../lib/gloom";

const ABBR: Record<string, string> = {
  santa_monica: "SMO",
  manhattan_beach: "MNB",
  garden_grove: "GDG",
  long_beach: "LGB",
  huntington_beach: "HUN",
  newport_beach: "NWP",
  laguna_beach: "LAG",
};

function pickDay(season: Season): DayResult | null {
  if (season.todaysGame) return season.todaysGame;
  const finals = season.days.filter((d) => d.status === "final");
  return finals.length ? finals[finals.length - 1] : null;
}

const baseRadius = (index: number) => 6 + (Math.abs(index - 50) / 50) * 8;

export default function CityBreakdown({ season, dark = true }: { season: Season; dark?: boolean }) {
  const day = pickDay(season);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.CircleMarker>>({});
  const [selected, setSelected] = useState<string | null>(null);

  const rows = (day?.stations ?? []).map((s) => {
    const index = Math.round(s.index);
    return {
      id: s.station.id,
      name: s.station.name,
      abbr: ABBR[s.station.id] ?? s.station.id.slice(0, 3).toUpperCase(),
      index,
      lat: s.station.lat,
      lon: s.station.lon,
      winner: index >= WIN_THRESHOLD ? ("gloom" as const) : ("dogs" as const),
    };
  });

  const coastalIdx = day?.gloomScore ?? 0;
  // Re-init only when the plotted data or theme actually changes.
  const mapKey = rows.map((r) => `${r.id}:${r.index}`).join("|") + `|${dark}`;

  // Build the map (tiles, markers, fog overlay, locked bounds).
  useEffect(() => {
    if (!mapEl.current || rows.length === 0) return;
    const map = L.map(mapEl.current, {
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: true,
      maxBoundsViscosity: 1.0,
    });
    mapRef.current = map;
    L.control.zoom({ position: "topright" }).addTo(map);

    const url = dark
      ? "https://{s}.basemap.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemap.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    L.tileLayer(url, { subdomains: "abcd", maxZoom: 18, attribution: "&copy; OpenStreetMap &copy; CARTO" }).addTo(map);

    const pts: L.LatLngExpression[] = rows.map((b) => [b.lat, b.lon]);
    const bounds = L.latLngBounds(pts);

    // "Socked-in" haze: a layer between tiles and markers, scaled to the day.
    map.createPane("fog");
    const fogPane = map.getPane("fog");
    if (fogPane) {
      fogPane.style.zIndex = "350";
      fogPane.style.pointerEvents = "none";
    }
    // Subtle haze only — strong enough to feel gloomy, never enough to grey out
    // the map. Scales with the day's index but caps low.
    L.rectangle(bounds.pad(1.2), {
      pane: "fog",
      stroke: false,
      fillColor: "#dbe4ef",
      fillOpacity: Math.min(0.22, (coastalIdx / 100) * 0.22),
    }).addTo(map);

    markersRef.current = {};
    for (const b of rows) {
      const t = TEAMS[b.winner];
      const m = L.circleMarker([b.lat, b.lon], {
        radius: baseRadius(b.index),
        color: "#fff",
        weight: 1.5,
        fillColor: t.c3,
        fillOpacity: 0.92,
      })
        .addTo(map)
        .bindTooltip(`${b.abbr} ${b.index}`, { permanent: true, direction: "right", className: "cb-tip", offset: [6, 0] });
      m.on("click", () => setSelected((cur) => (cur === b.id ? null : b.id)));
      markersRef.current[b.id] = m;
    }

    map.fitBounds(bounds.pad(0.4));
    map.setMaxBounds(bounds.pad(1.0)); // lock to the coast — no panning to open ocean
    map.setMinZoom(map.getZoom() - 1);
    const t = setTimeout(() => map.invalidateSize(), 60);

    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapKey]);

  // Reflect selection onto the markers (highlight + pan).
  useEffect(() => {
    for (const b of rows) {
      const m = markersRef.current[b.id];
      if (!m) continue;
      const t = TEAMS[b.winner];
      if (selected === b.id) {
        m.setRadius(baseRadius(b.index) + 4);
        m.setStyle({ weight: 3, fillColor: t.c1, fillOpacity: 1 });
        m.bringToFront();
        mapRef.current?.panTo(m.getLatLng(), { animate: true });
      } else {
        m.setRadius(baseRadius(b.index));
        m.setStyle({ weight: 1.5, fillColor: t.c3, fillOpacity: 0.92 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, mapKey]);

  if (!day) return null;

  return (
    <div className="jg-card jg-rise" style={{ padding: "clamp(18px,2.4vw,28px)" }}>
      <div className="cb-wrap">
        <div className="cb-map">
          <div ref={mapEl} className="cb-leaflet" />
          <div className="cb-mapcap">LA &amp; OC coast · live map</div>
        </div>

        <div className="cb-rows">
          {rows.map((b) => {
            const t = TEAMS[b.winner];
            const fromMid = b.index - 50;
            const widthPct = (Math.abs(fromMid) / 50) * 50;
            const style =
              fromMid >= 0
                ? { left: "50%", width: `${widthPct}%`, background: `linear-gradient(90deg, ${TEAMS.gloom.c3}, ${TEAMS.gloom.c4})` }
                : { right: "50%", width: `${widthPct}%`, background: `linear-gradient(90deg, ${TEAMS.dogs.c4}, ${TEAMS.dogs.c2})` };
            return (
              <div
                key={b.id}
                className={`cb-row${selected === b.id ? " sel" : ""}`}
                onClick={() => setSelected((cur) => (cur === b.id ? null : b.id))}
              >
                <div className="cb-name">{b.name}<small>{b.abbr}</small></div>
                <div className="cb-track">
                  <span className="cb-mid" />
                  <span className="cb-fill" style={style} />
                </div>
                <div className="cb-val" style={{ color: t.c3 }}>{b.index}</div>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-faint)", fontWeight: 600, marginTop: 6, paddingLeft: 130 }}>
            <span style={{ color: TEAMS.dogs.c3 }}>← Cleared (Dogs)</span>
            <span style={{ color: TEAMS.gloom.c3 }}>Socked in (Gloom) →</span>
          </div>
        </div>
      </div>

      <div className="cb-legend">
        <span><i style={{ background: TEAMS.dogs.c3 }} />Gold = sun winning that beach (index &lt; 50)</span>
        <span><i style={{ background: TEAMS.gloom.c3 }} />Slate = fog winning (index ≥ 50)</span>
        <span>Bigger marker = more lopsided</span>
        <span style={{ color: "var(--ink-faint)" }}>Tap a beach or pin to highlight it</span>
      </div>
    </div>
  );
}
