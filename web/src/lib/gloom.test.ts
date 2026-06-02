import { describe, it, expect } from "vitest";
import {
  windowIndex,
  buildSeason,
  WINDOW_START,
  WINDOW_END,
  WEIGHTS,
  SOCKED_THRESHOLD,
  WIN_THRESHOLD,
} from "./gloom";
import { seasonYear } from "./openMeteo";
import type { HourPoint, Station, StationSeries } from "./types";

const DATE = `${seasonYear()}-06-01`;

function hour(h: number, lowCloud: number, sunshineSec = 0): HourPoint {
  return { time: `${DATE}T${String(h).padStart(2, "0")}:00`, date: DATE, hour: h, lowCloud, sunshineSec };
}

const STN: Station = { id: "t", name: "Test", county: "LA", lat: 0, lon: 0 };

describe("methodology constants", () => {
  it("uses the 7 AM–noon window and a 50 split", () => {
    expect(WINDOW_START).toBe(7);
    expect(WINDOW_END).toBe(12);
    expect(WIN_THRESHOLD).toBe(50);
    expect(SOCKED_THRESHOLD).toBe(50);
  });

  it("weights sum to 1", () => {
    expect(WEIGHTS.lowCloud + WEIGHTS.sunless + WEIGHTS.socked).toBeCloseTo(1, 10);
  });
});

describe("windowIndex — the worked example from the methodology page", () => {
  // 7–11 AM: low cloud [95,90,80,55,30], sun [0,0,600,2400,3200]
  const day = [
    hour(6, 100, 0), // before window — must be ignored
    hour(7, 95, 0),
    hour(8, 90, 0),
    hour(9, 80, 600),
    hour(10, 55, 2400),
    hour(11, 30, 3200),
    hour(13, 0, 3600), // after window — must be ignored
  ];
  const s = windowIndex(day)!;

  it("counts only in-window hours", () => {
    expect(s.windowHours).toBe(5);
  });
  it("computes the component stats", () => {
    expect(s.meanLowCloud).toBeCloseTo(70, 6);
    expect(s.sunFraction).toBeCloseTo(6200 / 18000, 6);
    expect(s.pctSocked).toBeCloseTo(80, 6);
  });
  it("computes the blended index", () => {
    expect(s.index).toBeCloseTo(70.667, 2);
  });
  it("reports burn-off at the first sub-threshold hour", () => {
    expect(s.burnOffHour).toBe(11);
  });
});

describe("windowIndex — edge cases", () => {
  it("returns null when no window hours have data", () => {
    expect(windowIndex([hour(5, 100), hour(6, 100), hour(14, 0)])).toBeNull();
  });

  it("a fully clear morning scores 0 and burns off immediately", () => {
    const s = windowIndex([7, 8, 9, 10, 11].map((h) => hour(h, 0, 3600)))!;
    expect(s.index).toBe(0);
    expect(s.burnOffHour).toBe(7);
  });

  it("a fully socked morning scores 100 and never clears", () => {
    const s = windowIndex([7, 8, 9, 10, 11].map((h) => hour(h, 100, 0)))!;
    expect(s.index).toBe(100);
    expect(s.burnOffHour).toBeNull();
  });
});

describe("buildSeason — coastal aggregation & winner", () => {
  function series(low: number): StationSeries {
    return {
      station: { ...STN, id: `s${low}` },
      hours: [7, 8, 9, 10, 11].map((h) => hour(h, low, 0)),
    };
  }

  it("averages beach indices and credits Gloom at >= 50", () => {
    // Two beaches at 100% low cloud, no sun → index 100 each → coastal 100.
    const season = buildSeason([series(100), series(100)]);
    expect(season.days).toHaveLength(1);
    expect(season.days[0].gloomScore).toBe(100);
    expect(season.days[0].dogScore).toBe(0);
    expect(season.days[0].winner).toBe("gloom");
  });

  it("credits the Big Dogs below the win threshold", () => {
    // Clear skies, full sun → index 0 → Dogs win.
    const season = buildSeason([
      { station: STN, hours: [7, 8, 9, 10, 11].map((h) => hour(h, 0, 3600)) },
    ]);
    expect(season.days[0].winner).toBe("dogs");
    expect(season.days[0].gloomScore).toBe(0);
  });
});
