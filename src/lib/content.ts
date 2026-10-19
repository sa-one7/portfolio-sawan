// All site copy lives here, taken from Sawan's resume. Edit this file to update the site.

export const driver = {
  firstName: "Sawan",
  lastName: "Singh",
  // The car number used on the portfolio.
  number: 44,
  role: "Frontend Developer",
  team: "React · Tailwind CSS",
  base: "Lucknow, Uttar Pradesh",
  email: "work.singhsa.one7@gmail.com",
  github: "sa-one7",
  status: "Car on track",
  intro: "I build responsive, user-friendly web experiences with React, JavaScript and Tailwind CSS.",
  bio: "Frontend developer with internship experience building responsive web pages and healthcare-focused interfaces. I work with React, JavaScript and modern frontend tools, and have also built projects spanning NLP, resume scanning and AI-powered prompt assistance.",
};

export const links = [
  { label: "GitHub", href: "https://github.com/sa-one7" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/sawan-singh7" },
  { label: "LeetCode", href: "https://leetcode.com/u/user6496M/" },
];

// The driver card.
export const profile = [
  { label: "Role", value: "Frontend Developer" },
  { label: "Base", value: "Lucknow, Uttar Pradesh 226028" },
  { label: "Education", value: "MCA · University of Lucknow · 2025 to present" },
  { label: "Bachelor's", value: "BCA · Shri Ramswaroop Memorial University · 2022 to 2025" },
  { label: "Class XII", value: "Amrit Public School · 2021" },
  { label: "Class X", value: "Fatima School · 2018" },
];

export const stats = [
  { value: 2, decimals: 0, suffix: "", label: "Internships" },
  { value: 2, decimals: 0, suffix: "", label: "Featured projects" },
  { value: 6, decimals: 0, suffix: "", label: "Programming languages" },
  { value: 4, decimals: 0, suffix: "", label: "Education milestones" },
];

// The car, system by system. `part` names the piece of the 3D model that lights up, so
// it has to match a key in src/gl/car.ts.
export const systems = [
  { part: "engine", name: "Power unit", role: "Languages", items: ["Python", "Java", "C", "C++", "JavaScript", "SQL"] },
  { part: "aero", name: "Aero", role: "Frontend", items: ["HTML", "CSS", "JavaScript", "React JS", "Next JS"] },
  { part: "chassis", name: "Chassis", role: "Framework", items: ["Tailwind CSS"] },
  { part: "wheels", name: "Tyres", role: "Database", items: ["MySQL"] },
  { part: "suspension", name: "Suspension", role: "Developer tools", items: ["VS Code", "Git"] },
] as const;

export type Stint = {
  round: string;
  team: string;
  url?: string;
  role: string;
  period: string;
  live?: boolean;
  // Earlier titles at the same team, oldest first.
  path?: { role: string; from: string }[];
  points: string[];
};

export const season: Stint[] = [
  {
    round: "02",
    team: "UBIQCURE",
    role: "Frontend Developer Intern",
    period: "Dates to confirm",
    points: [
      "Developed a responsive, user-friendly frontend web app for a health tech startup using React and Tailwind CSS.",
      "Collaborated with the team on healthcare-focused features and user interface improvements.",
      "Used Git and GitHub for version control and collaborative development.",
    ],
  },
  {
    round: "01",
    team: "Octanet Services Pvt Ltd.",
    role: "Web Developer Intern",
    period: "Jul to Aug 2024",
    points: [
      "Learned and practiced HTML, CSS, JavaScript and React JS.",
      "Developed and styled responsive web pages with HTML and CSS.",
      "Implemented interactive features and dynamic content with JavaScript.",
    ],
  },
];

export type Project = {
  // The repository name on GitHub. Live details are pulled from it.
  repo: string;
  name: string;
  kind: string;
  period: string;
  stack: string[];
  // The headline number on the card.
  stat: { value: string; label: string };
  points: string[];
};

export const projects: Project[] = [
  {
    repo: "ARSIST",
    name: "ARSIST",
    kind: "ATS resume scanner",
    period: "Final year project",
    stack: ["HTML5", "CSS3", "JavaScript", "Python", "MySQL", "Streamlit", "NLTK", "spaCy"],
    stat: { value: "ATS", label: "Resume scanner and suggestions" },
    points: [
      "Built an ATS resume scanner and improvement suggestion tool using Python, MySQL and Streamlit.",
      "Developed resume parsing and prediction algorithms with NLTK and spaCy.",
      "Created a responsive applicant and recruiter interface with JSON data exchange.",
    ],
  },
  {
    repo: "emit-ai",
    name: "Emit-AI",
    kind: "AI prompt assistant",
    period: "Project",
    stack: ["React.js", "Clerk", "Context API", "Vite", "CSS3", "Vercel"],
    stat: { value: "AI", label: "Prompt assistant" },
    points: [
      "Developed an AI-driven prompt assistant with React.js, Clerk authentication, Context API and Vite.",
      "Built a responsive interface and used React Context for prompt history, results and chat state.",
      "Deployed the application on Vercel for live access and testing.",
    ],
  },
];

export const licences: { name: string; by: string; href?: string }[] = [
  { name: "Web Developer Internship Certificate", by: "Octanet Services Pvt Ltd." },
];

// One entry per chapter, in page order. `at` is where its corner sits on the track map,
// as a fraction of the lap.
export const chapters = [
  { id: "grid", label: "Lights out", turn: "S/F", at: 0 },
  { id: "driver", label: "Driver", turn: "T1", at: 0.15 },
  { id: "car", label: "The car", turn: "T4", at: 0.34 },
  { id: "season", label: "Season", turn: "T7", at: 0.53 },
  { id: "work", label: "The grid", turn: "T10", at: 0.72 },
  { id: "radio", label: "Pit wall", turn: "T13", at: 0.92 },
];
