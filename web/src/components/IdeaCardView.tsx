"use client";

import type { IdeaCard } from "@/lib/types";
import {
  Shield,
  Sparkles,
  Palette,
  TrendingUp,
  Gauge,
  FlaskConical,
  FileCode2,
  Play,
  X,
} from "lucide-react";

const CATEGORY_ICON: Record<string, typeof Shield> = {
  security: Shield,
  feature: Sparkles,
  ux: Palette,
  growth: TrendingUp,
  perf: Gauge,
  tests: FlaskConical,
};

const IMPACT_STYLE: Record<IdeaCard["impact"], React.CSSProperties> = {
  high: { background: "var(--green-tint)", color: "var(--green-text)" },
  medium: { background: "var(--amber-tint)", color: "var(--amber-text)" },
  low: { background: "var(--surface-2)", color: "var(--text-2)" },
};

const RISK_STYLE: Record<IdeaCard["risk"], React.CSSProperties> = {
  low: { background: "var(--surface-2)", color: "var(--text-2)" },
  medium: { background: "var(--amber-tint)", color: "var(--amber-text)" },
  high: { background: "var(--red-tint)", color: "var(--red-500)" },
};

export function IdeaCardView({
  card,
  onBuild,
}: {
  card: IdeaCard;
  onBuild?: (card: IdeaCard) => void;
}) {
  const Icon = CATEGORY_ICON[card.category] ?? Sparkles;
  const accent = card.track === "level_up" ? "var(--brand-500)" : "var(--purple-500)";
  const accentTint = card.track === "level_up" ? "var(--brand-tint)" : "var(--purple-tint)";

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
          style={{ background: accentTint }}
        >
          <Icon size={18} strokeWidth={1.9} style={{ color: accent }} />
        </span>
        <div className="flex flex-wrap gap-1.5 justify-end">
          <span className="chip" style={IMPACT_STYLE[card.impact]}>
            {card.impact} impact
          </span>
          <span className="chip" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>
            effort {card.effort}
          </span>
          <span className="chip" style={RISK_STYLE[card.risk]}>
            {card.risk} risk
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-[16px] font-semibold leading-snug">{card.title}</h3>
        <p className="text-[13px] mt-1" style={{ color: "var(--text-2)" }}>
          {card.rationale}
        </p>
      </div>

      <ul className="space-y-1">
        {card.bullets.map((b, i) => (
          <li key={i} className="text-[13px] flex gap-2" style={{ color: "var(--text-2)" }}>
            <span style={{ color: accent }}>•</span>
            {b}
          </li>
        ))}
      </ul>

      {card.targetFiles.length > 0 && (
        <div
          className="flex items-center gap-1.5 text-[11.5px] font-mono truncate rounded-md px-2.5 py-1.5"
          style={{ background: "var(--surface-2)", color: "var(--text-3)" }}
        >
          <FileCode2 size={13} className="shrink-0" />
          <span className="truncate">{card.targetFiles.join(" · ")}</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 mt-auto">
        <button
          className="btn-primary flex items-center gap-1.5"
          style={card.track === "whats_next" ? { background: "var(--purple-500)" } : undefined}
          onClick={() => onBuild?.(card)}
        >
          <Play size={14} strokeWidth={2.2} /> Build preview
        </button>
        <button className="btn-ghost flex items-center gap-1">
          <X size={14} /> Dismiss
        </button>
      </div>
    </div>
  );
}
