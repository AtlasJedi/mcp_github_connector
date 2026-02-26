import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getOctokit } from "../github.js";

export function registerBranchTools(server: McpServer) {
  server.tool(
    "list_branches",
    "List branches in a GitHub repository",
    {
      owner: z.string(),
      repo: z.string(),
      per_page: z.number().int().min(1).max(100).optional(),
    },
    async ({ owner, repo, per_page = 30 }) => {
      try {
        const { data } = await getOctokit().repos.listBranches({
          owner,
          repo,
          per_page,
        });
        const branches = data.map((b) => ({
          name: b.name,
          protected: b.protected,
          sha: b.commit.sha,
        }));
        return { content: [{ type: "text", text: JSON.stringify(branches, null, 2) }] };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  server.tool(
    "get_branch",
    "Get details about a specific branch including its latest commit",
    {
      owner: z.string(),
      repo: z.string(),
      branch: z.string().describe("Branch name"),
    },
    async ({ owner, repo, branch }) => {
      try {
        const { data } = await getOctokit().repos.getBranch({
          owner,
          repo,
          branch,
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              name: data.name,
              protected: data.protected,
              commit: {
                sha: data.commit.sha,
                message: data.commit.commit.message,
                author: data.commit.commit.author?.name,
                date: data.commit.commit.author?.date,
              },
            }, null, 2),
          }],
        };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  server.tool(
    "create_branch",
    "Create a new branch in a GitHub repository",
    {
      owner: z.string(),
      repo: z.string(),
      branch: z.string().describe("New branch name"),
      from_branch: z
        .string()
        .optional()
        .describe("Source branch to branch from (defaults to default branch)"),
      sha: z
        .string()
        .optional()
        .describe("Exact SHA to branch from — takes precedence over from_branch"),
    },
    async ({ owner, repo, branch, from_branch, sha }) => {
      try {
        const octokit = getOctokit();
        let refSha = sha;

        if (!refSha) {
          const source =
            from_branch ||
            (await octokit.repos.get({ owner, repo })).data.default_branch;
          const { data: refData } = await octokit.git.getRef({
            owner,
            repo,
            ref: `heads/${source}`,
          });
          refSha = refData.object.sha;
        }

        await octokit.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branch}`,
          sha: refSha!,
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              message: `Branch '${branch}' created successfully!`,
              sha: refSha,
            }, null, 2),
          }],
        };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  server.tool(
    "delete_branch",
    "Delete a branch from a GitHub repository",
    {
      owner: z.string(),
      repo: z.string(),
      branch: z.string().describe("Branch name to delete"),
    },
    async ({ owner, repo, branch }) => {
      try {
        await getOctokit().git.deleteRef({
          owner,
          repo,
          ref: `heads/${branch}`,
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ message: `Branch '${branch}' deleted successfully!` }, null, 2),
          }],
        };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );
}
