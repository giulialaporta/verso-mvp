import { useState, useRef } from "react";
import { X, PencilSimple } from "@phosphor-icons/react";

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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

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

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditDraft(items[index]);
    setTimeout(() => editRef.current?.focus(), 0);
  };

  const confirmEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editDraft.trim();
    if (trimmed && trimmed !== items[editingIndex]) {
      const updated = [...items];
      updated[editingIndex] = trimmed;
      onChange(updated);
    }
    setEditingIndex(null);
    setEditDraft("");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditDraft("");
  };

  const chipBase = "group/chip inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition-colors min-h-[30px]";
  const chipClass =
    variant === "primary"
      ? `${chipBase} bg-primary/15 text-primary font-mono`
      : `${chipBase} border border-border text-foreground`;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {items.map((item, i) =>
        editingIndex === i ? (
          <input
            key={`edit-${i}`}
            ref={editRef}
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); confirmEdit(); }
              if (e.key === "Escape") cancelEdit();
            }}
            onBlur={confirmEdit}
            className="rounded-full border border-primary/50 bg-surface-2 px-3 py-1.5 font-mono text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/30 w-32"
          />
        ) : (
          <span key={`${item}-${i}`} className={chipClass}>
            <span className="truncate max-w-[180px]">{item}</span>
            <button
              onClick={() => startEdit(i)}
              className="text-primary/50 hover:text-primary transition-colors -mr-0.5"
              aria-label={`Modifica ${item}`}
            >
              <PencilSimple size={11} weight="bold" />
            </button>
            <button
              onClick={() => remove(i)}
              className="text-destructive/50 hover:text-destructive transition-colors -mr-1"
              aria-label={`Rimuovi ${item}`}
            >
              <X size={11} weight="bold" />
            </button>
          </span>
        )
      )}
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
        className="rounded-full border border-dashed border-border bg-transparent px-3 py-1.5 font-mono text-xs text-muted-foreground outline-none focus:border-primary/50 transition-colors w-28"
      />
    </div>
  );
}
