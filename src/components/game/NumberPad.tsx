import { useEffect } from "react";
import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"] as const;

export function NumberPad({
  value,
  suffix,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  suffix: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  function push(ch: string) {
    if (disabled) return;
    if (ch === "back") {
      onChange(value.slice(0, -1));
      return;
    }
    if (ch === "." && value.includes(".")) return;
    const dot = value.indexOf(".");
    if (ch !== "." && dot !== -1 && value.length - dot > 2) return;
    if (value.length >= 6) return;
    if (ch === "." && value.length === 0) {
      onChange("0.");
      return;
    }
    onChange(value + ch);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (disabled) return;
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        push(e.key);
      } else if (e.key === "." || e.key === ",") {
        e.preventDefault();
        push(".");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        push("back");
      } else if (e.key === "Enter") {
        e.preventDefault();
        onSubmit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled, value, onChange, onSubmit]);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-2 text-center">
        <p className="font-display text-4xl sm:text-5xl tabular-nums tracking-tight text-fg min-h-11">
          {value || "0"}
          <span className="ml-2 text-2xl text-muted">{suffix}</span>
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            disabled={disabled}
            onClick={() => push(k)}
            className={cn(
              "h-11 rounded-2xl bg-surface-2 border border-border text-lg font-semibold text-fg",
              "active:scale-[0.98] transition-transform duration-150",
              "disabled:opacity-40",
            )}
            aria-label={k === "back" ? "Delete digit" : k === "." ? "Decimal point" : k}
          >
            {k === "back" ? <Delete className="mx-auto size-5" /> : k}
          </button>
        ))}
      </div>
      <Button className="w-full mt-2" onClick={onSubmit} disabled={disabled || value.length === 0}>
        Submit
      </Button>
    </div>
  );
}
