import { useState, useRef } from "react";
import { X } from "@phosphor-icons/react";

interface EditableSkillChipsProps {
  items: string[];
  onChange: (items: string[]) => void;
  variant?: "primary" | "outline";
  placeholder?: string;
}

export function EditableSkillChips({
  items,
  onChange,
  variant = "primary",
  placeholder = "Aggiungi...",
}: EditableSkillChipsProps) {
  const [adding, setAdding] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const add = () => {
    const trimmed = adding.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
    }
    setAdding("");
  };

  const chipBase = "group/chip inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs transition-colors";
  const chipClass =
    variant === "primary"
      ? `${chipBase} bg-primary/15 text-primary font-mono`
      : `${chipBase} border border-border text-foreground`;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className={chipClass}>
          {item}
          <button
            onClick={() => remove(i)}
            className="opacity-0 group-hover/chip:opacity-100 transition-opacity text-destructive hover:text-destructive/80 -mr-1"
            aria-label={`Rimuovi ${item}`}
          >
            <X size={12} weight="bold" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={adding}
        onChange={(e) => setAdding(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={() => {
          if (adding.trim()) add();
        }}
        placeholder={placeholder}
        className="rounded-full border border-dashed border-border bg-transparent px-3 py-1 font-mono text-xs text-muted-foreground outline-none focus:border-primary/50 transition-colors w-28"
      />
    </div>
  );
}
