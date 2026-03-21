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

// ATS-compliant DOCX generator
// Rules: single column, zero tables, Calibri 11pt, standard section headers

const FONT = "Calibri";
const NAME_SIZE = 32; // 16pt in half-points
const SECTION_SIZE = 24; // 12pt
const BODY_SIZE = 22; // 11pt
const META_SIZE = 20; // 10pt
const TEXT_COLOR = "111827";
const SECTION_COLOR = "166534";
const MUTED_COLOR = "6B7280";

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 280, after: 100 },
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

function sanitize(text: string): string {
  // Remove em dash, en dash, smart quotes — ATS-safe chars only
  return text
    .replace(/\u2014/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
}

function getHeaders(lang?: string): Record<string, string> {
  if (lang === "en") {
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

export async function generateDocx(
  cv: Record<string, any>,
  lang?: string,
): Promise<Blob> {
  const h = getHeaders(lang);
  const personal = cv.personal || {};
  const experience = Array.isArray(cv.experience) ? cv.experience : [];
  const education = Array.isArray(cv.education) ? cv.education : [];
  const skills = cv.skills;
  const certifications = Array.isArray(cv.certifications) ? cv.certifications : [];
  const projects = Array.isArray(cv.projects) ? cv.projects : [];
  const extraSections = Array.isArray(cv.extra_sections) ? cv.extra_sections : [];

  const children: Paragraph[] = [];

  // --- Name ---
  const nameText = clean(personal.name) || "Nome Cognome";
  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: sanitize(nameText),
          bold: true,
          size: NAME_SIZE,
          font: FONT,
          color: TEXT_COLOR,
        }),
      ],
    })
  );

  // --- Contact line with tab stops ---
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
        spacing: { after: 200 },
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

  // --- Summary ---
  const summary = clean(cv.summary);
  if (summary) {
    children.push(sectionTitle(h.profile));
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: sanitize(summary), size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
        ],
      })
    );
  }

  // --- Experience ---
  if (experience.length > 0) {
    children.push(sectionTitle(h.experience));
    for (const exp of experience) {
      const role = clean(exp.role) || clean(exp.title) || "";
      const endStr = exp.end || (exp.current ? (lang === "en" ? "Present" : "Attuale") : "");
      const dateStr = [exp.start, endStr].filter(Boolean).join(" - ");

      // Role + date on same line
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 20 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: sanitize(role), bold: true, size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
            new TextRun({ text: "\t" + sanitize(dateStr), size: META_SIZE, font: FONT, color: MUTED_COLOR }),
          ],
        })
      );

      // Company + location
      const companyLine = [exp.company, clean(exp.location)].filter(Boolean).join(" | ");
      if (companyLine) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: sanitize(companyLine), size: BODY_SIZE, font: FONT, color: "333333" }),
            ],
          })
        );
      }

      // Description
      if (clean(exp.description)) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: sanitize(exp.description), size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
            ],
          })
        );
      }

      // Bullets using numbering (ATS-safe)
      const bullets = Array.isArray(exp.bullets) ? exp.bullets.filter((b: string) => clean(b)) : [];
      for (const b of bullets) {
        children.push(
          new Paragraph({
            numbering: { reference: "ats-bullets", level: 0 },
            spacing: { after: 30 },
            children: [
              new TextRun({ text: sanitize(String(b)), size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
            ],
          })
        );
      }
    }
  }

  // --- Education ---
  if (education.length > 0) {
    children.push(sectionTitle(h.education));
    for (const ed of education) {
      const degreeField = [ed.degree, clean(ed.field)].filter(Boolean).join(" in ");
      const period = [ed.start, ed.end].filter(Boolean).join(" - ");

      children.push(
        new Paragraph({
          spacing: { before: 80, after: 20 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: sanitize(degreeField), bold: true, size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
            ...(period ? [new TextRun({ text: "\t" + sanitize(period), size: META_SIZE, font: FONT, color: MUTED_COLOR })] : []),
          ],
        })
      );

      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: sanitize(ed.institution || ""), size: BODY_SIZE, font: FONT, color: "333333" }),
            ...(clean(ed.grade)
              ? [new TextRun({ text: " | " + sanitize(ed.grade) + (clean(ed.honors) ? " " + sanitize(ed.honors) : ""), size: META_SIZE, font: FONT, color: MUTED_COLOR })]
              : []),
          ],
        })
      );
    }
  }

  // --- Skills ---
  const allSkills = skills
    ? Array.isArray(skills)
      ? skills.filter((sk: string) => clean(sk))
      : [...ensureArray(skills.technical), ...ensureArray(skills.soft), ...ensureArray(skills.tools)]
    : [];

  if (allSkills.length > 0) {
    children.push(sectionTitle(h.skills));
    children.push(
      new Paragraph({
        spacing: { after: 80 },
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

  // --- Languages ---
  const languages = skills?.languages && Array.isArray(skills.languages) ? skills.languages : [];
  if (languages.length > 0) {
    children.push(sectionTitle(h.languages));
    const langText = languages
      .map((l: any) => l.language + (clean(l.level) ? " - " + l.level : ""))
      .join(", ");
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: sanitize(langText), size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
        ],
      })
    );
  }

  // --- Certifications ---
  if (certifications.length > 0) {
    children.push(sectionTitle(h.certifications));
    for (const cert of certifications) {
      const parts = [cert.name];
      if (clean(cert.issuer)) parts.push(cert.issuer);
      if (clean(cert.year)) parts.push(cert.year);
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: sanitize(parts.join(" | ")), size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
          ],
        })
      );
    }
  }

  // --- Projects ---
  if (projects.length > 0) {
    children.push(sectionTitle(h.projects));
    for (const proj of projects) {
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 20 },
          children: [
            new TextRun({ text: sanitize(proj.name), bold: true, size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
          ],
        })
      );
      if (clean(proj.description)) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: sanitize(proj.description), size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
            ],
          })
        );
      }
    }
  }

  // --- Extra sections ---
  for (const sec of extraSections) {
    children.push(sectionTitle(sec.title));
    const items = (sec.items || []).filter((item: string) => clean(item));
    for (const item of items) {
      children.push(
        new Paragraph({
          numbering: { reference: "ats-bullets", level: 0 },
          spacing: { after: 30 },
          children: [
            new TextRun({ text: sanitize(String(item)), size: BODY_SIZE, font: FONT, color: TEXT_COLOR }),
          ],
        })
      );
    }
  }

  const gdprText = lang === "en"
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
              left: convertMillimetersToTwip(20),
              right: convertMillimetersToTwip(20),
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
