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
  Wrench,
  Heart,
  ListBullets,
  Globe,
  LinkedinLogo,
} from "@phosphor-icons/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

function SkillChips({ items, variant = "primary" }: { items: string[]; variant?: "primary" | "outline" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className={
            variant === "primary"
              ? "rounded-full bg-primary/15 px-3 py-1 font-mono text-xs text-primary"
              : "rounded-full border border-border px-3 py-1 text-xs text-foreground"
          }
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function CVSections({
  data,
  collapsible = false,
}: {
  data: ParsedCV;
  collapsible?: boolean;
}) {
  // Helper to count total skills
  const skills = data.skills;
  const hasSkills = skills && (
    (skills.technical && skills.technical.length > 0) ||
    (skills.soft && skills.soft.length > 0) ||
    (skills.tools && skills.tools.length > 0) ||
    (skills.languages && skills.languages.length > 0)
  );

  // Legacy support: skills might be a flat string array from old data
  const isLegacySkills = Array.isArray(data.skills);

  return (
    <div className="space-y-1">
      {/* Photo + Personal */}
      {data.personal?.name && (
        <Section
          icon={User}
          title="Dati personali"
          collapsible={collapsible}
          summary={data.personal.name}
        >
          <div className="flex items-start gap-3">
            {data.photo_base64 && (
              <Avatar className="h-14 w-14 shrink-0">
                <AvatarImage src={data.photo_base64} alt={data.personal.name} />
                <AvatarFallback>{data.personal.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div className="space-y-0.5">
              {data.personal.email && (
                <p className="text-sm text-muted-foreground">{data.personal.email}</p>
              )}
              {data.personal.phone && (
                <p className="text-sm text-muted-foreground">{data.personal.phone}</p>
              )}
              {data.personal.location && (
                <p className="text-sm text-muted-foreground">{data.personal.location}</p>
              )}
              {data.personal.date_of_birth && (
                <p className="text-sm text-muted-foreground">{data.personal.date_of_birth}</p>
              )}
              {data.personal.linkedin && (
                <a href={data.personal.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-secondary hover:underline">
                  <LinkedinLogo size={14} /> LinkedIn
                </a>
              )}
              {data.personal.website && (
                <a href={data.personal.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-secondary hover:underline">
                  <Globe size={14} /> Website
                </a>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* Summary */}
      {data.summary && (
        <Section icon={User} title="Profilo" collapsible={collapsible}>
          <p className="text-sm text-foreground/80">{data.summary}</p>
        </Section>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <Section
          icon={Briefcase}
          title="Esperienza"
          collapsible={collapsible}
          summary={`${data.experience.length} posizion${data.experience.length === 1 ? "e" : "i"}`}
        >
          {data.experience.map((exp, i) => (
            <div key={i} className="border-l-2 border-primary/30 pl-3 mb-3 last:mb-0">
              <p className="font-medium text-sm">{exp.role || (exp as any).title}</p>
              <p className="text-xs text-muted-foreground">
                {exp.company}
                {exp.location && ` · ${exp.location}`}
                {" · "}
                {exp.start || (exp as any).period}
                {exp.end && ` – ${exp.end}`}
                {exp.current && " – Attuale"}
              </p>
              {exp.description && (
                <p className="text-xs text-foreground/70 mt-1">{exp.description}</p>
              )}
              {exp.bullets && exp.bullets.length > 0 && (
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  {exp.bullets.map((b, j) => (
                    <li key={j} className="text-xs text-foreground/70">{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <Section
          icon={GraduationCap}
          title="Formazione"
          collapsible={collapsible}
          summary={`${data.education.length} titol${data.education.length === 1 ? "o" : "i"}`}
        >
          {data.education.map((edu, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <p className="font-medium text-sm">
                {edu.degree}
                {edu.field && ` in ${edu.field}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {edu.institution}
                {(edu.start || edu.end || (edu as any).period) && " · "}
                {edu.start && edu.start}
                {edu.end && ` – ${edu.end}`}
                {!(edu.start || edu.end) && (edu as any).period}
              </p>
              {edu.grade && (
                <p className="text-xs text-primary mt-0.5">{edu.grade}{edu.honors && ` — ${edu.honors}`}</p>
              )}
              {edu.program && (
                <p className="text-xs text-muted-foreground italic">{edu.program}</p>
              )}
              {edu.publication && (
                <p className="text-xs text-foreground/70 mt-0.5">📄 {edu.publication}</p>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Skills (new structured format) */}
      {hasSkills && !isLegacySkills && (
        <>
          {skills!.technical && skills!.technical.length > 0 && (
            <Section icon={Lightbulb} title="Competenze tecniche" collapsible={collapsible} summary={`${skills!.technical.length}`}>
              <SkillChips items={skills!.technical} />
            </Section>
          )}
          {skills!.soft && skills!.soft.length > 0 && (
            <Section icon={Heart} title="Competenze trasversali" collapsible={collapsible} summary={`${skills!.soft.length}`}>
              <SkillChips items={skills!.soft} variant="outline" />
            </Section>
          )}
          {skills!.tools && skills!.tools.length > 0 && (
            <Section icon={Wrench} title="Strumenti" collapsible={collapsible} summary={`${skills!.tools.length}`}>
              <SkillChips items={skills!.tools} />
            </Section>
          )}
          {skills!.languages && skills!.languages.length > 0 && (
            <Section
              icon={Translate}
              title="Lingue"
              collapsible={collapsible}
              summary={skills!.languages.map((l) => l.language).join(", ")}
            >
              <div className="flex flex-wrap gap-2">
                {skills!.languages.map((lang, i) => (
                  <span key={i} className="rounded-full border border-border px-3 py-1 text-xs text-foreground">
                    {lang.language}
                    {lang.level && ` — ${lang.level}`}
                    {lang.descriptor && ` (${lang.descriptor})`}
                  </span>
                ))}
              </div>
            </Section>
          )}
        </>
      )}

      {/* Legacy skills (flat array) */}
      {isLegacySkills && (data.skills as unknown as string[]).length > 0 && (
        <Section icon={Lightbulb} title="Competenze" collapsible={collapsible} summary={`${(data.skills as unknown as string[]).length}`}>
          <SkillChips items={data.skills as unknown as string[]} />
        </Section>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <Section
          icon={Certificate}
          title="Certificazioni"
          collapsible={collapsible}
          summary={`${data.certifications.length}`}
        >
          {data.certifications.map((cert, i) => (
            <p key={i} className="text-sm">
              {cert.name}
              {cert.issuer && <span className="text-muted-foreground"> — {cert.issuer}</span>}
              {cert.year && <span className="text-muted-foreground"> ({cert.year})</span>}
            </p>
          ))}
        </Section>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <Section icon={Lightbulb} title="Progetti" collapsible={collapsible} summary={`${data.projects.length}`}>
          {data.projects.map((proj, i) => (
            <div key={i} className="mb-1 last:mb-0">
              <p className="font-medium text-sm">{proj.name}</p>
              {proj.description && <p className="text-xs text-foreground/70">{proj.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {/* Extra Sections (dynamic) */}
      {data.extra_sections && data.extra_sections.length > 0 &&
        data.extra_sections.map((section, i) => (
          <Section
            key={i}
            icon={ListBullets}
            title={section.title}
            collapsible={collapsible}
            summary={`${section.items.length}`}
          >
            {section.items.length === 1 ? (
              <p className="text-sm text-foreground/80">{section.items[0]}</p>
            ) : (
              <ul className="space-y-0.5 list-disc list-inside">
                {section.items.map((item, j) => (
                  <li key={j} className="text-sm text-foreground/80">{item}</li>
                ))}
              </ul>
            )}
          </Section>
        ))
      }

      {/* Legacy languages (from old schema) */}
      {!isLegacySkills && !skills?.languages && (data as any).languages && (data as any).languages.length > 0 && (
        <Section
          icon={Translate}
          title="Lingue"
          collapsible={collapsible}
          summary={(data as any).languages.map((l: any) => l.language).join(", ")}
        >
          <div className="flex flex-wrap gap-2">
            {(data as any).languages.map((lang: any, i: number) => (
              <span key={i} className="rounded-full border border-border px-3 py-1 text-xs text-foreground">
                {lang.language} — {lang.level}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
