export type ParsedCV = {
  personal: { name?: string; email?: string; phone?: string; location?: string; linkedin?: string };
  summary?: string;
  experience?: { title: string; company: string; period: string; description: string }[];
  education?: { degree: string; institution: string; period: string }[];
  skills?: string[];
  certifications?: { name: string; year: string }[];
  projects?: { name: string; description: string }[];
  languages?: { language: string; level: string }[];
};
