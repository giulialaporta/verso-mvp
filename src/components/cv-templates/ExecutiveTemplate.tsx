import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";
import { clean, ensureArray, MAX_SIDEBAR_SKILLS, h, computeDensity, truncateBullets } from "./template-utils";

Font.register({
  family: "DM Sans",
  fonts: [
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-400-normal.ttf", fontWeight: 400 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-500-normal.ttf", fontWeight: 500 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-700-normal.ttf", fontWeight: 700 },
  ],
});

Font.registerHyphenationCallback((word: string) => [word]);

const ACCENT = "#2563EB";
const ACCENT_LIGHT = "#DBEAFE";
const BODY_TEXT = "#111827";
const BODY_MUTED = "#6B7280";
const BORDER = "#E5E7EB";

const baseStyles = StyleSheet.create({
  page: { fontFamily: "DM Sans", paddingHorizontal: 48, paddingVertical: 44, paddingBottom: 56, color: BODY_TEXT },
  header: { marginBottom: 20 },
  name: { fontSize: 26, fontWeight: 700, letterSpacing: 0.3, marginBottom: 3 },
  title: { fontSize: 11, fontWeight: 500, color: ACCENT, marginBottom: 8 },
  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 6 },
  contactItem: { fontSize: 8.5, color: BODY_MUTED, lineHeight: 1.4 },
  contactSep: { fontSize: 8.5, color: BORDER, marginHorizontal: 4 },
  accentLine: { height: 2.5, backgroundColor: ACCENT, width: 48, marginTop: 4 },
  sectionAccent: { height: 2, backgroundColor: ACCENT, width: 32 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 2 },
  skillChip: { fontSize: 8, color: ACCENT, backgroundColor: ACCENT_LIGHT, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  twoCol: { flexDirection: "row", gap: 24, marginTop: 2 },
  colHalf: { flex: 1 },
  photo: { width: 56, height: 56, borderRadius: 28 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerText: { flex: 1 },
});

export function ExecutiveTemplate({ cv, lang }: { cv: Record<string, any>; lang?: string }) {
  const d = computeDensity(cv);

  const personal = cv.personal || {};
  const summary = clean(cv.summary);
  const experience = cv.experience || [];
  const education = cv.education || [];
  const skills = cv.skills;
  const certifications = Array.isArray(cv.certifications) ? cv.certifications : [];
  const projects = Array.isArray(cv.projects) ? cv.projects : [];
  const extraSections = Array.isArray(cv.extra_sections) ? cv.extra_sections : [];
  const photoUrl = clean(cv.photo_url) || clean(personal.photo_url);

  const contactParts = [clean(personal.email), clean(personal.phone), clean(personal.location)].filter(Boolean) as string[];
  const links = [clean(personal.linkedin), clean(personal.website)].filter(Boolean) as string[];

  const allSkills = (skills
    ? Array.isArray(skills)
      ? skills.filter((sk: string) => clean(sk))
      : [...ensureArray(skills.technical), ...ensureArray(skills.soft), ...ensureArray(skills.tools)]
    : []).slice(0, MAX_SIDEBAR_SKILLS);

  const languages = skills?.languages && Array.isArray(skills.languages) ? skills.languages : [];

  const ds = {
    page: { ...baseStyles.page, fontSize: d.bodyFontSize },
    sectionTitle: { fontSize: d.sectionTitleFontSize + 0.5, fontWeight: 700 as const, textTransform: "uppercase" as const, letterSpacing: 1.5, color: BODY_TEXT, marginBottom: 4, marginTop: d.sectionMarginTop + 4 },
    sectionAccent: { ...baseStyles.sectionAccent, marginBottom: d.sectionMarginBottom },
    summary: { fontSize: d.summaryFontSize, lineHeight: d.lineHeight, color: BODY_TEXT },
    expBlock: { marginBottom: d.expBlockMarginBottom + 2 },
    expRole: { fontSize: d.expRoleFontSize + 0.5, fontWeight: 700 as const },
    expCompany: { fontSize: d.bodyFontSize, fontWeight: 500 as const, color: BODY_TEXT },
    expMeta: { fontSize: Math.max(9, d.bodyFontSize - 1), color: BODY_MUTED, marginBottom: 4, marginTop: 1 },
    bullet: { fontSize: d.bulletFontSize, lineHeight: d.lineHeight - 0.05, paddingLeft: 14, marginBottom: d.bulletMarginBottom },
    eduBlock: { marginBottom: d.eduBlockMarginBottom },
    eduTitle: { fontSize: d.bodyFontSize, fontWeight: 700 as const },
    eduInstitution: { fontSize: d.bulletFontSize, fontWeight: 500 as const, color: BODY_TEXT },
    eduMeta: { fontSize: Math.max(9, d.bodyFontSize - 1), color: BODY_MUTED, marginTop: 1 },
    langItem: { fontSize: Math.max(9, d.bodyFontSize - 1), color: BODY_TEXT, marginBottom: 3 },
    certName: { fontSize: Math.max(9, d.bodyFontSize - 1), fontWeight: 500 as const, color: BODY_TEXT },
    certMeta: { fontSize: Math.max(9, d.bodyFontSize - 2), color: BODY_MUTED, marginBottom: 5 },
    projBlock: { marginBottom: d.eduBlockMarginBottom },
    projName: { fontSize: d.bodyFontSize, fontWeight: 500 as const },
    projDesc: { fontSize: d.bulletFontSize, lineHeight: d.lineHeight - 0.1, marginTop: 1 },
    projLink: { fontSize: Math.max(9, d.bodyFontSize - 1), color: ACCENT, marginTop: 1 },
  };

  return (
    <Document>
      <Page size="A4" style={ds.page}>
        {/* Header */}
        <View style={baseStyles.header}>
          <View style={baseStyles.headerRow}>
            <View style={baseStyles.headerText}>
              <Text style={baseStyles.name}>{clean(personal.name) || "Nome Cognome"}</Text>
              {clean(personal.title) && <Text style={baseStyles.title}>{personal.title}</Text>}
              <View style={baseStyles.contactRow}>
                {[...contactParts, ...links].map((c, i, arr) => (
                  <View key={i} style={{ flexDirection: "row" as const }}>
                    <Text style={baseStyles.contactItem}>{c}</Text>
                    {i < arr.length - 1 && <Text style={baseStyles.contactSep}>·</Text>}
                  </View>
                ))}
              </View>
            </View>
            {photoUrl && <Image src={photoUrl} style={baseStyles.photo} />}
          </View>
          <View style={baseStyles.accentLine} />
        </View>

        {/* Profile */}
        {summary && (
          <View>
            <Text style={ds.sectionTitle}>{h("profile", lang)}</Text>
            <View style={ds.sectionAccent} />
            <Text style={ds.summary}>{summary}</Text>
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View>
            <Text style={ds.sectionTitle}>{h("experience", lang)}</Text>
            <View style={ds.sectionAccent} />
            {experience.map((exp: any, i: number) => {
              const bullets = truncateBullets(
                (Array.isArray(exp.bullets) ? exp.bullets : []).filter((b: string) => clean(b)),
                i, d
              );
              return (
                <View key={i} style={ds.expBlock} wrap={false}>
                  <Text style={ds.expRole}>{clean(exp.role) || clean(exp.title)}</Text>
                  <Text style={ds.expCompany}>{exp.company}</Text>
                  <Text style={ds.expMeta}>
                    {exp.start || exp.period}
                    {exp.end ? ` – ${exp.end}` : exp.current ? " – Attuale" : ""}
                    {clean(exp.location) ? `  ·  ${exp.location}` : ""}
                  </Text>
                  {clean(exp.description) && <Text style={ds.summary}>{exp.description}</Text>}
                  {bullets.map((b: string, j: number) => (
                    <Text key={j} style={ds.bullet}>• {b}</Text>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View>
            <Text style={ds.sectionTitle}>{h("education", lang)}</Text>
            <View style={ds.sectionAccent} />
            {education.map((ed: any, i: number) => (
              <View key={i} style={ds.eduBlock} wrap={false}>
                <Text style={ds.eduTitle}>
                  {ed.degree}{clean(ed.field) ? ` in ${ed.field}` : ""}
                </Text>
                <Text style={ds.eduInstitution}>{ed.institution}</Text>
                <Text style={ds.eduMeta}>
                  {ed.start || ed.period}{ed.end ? ` – ${ed.end}` : ""}
                  {clean(ed.grade) ? `  ·  ${ed.grade}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills & Languages side by side */}
        {(allSkills.length > 0 || languages.length > 0) && (
          <View style={baseStyles.twoCol} wrap={false}>
            {allSkills.length > 0 && (
              <View style={baseStyles.colHalf}>
                <Text style={ds.sectionTitle}>{h("skills", lang)}</Text>
                <View style={ds.sectionAccent} />
                <View style={baseStyles.skillsRow}>
                  {allSkills.map((sk: string, i: number) => (
                    <Text key={i} style={baseStyles.skillChip}>{sk}</Text>
                  ))}
                </View>
              </View>
            )}
            {languages.length > 0 && (
              <View style={baseStyles.colHalf}>
                <Text style={ds.sectionTitle}>{h("languages", lang)}</Text>
                <View style={ds.sectionAccent} />
                {languages.map((l: any, i: number) => (
                  <Text key={i} style={ds.langItem}>
                    {l.language}{clean(l.level) ? ` — ${l.level}` : ""}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View>
            <Text style={ds.sectionTitle}>{h("certifications", lang)}</Text>
            <View style={ds.sectionAccent} />
            {certifications.map((cert: any, i: number) => (
              <View key={i} wrap={false}>
                <Text style={ds.certName}>{cert.name}{clean(cert.issuer) ? ` — ${cert.issuer}` : ""}</Text>
                {clean(cert.year) && <Text style={ds.certMeta}>{cert.year}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View>
            <Text style={ds.sectionTitle}>{h("projects", lang)}</Text>
            <View style={ds.sectionAccent} />
            {projects.map((proj: any, i: number) => (
              <View key={i} style={ds.projBlock} wrap={false}>
                <Text style={ds.projName}>{proj.name}</Text>
                {clean(proj.description) && <Text style={ds.projDesc}>{proj.description}</Text>}
                {clean(proj.link) && <Text style={ds.projLink}>{proj.link}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Extra sections */}
        {extraSections.map((sec: any, i: number) => (
          <View key={i} wrap={false}>
            <Text style={ds.sectionTitle}>{sec.title}</Text>
            <View style={ds.sectionAccent} />
            {(sec.items || []).filter((item: string) => clean(item)).map((item: string, j: number) => (
              <Text key={j} style={ds.bullet}>• {item}</Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
