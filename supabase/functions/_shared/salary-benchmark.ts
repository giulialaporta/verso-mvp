/**
 * Fetch real-world salary benchmarks via Firecrawl Search API.
 * Returns contextualized text for the AI prompt + source metadata.
 * Gracefully returns null if Firecrawl is not configured or yields no results.
 */

type BenchmarkParams = {
  role_title: string;
  company_name?: string;
  location?: string;
  industry?: string;
};

type BenchmarkResult = {
  raw_context: string;
  sources: { url: string; title: string }[];
};

type FirecrawlSearchResult = {
  url?: string;
  title?: string;
  description?: string;
  markdown?: string;
};

async function firecrawlSearch(
  query: string,
  apiKey: string,
  limit = 5
): Promise<FirecrawlSearchResult[]> {
  console.log(`[salary-benchmark] Firecrawl query: "${query.slice(0, 80)}"`);
  const res = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, limit, lang: "it", country: "IT" }),
  });

  const bodyText = await res.text();
  console.log(`[salary-benchmark] Firecrawl status=${res.status}, body=${bodyText.slice(0, 500)}`);

  if (!res.ok) {
    return [];
  }

  const json = JSON.parse(bodyText);
  const results = (json.data ?? json.results ?? []) as FirecrawlSearchResult[];
  console.log(`[salary-benchmark] ${results.length} results, success=${json.success}`);
  return results;
}

function buildQueries(params: BenchmarkParams): string[] {
  const { role_title, company_name, location, industry } = params;
  const loc = location || "Italia";
  const company = company_name ? ` ${company_name}` : "";
  const sector = industry ? ` ${industry}` : "";

  return [
    `RAL "${role_title}" ${loc} stipendio${company}${sector}`,
    `"${role_title}" salary Italy${company}${sector} average`,
  ];
}

export async function fetchSalaryBenchmarks(
  params: BenchmarkParams
): Promise<BenchmarkResult | null> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    console.log("salary-benchmark: FIRECRAWL_API_KEY not set, skipping");
    return null;
  }

  const queries = buildQueries(params);

  try {
    const results = await Promise.all(
      queries.map((q) => firecrawlSearch(q, apiKey))
    );

    const allResults = results.flat();
    if (allResults.length === 0) {
      console.log("salary-benchmark: no results found");
      return null;
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const unique: FirecrawlSearchResult[] = [];
    for (const r of allResults) {
      const key = r.url || r.title || "";
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(r);
      }
    }

    // Build context string for AI prompt
    const snippets = unique.slice(0, 8).map((r, i) => {
      const parts = [`[${i + 1}] ${r.title || "N/A"}`];
      if (r.url) parts.push(`URL: ${r.url}`);
      if (r.description) parts.push(r.description);
      if (r.markdown) parts.push(r.markdown.slice(0, 500));
      return parts.join("\n");
    });

    const sources = unique
      .filter((r) => r.url)
      .slice(0, 8)
      .map((r) => ({ url: r.url!, title: r.title || r.url! }));

    return {
      raw_context: snippets.join("\n\n"),
      sources,
    };
  } catch (err) {
    console.error("salary-benchmark: error fetching benchmarks:", err);
    return null;
  }
}
