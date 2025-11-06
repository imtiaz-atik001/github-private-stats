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

    // Keep last 30 days
    const recent = contributions.slice(-30);
    const max = Math.max(...recent.map(d => d.contributionCount), 1);

    // Generate smooth line path
    const points = recent.map((d, i) => {
      const x = 40 + i * 15;
      const y = 240 - (d.contributionCount / max) * 180;
      return [x, y];
    });

    const path = points.reduce((acc, [x, y], i, arr) => {
      if (i === 0) return `M${x},${y}`;
      const prev = arr[i - 1];
      const cx = (prev[0] + x) / 2;
      return `${acc} Q${cx},${prev[1]} ${x},${y}`;
    }, "");

    const gradientId = "gradLine";

    const svg = `
    <svg width="600" height="280" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#00E6A0"/>
          <stop offset="100%" stop-color="#00BFFF"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <rect width="600" height="280" rx="15" fill="#0A0F1C"/>
      <text x="40" y="40" fill="#00E6A0" font-family="Fira Code" font-size="18" font-weight="bold">
        ${username}'s Contribution Graph
      </text>

      <!-- Grid Lines -->
      ${Array.from({ length: 6 }, (_, i) => {
        const y = 240 - i * 30;
        return `<line x1="40" y1="${y}" x2="580" y2="${y}" stroke="#1A1F2A" stroke-width="1"/>`;
      }).join("")}

      <!-- Axes -->
      <line x1="40" y1="240" x2="580" y2="240" stroke="#1A1F2A" stroke-width="2"/>
      <line x1="40" y1="60" x2="40" y2="240" stroke="#1A1F2A" stroke-width="2"/>

      <!-- Path -->
      <path d="${path}" fill="none" stroke="url(#${gradientId})" stroke-width="3" filter="url(#glow)"/>

      <!-- Dots -->
      ${points
        .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3" fill="#00E6A0" opacity="0.9"/>`)
        .join("")}

      <!-- Labels -->
      <text x="40" y="265" fill="#AAA" font-size="12" font-family="Fira Code">Days</text>
      <text x="5" y="150" fill="#AAA" font-size="12" font-family="Fira Code" transform="rotate(-90 20,150)">Contributions</text>
    </svg>
    `;

    res.setHeader("Content-Type", "image/svg+xml");
    res.status(200).send(svg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
