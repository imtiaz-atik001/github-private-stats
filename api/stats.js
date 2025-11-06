export default async function handler(req, res) {
  try {
    const { username } = req.query;
    const token = process.env.PAT_1;

    if (!token) {
      return res.status(500).json({ error: "Missing PAT_1 environment variable" });
    }

    const query = `
      query ($login: String!) {
        user(login: $login) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
            }
            totalCommitContributions
            totalIssueContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions
          }
        }
      }
    `;

    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables: { login: username } }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error("GitHub API error:", data.errors);
      return res.status(500).json({ error: data.errors });
    }

    const user = data.data.user;
    res.status(200).json({
      totalContributions: user.contributionsCollection.contributionCalendar.totalContributions,
      commits: user.contributionsCollection.totalCommitContributions,
      issues: user.contributionsCollection.totalIssueContributions,
      prs: user.contributionsCollection.totalPullRequestContributions,
      reviews: user.contributionsCollection.totalPullRequestReviewContributions,
    });
  } catch (err) {
    console.error("Handler crashed:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}
