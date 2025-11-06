export default async function handler(req, res) {
  const { username } = req.query;
  const apiUrl = `https://github-private-stats-xi.vercel.app/api/stats?username=${username}`;

  try {
    const response = await fetch(apiUrl);
    const stats = await response.json();

    if (!stats || stats.error) throw new Error(stats?.error || "Invalid data");

    const svg = `
    <svg width="440" height="190" xmlns="http://www.w3.org/2000/svg">
      <style>
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .card-bg {
          fill: #0D1117;
          stroke: #1E2632;
          stroke-width: 1;
          rx: 10;
        }
        .title {
          font: 600 16px 'Segoe UI', Ubuntu, sans-serif;
          fill: #58A6FF;
        }
        .label {
          font: 600 13px 'Segoe UI', Ubuntu, sans-serif;
          fill: #C9D1D9;
          opacity: 0.9;
          animation: fadeIn 0.6s ease forwards;
        }
        .value {
          font: 600 13px 'Segoe UI', Ubuntu, sans-serif;
          fill: #00E6A0;
          animation: fadeIn 0.8s ease forwards;
        }
        .icon {
          font: 14px 'Segoe UI Emoji';
          animation: fadeIn 0.5s ease forwards;
        }
        .ring {
          stroke: #3B82F6;
          stroke-width: 3;
          fill: none;
          opacity: 0.3;
        }
        .rotator {
          stroke: #00E6A0;
          stroke-width: 3;
          fill: none;
          transform-origin: 340px 100px;
          animation: spin 6s linear infinite;
        }
        .score {
          font: 600 16px 'Segoe UI', Ubuntu, sans-serif;
          fill: #00E6A0;
          text-anchor: middle;
        }
      </style>

      <rect class="card-bg" width="440" height="190"/>
      <text x="25" y="40" class="title">${username}'s GitHub Stats</text>

      <g transform="translate(25,70)">
        <text class="icon" y="0">⭐</text>
        <text class="label" x="25" y="0">Total Stars Earned:</text>
        <text class="value" x="220" y="0">${stats.stars || 0}</text>

        <text class="icon" y="25">🧱</text>
        <text class="label" x="25" y="25">Total Commits (last year):</text>
        <text class="value" x="220" y="25">${stats.commits || 0}</text>

        <text class="icon" y="50">🚀</text>
        <text class="label" x="25" y="50">Total PRs:</text>
        <text class="value" x="220" y="50">${stats.prs || 0}</text>

        <text class="icon" y="75">🐛</text>
        <text class="label" x="25" y="75">Total Issues:</text>
        <text class="value" x="220" y="75">${stats.issues || 0}</text>

        <text class="icon" y="100">💬</text>
        <text class="label" x="25" y="100">Contributed to (last year):</text>
        <text class="value" x="220" y="100">${stats.totalContributions || 0}</text>
      </g>

      <!-- Circle Progress -->
      <circle cx="340" cy="100" r="40" class="ring"/>
      <circle cx="340" cy="100" r="40" class="rotator" stroke-dasharray="10 180"/>
      <text x="340" y="106" class="score">C</text>
    </svg>
    `;

    res.setHeader("Content-Type", "image/svg+xml");
    res.status(200).send(svg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
