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

    // generate SVG bars
    const max = Math.max(...contributions.map(d => d.contributionCount));
    const scale = 120 / max || 1;
    const bars = contributions
      .slice(-90) // last 3 months
      .map((d, i) => {
        const height = d.contributionCount * scale;
        return `<rect x="${20 + i * 5}" y="${150 - height}" width="4" height="${height}" fill="#00E6A0"/>`;
      })
      .join("");

    const svg = `
      <svg width="500" height="180" xmlns="http://www.w3.org/2000/svg">
        <rect width="500" height="180" fill="#0A0F1C" rx="10"/>
        <text x="25" y="30" fill="#00E6A0" font-family="Fira Code" font-size="18">${username}'s Contribution Graph</text>
        ${bars}
      </svg>
    `;

    res.setHeader("Content-Type", "image/svg+xml");
    res.status(200).send(svg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
