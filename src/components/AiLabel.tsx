import { Robot } from "@phosphor-icons/react";

interface AiLabelProps {
  text: string;
  className?: string;
}

/** Discrete AI transparency label — EU AI Act compliance */
export function AiLabel({ text, className = "" }: AiLabelProps) {
  return (
    <p className={`flex items-center gap-1.5 text-[11px] text-muted-foreground/70 ${className}`}>
      <Robot size={12} weight="duotone" className="shrink-0" />
      {text}
    </p>
  );
}
