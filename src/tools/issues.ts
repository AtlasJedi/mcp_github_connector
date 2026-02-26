import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getOctokit } from "../github.js";

export function registerIssueTools(server: McpServer) {
  server.tool(
    "list_issues",
    "List issues in a GitHub repository with optional filters",
    {
      owner: z.string().describe("Repository owner"),
      repo: z.string().describe("Repository name"),
      state: z
        .enum(["open", "closed", "all"])
        .optional()
        .describe("Filter by state"),
      labels: z
        .string()
        .optional()
        .describe("Comma-separated list of label names"),
      per_page: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Results per page"),
    },
    async ({ owner, repo, state = "open", labels, per_page = 30 }) => {
      try {
        const { data } = await getOctokit().issues.listForRepo({
          owner,
          repo,
          state,
          labels,
          per_page,
        });

        // GitHub returns PRs in the issues endpoint — filter them out
        const issues = data
          .filter((i) => !i.pull_request)
          .map((i) => ({
            number: i.number,
            title: i.title,
            state: i.state,
            labels: i.labels.map((l: unknown) => (l as { name?: string }).name),
            assignees: i.assignees?.map((a) => a.login),
            comments: i.comments,
            created_at: i.created_at,
            updated_at: i.updated_at,
            url: i.html_url,
          }));

        return { content: [{ type: "text", text: JSON.stringify(issues, null, 2) }] };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  server.tool(
    "get_issue",
    "Get full details of a specific issue including body and metadata",
    {
      owner: z.string(),
      repo: z.string(),
      issue_number: z.number().int().describe("Issue number"),
    },
    async ({ owner, repo, issue_number }) => {
      try {
        const { data } = await getOctokit().issues.get({
          owner,
          repo,
          issue_number,
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
              labels: data.labels.map((l: unknown) => (l as { name?: string }).name),
              assignees: data.assignees?.map((a) => a.login),
              comments: data.comments,
              created_at: data.created_at,
              updated_at: data.updated_at,
              closed_at: data.closed_at,
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
    "create_issue",
    "Create a new issue in a GitHub repository",
    {
      owner: z.string(),
      repo: z.string(),
      title: z.string().describe("Issue title"),
      body: z.string().optional().describe("Issue body — supports Markdown"),
      labels: z.array(z.string()).optional().describe("Label names to apply"),
      assignees: z
        .array(z.string())
        .optional()
        .describe("GitHub usernames to assign"),
    },
    async ({ owner, repo, title, body, labels, assignees }) => {
      try {
        const { data } = await getOctokit().issues.create({
          owner,
          repo,
          title,
          body,
          labels,
          assignees,
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              message: `Issue #${data.number} created successfully!`,
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
    "update_issue",
    "Update an existing issue — change title, body, state, labels or assignees",
    {
      owner: z.string(),
      repo: z.string(),
      issue_number: z.number().int(),
      title: z.string().optional().describe("New title"),
      body: z.string().optional().describe("New body"),
      state: z.enum(["open", "closed"]).optional().describe("New state"),
      labels: z
        .array(z.string())
        .optional()
        .describe("Replace all labels with these"),
      assignees: z
        .array(z.string())
        .optional()
        .describe("Replace all assignees with these"),
    },
    async ({ owner, repo, issue_number, title, body, state, labels, assignees }) => {
      try {
        const { data } = await getOctokit().issues.update({
          owner,
          repo,
          issue_number,
          title,
          body,
          state,
          labels,
          assignees,
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              message: `Issue #${data.number} updated!`,
              number: data.number,
              title: data.title,
              state: data.state,
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
    "add_issue_comment",
    "Add a comment to a GitHub issue or pull request",
    {
      owner: z.string(),
      repo: z.string(),
      issue_number: z.number().int(),
      body: z.string().describe("Comment text — supports Markdown"),
    },
    async ({ owner, repo, issue_number, body }) => {
      try {
        const { data } = await getOctokit().issues.createComment({
          owner,
          repo,
          issue_number,
          body,
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              message: "Comment added successfully!",
              comment_id: data.id,
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
