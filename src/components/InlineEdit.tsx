import { useState, useRef, useEffect } from "react";
import { PencilSimple } from "@phosphor-icons/react";

interface InlineEditProps {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  showIcon?: boolean;
}

export function InlineEdit({
  value,
  onChange,
  multiline = false,
  placeholder = "Clicca per modificare...",
  className = "",
  showIcon = true,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const confirm = () => {
    setEditing(false);
    if (draft !== value) onChange(draft);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      cancel();
    } else if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      confirm();
    }
  };

  if (editing) {
    const sharedClasses =
      "w-full rounded-md border border-primary/50 bg-surface-2 px-2 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-colors";

    return multiline ? (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={confirm}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder={placeholder}
        className={`${sharedClasses} resize-y ${className}`}
      />
    ) : (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={confirm}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${sharedClasses} ${className}`}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`group/edit inline-flex items-center gap-1 cursor-pointer rounded px-1 -mx-1 hover:bg-muted/30 active:bg-muted/40 transition-colors min-h-[28px] ${className}`}
    >
      <span className={value ? "" : "text-muted-foreground italic"}>
        {value || placeholder}
      </span>
      {showIcon && (
        <PencilSimple
          size={12}
          weight="bold"
          className="text-primary/60 opacity-100 md:opacity-0 md:group-hover/edit:opacity-100 transition-opacity shrink-0"
        />
      )}
    </span>
  );
}
