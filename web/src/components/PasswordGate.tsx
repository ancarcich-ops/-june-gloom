import { useState, type FormEvent, type ReactNode } from "react";

/**
 * A soft, client-side gate. NOTE: this is a static site, so the expected
 * password ships in the bundle — it keeps out casual visitors, not anyone
 * willing to open devtools. For real auth you'd need a server/host that
 * enforces it (Cloudflare Access, Netlify password, a basic-auth proxy, …).
 *
 * Unlock is remembered per-device via localStorage until the browser cache
 * is cleared.
 */
const PASSWORD = "rocketship";
const STORAGE_KEY = "jg-unlocked";

export default function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "1",
  );
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (value === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
    } else {
      setError(true);
    }
  }

  return (
    <div className="jg-gate">
      <form className="jg-card jg-gate-card" onSubmit={submit}>
        <div className="jg-eyebrow">Members only</div>
        <h1 className="jg-h2" style={{ margin: "8px 0 6px" }}>The June Gloom Bowl</h1>
        <p className="jg-sub" style={{ marginBottom: 20 }}>
          Enter the password to step into the clubhouse.
        </p>
        <input
          className="jg-gate-input"
          type="password"
          autoFocus
          placeholder="Password"
          value={value}
          aria-label="Password"
          aria-invalid={error}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(false);
          }}
        />
        {error && (
          <p className="jg-sub" style={{ color: "#e0392b", margin: "10px 0 0" }}>
            Not quite — try again.
          </p>
        )}
        <button className="jg-pill jg-gate-btn" type="submit">Enter</button>
      </form>
    </div>
  );
}
