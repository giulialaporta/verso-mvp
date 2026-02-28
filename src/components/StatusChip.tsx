export const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-muted/40", text: "text-muted-foreground" },
  inviata: { bg: "bg-secondary/15", text: "text-secondary" },
  visualizzata: { bg: "bg-warning/15", text: "text-warning" },
  contattato: { bg: "bg-primary/15", text: "text-primary" },
  "follow-up": { bg: "bg-warning/20", text: "text-warning" },
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
