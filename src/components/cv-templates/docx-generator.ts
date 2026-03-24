import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  convertMillimetersToTwip,
  TabStopType,
  TabStopPosition,
  LevelFormat,
  Footer,
} from "docx";
import { clean, ensureArray, MAX_SIDEBAR_SKILLS } from "./template-utils";

// ─── ATS-Compliant DOCX Generator ─────────────────────────────
// Rules: single column, zero tables/text boxes, Calibri, no em/en dash,
// contatti in body (not header), standard section titles, trattino bullets

const FONT = "Calibri";
const NAME_SIZE = 32; // 16pt
const SECTION_SIZE = 24; // 12pt
const BODY_SIZE = 22; // 11pt
const META_SIZE = 20; // 10pt
const TEXT_COLOR = "111827";
const SECTION_COLOR = "166534";
const MUTED_COLOR = "6B7280";

// ─── Helpers ───────────────────────────────────────────────────

/** Remove em dash, en dash, smart quotes — ATS-safe chars only */
function sanitize(text: string): string {
  return text
    .replace(/\u2014/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
}

/** Normalize date strings to MM/YYYY format when possible */
function normalizeDate(d: string | undefined | null): string {
  if (!d) return "";
  const s = d.trim();

  // Already MM/YYYY
  if (/^\d{2}\/\d{4}$/.test(s)) return s;

  // YYYY-MM or YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{2})/);
  if (isoMatch) return `${isoMatch[2]}/${isoMatch[1]}`;

  // "Gen 2020", "Gennaio 2020", "Jan 2020", etc.
  const monthNames: Record<string, string> = {
    gen: "01", gennaio: "01", jan: "01", january: "01",
    feb: "02", febbraio: "02", february: "02",
    mar: "03", marzo: "03", march: "03",
    apr: "04", aprile: "04", april: "04",
    mag: "05", maggio: "05", may: "05",
    giu: "06", giugno: "06", jun: "06", june: "06",
    lug: "07", luglio: "07", jul: "07", july: "07",
    ago: "08", agosto: "08", aug: "08", august: "08",
    set: "09", settembre: "09", sep: "09", september: "09",
    ott: "10", ottobre: "10", oct: "10", october: "10",
    nov: "11", novembre: "11", november: "11",
    dic: "12", dicembre: "12", dec: "12", december: "12",
  };
  const monthMatch = s.match(/^([a-zA-Z]+)\s+(\d{4})$/);
  if (monthMatch) {
    const mm = monthNames[monthMatch[1].toLowerCase()];
    if (mm) return `${mm}/${monthMatch[2]}`;
  }

  // Just a year
  if (/^\d{4}$/.test(s)) return s;

  // Fallback: return as-is, sanitized
  return sanitize(s);
}


function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 420, after: 180 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 2, color: SECTION_COLOR },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: SECTION_SIZE,
        font: FONT,
        color: SECTION_COLOR,
      }),
    ],
  });
}

function normalizeLang(lang?: string): string {
  if (!lang) return "it";
  const l = lang.toLowerCase();
  if (l.startsWith("en")) return "en";
  return "it";
}

function getHeaders(lang?: string): Record<string, string> {
  const norm = normalizeLang(lang);
  if (norm === "en") {
    return {
      profile: "Professional Profile",
      experience: "Experience",
      education: "Education",
      skills: "Skills",
      certifications: "Certifications",
      languages: "Languages",
      projects: "Projects",
    };
  }
  return {
    profile: "Profilo professionale",
    experience: "Esperienze",
    education: "Formazione",
    skills: "Competenze",
    certifications: "Certificazioni",
    languages: "Lingue",
    projects: "Progetti",
  };
}

// ─── Main generator ────────────────────────────────────────────

export async function generateDocx(
  cv: Record<string, any>,
  lang?: string,
): Promise<Blob> {
  const headers = getHeaders(lang);
  const personal = cv.personal || {};
  const experience = Array.isArray(cv.experience) ? cv.experience : [];
  const education = Array.isArray(cv.education) ? cv.education : [];
  const skills = cv.skills;
  const certifications = Array.isArray(cv.certifications) ? cv.certifications : [];
  const projects = Array.isArray(cv.projects) ? cv.projects : [];
  const extraSections = Array.isArray(cv.extra_sections) ? cv.extra_sections : [];

  const children: Paragraph[] = [];

  // ── Name ──
  children.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: sanitize(clean(personal.name) || "Nome Cognome"),
          bold: true,
          size: NAME_SIZE,
          font: FONT,
          color: TEXT_COLOR,
        }),
      ],
    })
  );

  // ── Contact line (in body, NOT header/footer) ──
  const contactParts = [
    clean(personal.email),
    clean(personal.phone),
    clean(personal.location),
    clean(personal.linkedin),
    clean(personal.website),
  ].filter(Boolean) as string[];

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: sanitize(contactParts.join("  |  ")),
            size: META_SIZE,
            font: FONT,
            color: MUTED_COLOR,
          }),
        ],
      })
    );
  }

  // ── Summary / Professional Profile ──
  const summary = clean(cv.summary);
  if (summary) {
    children.push(sectionTitle(headers.profile));
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({ text: sanitize(summary), size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
        ],
      })
    );
  }

  // ── Experience ──
  if (experience.length > 0) {
    children.push(sectionTitle(headers.experience));

    for (const exp of experience) {
      const role = clean(exp.role) || clean(exp.title) || "";
      const startDate = normalizeDate(exp.start);
      const normLang = normalizeLang(lang);
      const endDate = exp.current
        ? (normLang === "en" ? "Present" : "Attuale")
        : normalizeDate(exp.end);
      const dateStr = [startDate, endDate].filter(Boolean).join(" - ");

      // Role + date on same line (tab stop right)
      children.push(
        new Paragraph({
          spacing: { before: 320, after: 60 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: sanitize(role), bold: true, size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
            ...(dateStr
              ? [new TextRun({ text: "\t" + sanitize(dateStr), size: META_SIZE, font: FONT, color: MUTED_COLOR })]
              : []),
          ],
        })
      );

      // Company + location
      const companyLine = [exp.company, clean(exp.location)].filter(Boolean).join(" | ");
      if (companyLine) {
        children.push(
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: sanitize(companyLine), size: BODY_SIZE, font: FONT, color: TEXT_COLOR, italics: true }),
            ],
          })
        );
      }

      // Description paragraph
      if (clean(exp.description)) {
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: sanitize(exp.description), size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
            ],
          })
        );
      }

      // Bullets (dash via Word numbering — ATS-safe)
      const bullets = Array.isArray(exp.bullets) ? exp.bullets.filter((b: string) => clean(b)) : [];
      for (const b of bullets) {
        children.push(
          new Paragraph({
            numbering: { reference: "ats-bullets", level: 0 },
            spacing: { after: 70, line: 276 },
            children: [
              new TextRun({ text: sanitize(String(b)), size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
            ],
          })
        );
      }
    }
  }

  // ── Education ──
  if (education.length > 0) {
    children.push(sectionTitle(headers.education));
    for (const ed of education) {
      const degreeField = [ed.degree, clean(ed.field)].filter(Boolean).join(" in ");
      const startDate = normalizeDate(ed.start);
      const endDate = normalizeDate(ed.end);
      const period = [startDate, endDate].filter(Boolean).join(" - ");

      children.push(
        new Paragraph({
          spacing: { before: 240, after: 60 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: sanitize(degreeField), bold: true, size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
            ...(period ? [new TextRun({ text: "\t" + sanitize(period), size: META_SIZE, font: FONT, color: MUTED_COLOR })] : []),
          ],
        })
      );

      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: sanitize(ed.institution || ""), size: BODY_SIZE, font: FONT, color: TEXT_COLOR, italics: true }),
            ...(clean(ed.grade)
              ? [new TextRun({ text: " | " + sanitize(ed.grade) + (clean(ed.honors) ? " " + sanitize(ed.honors) : ""), size: META_SIZE, font: FONT, color: MUTED_COLOR })]
              : []),
          ],
        })
      );
    }
  }

  // ── Skills (categorized: technical, soft, tools) ──
  const technicalSkills = skills ? ensureArray(skills.technical) : [];
  const softSkills = skills ? ensureArray(skills.soft) : [];
  const toolSkills = skills ? ensureArray(skills.tools) : [];
  const flatSkills = Array.isArray(skills) ? skills.filter((s: string) => clean(s)) : [];
  const hasCategories = technicalSkills.length > 0 || softSkills.length > 0 || toolSkills.length > 0;
  const allSkills = hasCategories
    ? [...technicalSkills, ...softSkills, ...toolSkills]
    : flatSkills;

  if (allSkills.length > 0) {
    children.push(sectionTitle(headers.skills));

    if (hasCategories) {
      // Show categorized
      const categories: [string, string[]][] = [];
      if (technicalSkills.length > 0) categories.push([normalizeLang(lang) === "en" ? "Technical" : "Tecniche", technicalSkills]);
      if (softSkills.length > 0) categories.push([normalizeLang(lang) === "en" ? "Soft Skills" : "Trasversali", softSkills]);
      if (toolSkills.length > 0) categories.push(["Tools", toolSkills]);

      for (const [label, items] of categories) {
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: label + ": ", bold: true, size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
              new TextRun({ text: sanitize(items.slice(0, MAX_SIDEBAR_SKILLS).join(", ")), size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
            ],
          })
        );
      }
    } else {
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: sanitize(allSkills.slice(0, MAX_SIDEBAR_SKILLS).join(", ")),
              size: BODY_SIZE,
              font: FONT,
              color: TEXT_COLOR,
            }),
          ],
        })
      );
    }
  }

  // ── Languages ──
  const languages = skills?.languages && Array.isArray(skills.languages) ? skills.languages : [];
  if (languages.length > 0) {
    children.push(sectionTitle(headers.languages));
    const langText = languages
      .map((l: any) => l.language + (clean(l.level) ? " - " + l.level : "") + (clean(l.descriptor) ? ` (${l.descriptor})` : ""))
      .join(", ");
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: sanitize(langText), size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
        ],
      })
    );
  }

  // ── Certifications ──
  if (certifications.length > 0) {
    children.push(sectionTitle(headers.certifications));
    for (const cert of certifications) {
      const parts = [cert.name];
      if (clean(cert.issuer)) parts.push(cert.issuer);
      if (clean(cert.year)) parts.push(cert.year);
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: sanitize(parts.join(" | ")), size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
          ],
        })
      );
    }
  }

  // ── Projects ──
  if (projects.length > 0) {
    children.push(sectionTitle(headers.projects));
    for (const proj of projects) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({ text: sanitize(proj.name), bold: true, size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
          ],
        })
      );
      if (clean(proj.description)) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: sanitize(proj.description), size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
            ],
          })
        );
      }
    }
  }

  // ── Extra sections ──
  for (const sec of extraSections) {
    children.push(sectionTitle(sec.title));
    const items = (sec.items || []).filter((item: string) => clean(item));
    for (const item of items) {
      children.push(
        new Paragraph({
          numbering: { reference: "ats-bullets", level: 0 },
          spacing: { after: 50 },
          children: [
            new TextRun({ text: sanitize(String(item)), size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
          ],
        })
      );
    }
  }

  // ── GDPR footer ──
  const gdprText = normalizeLang(lang) === "en"
    ? "I authorize the processing of my personal data pursuant to art. 13 of Legislative Decree 196/2003 and art. 13 of EU Regulation 679/2016."
    : "Autorizzo il trattamento dei miei dati personali ai sensi dell'art. 13 del D.Lgs. 196/2003 e dell'art. 13 del Regolamento UE 679/2016.";

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "ats-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "-",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: {
              top: convertMillimetersToTwip(20),
              bottom: convertMillimetersToTwip(20),
              left: convertMillimetersToTwip(22),
              right: convertMillimetersToTwip(22),
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: sanitize(gdprText),
                    size: 16, // 8pt
                    font: FONT,
                    color: "9CA3AF",
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}
