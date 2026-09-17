import { cn } from "@/lib/utils";

/** Full-screen 3-2-1-GO overlay shown before a timed round starts. */
export function Countdown({
  introMs,
  title,
  subtitle,
}: {
  introMs: number;
  title: string;
  subtitle: string;
}) {
  const n = Math.ceil(introMs / 1000);
  const label = n <= 0 ? "GO" : String(n);
  return (
    <div className="bm-countdown" role="status" aria-live="assertive">
      <div className="text-center">
        <p className="font-display text-xs tracking-[0.3em] text-muted">{title}</p>
        <p key={label} className={cn("bm-countdown-num", label === "GO" && "is-go")}>
          {label}
        </p>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
    </div>
  );
}
