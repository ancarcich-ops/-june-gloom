import { useEffect, useState } from "react";
import { animate, useMotionValue } from "framer-motion";

interface Props {
  value: number;
  duration?: number;
  className?: string;
}

/** Animated count-up that eases to `value` whenever it changes. */
export default function Count({ value, duration = 1.2, className }: Props) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: "easeOut" });
    const unsub = mv.on("change", (v) => setDisplay(Math.round(v)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, duration, mv]);

  return <span className={className}>{display}</span>;
}
