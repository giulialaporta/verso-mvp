import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  convertMillimetersToTwip,
  SectionType,
  ImageRun,
} from "docx";
import { clean, ensureArray, MAX_SIDEBAR_SKILLS } from "./template-utils";

const ACCENT_HEX = "2563EB";
const MUTED_HEX = "666666";

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT_HEX } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 22, font: "Calibri", color: "111111" })],
  });
}

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: `• ${text}`, size: 20, font: "Calibri" })],
  });
}

function metaText(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text, size: 18, font: "Calibri", color: MUTED_HEX, italics: true })],
  });
}

export async function generateDocx(cv: Record<string, any>, lang?: string): Promise<Blob> {
  const personal = cv.personal || {};
  const summary = clean(cv.summary);
  const experience = cv.experience || [];
  const education = cv.education || [];
  const skills = cv.skills;
  const certifications = Array.isArray(cv.certifications) ? cv.certifications : [];
  const projects = Array.isArray(cv.projects) ? cv.projects : [];
  const extraSections = Array.isArray(cv.extra_sections) ? cv.extra_sections : [];

  const contactParts = [clean(personal.email), clean(personal.phone), clean(personal.location)].filter(Boolean) as string[];
  const links = [clean(personal.linkedin), clean(personal.website)].filter(Boolean) as string[];

  const allSkills = (skills
    ? Array.isArray(skills)
      ? skills.filter((sk: string) => clean(sk))
      : [...ensureArray(skills.technical), ...ensureArray(skills.soft), ...ensureArray(skills.tools)]
    : []).slice(0, MAX_SIDEBAR_SKILLS);

  const languages = skills?.languages && Array.isArray(skills.languages) ? skills.languages : [];

  const children: Paragraph[] = [];

  // Name
  children.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 60 },
    children: [new TextRun({ text: clean(personal.name) || "Nome Cognome", bold: true, size: 36, font: "Calibri" })],
  }));

  // Contact line
  if (contactParts.length > 0 || links.length > 0) {
    children.push(new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: [...contactParts, ...links].join("  ·  "), size: 18, font: "Calibri", color: MUTED_HEX })],
    }));
  }

  // Summary
  if (summary) {
    children.push(sectionTitle(lang === "en" ? "Profile" : "Profilo"));
    children.push(new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: summary, size: 20, font: "Calibri" })],
    }));
  }

  // Experience
  if (experience.length > 0) {
    children.push(sectionTitle(lang === "en" ? "Experience" : "Esperienza"));
    for (const exp of experience) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 20 },
        children: [new TextRun({ text: clean(exp.role) || clean(exp.title) || "", bold: true, size: 22, font: "Calibri" })],
      }));
      children.push(new Paragraph({
        spacing: { after: 20 },
        children: [new TextRun({ text: exp.company || "", bold: true, size: 20, font: "Calibri", color: "333333" })],
      }));
      const meta = [
        exp.start || exp.period,
        exp.end ? ` – ${exp.end}` : exp.current ? " – Attuale" : "",
        clean(exp.location) ? `  ·  ${exp.location}` : "",
      ].join("");
      if (meta.trim()) children.push(metaText(meta));
      if (clean(exp.description)) {
        children.push(new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: exp.description, size: 20, font: "Calibri" })],
        }));
      }
      const bullets = Array.isArray(exp.bullets) ? exp.bullets.filter((b: string) => clean(b)) : [];
      for (const b of bullets) {
        children.push(bulletParagraph(b));
      }
    }
  }

  // Education
  if (education.length > 0) {
    children.push(sectionTitle(lang === "en" ? "Education" : "Formazione"));
    for (const ed of education) {
      children.push(new Paragraph({
        spacing: { before: 80, after: 20 },
        children: [new TextRun({
          text: `${ed.degree}${clean(ed.field) ? ` in ${ed.field}` : ""} — ${ed.institution}`,
          bold: true, size: 20, font: "Calibri",
        })],
      }));
      const meta = [
        ed.start || ed.period,
        ed.end ? ` – ${ed.end}` : "",
        clean(ed.grade) ? `  ·  ${ed.grade}` : "",
      ].join("");
      if (meta.trim()) children.push(metaText(meta));
    }
  }

  // Skills
  if (allSkills.length > 0) {
    children.push(sectionTitle(lang === "en" ? "Skills" : "Competenze"));
    children.push(new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: allSkills.join("  ·  "), size: 20, font: "Calibri" })],
    }));
  }

  // Languages
  if (languages.length > 0) {
    children.push(sectionTitle(lang === "en" ? "Languages" : "Lingue"));
    for (const l of languages) {
      children.push(new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: `${l.language}${clean(l.level) ? ` — ${l.level}` : ""}`, size: 20, font: "Calibri" })],
      }));
    }
  }

  // Certifications
  if (certifications.length > 0) {
    children.push(sectionTitle(lang === "en" ? "Certifications" : "Certificazioni"));
    for (const cert of certifications) {
      children.push(new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri" }),
          ...(clean(cert.issuer) ? [new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Calibri" })] : []),
          ...(clean(cert.year) ? [new TextRun({ text: ` (${cert.year})`, size: 18, font: "Calibri", color: MUTED_HEX })] : []),
        ],
      }));
    }
  }

  // Projects
  if (projects.length > 0) {
    children.push(sectionTitle(lang === "en" ? "Projects" : "Progetti"));
    for (const proj of projects) {
      children.push(new Paragraph({
        spacing: { before: 80, after: 20 },
        children: [new TextRun({ text: proj.name, bold: true, size: 20, font: "Calibri" })],
      }));
      if (clean(proj.description)) {
        children.push(new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: proj.description, size: 20, font: "Calibri" })],
        }));
      }
      if (clean(proj.link)) {
        children.push(new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: proj.link, size: 18, font: "Calibri", color: ACCENT_HEX })],
        }));
      }
    }
  }

  // Extra sections
  for (const sec of extraSections) {
    children.push(sectionTitle(sec.title));
    const items = (sec.items || []).filter((item: string) => clean(item));
    for (const item of items) {
      children.push(bulletParagraph(item));
    }
  }

  const doc = new Document({
    sections: [{
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
    }],
  });

  return Packer.toBlob(doc);
}
