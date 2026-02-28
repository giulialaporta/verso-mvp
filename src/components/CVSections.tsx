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
  Plus,
  Trash,
} from "@phosphor-icons/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { InlineEdit } from "@/components/InlineEdit";
import { EditableSkillChips } from "@/components/EditableSkillChips";

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

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="opacity-0 group-hover/item:opacity-100 transition-opacity text-destructive hover:text-destructive/80 shrink-0"
      aria-label={label}
    >
      <Trash size={14} />
    </button>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 font-mono text-[11px] uppercase text-muted-foreground hover:border-primary hover:text-primary transition-colors mt-1"
    >
      <Plus size={12} weight="bold" />
      {label}
    </button>
  );
}

// Helper to update nested data immutably
function updateData(data: ParsedCV, path: string, value: any): ParsedCV {
  const copy = JSON.parse(JSON.stringify(data));
  const keys = path.split(".");
  let obj = copy;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (/^\d+$/.test(k)) obj = obj[parseInt(k)];
    else obj = obj[k];
  }
  const lastKey = keys[keys.length - 1];
  if (/^\d+$/.test(lastKey)) obj[parseInt(lastKey)] = value;
  else obj[lastKey] = value;
  return copy;
}

export function CVSections({
  data,
  collapsible = false,
  editable = false,
  onUpdate,
}: {
  data: ParsedCV;
  collapsible?: boolean;
  editable?: boolean;
  onUpdate?: (data: ParsedCV) => void;
}) {
  const update = (path: string, value: any) => {
    if (onUpdate) onUpdate(updateData(data, path, value));
  };

  const skills = data.skills;
  const hasSkills = skills && (
    (skills.technical && skills.technical.length > 0) ||
    (skills.soft && skills.soft.length > 0) ||
    (skills.tools && skills.tools.length > 0) ||
    (skills.languages && skills.languages.length > 0)
  );
  const isLegacySkills = Array.isArray(data.skills);

  // Editable field helper
  const E = ({ value, path, multiline, placeholder, className }: { value: string; path: string; multiline?: boolean; placeholder?: string; className?: string }) => {
    if (!editable) return <>{value}</>;
    return (
      <InlineEdit
        value={value || ""}
        onChange={(v) => update(path, v)}
        multiline={multiline}
        placeholder={placeholder}
        className={className}
      />
    );
  };

  return (
    <div className="space-y-1">
      {/* Personal */}
      {(data.personal?.name || editable) && (
        <Section icon={User} title="Dati personali" collapsible={collapsible} summary={data.personal?.name}>
          <div className="flex items-start gap-3">
            {data.photo_base64 && (
              <Avatar className="h-14 w-14 shrink-0">
                <AvatarImage src={data.photo_base64} alt={data.personal?.name || ""} />
                <AvatarFallback>{data.personal?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div className="space-y-0.5">
              {(data.personal?.name || editable) && (
                <p className="text-sm font-medium">
                  <E value={data.personal?.name || ""} path="personal.name" placeholder="Nome completo" />
                </p>
              )}
              {(data.personal?.email || editable) && (
                <p className="text-sm text-muted-foreground">
                  <E value={data.personal?.email || ""} path="personal.email" placeholder="Email" />
                </p>
              )}
              {(data.personal?.phone || editable) && (
                <p className="text-sm text-muted-foreground">
                  <E value={data.personal?.phone || ""} path="personal.phone" placeholder="Telefono" />
                </p>
              )}
              {(data.personal?.location || editable) && (
                <p className="text-sm text-muted-foreground">
                  <E value={data.personal?.location || ""} path="personal.location" placeholder="Località" />
                </p>
              )}
              {(data.personal?.date_of_birth || editable) && (
                <p className="text-sm text-muted-foreground">
                  <E value={data.personal?.date_of_birth || ""} path="personal.date_of_birth" placeholder="Data di nascita" />
                </p>
              )}
              {data.personal?.linkedin !== undefined && (
                editable ? (
                  <p className="inline-flex items-center gap-1 text-sm text-secondary">
                    <LinkedinLogo size={14} />
                    <E value={data.personal.linkedin || ""} path="personal.linkedin" placeholder="URL LinkedIn" />
                  </p>
                ) : data.personal.linkedin ? (
                  <a href={data.personal.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-secondary hover:underline">
                    <LinkedinLogo size={14} /> LinkedIn
                  </a>
                ) : null
              )}
              {data.personal?.website !== undefined && (
                editable ? (
                  <p className="inline-flex items-center gap-1 text-sm text-secondary">
                    <Globe size={14} />
                    <E value={data.personal.website || ""} path="personal.website" placeholder="URL Website" />
                  </p>
                ) : data.personal.website ? (
                  <a href={data.personal.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-secondary hover:underline">
                    <Globe size={14} /> Website
                  </a>
                ) : null
              )}
            </div>
          </div>
        </Section>
      )}

      {/* Summary */}
      {(data.summary !== undefined || editable) && (
        <Section icon={User} title="Profilo" collapsible={collapsible}>
          {editable ? (
            <E value={data.summary || ""} path="summary" multiline placeholder="Scrivi un breve profilo professionale..." />
          ) : (
            <p className="text-sm text-foreground/80">{data.summary}</p>
          )}
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
            <div key={i} className="group/item border-l-2 border-primary/30 pl-3 mb-3 last:mb-0 relative">
              {editable && (
                <div className="absolute right-0 top-0">
                  <RemoveButton onClick={() => {
                    const updated = [...data.experience!];
                    updated.splice(i, 1);
                    onUpdate?.({ ...data, experience: updated });
                  }} label="Rimuovi esperienza" />
                </div>
              )}
              <p className="font-medium text-sm">
                <E value={exp.role || ""} path={`experience.${i}.role`} placeholder="Ruolo" />
              </p>
              <p className="text-xs text-muted-foreground">
                <E value={exp.company || ""} path={`experience.${i}.company`} placeholder="Azienda" />
                {" · "}
                <E value={exp.location || ""} path={`experience.${i}.location`} placeholder="Luogo" />
                {" · "}
                <E value={exp.start || ""} path={`experience.${i}.start`} placeholder="Inizio" />
                {" – "}
                <E value={exp.end || (exp.current ? "Attuale" : "")} path={`experience.${i}.end`} placeholder="Fine" />
              </p>
              {(exp.description || editable) && (
                <p className="text-xs text-foreground/70 mt-1">
                  <E value={exp.description || ""} path={`experience.${i}.description`} multiline placeholder="Descrizione..." />
                </p>
              )}
              {editable ? (
                <div className="mt-1">
                  <EditableSkillChips
                    items={exp.bullets || []}
                    onChange={(bullets) => update(`experience.${i}.bullets`, bullets)}
                    variant="outline"
                    placeholder="Aggiungi bullet..."
                  />
                </div>
              ) : (
                exp.bullets && exp.bullets.length > 0 && (
                  <ul className="mt-1 space-y-0.5 list-disc list-inside">
                    {exp.bullets.map((b, j) => (
                      <li key={j} className="text-xs text-foreground/70">{b}</li>
                    ))}
                  </ul>
                )
              )}
            </div>
          ))}
          {editable && (
            <AddButton onClick={() => {
              onUpdate?.({
                ...data,
                experience: [...(data.experience || []), { role: "", company: "" }],
              });
            }} label="Esperienza" />
          )}
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
            <div key={i} className="group/item mb-2 last:mb-0 relative">
              {editable && (
                <div className="absolute right-0 top-0">
                  <RemoveButton onClick={() => {
                    const updated = [...data.education!];
                    updated.splice(i, 1);
                    onUpdate?.({ ...data, education: updated });
                  }} label="Rimuovi formazione" />
                </div>
              )}
              <p className="font-medium text-sm">
                <E value={edu.degree || ""} path={`education.${i}.degree`} placeholder="Titolo" />
                {(edu.field || editable) && (
                  <>
                    {" in "}
                    <E value={edu.field || ""} path={`education.${i}.field`} placeholder="Campo" />
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                <E value={edu.institution || ""} path={`education.${i}.institution`} placeholder="Istituto" />
                {" · "}
                <E value={edu.start || ""} path={`education.${i}.start`} placeholder="Inizio" />
                {" – "}
                <E value={edu.end || ""} path={`education.${i}.end`} placeholder="Fine" />
              </p>
              {(edu.grade || editable) && (
                <p className="text-xs text-primary mt-0.5">
                  <E value={edu.grade || ""} path={`education.${i}.grade`} placeholder="Voto" />
                </p>
              )}
            </div>
          ))}
          {editable && (
            <AddButton onClick={() => {
              onUpdate?.({
                ...data,
                education: [...(data.education || []), { degree: "", institution: "" }],
              });
            }} label="Formazione" />
          )}
        </Section>
      )}

      {/* Skills - Technical */}
      {(hasSkills || editable) && !isLegacySkills && (
        <>
          {(skills?.technical && skills.technical.length > 0 || editable && data.skills) && (
            <Section icon={Lightbulb} title="Competenze tecniche" collapsible={collapsible} summary={`${skills?.technical?.length || 0}`}>
              {editable ? (
                <EditableSkillChips
                  items={skills?.technical || []}
                  onChange={(items) => onUpdate?.({ ...data, skills: { ...data.skills, technical: items } })}
                />
              ) : (
                <SkillChips items={skills!.technical!} />
              )}
            </Section>
          )}

          {(skills?.soft && skills.soft.length > 0 || (editable && data.skills?.soft !== undefined)) && (
            <Section icon={Heart} title="Competenze trasversali" collapsible={collapsible} summary={`${skills?.soft?.length || 0}`}>
              {editable ? (
                <EditableSkillChips
                  items={skills?.soft || []}
                  onChange={(items) => onUpdate?.({ ...data, skills: { ...data.skills, soft: items } })}
                  variant="outline"
                />
              ) : (
                <SkillChips items={skills!.soft!} variant="outline" />
              )}
            </Section>
          )}

          {(skills?.tools && skills.tools.length > 0 || (editable && data.skills?.tools !== undefined)) && (
            <Section icon={Wrench} title="Strumenti" collapsible={collapsible} summary={`${skills?.tools?.length || 0}`}>
              {editable ? (
                <EditableSkillChips
                  items={skills?.tools || []}
                  onChange={(items) => onUpdate?.({ ...data, skills: { ...data.skills, tools: items } })}
                />
              ) : (
                <SkillChips items={skills!.tools!} />
              )}
            </Section>
          )}

          {(skills?.languages && skills.languages.length > 0 || (editable && data.skills?.languages !== undefined)) && (
            <Section
              icon={Translate}
              title="Lingue"
              collapsible={collapsible}
              summary={skills?.languages?.map((l) => l.language).join(", ") || ""}
            >
              <div className="flex flex-wrap gap-2">
                {(skills?.languages || []).map((lang, i) => (
                  <span key={i} className="group/item inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-foreground">
                    {editable ? (
                      <>
                        <InlineEdit
                          value={lang.language}
                          onChange={(v) => {
                            const langs = [...(skills?.languages || [])];
                            langs[i] = { ...langs[i], language: v };
                            onUpdate?.({ ...data, skills: { ...data.skills, languages: langs } });
                          }}
                          placeholder="Lingua"
                        />
                        {" — "}
                        <InlineEdit
                          value={lang.level || ""}
                          onChange={(v) => {
                            const langs = [...(skills?.languages || [])];
                            langs[i] = { ...langs[i], level: v };
                            onUpdate?.({ ...data, skills: { ...data.skills, languages: langs } });
                          }}
                          placeholder="Livello"
                        />
                        <button
                          onClick={() => {
                            const langs = (skills?.languages || []).filter((_, j) => j !== i);
                            onUpdate?.({ ...data, skills: { ...data.skills, languages: langs } });
                          }}
                          className="opacity-0 group-hover/item:opacity-100 transition-opacity text-destructive -mr-1"
                        >
                          <Trash size={12} />
                        </button>
                      </>
                    ) : (
                      <>
                        {lang.language}
                        {lang.level && ` — ${lang.level}`}
                        {lang.descriptor && ` (${lang.descriptor})`}
                      </>
                    )}
                  </span>
                ))}
                {editable && (
                  <AddButton onClick={() => {
                    const langs = [...(skills?.languages || []), { language: "", level: "" }];
                    onUpdate?.({ ...data, skills: { ...data.skills, languages: langs } });
                  }} label="Lingua" />
                )}
              </div>
            </Section>
          )}
        </>
      )}

      {/* Legacy skills */}
      {isLegacySkills && (data.skills as unknown as string[]).length > 0 && (
        <Section icon={Lightbulb} title="Competenze" collapsible={collapsible} summary={`${(data.skills as unknown as string[]).length}`}>
          {editable ? (
            <EditableSkillChips
              items={data.skills as unknown as string[]}
              onChange={(items) => onUpdate?.({ ...data, skills: items as any })}
            />
          ) : (
            <SkillChips items={data.skills as unknown as string[]} />
          )}
        </Section>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <Section icon={Certificate} title="Certificazioni" collapsible={collapsible} summary={`${data.certifications.length}`}>
          {data.certifications.map((cert, i) => (
            <div key={i} className="group/item flex items-start gap-2">
              <p className="text-sm flex-1">
                <E value={cert.name} path={`certifications.${i}.name`} placeholder="Nome certificazione" />
                {(cert.issuer || editable) && (
                  <span className="text-muted-foreground">
                    {" — "}
                    <E value={cert.issuer || ""} path={`certifications.${i}.issuer`} placeholder="Ente" />
                  </span>
                )}
                {(cert.year || editable) && (
                  <span className="text-muted-foreground">
                    {" ("}
                    <E value={cert.year || ""} path={`certifications.${i}.year`} placeholder="Anno" />
                    {")"}
                  </span>
                )}
              </p>
              {editable && (
                <RemoveButton onClick={() => {
                  const updated = data.certifications!.filter((_, j) => j !== i);
                  onUpdate?.({ ...data, certifications: updated });
                }} label="Rimuovi certificazione" />
              )}
            </div>
          ))}
          {editable && (
            <AddButton onClick={() => {
              onUpdate?.({ ...data, certifications: [...(data.certifications || []), { name: "" }] });
            }} label="Certificazione" />
          )}
        </Section>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <Section icon={Lightbulb} title="Progetti" collapsible={collapsible} summary={`${data.projects.length}`}>
          {data.projects.map((proj, i) => (
            <div key={i} className="group/item mb-1 last:mb-0 flex items-start gap-2">
              <div className="flex-1">
                <p className="font-medium text-sm">
                  <E value={proj.name} path={`projects.${i}.name`} placeholder="Nome progetto" />
                </p>
                {(proj.description || editable) && (
                  <p className="text-xs text-foreground/70">
                    <E value={proj.description || ""} path={`projects.${i}.description`} multiline placeholder="Descrizione..." />
                  </p>
                )}
              </div>
              {editable && (
                <RemoveButton onClick={() => {
                  const updated = data.projects!.filter((_, j) => j !== i);
                  onUpdate?.({ ...data, projects: updated });
                }} label="Rimuovi progetto" />
              )}
            </div>
          ))}
          {editable && (
            <AddButton onClick={() => {
              onUpdate?.({ ...data, projects: [...(data.projects || []), { name: "" }] });
            }} label="Progetto" />
          )}
        </Section>
      )}

      {/* Extra Sections */}
      {data.extra_sections && data.extra_sections.length > 0 &&
        data.extra_sections.map((section, i) => (
          <Section key={i} icon={ListBullets} title={section.title} collapsible={collapsible} summary={`${section.items.length}`}>
            {editable ? (
              <EditableSkillChips
                items={section.items}
                onChange={(items) => {
                  const updated = [...data.extra_sections!];
                  updated[i] = { ...updated[i], items };
                  onUpdate?.({ ...data, extra_sections: updated });
                }}
                variant="outline"
                placeholder="Aggiungi..."
              />
            ) : (
              section.items.length === 1 ? (
                <p className="text-sm text-foreground/80">{section.items[0]}</p>
              ) : (
                <ul className="space-y-0.5 list-disc list-inside">
                  {section.items.map((item, j) => (
                    <li key={j} className="text-sm text-foreground/80">{item}</li>
                  ))}
                </ul>
              )
            )}
          </Section>
        ))
      }

      {/* Legacy languages */}
      {!editable && !isLegacySkills && !skills?.languages && (data as any).languages && (data as any).languages.length > 0 && (
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
