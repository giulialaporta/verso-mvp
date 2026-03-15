import { useState, useCallback } from "react";
import { ArrowUp, ArrowDown, Eye, EyeClosed } from "@phosphor-icons/react";

export interface ManagedSkill {
  label: string;
  visible: boolean;
}

interface SkillManagerProps {
  skills: ManagedSkill[];
  onChange: (skills: ManagedSkill[]) => void;
}

export function SkillManager({ skills, onChange }: SkillManagerProps) {
  const move = useCallback((index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= skills.length) return;
    const updated = [...skills];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  }, [skills, onChange]);

  const toggleVisibility = useCallback((index: number) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], visible: !updated[index].visible };
    onChange(updated);
  }, [skills, onChange]);

  if (skills.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {skills.map((skill, i) => (
        <div
          key={`${skill.label}-${i}`}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
            skill.visible
              ? "border-border/50 bg-card/80"
              : "border-border/20 bg-muted/30 opacity-60"
          }`}
        >
          <span className={`flex-1 font-mono text-xs ${skill.visible ? "text-foreground" : "text-muted-foreground line-through"}`}>
            {skill.label}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              aria-label="Sposta su"
            >
              <ArrowUp size={14} />
            </button>
            <button
              onClick={() => move(i, 1)}
              disabled={i === skills.length - 1}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              aria-label="Sposta giù"
            >
              <ArrowDown size={14} />
            </button>
            <button
              onClick={() => toggleVisibility(i)}
              className={`p-1 transition-colors ${skill.visible ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground"}`}
              aria-label={skill.visible ? "Nascondi" : "Mostra"}
            >
              {skill.visible ? <Eye size={14} /> : <EyeClosed size={14} />}
            </button>
          </div>
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground mt-2">
        Le skill nascoste non appariranno nel PDF. Trascina con le frecce per riordinare.
      </p>
    </div>
  );
}

/** Convert raw CV skills object to ManagedSkill array */
export function skillsToManaged(skills: any): ManagedSkill[] {
  if (!skills) return [];
  if (Array.isArray(skills)) {
    return skills.filter((s: string) => s && typeof s === "string" && s.trim()).map((s: string) => ({ label: s.trim(), visible: true }));
  }
  const result: ManagedSkill[] = [];
  for (const key of ["technical", "soft", "tools"]) {
    if (Array.isArray(skills[key])) {
      for (const s of skills[key]) {
        if (typeof s === "string" && s.trim()) {
          result.push({ label: s.trim(), visible: true });
        }
      }
    }
  }
  return result;
}

/** Convert ManagedSkill array back to CV skills object, preserving languages */
export function managedToSkills(managed: ManagedSkill[], originalSkills: any): any {
  const visibleLabels = managed.filter(s => s.visible).map(s => s.label);

  // If original was flat array, return flat array
  if (Array.isArray(originalSkills)) {
    return visibleLabels;
  }

  // Preserve the categorized structure — put all visible in technical for simplicity
  // since the AI already merged/reordered them
  return {
    ...(originalSkills || {}),
    technical: visibleLabels,
    soft: [],
    tools: [],
    languages: originalSkills?.languages || [],
  };
}
