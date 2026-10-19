import { driver, projects } from "@/lib/content";

export type Repo = {
  name: string;
  url: string;
  language: string | null;
  stars: number;
  pushed: string;
  description: string | null;
  // Share of the code by language, largest first. Only loaded for featured projects.
  languages?: { name: string; share: number }[];
};

export type Github = {
  live: boolean;
  repoCount: number;
  featured: Record<string, Repo>;
  others: Repo[];
};

type ApiRepo = {
  name: string;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  description: string | null;
  fork: boolean;
  size: number;
};

const API = "https://api.github.com";
const headers: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "User-Agent": "sawan-portfolio",
  // Optional. Without a token GitHub allows 60 requests an hour, which is plenty here.
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

// Refreshed at most once an hour, so the site never waits on GitHub for a visitor.
const hourly = { headers, next: { revalidate: 3600 } };

const repo = (r: ApiRepo): Repo => ({
  name: r.name,
  url: r.html_url,
  language: r.language,
  stars: r.stargazers_count,
  pushed: r.pushed_at,
  description: r.description,
});

// What GitHub said on 11 Oct 2026. Shown only if GitHub cannot be reached.
const snapshot: Github = {
  live: false,
  repoCount: 24,
  featured: {
    Payment_app: {
      name: "Payment_app",
      url: "https://github.com/TOJIZENN/Payment_app",
      language: "JavaScript",
      stars: 0,
      pushed: "2024-09-25T00:00:00Z",
      description: null,
      languages: [{ name: "JavaScript", share: 1 }],
    },
    "Notes-Application": {
      name: "Notes-Application",
      url: "https://github.com/TOJIZENN/Notes-Application",
      language: "JavaScript",
      stars: 0,
      pushed: "2025-07-22T00:00:00Z",
      description: null,
      languages: [
        { name: "JavaScript", share: 0.93 },
        { name: "Kotlin", share: 0.03 },
        { name: "Ruby", share: 0.02 },
        { name: "TypeScript", share: 0.02 },
      ],
    },
    "Movie-Recommendation-Site": {
      name: "Movie-Recommendation-Site",
      url: "https://github.com/TOJIZENN/Movie-Recommendation-Site",
      language: "Python",
      stars: 0,
      pushed: "2024-10-03T00:00:00Z",
      description: null,
      languages: [{ name: "Python", share: 1 }],
    },
  },
  others: [
    ["BACKTRACK-Brains", "TypeScript", "2026-10-10"],
    ["DSA", "C++", "2026-09-28"],
    ["IMAGE_FILTER_APP", "Python", "2026-09-03"],
    ["ANN-classification-churn", "Jupyter Notebook", "2026-07-01"],
    ["Asterik-Field-Validation", "JavaScript", "2025-11-05"],
    ["OTP_INPUT", "JavaScript", "2025-10-22"],
    ["Autocomplete_Search_bar", "JavaScript", "2025-09-22"],
    ["Chat-APP", "JavaScript", "2025-03-04"],
  ].map(([name, language, pushed]) => ({
    name,
    url: `https://github.com/TOJIZENN/${name}`,
    language,
    stars: 0,
    pushed: `${pushed}T00:00:00Z`,
    description: null,
  })),
};

// Pulls the resume's projects, and the rest of the garage, straight from GitHub.
export async function getGithub(): Promise<Github> {
  try {
    const res = await fetch(`${API}/users/${driver.github}/repos?per_page=100&sort=pushed`, hourly);
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const all = (await res.json()) as ApiRepo[];
    const names = projects.map((p) => p.repo);

    const featured: Record<string, Repo> = {};
    await Promise.all(
      names.map(async (name) => {
        const found = all.find((r) => r.name === name);
        if (!found) return;
        const entry = repo(found);
        try {
          const lr = await fetch(`${API}/repos/${driver.github}/${name}/languages`, hourly);
          if (lr.ok) {
            const bytes = (await lr.json()) as Record<string, number>;
            const total = Object.values(bytes).reduce((a, b) => a + b, 0) || 1;
            entry.languages = Object.entries(bytes)
              .map(([lang, n]) => ({ name: lang, share: n / total }))
              .sort((a, b) => b.share - a.share)
              .slice(0, 4);
          }
        } catch {
          // The card simply shows the main language.
        }
        featured[name] = entry;
      }),
    );

    // Everything else worth a look: his own work, not empty, most recent first.
    const others = all
      .filter((r) => !r.fork && r.size > 0 && r.language && !names.includes(r.name) && r.name !== driver.github)
      .slice(0, 8)
      .map(repo);

    return { live: true, repoCount: all.length, featured: { ...snapshot.featured, ...featured }, others };
  } catch {
    return snapshot;
  }
}
