import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
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

type HorizontalAlign = "left" | "center";

interface DocxStyle {
  accentHex: string;
  mutedHex: string;
  sectionColorHex: string;
  nameColorHex: string;
  headingFont: string;
  bodyFont: string;
  nameSize: number; // half-points
  sectionSize: number;
  bodySize: number;
  bulletSize: number;
  metaSize: number;
  sectionBorder: boolean;
  sectionUppercase: boolean;
  nameUppercase: boolean;
  nameAlignment: HorizontalAlign;
  contactAlignment: HorizontalAlign;
  sectionAlignment: HorizontalAlign;
  bulletChar: string;
  headerRule: boolean;
}

const STYLES: Record<TemplateId, DocxStyle> = {
  classico: {
    accentHex: "60A5FA",
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
    nameAlignment: "left",
    contactAlignment: "left",
    sectionAlignment: "left",
    bulletChar: "•",
    headerRule: false,
  },
  minimal: {
    accentHex: "111111",
    mutedHex: "666666",
    sectionColorHex: "111111",
    nameColorHex: "111111",
    headingFont: "Calibri",
    bodyFont: "Calibri",
    nameSize: 40,
    sectionSize: 20,
    bodySize: 20,
    bulletSize: 20,
    metaSize: 18,
    sectionBorder: false,
    sectionUppercase: false,
    nameUppercase: false,
    nameAlignment: "left",
    contactAlignment: "left",
    sectionAlignment: "left",
    bulletChar: "–",
    headerRule: false,
  },
  executive: {
    accentHex: "2563EB",
    mutedHex: "6B7280",
    sectionColorHex: "2563EB",
    nameColorHex: "111111",
    headingFont: "Calibri",
    bodyFont: "Calibri",
    nameSize: 46,
    sectionSize: 22,
    bodySize: 20,
    bulletSize: 20,
    metaSize: 18,
    sectionBorder: true,
    sectionUppercase: true,
    nameUppercase: true,
    nameAlignment: "center",
    contactAlignment: "center",
    sectionAlignment: "left",
    bulletChar: "▪",
    headerRule: true,
  },
  moderno: {
    accentHex: "38BDF8",
    mutedHex: "64748B",
    sectionColorHex: "38BDF8",
    nameColorHex: "38BDF8",
    headingFont: "Calibri",
    bodyFont: "Calibri",
    nameSize: 38,
    sectionSize: 22,
    bodySize: 20,
    bulletSize: 20,
    metaSize: 18,
    sectionBorder: true,
    sectionUppercase: true,
    nameUppercase: false,
    nameAlignment: "left",
    contactAlignment: "left",
    sectionAlignment: "left",
    bulletChar: "▸",
    headerRule: true,
  },
};

function getStyle(templateId?: TemplateId): DocxStyle {
  return STYLES[templateId ?? "classico"];
}

function toAlignment(align: HorizontalAlign) {
  return align === "center" ? AlignmentType.CENTER : AlignmentType.LEFT;
}

function sectionTitle(text: string, s: DocxStyle): Paragraph {
  const displayText = s.sectionUppercase ? text.toUpperCase() : text;
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: toAlignment(s.sectionAlignment),
    spacing: { before: 280, after: 120 },
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

function bulletParagraph(text: string, s: DocxStyle): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: `${s.bulletChar} ${text}`, size: s.bulletSize, font: s.bodyFont })],
  });
}

function metaText(text: string, s: DocxStyle): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text, size: s.metaSize, font: s.bodyFont, color: s.mutedHex, italics: true })],
  });
}

export async function generateDocx(
  cv: Record<string, any>,
  lang?: string,
  templateId?: TemplateId
): Promise<Blob> {
  const s = getStyle(templateId);
  const d = computeDensity(cv);

  const personal = cv.personal || {};
  const summary = truncateSummary(clean(cv.summary), d);
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

  const nameText = clean(personal.name) || "Nome Cognome";
  children.push(
    new Paragraph({
      alignment: toAlignment(s.nameAlignment),
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

  if (contactParts.length > 0 || links.length > 0) {
    children.push(
      new Paragraph({
        alignment: toAlignment(s.contactAlignment),
        spacing: { after: 200 },
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

  if (s.headerRule) {
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: s.accentHex },
        },
      })
    );
  }

  if (summary) {
    children.push(sectionTitle(h("profile", lang), s));
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: summary, size: s.bodySize, font: s.bodyFont })],
      })
    );
  }

  if (experience.length > 0) {
    children.push(sectionTitle(h("experience", lang), s));
    for (let i = 0; i < experience.length; i++) {
      const exp = experience[i];
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 20 },
          children: [
            new TextRun({
              text: clean(exp.role) || clean(exp.title) || "",
              bold: true,
              size: s.sectionSize,
              font: s.headingFont,
            }),
          ],
        })
      );
      children.push(
        new Paragraph({
          spacing: { after: 20 },
          children: [
            new TextRun({ text: exp.company || "", bold: true, size: s.bodySize, font: s.bodyFont, color: "333333" }),
          ],
        })
      );
      const meta = [
        exp.start || exp.period,
        exp.end ? ` – ${exp.end}` : exp.current ? " – Attuale" : "",
        clean(exp.location) ? `  ·  ${exp.location}` : "",
      ].join("");
      if (meta.trim()) children.push(metaText(meta, s));
      if (clean(exp.description)) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: exp.description, size: s.bodySize, font: s.bodyFont })],
          })
        );
      }
      const rawBullets = Array.isArray(exp.bullets) ? exp.bullets.filter((b: string) => clean(b)) : [];
      const bullets = truncateBullets(rawBullets, i, d);
      for (const b of bullets) {
        children.push(bulletParagraph(b, s));
      }
    }
  }

  if (education.length > 0) {
    children.push(sectionTitle(h("education", lang), s));
    for (const ed of education) {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 20 },
          children: [
            new TextRun({
              text: `${ed.degree}${clean(ed.field) ? ` in ${ed.field}` : ""} — ${ed.institution}`,
              bold: true,
              size: s.bodySize,
              font: s.bodyFont,
            }),
          ],
        })
      );
      const meta = [
        ed.start || ed.period,
        ed.end ? ` – ${ed.end}` : "",
        clean(ed.grade) ? `  ·  ${ed.grade}` : "",
      ].join("");
      if (meta.trim()) children.push(metaText(meta, s));
    }
  }

  if (allSkills.length > 0) {
    children.push(sectionTitle(h("skills", lang), s));
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: allSkills.join("  ·  "), size: s.bodySize, font: s.bodyFont })],
      })
    );
  }

  if (languages.length > 0) {
    children.push(sectionTitle(h("languages", lang), s));
    for (const l of languages) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: `${l.language}${clean(l.level) ? ` — ${l.level}` : ""}`, size: s.bodySize, font: s.bodyFont })],
        })
      );
    }
  }

  if (certifications.length > 0) {
    children.push(sectionTitle(h("certifications", lang), s));
    for (const cert of certifications) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: cert.name, bold: true, size: s.bodySize, font: s.bodyFont }),
            ...(clean(cert.issuer)
              ? [new TextRun({ text: ` — ${cert.issuer}`, size: s.bodySize, font: s.bodyFont })]
              : []),
            ...(clean(cert.year)
              ? [new TextRun({ text: ` (${cert.year})`, size: s.metaSize, font: s.bodyFont, color: s.mutedHex })]
              : []),
          ],
        })
      );
    }
  }

  if (projects.length > 0) {
    children.push(sectionTitle(h("projects", lang), s));
    for (const proj of projects) {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 20 },
          children: [new TextRun({ text: proj.name, bold: true, size: s.bodySize, font: s.bodyFont })],
        })
      );
      if (clean(proj.description)) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: proj.description, size: s.bodySize, font: s.bodyFont })],
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

  for (const sec of extraSections) {
    children.push(sectionTitle(sec.title, s));
    const items = (sec.items || []).filter((item: string) => clean(item));
    for (const item of items) {
      children.push(bulletParagraph(item, s));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertMillimetersToTwip(25),
              bottom: convertMillimetersToTwip(25),
              left: convertMillimetersToTwip(20),
              right: convertMillimetersToTwip(20),
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}
