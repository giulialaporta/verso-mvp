import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";
import { clean, ensureArray, MAX_SIDEBAR_SKILLS, h, computeDensity, truncateBullets } from "./template-utils";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hjQ.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjQ.ttf", fontWeight: 700 },
  ],
});

Font.registerHyphenationCallback((word: string) => [word]);

const SIDEBAR_TEXT = "#1a1a1a";
const SIDEBAR_MUTED = "#666";
const LINK_COLOR = "#2563EB";
const BODY_TEXT = "#1a1a1a";
const BODY_MUTED = "#666";
const BORDER = "#E0E0E0";
const SECTION_TITLE = "#111";

const baseStyles = StyleSheet.create({
  page: { fontFamily: "Inter", flexDirection: "row" },
  sidebar: { width: "26%", paddingHorizontal: 18, paddingVertical: 32, color: SIDEBAR_TEXT, borderRightWidth: 0.5, borderRightColor: BORDER },
  main: { width: "74%", paddingHorizontal: 36, paddingVertical: 32, paddingBottom: 60, color: BODY_TEXT },
  photo: { width: 68, height: 68, borderRadius: 34, marginBottom: 16, alignSelf: "center" },
  contactItem: { fontSize: 8, color: SIDEBAR_MUTED, marginBottom: 4, lineHeight: 1.5 },
  contactLink: { fontSize: 8, color: LINK_COLOR, marginBottom: 4, lineHeight: 1.5 },
  sidebarSection: { fontSize: 8, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1, color: SIDEBAR_MUTED, borderBottomWidth: 0.5, borderBottomColor: BORDER, paddingBottom: 4, marginBottom: 8, marginTop: 18 },
  skillChip: { fontSize: 8, color: SIDEBAR_TEXT, marginBottom: 3, lineHeight: 1.5 },
  langItem: { fontSize: 8, color: SIDEBAR_TEXT, marginBottom: 3 },
  certName: { fontSize: 8, color: SIDEBAR_TEXT, fontWeight: 500 },
  certMeta: { fontSize: 7, color: SIDEBAR_MUTED, marginBottom: 5 },
  mainName: { fontSize: 24, fontWeight: 700, marginBottom: 3, letterSpacing: -0.3 },
  mainSubtitle: { fontSize: 8.5, color: BODY_MUTED, marginBottom: 16, letterSpacing: 0.5, textTransform: "uppercase" as const },
  divider: { borderBottomWidth: 0.3, borderBottomColor: BORDER },
});

export function MinimalTemplate({ cv, lang }: { cv: Record<string, any>; lang?: string }) {
  const d = computeDensity(cv);

  const personal = cv.personal || {};
  const summary = clean(cv.summary);
  const experience = cv.experience || [];
  const education = cv.education || [];
  const skills = cv.skills;
  const certifications = Array.isArray(cv.certifications) ? cv.certifications : [];
  const projects = Array.isArray(cv.projects) ? cv.projects : [];
  const extraSections = Array.isArray(cv.extra_sections) ? cv.extra_sections : [];
  const photoUrl = clean(cv.photo_url) || clean(cv.photo_base64) || clean(personal.photo_url);

  const contactParts = [clean(personal.email), clean(personal.phone), clean(personal.location)].filter(Boolean) as string[];

  const allSkills = (skills
    ? Array.isArray(skills)
      ? skills.filter((sk: string) => clean(sk))
      : [...ensureArray(skills.technical), ...ensureArray(skills.soft), ...ensureArray(skills.tools)]
    : []).slice(0, MAX_SIDEBAR_SKILLS);

  const languages = skills?.languages && Array.isArray(skills.languages) ? skills.languages : [];

  const dividerMargin = { marginVertical: d.sectionMarginTop * 0.7 };

  const ds = {
    page: { ...baseStyles.page, fontSize: d.bodyFontSize },
    sectionTitle: { fontSize: d.sectionTitleFontSize, fontWeight: 700 as const, color: SECTION_TITLE, marginBottom: d.sectionMarginBottom },
    summary: { fontSize: d.summaryFontSize, lineHeight: d.lineHeight, marginBottom: 4 },
    expBlock: { marginBottom: d.expBlockMarginBottom },
    expRole: { fontSize: d.expRoleFontSize, fontWeight: 700 as const },
    expCompany: { fontSize: d.bodyFontSize, fontWeight: 500 as const, color: BODY_TEXT, marginBottom: 1 },
    expMeta: { fontSize: Math.max(9, d.bodyFontSize - 1), color: BODY_MUTED, marginBottom: 3 },
    bullet: { fontSize: d.bulletFontSize, lineHeight: d.lineHeight - 0.1, paddingLeft: 14, marginBottom: d.bulletMarginBottom },
    eduBlock: { marginBottom: d.eduBlockMarginBottom },
    eduTitle: { fontSize: d.bodyFontSize, fontWeight: 500 as const },
    eduMeta: { fontSize: Math.max(9, d.bodyFontSize - 1), color: BODY_MUTED },
    projBlock: { marginBottom: d.eduBlockMarginBottom },
    projName: { fontSize: d.bodyFontSize, fontWeight: 500 as const },
    projDesc: { fontSize: d.bulletFontSize, lineHeight: d.lineHeight - 0.1, marginTop: 1 },
    projLink: { fontSize: Math.max(9, d.bodyFontSize - 1), color: LINK_COLOR, marginTop: 1 },
  };

  return (
    <Document>
      <Page size="A4" style={ds.page}>
        <View style={baseStyles.sidebar}>
          {photoUrl && <Image src={photoUrl} style={baseStyles.photo} />}

          <Text style={baseStyles.sidebarSection}>{h("contacts", lang)}</Text>
          {contactParts.map((c, i) => <Text key={i} style={baseStyles.contactItem}>{c}</Text>)}
          {clean(personal.linkedin) && <Text style={baseStyles.contactLink}>{personal.linkedin}</Text>}
          {clean(personal.website) && <Text style={baseStyles.contactLink}>{personal.website}</Text>}

          {allSkills.length > 0 && (
            <>
              <Text style={baseStyles.sidebarSection}>{h("skills", lang)}</Text>
              {allSkills.map((sk: string, i: number) => <Text key={i} style={baseStyles.skillChip}>• {sk}</Text>)}
            </>
          )}

          {languages.length > 0 && (
            <>
              <Text style={baseStyles.sidebarSection}>{h("languages", lang)}</Text>
              {languages.map((l: any, i: number) => (
                <Text key={i} style={baseStyles.langItem}>
                  {l.language}{clean(l.level) ? ` — ${l.level}` : ""}
                </Text>
              ))}
            </>
          )}

          {certifications.length > 0 && (
            <>
              <Text style={baseStyles.sidebarSection}>{h("certifications", lang)}</Text>
              {certifications.map((cert: any, i: number) => (
                <View key={i}>
                  <Text style={baseStyles.certName}>{cert.name}{clean(cert.issuer) ? ` — ${cert.issuer}` : ""}</Text>
                  {clean(cert.year) && <Text style={baseStyles.certMeta}>{cert.year}</Text>}
                </View>
              ))}
            </>
          )}
        </View>

        <View style={baseStyles.main}>
          <Text style={baseStyles.mainName}>{clean(personal.name) || "Nome Cognome"}</Text>
          {contactParts.length > 0 && <Text style={baseStyles.mainSubtitle}>{contactParts.join("  ·  ")}</Text>}

          {summary && (
            <>
              <View style={{ ...baseStyles.divider, ...dividerMargin }} />
              <Text style={ds.sectionTitle}>{h("profile", lang)}</Text>
              <Text style={ds.summary}>{summary}</Text>
            </>
          )}

          {experience.length > 0 && (
            <>
              <View style={{ ...baseStyles.divider, ...dividerMargin }} />
              <Text style={ds.sectionTitle}>{h("experience", lang)}</Text>
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
                      {clean(exp.location) ? ` · ${exp.location}` : ""}
                    </Text>
                    {clean(exp.description) && <Text style={ds.summary}>{exp.description}</Text>}
                    {bullets.map((b: string, j: number) => (
                      <Text key={j} style={ds.bullet}>• {b}</Text>
                    ))}
                  </View>
                );
              })}
            </>
          )}

          {education.length > 0 && (
            <>
              <View style={{ ...baseStyles.divider, ...dividerMargin }} />
              <Text style={ds.sectionTitle}>{h("education", lang)}</Text>
              {education.map((ed: any, i: number) => (
                <View key={i} style={ds.eduBlock} wrap={false}>
                  <Text style={ds.eduTitle}>
                    {ed.degree}{clean(ed.field) ? ` in ${ed.field}` : ""} — {ed.institution}
                  </Text>
                  <Text style={ds.eduMeta}>
                    {ed.start || ed.period}{ed.end ? ` – ${ed.end}` : ""}
                    {clean(ed.grade) ? ` · ${ed.grade}` : ""}
                  </Text>
                </View>
              ))}
            </>
          )}

          {projects.length > 0 && (
            <>
              <View style={{ ...baseStyles.divider, ...dividerMargin }} />
              <Text style={ds.sectionTitle}>{h("projects", lang)}</Text>
              {projects.map((proj: any, i: number) => (
                <View key={i} style={ds.projBlock} wrap={false}>
                  <Text style={ds.projName}>{proj.name}</Text>
                  {clean(proj.description) && <Text style={ds.projDesc}>{proj.description}</Text>}
                  {clean(proj.link) && <Text style={ds.projLink}>{proj.link}</Text>}
                </View>
              ))}
            </>
          )}

          {extraSections.map((sec: any, i: number) => (
            <View key={i} wrap={false}>
              <View style={{ ...baseStyles.divider, ...dividerMargin }} />
              <Text style={ds.sectionTitle}>{sec.title}</Text>
              {(sec.items || []).filter((item: string) => clean(item)).map((item: string, j: number) => (
                <Text key={j} style={ds.bullet}>• {item}</Text>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
