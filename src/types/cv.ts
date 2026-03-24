export type ParsedCV = {
  personal: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    date_of_birth?: string;
    linkedin?: string;
    website?: string;
  };
  photo_base64?: string;

  summary?: string;

  experience?: {
    role: string;
    company: string;
    location?: string;
    start?: string;
    end?: string;
    current?: boolean;
    description?: string;
    bullets?: string[];
  }[];

  education?: {
    institution: string;
    degree: string;
    field?: string;
    start?: string;
    end?: string;
    grade?: string;
    honors?: string;
    program?: string;
    publication?: string;
  }[];

  skills?: {
    technical?: string[];
    soft?: string[];
    tools?: string[];
    languages?: {
      language: string;
      level?: string;
      descriptor?: string;
    }[];
  };

  certifications?: {
    name: string;
    issuer?: string;
    year?: string;
  }[];

  projects?: {
    name: string;
    description?: string;
    link?: string;
  }[];

  publications?: {
    title: string;
    journal?: string;
    year?: string;
    doi?: string;
    authors?: string;
  }[];

  volunteering?: {
    role: string;
    organization: string;
    start?: string;
    end?: string;
    current?: boolean;
    description?: string;
  }[];

  awards?: {
    name: string;
    issuer?: string;
    year?: string;
    description?: string;
  }[];

  conferences?: {
    title: string;
    event: string;
    year?: string;
    role?: string;
  }[];

  extra_sections?: {
    title: string;
    items: string[];
  }[];
};
