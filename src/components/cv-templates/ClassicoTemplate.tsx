import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "DM Sans",
  fonts: [
    { src: "https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZOIHTWEBlw.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZ-IHTWEBlwp.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZOIHTWEBlw.ttf", fontWeight: 700, fontStyle: "normal" },
  ],
});

const NONE_VALUES = ["None", "none", "null", "N/A", "n/a", "undefined", "N/D", "n/d"];
const clean = (val: unknown): string | null => {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  if (!trimmed || NONE_VALUES.includes(trimmed)) return null;
  return trimmed;
};

const ensureArray = (val: unknown): string[] => {
  if (Array.isArray(val)) return val.map(v => clean(String(v))).filter(Boolean) as string[];
  if (typeof val === "string") return val.split(",").map(s => s.trim()).filter(s => s && !NONE_VALUES.includes(s));
  return [];
};

const SIDEBAR_BG = "#141518";
const SIDEBAR_TEXT = "#F2F3F7";
const SIDEBAR_MUTED = "#8B8FA8";
const SIDEBAR_ACCENT = "#5DBBFF";
const BODY_TEXT = "#1a1a1a";
const BODY_MUTED = "#555";
const SECTION_BORDER = "#d0d0d0";

const s = StyleSheet.create({
  page: { fontFamily: "DM Sans", fontSize: 10, flexDirection: "row" },
  sidebar: { width: "30%", backgroundColor: SIDEBAR_BG, paddingHorizontal: 16, paddingVertical: 24, color: SIDEBAR_TEXT },
  main: { width: "70%", paddingHorizontal: 28, paddingVertical: 24, paddingBottom: 60, color: BODY_TEXT },
  // Sidebar
  photo: { width: 72, height: 72, borderRadius: 36, marginBottom: 12, alignSelf: "center" },
  sidebarName: { fontSize: 14, fontWeight: 700, marginBottom: 8, textAlign: "center" },
  contactItem: { fontSize: 8, color: SIDEBAR_MUTED, marginBottom: 3, lineHeight: 1.4 },
  contactLink: { fontSize: 8, color: SIDEBAR_ACCENT, marginBottom: 3, lineHeight: 1.4 },
  sidebarSection: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: SIDEBAR_MUTED, borderBottomWidth: 0.5, borderBottomColor: "#2A2D35", paddingBottom: 3, marginBottom: 6, marginTop: 14 },
  skillChip: { fontSize: 8, color: SIDEBAR_TEXT, marginBottom: 2, lineHeight: 1.4 },
  langItem: { fontSize: 8, color: SIDEBAR_TEXT, marginBottom: 2 },
  certName: { fontSize: 8, color: SIDEBAR_TEXT, fontWeight: 500 },
  certMeta: { fontSize: 7, color: SIDEBAR_MUTED, marginBottom: 4 },
  // Main
  mainName: { fontSize: 20, fontWeight: 700, marginBottom: 2 },
  mainSubtitle: { fontSize: 9, color: BODY_MUTED, marginBottom: 14 },
  sectionTitle: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: BODY_TEXT, borderBottomWidth: 0.5, borderBottomColor: SECTION_BORDER, paddingBottom: 3, marginBottom: 8, marginTop: 14 },
  summary: { fontSize: 10, lineHeight: 1.5, marginBottom: 4 },
  expBlock: { marginBottom: 10 },
  expRole: { fontSize: 11, fontWeight: 700 },
  expMeta: { fontSize: 9, color: BODY_MUTED, marginBottom: 2 },
  bullet: { fontSize: 9.5, lineHeight: 1.5, paddingLeft: 10, marginBottom: 1 },
  eduBlock: { marginBottom: 6 },
  eduTitle: { fontSize: 10, fontWeight: 500 },
  eduMeta: { fontSize: 9, color: BODY_MUTED },
  projBlock: { marginBottom: 8 },
  projName: { fontSize: 10, fontWeight: 500 },
  projDesc: { fontSize: 9.5, lineHeight: 1.5, marginTop: 1 },
  projLink: { fontSize: 9, color: SIDEBAR_ACCENT, marginTop: 1 },
  extraBlock: { marginBottom: 6 },
});

export function ClassicoTemplate({ cv }: { cv: Record<string, any> }) {
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

  const allSkills = skills
    ? Array.isArray(skills)
      ? skills.filter((sk: string) => clean(sk))
      : [...ensureArray(skills.technical), ...ensureArray(skills.soft), ...ensureArray(skills.tools)]
    : [];

  const languages = skills?.languages && Array.isArray(skills.languages) ? skills.languages : [];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ===== SIDEBAR (30%) ===== */}
        <View style={s.sidebar}>
          {photoUrl && <Image src={photoUrl} style={s.photo} />}
          <Text style={s.sidebarName}>{clean(personal.name) || "Nome Cognome"}</Text>

          {/* Contacts */}
          <Text style={s.sidebarSection}>Contatti</Text>
          {contactParts.map((c, i) => <Text key={i} style={s.contactItem}>{c}</Text>)}
          {clean(personal.linkedin) && <Text style={s.contactLink}>{personal.linkedin}</Text>}
          {clean(personal.website) && <Text style={s.contactLink}>{personal.website}</Text>}

          {/* Skills */}
          {allSkills.length > 0 && (
            <>
              <Text style={s.sidebarSection}>Competenze</Text>
              {allSkills.map((sk: string, i: number) => <Text key={i} style={s.skillChip}>• {sk}</Text>)}
            </>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <>
              <Text style={s.sidebarSection}>Lingue</Text>
              {languages.map((l: any, i: number) => (
                <Text key={i} style={s.langItem}>
                  {l.language}{clean(l.level) ? ` — ${l.level}` : ""}
                </Text>
              ))}
            </>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <>
              <Text style={s.sidebarSection}>Certificazioni</Text>
              {certifications.map((cert: any, i: number) => (
                <View key={i}>
                  <Text style={s.certName}>{cert.name}{clean(cert.issuer) ? ` — ${cert.issuer}` : ""}</Text>
                  {clean(cert.year) && <Text style={s.certMeta}>{cert.year}</Text>}
                </View>
              ))}
            </>
          )}
        </View>

        {/* ===== MAIN (70%) ===== */}
        <View style={s.main}>
          <Text style={s.mainName}>{clean(personal.name) || "Nome Cognome"}</Text>
          {contactParts.length > 0 && <Text style={s.mainSubtitle}>{contactParts.join(" | ")}</Text>}

          {/* Summary */}
          {summary && (
            <>
              <Text style={s.sectionTitle}>Profilo</Text>
              <Text style={s.summary}>{summary}</Text>
            </>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Esperienza</Text>
              {experience.map((exp: any, i: number) => (
                <View key={i} style={s.expBlock}>
                  <Text style={s.expRole}>
                    {clean(exp.role) || clean(exp.title)} — {exp.company}
                  </Text>
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

          {/* Education */}
          {education.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Formazione</Text>
              {education.map((ed: any, i: number) => (
                <View key={i} style={s.eduBlock}>
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

          {/* Projects */}
          {projects.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Progetti</Text>
              {projects.map((proj: any, i: number) => (
                <View key={i} style={s.projBlock}>
                  <Text style={s.projName}>{proj.name}</Text>
                  {clean(proj.description) && <Text style={s.projDesc}>{proj.description}</Text>}
                  {clean(proj.link) && <Text style={s.projLink}>{proj.link}</Text>}
                </View>
              ))}
            </>
          )}

          {/* Extra Sections */}
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
