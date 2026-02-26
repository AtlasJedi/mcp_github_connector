import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getOctokit } from "../github.js";

export function registerCommitTools(server: McpServer) {
  server.tool(
    "list_commits",
    "List commits in a GitHub repository with optional path filter",
    {
      owner: z.string(),
      repo: z.string(),
      sha: z
        .string()
        .optional()
        .describe("Branch, tag, or commit SHA to start listing from"),
      path: z
        .string()
        .optional()
        .describe("Only return commits that touched this file path"),
      per_page: z.number().int().min(1).max(100).optional(),
    },
    async ({ owner, repo, sha, path, per_page = 30 }) => {
      try {
        const { data } = await getOctokit().repos.listCommits({
          owner,
          repo,
          sha,
          path,
          per_page,
        });

        const commits = data.map((c) => ({
          sha: c.sha.substring(0, 7),
          full_sha: c.sha,
          message: c.commit.message.split("\n")[0],
          author: c.commit.author?.name || c.author?.login,
          date: c.commit.author?.date,
          url: c.html_url,
        }));

        return { content: [{ type: "text", text: JSON.stringify(commits, null, 2) }] };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  server.tool(
    "get_commit",
    "Get full details of a commit including file diffs and stats",
    {
      owner: z.string(),
      repo: z.string(),
      ref: z.string().describe("Commit SHA, branch name, or tag"),
    },
    async ({ owner, repo, ref }) => {
      try {
        const { data } = await getOctokit().repos.getCommit({ owner, repo, ref });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              sha: data.sha,
              message: data.commit.message,
              author: {
                name: data.commit.author?.name,
                email: data.commit.author?.email,
                date: data.commit.author?.date,
                login: data.author?.login,
              },
              stats: data.stats,
              files: data.files?.map((f) => ({
                filename: f.filename,
                status: f.status,
                additions: f.additions,
                deletions: f.deletions,
                changes: f.changes,
              })),
              url: data.html_url,
            }, null, 2),
          }],
        };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );
}
