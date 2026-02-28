import type { ParsedCV } from "@/types/cv";
import {
  User,
  Briefcase,
  GraduationCap,
  Lightbulb,
  Certificate,
  Translate,
} from "@phosphor-icons/react";

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
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

export function CVSections({ data }: { data: ParsedCV }) {
  return (
    <div className="space-y-5">
      {data.personal?.name && (
        <Section icon={User} title="Dati personali">
          <p className="font-medium">{data.personal.name}</p>
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
        <Section icon={User} title="Sommario">
          <p className="text-sm text-foreground/80">{data.summary}</p>
        </Section>
      )}

      {data.experience && data.experience.length > 0 && (
        <Section icon={Briefcase} title="Esperienza">
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
        <Section icon={GraduationCap} title="Formazione">
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
        <Section icon={Lightbulb} title="Competenze">
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
        <Section icon={Certificate} title="Certificazioni">
          {data.certifications.map((cert, i) => (
            <p key={i} className="text-sm">
              {cert.name} {cert.year && <span className="text-muted-foreground">({cert.year})</span>}
            </p>
          ))}
        </Section>
      )}

      {data.languages && data.languages.length > 0 && (
        <Section icon={Translate} title="Lingue">
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
