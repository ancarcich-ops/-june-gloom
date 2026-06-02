import { useEffect, useState, type CSSProperties } from "react";

export function useCountUp(target: number, dur = 1100, run = true) {
  const [n, setN] = useState(run ? 0 : target);
  useEffect(() => {
    if (!run) {
      setN(target);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start == null) start = t;
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, dur, run]);
  return n;
}

export default function Count({
  value,
  dur,
  run = true,
  className,
  style,
}: {
  value: number;
  dur?: number;
  run?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const n = useCountUp(value, dur, run);
  return (
    <span className={className} style={style}>
      {n}
    </span>
  );
}
