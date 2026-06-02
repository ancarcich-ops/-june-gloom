import { motion } from "framer-motion";

const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));

/**
 * Full-screen mood layer that reacts to today's Gloom Index.
 *  - index < 50  → the sun wins: warm, bright, golden, with a glowing sun + rays
 *  - index > 50  → the gloom wins: cool, dark, desaturated, with drifting fog
 *  - distance from 50 sets the drama (calm at 50, extreme near 0 / 100)
 */
export default function DynamicBackground({ index }: { index: number }) {
  const i = clamp(index, 0, 100);
  const sun = clamp((50 - i) / 50); // 1 = peak sun, 0 at index ≥ 50
  const gloom = clamp((i - 50) / 50); // 1 = peak gloom, 0 at index ≤ 50

  const ease = { duration: 1.6, ease: "easeInOut" } as const;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Sunny wash */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: 0.25 + 0.75 * sun }}
        transition={ease}
        style={{
          background:
            "radial-gradient(900px 620px at 76% -5%, rgba(251,191,36,0.55), transparent 60%)," +
            "linear-gradient(180deg, rgba(245,158,11,0.22) 0%, rgba(120,60,10,0.05) 45%, transparent 75%)",
        }}
      />

      {/* Gloomy wash */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: 0.25 + 0.75 * gloom }}
        transition={ease}
        style={{
          background:
            "radial-gradient(1200px 720px at 50% -10%, rgba(130,150,175,0.5), transparent 65%)," +
            "linear-gradient(180deg, rgba(95,112,135,0.4) 0%, rgba(40,48,60,0.25) 50%, rgba(10,13,17,0.35) 100%)",
        }}
      />

      {/* Sun disc + rays */}
      <motion.div
        className="absolute -right-10 -top-16 h-[360px] w-[360px]"
        animate={{ opacity: sun, scale: 0.7 + 0.6 * sun }}
        transition={ease}
        style={{ transformOrigin: "70% 30%" }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 90, ease: "linear", repeat: Infinity }}
          style={{
            background:
              "repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,221,120,0.5) 0deg 6deg, transparent 6deg 16deg)",
            maskImage: "radial-gradient(closest-side, black 30%, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(closest-side, black 30%, transparent 72%)",
          }}
        />
        <motion.div
          className="absolute inset-[28%] rounded-full"
          animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
          style={{
            background:
              "radial-gradient(circle, rgba(255,236,170,0.95), rgba(251,191,36,0.65) 55%, transparent 72%)",
            filter: "blur(2px)",
          }}
        />
      </motion.div>

      {/* Drifting fog banks */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: gloom }}
        transition={ease}
      >
        {FOG.map((f, idx) => (
          <motion.div
            key={idx}
            className="absolute rounded-full"
            initial={{ x: f.from }}
            animate={{ x: f.to }}
            transition={{
              duration: f.dur,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              top: f.top,
              left: f.left,
              width: f.w,
              height: f.h,
              background:
                "radial-gradient(closest-side, rgba(200,210,224,0.5), transparent 70%)",
              filter: `blur(${f.blur}px)`,
            }}
          />
        ))}
      </motion.div>

      {/* Warm brighten (sunny) / cool darken (gloomy) overlays */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: 0.28 * sun }}
        transition={ease}
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, rgba(255,214,140,0.35), transparent 60%)",
          mixBlendMode: "soft-light",
        }}
      />
      <motion.div
        className="absolute inset-0 bg-slate-950"
        animate={{ opacity: 0.45 * gloom }}
        transition={ease}
      />
    </div>
  );
}

const FOG = [
  { top: "8%", left: "-10%", w: 520, h: 220, from: -60, to: 80, dur: 26, blur: 36 },
  { top: "32%", left: "20%", w: 640, h: 260, from: -90, to: 60, dur: 34, blur: 48 },
  { top: "55%", left: "-5%", w: 700, h: 300, from: -40, to: 120, dur: 30, blur: 52 },
  { top: "72%", left: "40%", w: 560, h: 240, from: -100, to: 40, dur: 38, blur: 44 },
];
