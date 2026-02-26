import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getOctokit } from "../github.js";

export function registerPullRequestTools(server: McpServer) {
  server.tool(
    "list_pull_requests",
    "List pull requests in a GitHub repository",
    {
      owner: z.string(),
      repo: z.string(),
      state: z.enum(["open", "closed", "all"]).optional().describe("PR state filter"),
      per_page: z.number().int().min(1).max(100).optional(),
    },
    async ({ owner, repo, state = "open", per_page = 30 }) => {
      try {
        const { data } = await getOctokit().pulls.list({
          owner,
          repo,
          state,
          per_page,
        });

        const result = data.map((pr) => ({
          number: pr.number,
          title: pr.title,
          state: pr.state,
          author: pr.user?.login,
          head: pr.head.ref,
          base: pr.base.ref,
          draft: pr.draft,
          created_at: pr.created_at,
          updated_at: pr.updated_at,
          url: pr.html_url,
        }));

        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  server.tool(
    "get_pull_request",
    "Get full details about a specific pull request including diff stats",
    {
      owner: z.string(),
      repo: z.string(),
      pull_number: z.number().int().describe("Pull request number"),
    },
    async ({ owner, repo, pull_number }) => {
      try {
        const { data } = await getOctokit().pulls.get({
          owner,
          repo,
          pull_number,
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              number: data.number,
              title: data.title,
              body: data.body,
              state: data.state,
              author: data.user?.login,
              head: data.head.ref,
              base: data.base.ref,
              draft: data.draft,
              mergeable: data.mergeable,
              commits: data.commits,
              additions: data.additions,
              deletions: data.deletions,
              changed_files: data.changed_files,
              created_at: data.created_at,
              updated_at: data.updated_at,
              merged_at: data.merged_at,
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

  server.tool(
    "create_pull_request",
    "Open a new pull request",
    {
      owner: z.string(),
      repo: z.string(),
      title: z.string().describe("PR title"),
      head: z.string().describe("Branch that contains your changes"),
      base: z.string().describe("Branch you want to merge into"),
      body: z.string().optional().describe("PR description — supports Markdown"),
      draft: z.boolean().optional().describe("Open as a draft PR"),
    },
    async ({ owner, repo, title, head, base, body, draft = false }) => {
      try {
        const { data } = await getOctokit().pulls.create({
          owner,
          repo,
          title,
          head,
          base,
          body,
          draft,
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              message: `Pull request #${data.number} created successfully!`,
              number: data.number,
              title: data.title,
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

  server.tool(
    "merge_pull_request",
    "Merge an open pull request",
    {
      owner: z.string(),
      repo: z.string(),
      pull_number: z.number().int(),
      merge_method: z
        .enum(["merge", "squash", "rebase"])
        .optional()
        .describe("Merge strategy"),
      commit_title: z.string().optional().describe("Title for the merge commit"),
      commit_message: z
        .string()
        .optional()
        .describe("Extra detail in the merge commit message"),
    },
    async ({
      owner,
      repo,
      pull_number,
      merge_method = "merge",
      commit_title,
      commit_message,
    }) => {
      try {
        const { data } = await getOctokit().pulls.merge({
          owner,
          repo,
          pull_number,
          merge_method,
          commit_title,
          commit_message,
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              merged: data.merged,
              message: data.message,
              sha: data.sha,
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
