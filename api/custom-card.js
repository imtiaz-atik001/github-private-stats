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
    <svg width="480" height="200" xmlns="http://www.w3.org/2000/svg">
      <style>
        .header {
          font: 600 20px 'Segoe UI', Ubuntu, Sans-Serif;
          fill: #2f81f7;
        }
        .label {
          font: 500 14px 'Segoe UI', Ubuntu, Sans-Serif;
          fill: #6e7681;
        }
        .value {
          font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif;
          fill: #1f2328;
        }
        .icon {
          font: 16px 'Segoe UI Emoji';
        }
      </style>

      <!-- Card Background -->
      <rect width="480" height="200" rx="10" fill="#ffffff" stroke="#d0d7de" stroke-width="1"/>

      <!-- Header -->
      <text x="25" y="45" class="header">${username}'s GitHub Stats</text>

      <!-- Stats List -->
      <g transform="translate(25, 70)">
        <text class="icon" y="0">🏗️</text>
        <text class="label" x="25" y="0">Total Contributions:</text>
        <text class="value" x="220" y="0">${stats.totalContributions}</text>

        <text class="icon" y="30">💾</text>
        <text class="label" x="25" y="30">Total Commits:</text>
        <text class="value" x="220" y="30">${stats.commits}</text>

        <text class="icon" y="60">🐛</text>
        <text class="label" x="25" y="60">Issues Opened:</text>
        <text class="value" x="220" y="60">${stats.issues}</text>

        <text class="icon" y="90">🚀</text>
        <text class="label" x="25" y="90">PRs Submitted:</text>
        <text class="value" x="220" y="90">${stats.prs}</text>
      </g>

      <!-- Circle Summary -->
      <circle cx="400" cy="105" r="55" stroke="#2f81f7" stroke-width="3" fill="none" opacity="0.2"/>
      <text x="375" y="112" font-size="22" font-weight="700" fill="#2f81f7" font-family="Segoe UI, Ubuntu, Sans-Serif">
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
