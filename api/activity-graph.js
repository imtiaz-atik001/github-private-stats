export default async function handler(req, res) {
  const { username } = req.query;
  const token = process.env.PAT_1;

  const query = `
    query ($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables: { login: username } }),
    });

    const data = await response.json();
    const weeks = data.data.user.contributionsCollection.contributionCalendar.weeks;
    const contributions = weeks.flatMap(w => w.contributionDays);

    const recent = contributions.slice(-30);
    const max = Math.max(...recent.map(d => d.contributionCount), 1);

    // Smooth line path
    const points = recent.map((d, i) => {
      const x = 60 + i * 16;
      const y = 300 - (d.contributionCount / max) * 200;
      return [x, y, d.contributionCount];
    });

    const path = points.reduce((acc, [x, y], i, arr) => {
      if (i === 0) return `M${x},${y}`;
      const prev = arr[i - 1];
      const cx = (prev[0] + x) / 2;
      return `${acc} Q${cx},${prev[1]} ${x},${y}`;
    }, "");

    const yTicks = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max];

    const svg = `
    <svg width="700" height="360" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradLine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#00E6A0"/>
          <stop offset="50%" stop-color="#00BFFF"/>
          <stop offset="100%" stop-color="#5B6EF5"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <rect width="700" height="360" rx="20" fill="#0B1220"/>
      <text x="60" y="45" fill="#A8E4D0" font-family="Inter, Fira Code" font-size="20" font-weight="600">
        ${username}'s Contribution Graph
      </text>

      <!-- Grid & Axes -->
      ${yTicks.map((t, i) => {
        const y = 300 - (t / max) * 200;
        return `
          <line x1="60" y1="${y}" x2="660" y2="${y}" stroke="#1A2235" stroke-width="1"/>
          <text x="30" y="${y + 4}" fill="#7C8595" font-size="12">${t}</text>
        `;
      }).join("")}

      <line x1="60" y1="300" x2="660" y2="300" stroke="#1A2235" stroke-width="2"/>
      <line x1="60" y1="100" x2="60" y2="300" stroke="#1A2235" stroke-width="2"/>

      <!-- Line -->
      <path d="${path}" fill="none" stroke="url(#gradLine)" stroke-width="4" filter="url(#glow)" stroke-linecap="round"/>

      <!-- Dots -->
      ${points.map(([x, y, c]) =>
        `<circle cx="${x}" cy="${y}" r="4" fill="#00E6A0" stroke="#0A0F1C" stroke-width="1.5">
          <title>${c} contributions</title>
        </circle>`
      ).join("")}

      <!-- X-axis days -->
      ${points
        .filter((_, i) => i % 5 === 0)
        .map(([x], i) =>
          `<text x="${x - 8}" y="320" fill="#8FA2B2" font-size="12">${i * 5}</text>`
        ).join("")}

      <text x="355" y="340" fill="#7C8595" font-size="12" text-anchor="middle">Days (last 30)</text>
      <text x="20" y="200" fill="#7C8595" font-size="12" transform="rotate(-90 20,200)">Contributions</text>
    </svg>
    `;

    res.setHeader("Content-Type", "image/svg+xml");
    res.status(200).send(svg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
