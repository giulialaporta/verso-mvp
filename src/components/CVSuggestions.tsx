import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import type { ParsedCV } from "@/types/cv";

interface CVSuggestionsProps {
  data: ParsedCV;
  onUpdate: (data: ParsedCV) => void;
}

type Suggestion = {
  key: string;
  label: string;
  action: () => void;
};

export function CVSuggestions({ data, onUpdate }: CVSuggestionsProps) {
  const [customTitle, setCustomTitle] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const suggestions: Suggestion[] = [];

  if (!data.summary) {
    suggestions.push({
      key: "summary",
      label: "Aggiungi un profilo professionale",
      action: () => onUpdate({ ...data, summary: "" }),
    });
  }

  if (!data.skills?.tools || data.skills.tools.length === 0) {
    suggestions.push({
      key: "tools",
      label: "Aggiungi gli strumenti che usi",
      action: () =>
        onUpdate({
          ...data,
          skills: { ...data.skills, tools: [] },
        }),
    });
  }

  if (!data.skills?.soft || data.skills.soft.length === 0) {
    suggestions.push({
      key: "soft",
      label: "Aggiungi competenze trasversali",
      action: () =>
        onUpdate({
          ...data,
          skills: { ...data.skills, soft: [] },
        }),
    });
  }

  if (!data.skills?.languages || data.skills.languages.length === 0) {
    suggestions.push({
      key: "languages",
      label: "Aggiungi le lingue",
      action: () =>
        onUpdate({
          ...data,
          skills: { ...data.skills, languages: [] },
        }),
    });
  }

  if (!data.certifications || data.certifications.length === 0) {
    suggestions.push({
      key: "certifications",
      label: "Hai certificazioni?",
      action: () =>
        onUpdate({
          ...data,
          certifications: [{ name: "" }],
        }),
    });
  }

  if (!data.projects || data.projects.length === 0) {
    suggestions.push({
      key: "projects",
      label: "Hai progetti personali?",
      action: () =>
        onUpdate({
          ...data,
          projects: [{ name: "" }],
        }),
    });
  }

  if (!data.personal?.linkedin) {
    suggestions.push({
      key: "linkedin",
      label: "Aggiungi LinkedIn",
      action: () =>
        onUpdate({
          ...data,
          personal: { ...data.personal, linkedin: "" },
        }),
    });
  }

  const addCustomSection = () => {
    const title = customTitle.trim();
    if (!title) return;
    onUpdate({
      ...data,
      extra_sections: [
        ...(data.extra_sections || []),
        { title, items: [""] },
      ],
    });
    setCustomTitle("");
    setShowCustomInput(false);
  };

  // Always show custom section option
  const hasAnySuggestion = suggestions.length > 0 || true;

  if (!hasAnySuggestion) return null;

  return (
    <div className="space-y-3">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Suggerimenti di Verso
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s.key}
            onClick={s.action}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-primary/60 hover:border-primary hover:text-primary transition-colors"
          >
            <Plus size={12} weight="bold" />
            {s.label}
          </button>
        ))}

        {/* Custom section */}
        {!showCustomInput ? (
          <button
            onClick={() => setShowCustomInput(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-primary/60 hover:border-primary hover:text-primary transition-colors"
          >
            <Plus size={12} weight="bold" />
            Aggiungi sezione personalizzata
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5">
            <input
              autoFocus
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCustomSection();
                if (e.key === "Escape") {
                  setShowCustomInput(false);
                  setCustomTitle("");
                }
              }}
              onBlur={() => {
                if (customTitle.trim()) addCustomSection();
                else {
                  setShowCustomInput(false);
                  setCustomTitle("");
                }
              }}
              placeholder="Nome sezione..."
              className="rounded-full border border-primary/50 bg-surface-2 px-3 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/30 w-44"
            />
          </div>
        )}
      </div>
    </div>
  );
}
