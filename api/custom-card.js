export default async function handler(req, res) {
  const { username } = req.query;
  const apiUrl = `https://github-private-stats-xi.vercel.app/api/stats?username=${username}`;

  try {
    const response = await fetch(apiUrl);
    const stats = await response.json();

    if (!stats || stats.error) {
      throw new Error(stats?.error || "Invalid data");
    }

    const svg = `
    <svg width="480" height="210" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#00E6A0"/>
          <stop offset="100%" stop-color="#00BFFF"/>
        </linearGradient>
      </defs>
      <rect width="480" height="210" rx="20" fill="#0A0F1C"/>
      <text x="30" y="50" fill="url(#grad)" font-size="22" font-weight="bold" font-family="Fira Code">
        ${username}'s GitHub Stats
      </text>

      <g font-family="Fira Code" font-size="16" fill="#E0E0E0">
        <text x="30" y="90">🏗️ Total Contributions: </text>
        <text x="300" y="90" fill="#00E6A0">${stats.totalContributions}</text>

        <text x="30" y="120">💾 Total Commits: </text>
        <text x="300" y="120" fill="#00E6A0">${stats.commits}</text>

        <text x="30" y="150">🐛 Issues Opened: </text>
        <text x="300" y="150" fill="#00E6A0">${stats.issues}</text>

        <text x="30" y="180">🚀 PRs Submitted: </text>
        <text x="300" y="180" fill="#00E6A0">${stats.prs}</text>
      </g>

      <circle cx="400" cy="105" r="60" stroke="url(#grad)" stroke-width="4" fill="none"/>
      <text x="370" y="115" font-size="28" fill="#00E6A0" font-family="Fira Code">
        ${(stats.totalContributions / 1000).toFixed(1)}k
      </text>
    </svg>
    `;

    res.setHeader("Content-Type", "image/svg+xml");
    res.status(200).send(svg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
