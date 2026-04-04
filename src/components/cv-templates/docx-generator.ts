import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  TabStopType,
  TabStopPosition,
  LevelFormat,
  convertMillimetersToTwip,
} from "docx";
import {
  clean,
  ensureArray,
  MAX_SIDEBAR_SKILLS,
  computeDensity,
  truncateSummary,
  limitExperiences,
  truncateBullets,
  h,
} from "./template-utils";
import type { TemplateId } from "./index";

function sanitize(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/\u2014/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
}

function normalizeDate(d: string | undefined | null): string {
  if (!d) return "";
  const s = String(d).trim();
  // MM/YYYY already ok
  if (/^\d{2}\/\d{4}$/.test(s)) return s;
  // ISO: 2020-06
  const isoMatch = s.match(/^(\d{4})-(\d{2})/);
  if (isoMatch) return `${isoMatch[2]}/${isoMatch[1]}`;
  // Dot format: 01.2018
  const dotMatch = s.match(/^(\d{2})\.(\d{4})$/);
  if (dotMatch) return `${dotMatch[1]}/${dotMatch[2]}`;
  // Month name: Gen 2020, January 2020
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
  // Year only
  if (/^\d{4}$/.test(s)) return s;
  return sanitize(s);
}

interface DocxStyle {
  accentHex: string;
  mutedHex: string;
  sectionColorHex: string;
  nameColorHex: string;
  headingFont: string;
  bodyFont: string;
  nameSize: number;
  sectionSize: number;
  bodySize: number;
  bulletSize: number;
  metaSize: number;
  sectionBorder: boolean;
  sectionUppercase: boolean;
  nameUppercase: boolean;
}

const VERSO_STYLE: DocxStyle = {
  accentHex: "111111",
  mutedHex: "555555",
  sectionColorHex: "111111",
  nameColorHex: "111111",
  headingFont: "Calibri",
  bodyFont: "Calibri",
  nameSize: 36,
  sectionSize: 22,
  bodySize: 20,
  bulletSize: 20,
  metaSize: 18,
  sectionBorder: true,
  sectionUppercase: true,
  nameUppercase: false,
};

function getStyle(_templateId?: TemplateId): DocxStyle {
  return VERSO_STYLE;
}

// ─── Paragraph builders ─────────────────────────────────

function sectionTitle(text: string, s: DocxStyle): Paragraph {
  const displayText = s.sectionUppercase ? text.toUpperCase() : text;
  return new Paragraph({
    spacing: { before: 240, after: 60 },
    border: s.sectionBorder
      ? { bottom: { style: BorderStyle.SINGLE, size: 2, color: s.accentHex } }
      : undefined,
    children: [
      new TextRun({
        text: displayText,
        bold: true,
        size: s.sectionSize,
        font: s.headingFont,
        color: s.sectionColorHex,
      }),
    ],
  });
}

/** Role line with date right-aligned via tab stop */
function roleWithDate(role: string, dateRange: string, s: DocxStyle): Paragraph {
  const children: TextRun[] = [
    new TextRun({ text: role, bold: true, size: s.sectionSize, font: s.headingFont }),
  ];
  if (dateRange) {
    children.push(
      new TextRun({ text: "\t", size: s.metaSize, font: s.bodyFont }),
      new TextRun({ text: dateRange, size: s.metaSize, font: s.bodyFont, color: s.mutedHex, italics: true }),
    );
  }
  return new Paragraph({
    spacing: { before: 160, after: 0 },
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    children,
  });
}

/** Company · Location line (muted, italic) */
function companyLine(company: string, location: string | null, s: DocxStyle): Paragraph {
  const text = location ? `${company}  ·  ${location}` : company;
  return new Paragraph({
    spacing: { after: 20 },
    children: [
      new TextRun({ text: sanitize(text), size: s.bodySize, font: s.bodyFont, color: s.mutedHex, italics: true }),
    ],
  });
}

/** Degree line with date right-aligned */
function degreeWithDate(degree: string, dateRange: string, s: DocxStyle): Paragraph {
  const children: TextRun[] = [
    new TextRun({ text: degree, bold: true, size: s.bodySize, font: s.bodyFont }),
  ];
  if (dateRange) {
    children.push(
      new TextRun({ text: "\t", size: s.metaSize, font: s.bodyFont }),
      new TextRun({ text: dateRange, size: s.metaSize, font: s.bodyFont, color: s.mutedHex, italics: true }),
    );
  }
  return new Paragraph({
    spacing: { before: 80, after: 0 },
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    children,
  });
}

function buildDateRange(start: string, end: string, current?: boolean): string {
  if (!start && !end) return "";
  const s = normalizeDate(start);
  const e = current ? "Attuale" : normalizeDate(end);
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

export async function generateDocx(
  cv: Record<string, any>,
  lang?: string,
  templateId?: TemplateId
): Promise<Blob> {
  const s = getStyle(templateId);
  const d = computeDensity(cv);

  const personal = cv.personal || {};
  const summary = sanitize(truncateSummary(clean(cv.summary), d) ?? "");
  const [experience] = limitExperiences(cv.experience || [], d) as [any[], number];
  const education = cv.education || [];
  const skills = cv.skills;
  const certifications = Array.isArray(cv.certifications) ? cv.certifications : [];
  const projects = Array.isArray(cv.projects) ? cv.projects : [];
  const extraSections = Array.isArray(cv.extra_sections) ? cv.extra_sections : [];

  const contactParts = [clean(personal.email), clean(personal.phone), clean(personal.location)].filter(Boolean) as string[];
  const links = [clean(personal.linkedin), clean(personal.website)].filter(Boolean) as string[];

  const allSkills = (
    skills
      ? Array.isArray(skills)
        ? skills.filter((sk: string) => clean(sk))
        : [...ensureArray(skills.technical), ...ensureArray(skills.soft), ...ensureArray(skills.tools)]
      : []
  ).slice(0, MAX_SIDEBAR_SKILLS);

  const languages = skills?.languages && Array.isArray(skills.languages) ? skills.languages : [];

  const children: Paragraph[] = [];

  // ─── Name ─────────────────────────────
  const nameText = sanitize(clean(personal.name) || "Nome Cognome");
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: s.nameUppercase ? nameText.toUpperCase() : nameText,
          bold: true,
          size: s.nameSize,
          font: s.headingFont,
          color: s.nameColorHex,
        }),
      ],
    })
  );

  // ─── Contact line ─────────────────────
  if (contactParts.length > 0 || links.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: [...contactParts, ...links].join("  ·  "),
            size: s.metaSize,
            font: s.bodyFont,
            color: s.mutedHex,
          }),
        ],
      })
    );
  }

  // ─── Profile / Summary ────────────────
  if (summary) {
    children.push(sectionTitle(h("profile", lang), s));
    const paragraphs = summary.split(/\n\n+/).filter(Boolean);
    for (const para of paragraphs) {
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: para.trim(), size: s.bodySize, font: s.bodyFont })],
        })
      );
    }
  }

  // ─── Experience ───────────────────────
  if (experience.length > 0) {
    children.push(sectionTitle(h("experience", lang), s));
    for (let i = 0; i < experience.length; i++) {
      const exp = experience[i];
      const roleText = sanitize(clean(exp.role) || clean(exp.title) || "");
      const companyText = sanitize(clean(exp.company) || "");
      const locationText = clean(exp.location) ? sanitize(exp.location) : null;
      const dateRange = buildDateRange(exp.start || exp.period, exp.end, exp.current);

      // Line 1: Role [TAB] Date range
      if (roleText) {
        children.push(roleWithDate(roleText, dateRange, s));
      }
      // Line 2: Company · Location
      if (companyText) {
        children.push(companyLine(companyText, locationText, s));
      }
      // Description paragraph
      if (clean(exp.description)) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: sanitize(exp.description), size: s.bodySize, font: s.bodyFont })],
          })
        );
      }
      // Bullets (native Word numbering)
      const rawBullets = Array.isArray(exp.bullets) ? exp.bullets.filter((b: string) => clean(b)) : [];
      const bullets = truncateBullets(rawBullets, i, d);
      for (const b of bullets) {
        children.push(
          new Paragraph({
            numbering: { reference: "cv-bullets", level: 0 },
            spacing: { after: 40 },
            children: [new TextRun({ text: sanitize(b), size: s.bulletSize, font: s.bodyFont })],
          })
        );
      }
    }
  }

  // ─── Education ────────────────────────
  if (education.length > 0) {
    children.push(sectionTitle(h("education", lang), s));
    for (const ed of education) {
      const degree = clean(ed.degree);
      const field = clean(ed.field);
      const institution = clean(ed.institution);

      // Build degree title
      const titleParts: string[] = [];
      if (degree && field) {
        titleParts.push(degree.toLowerCase().includes(field.toLowerCase()) ? degree : `${degree}: ${field}`);
      } else if (degree) {
        titleParts.push(degree);
      } else if (field) {
        titleParts.push(field);
      }
      const degreeTitle = sanitize(titleParts.length > 0
        ? (institution ? `${titleParts.join("")} - ${institution}` : titleParts.join(""))
        : (institution || ""));

      // Date range for education
      const startDate = normalizeDate(clean(ed.start) || clean(ed.period));
      const endDate = normalizeDate(clean(ed.end));
      const eduDateRange = startDate ? (endDate ? `${startDate} – ${endDate}` : startDate) : endDate || "";

      // Line 1: Degree [TAB] Date range
      if (degreeTitle) {
        children.push(degreeWithDate(degreeTitle, eduDateRange, s));
      }

      // Line 2: Grade + honors (if any)
      const grade = sanitize(clean(ed.grade));
      const honors = sanitize(clean(ed.honors));
      const gradeLine = [grade, honors].filter(Boolean).join(" ");
      if (gradeLine) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: gradeLine, size: s.metaSize, font: s.bodyFont, color: s.mutedHex, italics: true })],
          })
        );
      }
    }
  }

  // ─── Skills ───────────────────────────
  if (allSkills.length > 0) {
    children.push(sectionTitle(h("skills", lang), s));
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: allSkills.join("  ·  "), size: s.bodySize, font: s.bodyFont })],
      })
    );
  }

  // ─── Languages ────────────────────────
  if (languages.length > 0) {
    children.push(sectionTitle(h("languages", lang), s));
    for (const l of languages) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: sanitize(`${l.language}${clean(l.level) ? ` - ${l.level}` : ""}`), size: s.bodySize, font: s.bodyFont })],
        })
      );
    }
  }

  // ─── Certifications ───────────────────
  if (certifications.length > 0) {
    children.push(sectionTitle(h("certifications", lang), s));
    for (const cert of certifications) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: sanitize(cert.name), bold: true, size: s.bodySize, font: s.bodyFont }),
            ...(clean(cert.issuer)
              ? [new TextRun({ text: ` - ${sanitize(cert.issuer)}`, size: s.bodySize, font: s.bodyFont })]
              : []),
            ...(clean(cert.year)
              ? [new TextRun({ text: ` (${cert.year})`, size: s.metaSize, font: s.bodyFont, color: s.mutedHex })]
              : []),
          ],
        })
      );
    }
  }

  // ─── Projects ─────────────────────────
  if (projects.length > 0) {
    children.push(sectionTitle(h("projects", lang), s));
    for (const proj of projects) {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 20 },
          children: [new TextRun({ text: sanitize(proj.name), bold: true, size: s.bodySize, font: s.bodyFont })],
        })
      );
      if (clean(proj.description)) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: sanitize(proj.description), size: s.bodySize, font: s.bodyFont })],
          })
        );
      }
      if (clean(proj.link)) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: proj.link, size: s.metaSize, font: s.bodyFont, color: s.accentHex })],
          })
        );
      }
    }
  }

  // ─── Extra sections ───────────────────
  for (const sec of extraSections) {
    const secTitle = clean(sec.title);
    if (!secTitle) continue;
    children.push(sectionTitle(secTitle, s));
    const items = (sec.items || []).filter((item: string) => clean(item));
    const isHobbySection = /hobby|hobbies|interest|interests|interessi/i.test(secTitle);
    if (isHobbySection && items.length > 0) {
      children.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: items.join(", "), size: s.bodySize, font: s.bodyFont })],
        })
      );
    } else {
      for (const item of items) {
        children.push(
          new Paragraph({
            numbering: { reference: "cv-bullets", level: 0 },
            spacing: { after: 40 },
            children: [new TextRun({ text: sanitize(item), size: s.bulletSize, font: s.bodyFont })],
          })
        );
      }
    }
  }

  // ─── Build document ───────────────────
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "cv-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 360, hanging: 180 },
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
            margin: {
              top: convertMillimetersToTwip(15),
              bottom: convertMillimetersToTwip(15),
              left: convertMillimetersToTwip(18),
              right: convertMillimetersToTwip(18),
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}
