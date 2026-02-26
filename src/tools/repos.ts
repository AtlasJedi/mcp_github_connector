import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getOctokit } from "../github.js";

export function registerRepoTools(server: McpServer) {
  server.tool(
    "list_repos",
    "List GitHub repositories for the authenticated user or a specific user",
    {
      username: z
        .string()
        .optional()
        .describe("GitHub username (defaults to authenticated user)"),
      type: z
        .enum(["all", "owner", "public", "private", "member"])
        .optional()
        .describe("Type of repos to list"),
      sort: z
        .enum(["created", "updated", "pushed", "full_name"])
        .optional()
        .describe("Sort order"),
      per_page: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Results per page (max 100)"),
    },
    async ({ username, type = "all", sort = "updated", per_page = 30 }) => {
      try {
        const octokit = getOctokit();
        let repos;
        if (username) {
          const { data } = await octokit.repos.listForUser({
            username,
            type: (type === "all" || type === "private" ? "owner" : type) as "owner" | "member" | "all",
            sort,
            per_page,
          });
          repos = data;
        } else {
          const { data } = await octokit.repos.listForAuthenticatedUser({
            type,
            sort,
            per_page,
          });
          repos = data;
        }

        const result = repos.map((r) => ({
          name: r.full_name,
          description: r.description,
          stars: r.stargazers_count,
          forks: r.forks_count,
          language: r.language,
          private: r.private,
          updated_at: r.updated_at,
          url: r.html_url,
        }));

        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  server.tool(
    "get_repo",
    "Get detailed information about a specific GitHub repository",
    {
      owner: z.string().describe("Repository owner (username or organization)"),
      repo: z.string().describe("Repository name"),
    },
    async ({ owner, repo }) => {
      try {
        const { data } = await getOctokit().repos.get({ owner, repo });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              name: data.full_name,
              description: data.description,
              stars: data.stargazers_count,
              forks: data.forks_count,
              watchers: data.watchers_count,
              open_issues: data.open_issues_count,
              language: data.language,
              private: data.private,
              default_branch: data.default_branch,
              topics: data.topics,
              license: data.license?.name,
              created_at: data.created_at,
              updated_at: data.updated_at,
              pushed_at: data.pushed_at,
              url: data.html_url,
              clone_url: data.clone_url,
              ssh_url: data.ssh_url,
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
    "create_repo",
    "Create a new GitHub repository",
    {
      name: z.string().describe("Repository name"),
      description: z.string().optional().describe("Short description"),
      private: z.boolean().optional().describe("Make the repository private"),
      auto_init: z.boolean().optional().describe("Initialize with a README"),
      gitignore_template: z
        .string()
        .optional()
        .describe("Gitignore template to apply (e.g. 'Node', 'Python')"),
      license_template: z
        .string()
        .optional()
        .describe("License template (e.g. 'mit', 'apache-2.0')"),
    },
    async ({
      name,
      description,
      private: isPrivate = false,
      auto_init = true,
      gitignore_template,
      license_template,
    }) => {
      try {
        const { data } = await getOctokit().repos.createForAuthenticatedUser({
          name,
          description,
          private: isPrivate,
          auto_init,
          gitignore_template,
          license_template,
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              message: `Repository '${data.full_name}' created successfully!`,
              url: data.html_url,
              clone_url: data.clone_url,
              ssh_url: data.ssh_url,
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
    "fork_repo",
    "Fork a GitHub repository to your account or an organization",
    {
      owner: z.string().describe("Repository owner"),
      repo: z.string().describe("Repository name"),
      organization: z
        .string()
        .optional()
        .describe("Target organization (defaults to your account)"),
    },
    async ({ owner, repo, organization }) => {
      try {
        const { data } = await getOctokit().repos.createFork({
          owner,
          repo,
          organization,
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              message: `Forked '${owner}/${repo}' successfully!`,
              fork_name: data.full_name,
              fork_url: data.html_url,
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
    "delete_repo",
    "Permanently delete a GitHub repository — this action is IRREVERSIBLE",
    {
      owner: z.string().describe("Repository owner"),
      repo: z.string().describe("Repository name"),
    },
    async ({ owner, repo }) => {
      try {
        await getOctokit().repos.delete({ owner, repo });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              message: `Repository '${owner}/${repo}' has been permanently deleted.`,
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
