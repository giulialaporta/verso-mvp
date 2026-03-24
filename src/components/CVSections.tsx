import { useState, useMemo } from "react";
import type { ParsedCV } from "@/types/cv";
import { EditItemDrawer, type DrawerField } from "@/components/EditItemDrawer";
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
  Link as LinkIcon,
  PencilSimple,
  BookOpen,
  HandHeart,
  Trophy,
  Microphone,
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

function ItemActions({ onEdit, onRemove }: { onEdit?: () => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-1 rounded text-primary/50 hover:text-primary hover:bg-primary/10 transition-colors"
          aria-label="Modifica"
        >
          <PencilSimple size={14} weight="bold" />
        </button>
      )}
      <button
        onClick={onRemove}
        className="p-1 rounded text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
        aria-label="Rimuovi"
      >
        <Trash size={14} />
      </button>
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2.5 py-1.5 font-mono text-[11px] uppercase text-muted-foreground hover:border-primary hover:text-primary transition-colors mt-2"
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
  const [editingItem, setEditingItem] = useState<{
    type: "experience" | "education" | "certification" | "project" | "publication" | "volunteering" | "award" | "conference";
    index: number;
  } | null>(null);

  const update = (path: string, value: any) => {
    if (onUpdate) onUpdate(updateData(data, path, value));
  };

  // Field maps for the drawer
  const drawerFields: DrawerField[] = useMemo(() => {
    if (!editingItem) return [];
    const { type, index } = editingItem;
    if (type === "experience" && data.experience?.[index]) {
      const exp = data.experience[index];
      return [
        { key: "role", label: "Ruolo", value: exp.role || "", placeholder: "Ruolo" },
        { key: "company", label: "Azienda", value: exp.company || "", placeholder: "Azienda" },
        { key: "location", label: "Luogo", value: exp.location || "", placeholder: "Luogo" },
        { key: "start", label: "Data inizio", value: exp.start || "", placeholder: "es. Gen 2020" },
        { key: "end", label: "Data fine", value: exp.end || (exp.current ? "Attuale" : ""), placeholder: "es. Dic 2023" },
        { key: "description", label: "Descrizione", value: exp.description || "", multiline: true, placeholder: "Descrizione del ruolo..." },
        { key: "bullets", label: "Attività principali", values: exp.bullets || [], list: true, placeholder: "Descrivi un'attività..." },
      ];
    }
    if (type === "education" && data.education?.[index]) {
      const edu = data.education[index];
      return [
        { key: "degree", label: "Titolo", value: edu.degree || "", placeholder: "Titolo di studio" },
        { key: "field", label: "Campo", value: edu.field || "", placeholder: "Campo di studio" },
        { key: "institution", label: "Istituto", value: edu.institution || "", placeholder: "Istituto" },
        { key: "start", label: "Data inizio", value: edu.start || "", placeholder: "es. 2016" },
        { key: "end", label: "Data fine", value: edu.end || "", placeholder: "es. 2020" },
        { key: "grade", label: "Voto", value: edu.grade || "", placeholder: "es. 110/110" },
        { key: "honors", label: "Menzioni", value: edu.honors || "", placeholder: "es. cum laude" },
        { key: "program", label: "Programma", value: edu.program || "", placeholder: "es. Erasmus" },
        { key: "publication", label: "Tesi / Pubblicazione", value: edu.publication || "", multiline: true, placeholder: "Titolo tesi..." },
      ];
    }
    if (type === "certification" && data.certifications?.[index]) {
      const cert = data.certifications[index];
      return [
        { key: "name", label: "Nome", value: cert.name || "", placeholder: "Nome certificazione" },
        { key: "issuer", label: "Ente", value: cert.issuer || "", placeholder: "Ente certificatore" },
        { key: "year", label: "Anno", value: cert.year || "", placeholder: "es. 2023" },
      ];
    }
    if (type === "project" && data.projects?.[index]) {
      const proj = data.projects[index];
      return [
        { key: "name", label: "Nome", value: proj.name || "", placeholder: "Nome progetto" },
        { key: "description", label: "Descrizione", value: proj.description || "", multiline: true, placeholder: "Descrizione..." },
        { key: "link", label: "Link", value: proj.link || "", placeholder: "https://..." },
      ];
    }
    if (type === "publication" && data.publications?.[index]) {
      const pub = data.publications[index];
      return [
        { key: "title", label: "Titolo", value: pub.title || "", placeholder: "Titolo pubblicazione" },
        { key: "journal", label: "Rivista / Editore", value: pub.journal || "", placeholder: "Nome rivista o editore" },
        { key: "year", label: "Anno", value: pub.year || "", placeholder: "es. 2023" },
        { key: "doi", label: "DOI / Link", value: pub.doi || "", placeholder: "https://doi.org/..." },
        { key: "authors", label: "Autori", value: pub.authors || "", placeholder: "Co-autori" },
      ];
    }
    if (type === "volunteering" && data.volunteering?.[index]) {
      const vol = data.volunteering[index];
      return [
        { key: "role", label: "Ruolo", value: vol.role || "", placeholder: "Ruolo" },
        { key: "organization", label: "Organizzazione", value: vol.organization || "", placeholder: "Organizzazione" },
        { key: "start", label: "Data inizio", value: vol.start || "", placeholder: "es. Gen 2020" },
        { key: "end", label: "Data fine", value: vol.end || (vol.current ? "Attuale" : ""), placeholder: "es. Dic 2023" },
        { key: "description", label: "Descrizione", value: vol.description || "", multiline: true, placeholder: "Descrizione..." },
      ];
    }
    if (type === "award" && data.awards?.[index]) {
      const award = data.awards[index];
      return [
        { key: "name", label: "Nome", value: award.name || "", placeholder: "Nome premio" },
        { key: "issuer", label: "Ente", value: award.issuer || "", placeholder: "Ente conferitore" },
        { key: "year", label: "Anno", value: award.year || "", placeholder: "es. 2023" },
        { key: "description", label: "Descrizione", value: award.description || "", multiline: true, placeholder: "Descrizione..." },
      ];
    }
    if (type === "conference" && data.conferences?.[index]) {
      const conf = data.conferences[index];
      return [
        { key: "title", label: "Titolo", value: conf.title || "", placeholder: "Titolo presentazione" },
        { key: "event", label: "Evento", value: conf.event || "", placeholder: "Nome evento / conferenza" },
        { key: "year", label: "Anno", value: conf.year || "", placeholder: "es. 2023" },
        { key: "role", label: "Ruolo", value: conf.role || "", placeholder: "es. speaker, organizer" },
      ];
    }
    return [];
  }, [editingItem, data]);

  const drawerTitle = editingItem
    ? {
        experience: "Modifica esperienza",
        education: "Modifica formazione",
        certification: "Modifica certificazione",
        project: "Modifica progetto",
        publication: "Modifica pubblicazione",
        volunteering: "Modifica volontariato",
        award: "Modifica premio",
        conference: "Modifica conferenza",
      }[editingItem.type]
    : "";

  const handleDrawerSave = (values: Record<string, string | string[]>) => {
    if (!editingItem || !onUpdate) return;
    const { type, index } = editingItem;
    const copy = JSON.parse(JSON.stringify(data));
    const arrayKey = type === "certification" ? "certifications" : type === "project" ? "projects" : type === "experience" ? "experience" : type === "education" ? "education" : type === "publication" ? "publications" : type === "volunteering" ? "volunteering" : type === "award" ? "awards" : "conferences";
    if (copy[arrayKey]?.[index]) {
      Object.entries(values).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          copy[arrayKey][index][k] = v.filter((s: string) => s.trim() !== "");
        } else {
          copy[arrayKey][index][k] = v;
        }
      });
      onUpdate(copy);
    }
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
  const E = ({ value, path, multiline, placeholder, className, showIcon = false }: { value: string; path: string; multiline?: boolean; placeholder?: string; className?: string; showIcon?: boolean }) => {
    if (!editable) return <>{value}</>;
    return (
      <InlineEdit
        value={value || ""}
        onChange={(v) => update(path, v)}
        multiline={multiline}
        placeholder={placeholder}
        className={className}
        showIcon={showIcon}
      />
    );
  };

  return (
    <div className="space-y-3">
      {/* Personal */}
      {(data.personal?.name || editable) && (
        <Section icon={User} title="Dati personali" collapsible={collapsible} summary={data.personal?.name}>
          <div className="flex items-start gap-3">
            {data.photo_base64 && (
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={data.photo_base64} alt={data.personal?.name || ""} />
                <AvatarFallback>{data.personal?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div className="space-y-1 min-w-0 flex-1">
              {(data.personal?.name || editable) && (
                <p className="text-sm font-medium">
                  <E value={data.personal?.name || ""} path="personal.name" placeholder="Nome completo" showIcon />
                </p>
              )}
              <div className="grid grid-cols-1 gap-0.5">
                {(data.personal?.email || editable) && (
                  <p className="text-sm text-muted-foreground truncate">
                    <E value={data.personal?.email || ""} path="personal.email" placeholder="Email" showIcon />
                  </p>
                )}
                {(data.personal?.phone || editable) && (
                  <p className="text-sm text-muted-foreground">
                    <E value={data.personal?.phone || ""} path="personal.phone" placeholder="Telefono" showIcon />
                  </p>
                )}
                {(data.personal?.location || editable) && (
                  <p className="text-sm text-muted-foreground">
                    <E value={data.personal?.location || ""} path="personal.location" placeholder="Località" showIcon />
                  </p>
                )}
                {(data.personal?.date_of_birth || editable) && (
                  <p className="text-sm text-muted-foreground">
                    <E value={data.personal?.date_of_birth || ""} path="personal.date_of_birth" placeholder="Data di nascita" showIcon />
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
                {(data.personal?.linkedin || editable) && (
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
                {(data.personal?.website || editable) && (
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
          </div>
        </Section>
      )}

      {/* Summary */}
      {(data.summary || editable) && (
        <Section icon={User} title="Profilo" collapsible={collapsible}>
          {editable ? (
            <E value={data.summary || ""} path="summary" multiline placeholder="Scrivi un breve profilo professionale..." showIcon />
          ) : (
            <p className="text-sm text-foreground/80">{data.summary}</p>
          )}
        </Section>
      )}

      {/* Experience */}
      {Array.isArray(data.experience) && data.experience.length > 0 && (
        <Section
          icon={Briefcase}
          title="Esperienza"
          collapsible={collapsible}
          summary={`${data.experience.length} posizion${data.experience.length === 1 ? "e" : "i"}`}
        >
          <div className="space-y-3">
            {data.experience.map((exp, i) => (
              <div key={i} className="border-l-2 border-primary/30 pl-3 relative">
                {editable && (
                  <div className="absolute right-0 top-0">
                    <ItemActions
                      onEdit={() => setEditingItem({ type: "experience", index: i })}
                      onRemove={() => {
                        const updated = [...data.experience!];
                        updated.splice(i, 1);
                        onUpdate?.({ ...data, experience: updated });
                      }}
                    />
                  </div>
                )}
                <p className="font-medium text-sm pr-14">{exp.role || "Ruolo non specificato"}</p>
                <p className="text-xs text-muted-foreground">
                  {exp.company || ""}{exp.location ? ` · ${exp.location}` : ""}
                </p>
                <p className="text-xs text-muted-foreground/60">
                  {exp.start || ""}{" – "}{exp.end || (exp.current ? "Attuale" : "")}
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
          </div>
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
      {Array.isArray(data.education) && data.education.length > 0 && (
        <Section
          icon={GraduationCap}
          title="Formazione"
          collapsible={collapsible}
          summary={`${data.education.length} titol${data.education.length === 1 ? "o" : "i"}`}
        >
          <div className="space-y-3">
            {data.education.map((edu, i) => (
              <div key={i} className="relative">
                {editable && (
                  <div className="absolute right-0 top-0">
                    <ItemActions
                      onEdit={() => setEditingItem({ type: "education", index: i })}
                      onRemove={() => {
                        const updated = [...data.education!];
                        updated.splice(i, 1);
                        onUpdate?.({ ...data, education: updated });
                      }}
                    />
                  </div>
                )}
                <p className="font-medium text-sm pr-14">
                  {edu.degree || ""}{edu.field ? ` in ${edu.field}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">{edu.institution || ""}</p>
                <p className="text-xs text-muted-foreground/60">
                  {edu.start || ""}{" – "}{edu.end || ""}
                </p>
                {edu.grade && (
                  <p className="text-xs text-primary mt-0.5">{edu.grade}</p>
                )}
                {edu.honors && (
                  <p className="text-xs text-primary/80 mt-0.5 italic">{edu.honors}</p>
                )}
                {edu.program && (
                  <p className="text-xs text-secondary mt-0.5">{edu.program}</p>
                )}
                {edu.publication && (
                  <p className="text-xs text-foreground/60 mt-0.5">{edu.publication}</p>
                )}
              </div>
            ))}
          </div>
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
                  <span key={i} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-foreground">
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
                          showIcon={false}
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
                          showIcon={false}
                        />
                        <button
                          onClick={() => {
                            const langs = (skills?.languages || []).filter((_, j) => j !== i);
                            onUpdate?.({ ...data, skills: { ...data.skills, languages: langs } });
                          }}
                          className="text-destructive/50 hover:text-destructive transition-colors -mr-1"
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
      {Array.isArray(data.certifications) && data.certifications.length > 0 && (
        <Section icon={Certificate} title="Certificazioni" collapsible={collapsible} summary={`${data.certifications.length}`}>
          <div className="space-y-2">
            {data.certifications.map((cert, i) => (
              <div key={i} className="flex items-start gap-2">
                <p className="text-sm flex-1 min-w-0">
                  {cert.name}
                  {cert.issuer && <span className="text-muted-foreground"> — {cert.issuer}</span>}
                  {cert.year && <span className="text-muted-foreground"> ({cert.year})</span>}
                </p>
                {editable && (
                  <ItemActions
                    onEdit={() => setEditingItem({ type: "certification", index: i })}
                    onRemove={() => {
                      const updated = data.certifications!.filter((_, j) => j !== i);
                      onUpdate?.({ ...data, certifications: updated });
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          {editable && (
            <AddButton onClick={() => {
              onUpdate?.({ ...data, certifications: [...(data.certifications || []), { name: "" }] });
            }} label="Certificazione" />
          )}
        </Section>
      )}

      {/* Projects */}
      {Array.isArray(data.projects) && data.projects.length > 0 && (
        <Section icon={Lightbulb} title="Progetti" collapsible={collapsible} summary={`${data.projects.length}`}>
          <div className="space-y-3">
            {data.projects.map((proj, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{proj.name}</p>
                  {proj.description && (
                    <p className="text-xs text-foreground/70 mt-0.5">{proj.description}</p>
                  )}
                  {proj.link && (
                    <a
                      href={proj.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-secondary hover:underline mt-0.5"
                    >
                      <LinkIcon size={12} /> {proj.link}
                    </a>
                  )}
                </div>
                {editable && (
                  <ItemActions
                    onEdit={() => setEditingItem({ type: "project", index: i })}
                    onRemove={() => {
                      const updated = data.projects!.filter((_, j) => j !== i);
                      onUpdate?.({ ...data, projects: updated });
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          {editable && (
            <AddButton onClick={() => {
              onUpdate?.({ ...data, projects: [...(data.projects || []), { name: "", link: "" }] });
            }} label="Progetto" />
          )}
        </Section>
      )}

      {/* Publications */}
      {Array.isArray(data.publications) && data.publications.length > 0 && (
        <Section icon={BookOpen} title="Pubblicazioni" collapsible={collapsible} summary={`${data.publications.length}`}>
          <div className="space-y-2">
            {data.publications.map((pub, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{pub.title}</p>
                  {pub.journal && <p className="text-xs text-muted-foreground">{pub.journal}</p>}
                  <div className="flex gap-2 text-xs text-muted-foreground/60">
                    {pub.year && <span>{pub.year}</span>}
                    {pub.authors && <span>· {pub.authors}</span>}
                  </div>
                  {pub.doi && (
                    <a href={pub.doi.startsWith("http") ? pub.doi : `https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-secondary hover:underline mt-0.5">
                      <LinkIcon size={12} /> {pub.doi}
                    </a>
                  )}
                </div>
                {editable && (
                  <ItemActions
                    onEdit={() => setEditingItem({ type: "publication", index: i })}
                    onRemove={() => {
                      const updated = data.publications!.filter((_, j) => j !== i);
                      onUpdate?.({ ...data, publications: updated });
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          {editable && (
            <AddButton onClick={() => {
              onUpdate?.({ ...data, publications: [...(data.publications || []), { title: "" }] });
            }} label="Pubblicazione" />
          )}
        </Section>
      )}

      {/* Volunteering */}
      {Array.isArray(data.volunteering) && data.volunteering.length > 0 && (
        <Section icon={HandHeart} title="Volontariato" collapsible={collapsible} summary={`${data.volunteering.length}`}>
          <div className="space-y-3">
            {data.volunteering.map((vol, i) => (
              <div key={i} className="border-l-2 border-primary/30 pl-3 relative">
                {editable && (
                  <div className="absolute right-0 top-0">
                    <ItemActions
                      onEdit={() => setEditingItem({ type: "volunteering", index: i })}
                      onRemove={() => {
                        const updated = data.volunteering!.filter((_, j) => j !== i);
                        onUpdate?.({ ...data, volunteering: updated });
                      }}
                    />
                  </div>
                )}
                <p className="font-medium text-sm pr-14">{vol.role}</p>
                <p className="text-xs text-muted-foreground">{vol.organization}</p>
                <p className="text-xs text-muted-foreground/60">
                  {vol.start || ""}{" – "}{vol.end || (vol.current ? "Attuale" : "")}
                </p>
                {vol.description && <p className="text-xs text-foreground/70 mt-1">{vol.description}</p>}
              </div>
            ))}
          </div>
          {editable && (
            <AddButton onClick={() => {
              onUpdate?.({ ...data, volunteering: [...(data.volunteering || []), { role: "", organization: "" }] });
            }} label="Volontariato" />
          )}
        </Section>
      )}

      {/* Awards */}
      {Array.isArray(data.awards) && data.awards.length > 0 && (
        <Section icon={Trophy} title="Premi e riconoscimenti" collapsible={collapsible} summary={`${data.awards.length}`}>
          <div className="space-y-2">
            {data.awards.map((award, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{award.name}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {award.issuer && <span>{award.issuer}</span>}
                    {award.year && <span>({award.year})</span>}
                  </div>
                  {award.description && <p className="text-xs text-foreground/70 mt-0.5">{award.description}</p>}
                </div>
                {editable && (
                  <ItemActions
                    onEdit={() => setEditingItem({ type: "award", index: i })}
                    onRemove={() => {
                      const updated = data.awards!.filter((_, j) => j !== i);
                      onUpdate?.({ ...data, awards: updated });
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          {editable && (
            <AddButton onClick={() => {
              onUpdate?.({ ...data, awards: [...(data.awards || []), { name: "" }] });
            }} label="Premio" />
          )}
        </Section>
      )}

      {/* Conferences */}
      {Array.isArray(data.conferences) && data.conferences.length > 0 && (
        <Section icon={Microphone} title="Conferenze e presentazioni" collapsible={collapsible} summary={`${data.conferences.length}`}>
          <div className="space-y-2">
            {data.conferences.map((conf, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{conf.title}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{conf.event}</span>
                    {conf.year && <span>({conf.year})</span>}
                    {conf.role && <span className="capitalize">· {conf.role}</span>}
                  </div>
                </div>
                {editable && (
                  <ItemActions
                    onEdit={() => setEditingItem({ type: "conference", index: i })}
                    onRemove={() => {
                      const updated = data.conferences!.filter((_, j) => j !== i);
                      onUpdate?.({ ...data, conferences: updated });
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          {editable && (
            <AddButton onClick={() => {
              onUpdate?.({ ...data, conferences: [...(data.conferences || []), { title: "", event: "" }] });
            }} label="Conferenza" />
          )}
        </Section>
      )}

      {/* Extra Sections */}
      {Array.isArray(data.extra_sections) && data.extra_sections.length > 0 &&
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

      {editable && (
        <EditItemDrawer
          open={editingItem !== null}
          onClose={() => setEditingItem(null)}
          title={drawerTitle}
          fields={drawerFields}
          onSave={handleDrawerSave}
        />
      )}
    </div>
  );
}
