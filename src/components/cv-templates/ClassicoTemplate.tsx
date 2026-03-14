import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";
import { clean, ensureArray, MAX_SIDEBAR_SKILLS, h } from "./template-utils";

Font.register({
  family: "DM Sans",
  fonts: [
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-400-normal.ttf", fontWeight: 400 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-500-normal.ttf", fontWeight: 500 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-700-normal.ttf", fontWeight: 700 },
  ],
});

const SIDEBAR_BG = "#1C1F26";
const SIDEBAR_TEXT = "#F2F3F7";
const SIDEBAR_MUTED = "#8B8FA8";
const SIDEBAR_ACCENT = "#60A5FA";
const SIDEBAR_BORDER = "#333842";
const BODY_TEXT = "#1a1a1a";
const BODY_MUTED = "#555";

const s = StyleSheet.create({
  page: { fontFamily: "DM Sans", fontSize: 10, flexDirection: "row" },
  sidebar: { width: "28%", backgroundColor: SIDEBAR_BG, paddingHorizontal: 20, paddingVertical: 32, color: SIDEBAR_TEXT },
  main: { width: "72%", paddingHorizontal: 36, paddingVertical: 32, paddingBottom: 60, color: BODY_TEXT },
  photo: { width: 72, height: 72, borderRadius: 36, marginBottom: 16, alignSelf: "center" },
  contactItem: { fontSize: 8, color: SIDEBAR_MUTED, marginBottom: 4, lineHeight: 1.5 },
  contactLink: { fontSize: 8, color: SIDEBAR_ACCENT, marginBottom: 4, lineHeight: 1.5 },
  sidebarSection: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: SIDEBAR_MUTED, borderBottomWidth: 0.5, borderBottomColor: SIDEBAR_BORDER, paddingBottom: 4, marginBottom: 8, marginTop: 18 },
  skillChip: { fontSize: 8, color: SIDEBAR_TEXT, marginBottom: 3, lineHeight: 1.5 },
  langItem: { fontSize: 8, color: SIDEBAR_TEXT, marginBottom: 3 },
  certName: { fontSize: 8, color: SIDEBAR_TEXT, fontWeight: 500 },
  certMeta: { fontSize: 7, color: SIDEBAR_MUTED, marginBottom: 5 },
  mainName: { fontSize: 22, fontWeight: 700, marginBottom: 2, letterSpacing: 0.5 },
  mainSubtitle: { fontSize: 9, color: BODY_MUTED, marginBottom: 16, letterSpacing: 0.3 },
  sectionTitle: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: BODY_TEXT, borderBottomWidth: 2, borderBottomColor: SIDEBAR_ACCENT, paddingBottom: 4, marginBottom: 10, marginTop: 18 },
  summary: { fontSize: 10, lineHeight: 1.6, marginBottom: 4 },
  expBlock: { marginBottom: 12 },
  expRole: { fontSize: 11, fontWeight: 700 },
  expCompany: { fontSize: 10, fontWeight: 500, color: BODY_TEXT, marginBottom: 1 },
  expMeta: { fontSize: 9, color: BODY_MUTED, marginBottom: 3 },
  bullet: { fontSize: 9.5, lineHeight: 1.5, paddingLeft: 14, marginBottom: 2.5 },
  eduBlock: { marginBottom: 8 },
  eduTitle: { fontSize: 10, fontWeight: 500 },
  eduMeta: { fontSize: 9, color: BODY_MUTED },
  projBlock: { marginBottom: 10 },
  projName: { fontSize: 10, fontWeight: 500 },
  projDesc: { fontSize: 9.5, lineHeight: 1.5, marginTop: 1 },
  projLink: { fontSize: 9, color: SIDEBAR_ACCENT, marginTop: 1 },
});

export function ClassicoTemplate({ cv, lang }: { cv: Record<string, any>; lang?: string }) {
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

  const allSkills = (skills
    ? Array.isArray(skills)
      ? skills.filter((sk: string) => clean(sk))
      : [...ensureArray(skills.technical), ...ensureArray(skills.soft), ...ensureArray(skills.tools)]
    : []).slice(0, MAX_SIDEBAR_SKILLS);

  const languages = skills?.languages && Array.isArray(skills.languages) ? skills.languages : [];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.sidebar}>
          {photoUrl && <Image src={photoUrl} style={s.photo} />}

          <Text style={s.sidebarSection}>{h("contacts", lang)}</Text>
          {contactParts.map((c, i) => <Text key={i} style={s.contactItem}>{c}</Text>)}
          {clean(personal.linkedin) && <Text style={s.contactLink}>{personal.linkedin}</Text>}
          {clean(personal.website) && <Text style={s.contactLink}>{personal.website}</Text>}

          {allSkills.length > 0 && (
            <>
              <Text style={s.sidebarSection}>{h("skills", lang)}</Text>
              {allSkills.map((sk: string, i: number) => <Text key={i} style={s.skillChip}>• {sk}</Text>)}
            </>
          )}

          {languages.length > 0 && (
            <>
              <Text style={s.sidebarSection}>{h("languages", lang)}</Text>
              {languages.map((l: any, i: number) => (
                <Text key={i} style={s.langItem}>
                  {l.language}{clean(l.level) ? ` — ${l.level}` : ""}
                </Text>
              ))}
            </>
          )}

          {certifications.length > 0 && (
            <>
              <Text style={s.sidebarSection}>{h("certifications", lang)}</Text>
              {certifications.map((cert: any, i: number) => (
                <View key={i} wrap={false}>
                  <Text style={s.certName}>{cert.name}{clean(cert.issuer) ? ` — ${cert.issuer}` : ""}</Text>
                  {clean(cert.year) && <Text style={s.certMeta}>{cert.year}</Text>}
                </View>
              ))}
            </>
          )}
        </View>

        <View style={s.main}>
          <Text style={s.mainName}>{clean(personal.name) || "Nome Cognome"}</Text>
          {contactParts.length > 0 && <Text style={s.mainSubtitle}>{contactParts.join(" · ")}</Text>}

          {summary && (
            <>
              <Text style={s.sectionTitle}>{h("profile", lang)}</Text>
              <Text style={s.summary}>{summary}</Text>
            </>
          )}

          {experience.length > 0 && (
            <>
              <Text style={s.sectionTitle}>{h("experience", lang)}</Text>
              {experience.map((exp: any, i: number) => (
                <View key={i} style={s.expBlock} wrap={false}>
                  <Text style={s.expRole}>{clean(exp.role) || clean(exp.title)}</Text>
                  <Text style={s.expCompany}>{exp.company}</Text>
                  <Text style={s.expMeta}>
                    {exp.start || exp.period}
                    {exp.end ? ` – ${exp.end}` : exp.current ? " – Attuale" : ""}
                    {clean(exp.location) ? ` · ${exp.location}` : ""}
                  </Text>
                  {clean(exp.description) && <Text style={s.summary}>{exp.description}</Text>}
                  {Array.isArray(exp.bullets) &&
                    exp.bullets.filter((b: string) => clean(b)).map((b: string, j: number) => (
                      <Text key={j} style={s.bullet}>• {b}</Text>
                    ))}
                </View>
              ))}
            </>
          )}

          {education.length > 0 && (
            <>
              <Text style={s.sectionTitle}>{h("education", lang)}</Text>
              {education.map((ed: any, i: number) => (
                <View key={i} style={s.eduBlock} wrap={false}>
                  <Text style={s.eduTitle}>
                    {ed.degree}{clean(ed.field) ? ` in ${ed.field}` : ""} — {ed.institution}
                  </Text>
                  <Text style={s.eduMeta}>
                    {ed.start || ed.period}
                    {ed.end ? ` – ${ed.end}` : ""}
                    {clean(ed.grade) ? ` · ${ed.grade}` : ""}
                  </Text>
                </View>
              ))}
            </>
          )}

          {projects.length > 0 && (
            <>
              <Text style={s.sectionTitle}>{h("projects", lang)}</Text>
              {projects.map((proj: any, i: number) => (
                <View key={i} style={s.projBlock} wrap={false}>
                  <Text style={s.projName}>{proj.name}</Text>
                  {clean(proj.description) && <Text style={s.projDesc}>{proj.description}</Text>}
                  {clean(proj.link) && <Text style={s.projLink}>{proj.link}</Text>}
                </View>
              ))}
            </>
          )}

          {extraSections.map((sec: any, i: number) => (
            <View key={i}>
              <Text style={s.sectionTitle}>{sec.title}</Text>
              {(sec.items || []).filter((item: string) => clean(item)).map((item: string, j: number) => (
                <Text key={j} style={s.bullet}>• {item}</Text>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
