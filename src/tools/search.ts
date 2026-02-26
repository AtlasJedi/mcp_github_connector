import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getOctokit } from "../github.js";

export function registerSearchTools(server: McpServer) {
  server.tool(
    "search_repositories",
    "Search GitHub repositories using GitHub's search syntax",
    {
      query: z
        .string()
        .describe(
          "Search query — supports GitHub syntax (e.g. 'rust async language:rust stars:>1000')"
        ),
      sort: z
        .enum(["stars", "forks", "help-wanted-issues", "updated"])
        .optional()
        .describe("Sort field"),
      order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
      per_page: z.number().int().min(1).max(100).optional(),
    },
    async ({ query, sort, order = "desc", per_page = 30 }) => {
      try {
        const { data } = await getOctokit().search.repos({
          q: query,
          sort,
          order,
          per_page,
        });

        const results = data.items.map((r) => ({
          name: r.full_name,
          description: r.description,
          stars: r.stargazers_count,
          forks: r.forks_count,
          language: r.language,
          updated_at: r.updated_at,
          url: r.html_url,
        }));

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ total_count: data.total_count, results }, null, 2),
          }],
        };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  server.tool(
    "search_code",
    "Search code across all public GitHub repositories",
    {
      query: z
        .string()
        .describe(
          "Code search query — supports GitHub syntax (e.g. 'useState repo:facebook/react')"
        ),
      per_page: z.number().int().min(1).max(100).optional(),
    },
    async ({ query, per_page = 30 }) => {
      try {
        const { data } = await getOctokit().search.code({
          q: query,
          per_page,
        });

        const results = data.items.map((item) => ({
          name: item.name,
          path: item.path,
          repository: item.repository.full_name,
          sha: item.sha,
          url: item.html_url,
        }));

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ total_count: data.total_count, results }, null, 2),
          }],
        };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  server.tool(
    "search_issues",
    "Search issues and pull requests across GitHub",
    {
      query: z
        .string()
        .describe(
          "Search query — supports GitHub syntax (e.g. 'is:issue is:open label:bug repo:owner/repo')"
        ),
      sort: z
        .enum(["comments", "reactions", "created", "updated"])
        .optional()
        .describe("Sort field"),
      order: z.enum(["asc", "desc"]).optional(),
      per_page: z.number().int().min(1).max(100).optional(),
    },
    async ({ query, sort, order = "desc", per_page = 30 }) => {
      try {
        const { data } = await getOctokit().search.issuesAndPullRequests({
          q: query,
          sort,
          order,
          per_page,
        });

        const results = data.items.map((item) => ({
          number: item.number,
          title: item.title,
          state: item.state,
          type: item.pull_request ? "pull_request" : "issue",
          author: item.user?.login,
          comments: item.comments,
          created_at: item.created_at,
          url: item.html_url,
        }));

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ total_count: data.total_count, results }, null, 2),
          }],
        };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );
}
