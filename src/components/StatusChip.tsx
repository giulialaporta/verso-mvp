export const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-muted/30", text: "text-muted-foreground" },
  pronta: { bg: "bg-blue-500/15", text: "text-blue-500" },
  inviata: { bg: "bg-indigo-500/15", text: "text-indigo-500" },
  visualizzata: { bg: "bg-amber-500/15", text: "text-amber-500" },
  contattato: { bg: "bg-violet-500/15", text: "text-violet-500" },
  colloquio: { bg: "bg-orange-500/15", text: "text-orange-500" },
  offerta: { bg: "bg-emerald-500/15", text: "text-emerald-500" },
  ko: { bg: "bg-destructive/15", text: "text-destructive" },
};

export function StatusChip({ status }: { status: string }) {
  const s = STATUS_STYLES[status.toLowerCase()] ?? STATUS_STYLES.draft;
  return (
    <span className={`${s.bg} ${s.text} rounded-full px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider`}>
      {status}
    </span>
  );
}
