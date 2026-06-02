import { useCallback, useEffect, useState } from "react";
import { fetchSeason } from "./openMeteo";
import { buildSeason } from "./gloom";
import type { Season } from "./types";

interface State {
  season: Season | null;
  loading: boolean;
  error: string | null;
}

export function useSeason() {
  const [state, setState] = useState<State>({
    season: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const series = await fetchSeason();
      setState({ season: buildSeason(series), loading: false, error: null });
    } catch (e) {
      setState({
        season: null,
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load weather data",
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
