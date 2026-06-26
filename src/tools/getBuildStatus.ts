// src/tools/getBuildStatus.ts
export async function getBuildStatus(args: Record<string, unknown>) {
  const job = String(args.job ?? "actian-docs-publish");

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        data_source: "mock",
        note: "Add JENKINS_URL and JENKINS_TOKEN to .env for live data",
        job,
        latest_build: {
          number: 142,
          status: "SUCCESS",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          duration_seconds: 187,
          triggered_by: "GitHub webhook — push to main",
          stages: [
            { name: "Checkout",          status: "SUCCESS", duration_s: 4  },
            { name: "Lint (Vale)",        status: "SUCCESS", duration_s: 22 },
            { name: "Build (MkDocs)",     status: "SUCCESS", duration_s: 68 },
            { name: "Link check",         status: "SUCCESS", duration_s: 41 },
            { name: "Deploy to staging",  status: "SUCCESS", duration_s: 38 },
            { name: "Smoke test",         status: "SUCCESS", duration_s: 14 },
          ],
        },
        recent_history: [
          { number: 142, status: "SUCCESS" },
          { number: 141, status: "SUCCESS" },
          { number: 140, status: "FAILURE", failed_stage: "Lint (Vale)" },
          { number: 139, status: "SUCCESS" },
          { number: 138, status: "SUCCESS" },
        ],
        links: {
          console: `https://jenkins.example.com/job/${job}/142/console`,
          artifacts: `https://jenkins.example.com/job/${job}/142/artifacts`,
        },
      }, null, 2),
    }],
  };
}
