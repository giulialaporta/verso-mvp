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

const ACCENT = "#2563EB";
const ACCENT_LIGHT = "#DBEAFE";
const BODY_TEXT = "#111827";
const BODY_MUTED = "#6B7280";
const BORDER = "#E5E7EB";

const s = StyleSheet.create({
  page: { fontFamily: "DM Sans", fontSize: 10, paddingHorizontal: 48, paddingVertical: 44, paddingBottom: 56, color: BODY_TEXT },
  header: { marginBottom: 20 },
  name: { fontSize: 26, fontWeight: 700, letterSpacing: 0.3, marginBottom: 3 },
  title: { fontSize: 11, fontWeight: 500, color: ACCENT, marginBottom: 8 },
  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 6 },
  contactItem: { fontSize: 8.5, color: BODY_MUTED, lineHeight: 1.4 },
  contactSep: { fontSize: 8.5, color: BORDER, marginHorizontal: 4 },
  accentLine: { height: 2.5, backgroundColor: ACCENT, width: 48, marginTop: 4 },
  sectionTitle: { fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: BODY_TEXT, marginBottom: 4, marginTop: 22 },
  sectionAccent: { height: 2, backgroundColor: ACCENT, width: 32, marginBottom: 10 },
  summary: { fontSize: 10, lineHeight: 1.65, color: BODY_TEXT },
  expBlock: { marginBottom: 14 },
  expRole: { fontSize: 11.5, fontWeight: 700 },
  expCompany: { fontSize: 10, fontWeight: 500, color: BODY_TEXT },
  expMeta: { fontSize: 9, color: BODY_MUTED, marginBottom: 4, marginTop: 1 },
  bullet: { fontSize: 9.5, lineHeight: 1.55, paddingLeft: 14, marginBottom: 2.5 },
  eduBlock: { marginBottom: 10 },
  eduTitle: { fontSize: 10, fontWeight: 700 },
  eduInstitution: { fontSize: 9.5, fontWeight: 500, color: BODY_TEXT },
  eduMeta: { fontSize: 9, color: BODY_MUTED, marginTop: 1 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 2 },
  skillChip: { fontSize: 8, color: ACCENT, backgroundColor: ACCENT_LIGHT, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  twoCol: { flexDirection: "row", gap: 24, marginTop: 2 },
  colHalf: { flex: 1 },
  langItem: { fontSize: 9, color: BODY_TEXT, marginBottom: 3 },
  certName: { fontSize: 9, fontWeight: 500, color: BODY_TEXT },
  certMeta: { fontSize: 8, color: BODY_MUTED, marginBottom: 5 },
  projBlock: { marginBottom: 10 },
  projName: { fontSize: 10, fontWeight: 500 },
  projDesc: { fontSize: 9.5, lineHeight: 1.5, marginTop: 1 },
  projLink: { fontSize: 9, color: ACCENT, marginTop: 1 },
  photo: { width: 56, height: 56, borderRadius: 28 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerText: { flex: 1 },
});

export function ExecutiveTemplate({ cv, lang }: { cv: Record<string, any>; lang?: string }) {
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

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.headerText}>
              <Text style={s.name}>{clean(personal.name) || "Nome Cognome"}</Text>
              {clean(personal.title) && <Text style={s.title}>{personal.title}</Text>}
              <View style={s.contactRow}>
                {[...contactParts, ...links].map((c, i, arr) => (
                  <View key={i} style={{ flexDirection: "row" }}>
                    <Text style={s.contactItem}>{c}</Text>
                    {i < arr.length - 1 && <Text style={s.contactSep}>·</Text>}
                  </View>
                ))}
              </View>
            </View>
            {photoUrl && <Image src={photoUrl} style={s.photo} />}
          </View>
          <View style={s.accentLine} />
        </View>

        {/* Profile */}
        {summary && (
          <View>
            <Text style={s.sectionTitle}>{h("profile", lang)}</Text>
            <View style={s.sectionAccent} />
            <Text style={s.summary}>{summary}</Text>
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>{h("experience", lang)}</Text>
            <View style={s.sectionAccent} />
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
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>{h("education", lang)}</Text>
            <View style={s.sectionAccent} />
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
          </View>
        )}

        {/* Skills & Languages side by side */}
        {(allSkills.length > 0 || languages.length > 0) && (
          <View style={s.twoCol} wrap={false}>
            {allSkills.length > 0 && (
              <View style={s.colHalf}>
                <Text style={s.sectionTitle}>{h("skills", lang)}</Text>
                <View style={s.sectionAccent} />
                <View style={s.skillsRow}>
                  {allSkills.map((sk: string, i: number) => (
                    <Text key={i} style={s.skillChip}>{sk}</Text>
                  ))}
                </View>
              </View>
            )}
            {languages.length > 0 && (
              <View style={s.colHalf}>
                <Text style={s.sectionTitle}>{h("languages", lang)}</Text>
                <View style={s.sectionAccent} />
                {languages.map((l: any, i: number) => (
                  <Text key={i} style={s.langItem}>
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
            <Text style={s.sectionTitle}>{h("certifications", lang)}</Text>
            <View style={s.sectionAccent} />
            {certifications.map((cert: any, i: number) => (
              <View key={i} wrap={false}>
                <Text style={s.certName}>{cert.name}{clean(cert.issuer) ? ` — ${cert.issuer}` : ""}</Text>
                {clean(cert.year) && <Text style={s.certMeta}>{cert.year}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>{h("projects", lang)}</Text>
            <View style={s.sectionAccent} />
            {projects.map((proj: any, i: number) => (
              <View key={i} style={s.projBlock}>
                <Text style={s.projName}>{proj.name}</Text>
                {clean(proj.description) && <Text style={s.projDesc}>{proj.description}</Text>}
                {clean(proj.link) && <Text style={s.projLink}>{proj.link}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Extra sections */}
        {extraSections.map((sec: any, i: number) => (
          <View key={i}>
            <Text style={s.sectionTitle}>{sec.title}</Text>
            <View style={s.sectionAccent} />
            {(sec.items || []).filter((item: string) => clean(item)).map((item: string, j: number) => (
              <Text key={j} style={s.bullet}>• {item}</Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
