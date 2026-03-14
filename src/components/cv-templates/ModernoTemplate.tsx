import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";
import { clean, ensureArray, MAX_SIDEBAR_SKILLS, h } from "./template-utils";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hjQ.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjQ.ttf", fontWeight: 700 },
  ],
});

const SIDEBAR_BG = "#1E293B";
const SIDEBAR_TEXT = "#F1F5F9";
const SIDEBAR_MUTED = "#94A3B8";
const SIDEBAR_ACCENT = "#38BDF8";
const SIDEBAR_BORDER = "#334155";
const BODY_TEXT = "#0F172A";
const BODY_MUTED = "#64748B";
const BORDER = "#E2E8F0";

const s = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 10, flexDirection: "row" },
  sidebar: { width: "35%", backgroundColor: SIDEBAR_BG, paddingHorizontal: 22, paddingVertical: 36, color: SIDEBAR_TEXT },
  main: { width: "65%", paddingHorizontal: 32, paddingVertical: 36, paddingBottom: 56, color: BODY_TEXT },
  photo: { width: 80, height: 80, borderRadius: 40, marginBottom: 14, alignSelf: "center", borderWidth: 2, borderColor: SIDEBAR_ACCENT },
  sidebarName: { fontSize: 16, fontWeight: 700, textAlign: "center", marginBottom: 4, letterSpacing: 0.3 },
  sidebarTitle: { fontSize: 9, fontWeight: 500, color: SIDEBAR_ACCENT, textAlign: "center", marginBottom: 16 },
  sidebarSection: { fontSize: 7.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: SIDEBAR_ACCENT, marginBottom: 8, marginTop: 20 },
  sidebarDivider: { height: 0.5, backgroundColor: SIDEBAR_BORDER, marginBottom: 10 },
  contactIcon: { fontSize: 8, color: SIDEBAR_MUTED, marginBottom: 5, lineHeight: 1.5 },
  contactLink: { fontSize: 8, color: SIDEBAR_ACCENT, marginBottom: 5, lineHeight: 1.5 },
  skillChip: { fontSize: 8, color: SIDEBAR_TEXT, backgroundColor: SIDEBAR_BORDER, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 4, marginRight: 4 },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 3 },
  langRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  langName: { fontSize: 8.5, color: SIDEBAR_TEXT },
  langLevel: { fontSize: 8, color: SIDEBAR_MUTED },
  certName: { fontSize: 8, color: SIDEBAR_TEXT, fontWeight: 500, marginBottom: 1 },
  certMeta: { fontSize: 7, color: SIDEBAR_MUTED, marginBottom: 6 },
  mainName: { fontSize: 22, fontWeight: 700, letterSpacing: -0.2, marginBottom: 2 },
  mainSubtitle: { fontSize: 9, color: BODY_MUTED, marginBottom: 18, letterSpacing: 0.3 },
  sectionTitle: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: BODY_TEXT, paddingBottom: 5, marginBottom: 10, marginTop: 20, borderBottomWidth: 1.5, borderBottomColor: SIDEBAR_ACCENT },
  summary: { fontSize: 10, lineHeight: 1.65, color: BODY_TEXT },
  expBlock: { marginBottom: 14 },
  expRole: { fontSize: 11, fontWeight: 700 },
  expCompany: { fontSize: 10, fontWeight: 500, color: BODY_TEXT, marginBottom: 1 },
  expMeta: { fontSize: 9, color: BODY_MUTED, marginBottom: 4 },
  bullet: { fontSize: 9.5, lineHeight: 1.55, paddingLeft: 14, marginBottom: 2.5 },
  eduBlock: { marginBottom: 10 },
  eduTitle: { fontSize: 10, fontWeight: 700 },
  eduInstitution: { fontSize: 9.5, fontWeight: 500, color: BODY_TEXT },
  eduMeta: { fontSize: 9, color: BODY_MUTED, marginTop: 1 },
  projBlock: { marginBottom: 10 },
  projName: { fontSize: 10, fontWeight: 500 },
  projDesc: { fontSize: 9.5, lineHeight: 1.5, marginTop: 1 },
  projLink: { fontSize: 9, color: SIDEBAR_ACCENT, marginTop: 1 },
});

export function ModernoTemplate({ cv, lang }: { cv: Record<string, any>; lang?: string }) {
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
        {/* Sidebar */}
        <View style={s.sidebar}>
          {photoUrl && <Image src={photoUrl} style={s.photo} />}
          <Text style={s.sidebarName}>{clean(personal.name) || "Nome Cognome"}</Text>
          {clean(personal.title) && <Text style={s.sidebarTitle}>{personal.title}</Text>}

          <Text style={s.sidebarSection}>{h("contacts", lang)}</Text>
          <View style={s.sidebarDivider} />
          {contactParts.map((c, i) => <Text key={i} style={s.contactIcon}>{c}</Text>)}
          {clean(personal.linkedin) && <Text style={s.contactLink}>{personal.linkedin}</Text>}
          {clean(personal.website) && <Text style={s.contactLink}>{personal.website}</Text>}

          {allSkills.length > 0 && (
            <>
              <Text style={s.sidebarSection}>{h("skills", lang)}</Text>
              <View style={s.sidebarDivider} />
              <View style={s.skillsWrap}>
                {allSkills.map((sk: string, i: number) => (
                  <Text key={i} style={s.skillChip}>{sk}</Text>
                ))}
              </View>
            </>
          )}

          {languages.length > 0 && (
            <>
              <Text style={s.sidebarSection}>{h("languages", lang)}</Text>
              <View style={s.sidebarDivider} />
              {languages.map((l: any, i: number) => (
                <View key={i} style={s.langRow}>
                  <Text style={s.langName}>{l.language}</Text>
                  {clean(l.level) && <Text style={s.langLevel}>{l.level}</Text>}
                </View>
              ))}
            </>
          )}

          {certifications.length > 0 && (
            <>
              <Text style={s.sidebarSection}>{h("certifications", lang)}</Text>
              <View style={s.sidebarDivider} />
              {certifications.map((cert: any, i: number) => (
                <View key={i}>
                  <Text style={s.certName}>{cert.name}</Text>
                  <Text style={s.certMeta}>
                    {clean(cert.issuer) ? `${cert.issuer}` : ""}
                    {clean(cert.year) ? ` · ${cert.year}` : ""}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Main */}
        <View style={s.main}>
          <Text style={s.mainName}>{clean(personal.name) || "Nome Cognome"}</Text>
          {contactParts.length > 0 && <Text style={s.mainSubtitle}>{contactParts.join("  ·  ")}</Text>}

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
                    {clean(exp.location) ? `  ·  ${exp.location}` : ""}
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
                    {ed.degree}{clean(ed.field) ? ` in ${ed.field}` : ""}
                  </Text>
                  <Text style={s.eduInstitution}>{ed.institution}</Text>
                  <Text style={s.eduMeta}>
                    {ed.start || ed.period}{ed.end ? ` – ${ed.end}` : ""}
                    {clean(ed.grade) ? `  ·  ${ed.grade}` : ""}
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
            <View key={i} wrap={false}>
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
