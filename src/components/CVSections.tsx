import { useState } from "react";
import type { ParsedCV } from "@/types/cv";
import {
  User,
  Briefcase,
  GraduationCap,
  Lightbulb,
  Certificate,
  Translate,
  CaretDown,
  CaretRight,
} from "@phosphor-icons/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function Section({
  icon: Icon,
  title,
  summary,
  collapsible,
  children,
}: {
  icon: React.ElementType;
  title: string;
  summary?: string;
  collapsible?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  if (!collapsible) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon size={16} />
          <h3 className="font-mono text-xs uppercase tracking-wider">{title}</h3>
        </div>
        <div>{children}</div>
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 py-2 text-left hover:text-foreground transition-colors group">
        <Icon size={16} className="text-muted-foreground shrink-0" />
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
          {title}
        </h3>
        {summary && (
          <span className="ml-1 text-xs text-muted-foreground/60 font-normal normal-case">
            — {summary}
          </span>
        )}
        <span className="ml-auto text-muted-foreground">
          {open ? <CaretDown size={14} /> : <CaretRight size={14} />}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6 pb-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function CVSections({
  data,
  collapsible = false,
}: {
  data: ParsedCV;
  collapsible?: boolean;
}) {
  return (
    <div className="space-y-1">
      {data.personal?.name && (
        <Section
          icon={User}
          title="Dati personali"
          collapsible={collapsible}
          summary={data.personal.name}
        >
          {data.personal.email && (
            <p className="text-sm text-muted-foreground">{data.personal.email}</p>
          )}
          {data.personal.phone && (
            <p className="text-sm text-muted-foreground">{data.personal.phone}</p>
          )}
          {data.personal.location && (
            <p className="text-sm text-muted-foreground">{data.personal.location}</p>
          )}
        </Section>
      )}

      {data.summary && (
        <Section icon={User} title="Sommario" collapsible={collapsible}>
          <p className="text-sm text-foreground/80">{data.summary}</p>
        </Section>
      )}

      {data.experience && data.experience.length > 0 && (
        <Section
          icon={Briefcase}
          title="Esperienza"
          collapsible={collapsible}
          summary={`${data.experience.length} posizion${data.experience.length === 1 ? "e" : "i"}`}
        >
          {data.experience.map((exp, i) => (
            <div key={i} className="border-l-2 border-primary/30 pl-3 mb-3 last:mb-0">
              <p className="font-medium text-sm">{exp.title}</p>
              <p className="text-xs text-muted-foreground">
                {exp.company} · {exp.period}
              </p>
              {exp.description && (
                <p className="text-xs text-foreground/70 mt-1">{exp.description}</p>
              )}
            </div>
          ))}
        </Section>
      )}

      {data.education && data.education.length > 0 && (
        <Section
          icon={GraduationCap}
          title="Formazione"
          collapsible={collapsible}
          summary={`${data.education.length} titol${data.education.length === 1 ? "o" : "i"}`}
        >
          {data.education.map((edu, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <p className="font-medium text-sm">{edu.degree}</p>
              <p className="text-xs text-muted-foreground">
                {edu.institution} · {edu.period}
              </p>
            </div>
          ))}
        </Section>
      )}

      {data.skills && data.skills.length > 0 && (
        <Section
          icon={Lightbulb}
          title="Competenze"
          collapsible={collapsible}
          summary={`${data.skills.length}`}
        >
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, i) => (
              <span
                key={i}
                className="rounded-full bg-primary/15 px-3 py-1 font-mono text-xs text-primary"
              >
                {skill}
              </span>
            ))}
          </div>
        </Section>
      )}

      {data.certifications && data.certifications.length > 0 && (
        <Section
          icon={Certificate}
          title="Certificazioni"
          collapsible={collapsible}
          summary={`${data.certifications.length}`}
        >
          {data.certifications.map((cert, i) => (
            <p key={i} className="text-sm">
              {cert.name}{" "}
              {cert.year && (
                <span className="text-muted-foreground">({cert.year})</span>
              )}
            </p>
          ))}
        </Section>
      )}

      {data.languages && data.languages.length > 0 && (
        <Section
          icon={Translate}
          title="Lingue"
          collapsible={collapsible}
          summary={data.languages.map((l) => l.language).join(", ")}
        >
          <div className="flex flex-wrap gap-2">
            {data.languages.map((lang, i) => (
              <span
                key={i}
                className="rounded-full border border-border px-3 py-1 text-xs text-foreground"
              >
                {lang.language} — {lang.level}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
