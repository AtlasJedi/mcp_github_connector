import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getOctokit } from "../github.js";

export function registerFileTools(server: McpServer) {
  server.tool(
    "get_file_contents",
    "Read a file or list a directory in a GitHub repository",
    {
      owner: z.string(),
      repo: z.string(),
      path: z.string().describe("File or directory path (e.g. 'src/index.ts' or 'src/')"),
      ref: z
        .string()
        .optional()
        .describe("Branch, tag, or commit SHA (defaults to default branch)"),
    },
    async ({ owner, repo, path, ref }) => {
      try {
        const { data } = await getOctokit().repos.getContent({
          owner,
          repo,
          path,
          ref,
        });

        if (Array.isArray(data)) {
          const listing = data.map((item) => ({
            name: item.name,
            type: item.type,
            size: item.size,
            path: item.path,
            sha: item.sha,
          }));
          return { content: [{ type: "text", text: JSON.stringify(listing, null, 2) }] };
        }

        if (data.type === "file") {
          const content =
            data.encoding === "base64"
              ? Buffer.from(data.content, "base64").toString("utf-8")
              : data.content;
          return {
            content: [{
              type: "text",
              text: JSON.stringify(
                { name: data.name, path: data.path, sha: data.sha, size: data.size, content },
                null,
                2
              ),
            }],
          };
        }

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  server.tool(
    "create_or_update_file",
    "Create or update a file in a GitHub repository (creates a commit)",
    {
      owner: z.string(),
      repo: z.string(),
      path: z.string().describe("File path in the repository (e.g. 'src/hello.ts')"),
      content: z.string().describe("File content as plain text"),
      message: z.string().describe("Commit message"),
      branch: z
        .string()
        .optional()
        .describe("Target branch (defaults to the repository's default branch)"),
      sha: z
        .string()
        .optional()
        .describe(
          "SHA of the file being replaced — required for updates, auto-fetched if omitted"
        ),
    },
    async ({ owner, repo, path, content, message, branch, sha }) => {
      try {
        const octokit = getOctokit();
        let fileSha = sha;

        // Auto-fetch SHA if not provided (needed for updates)
        if (!fileSha) {
          try {
            const { data } = await octokit.repos.getContent({
              owner,
              repo,
              path,
              ref: branch,
            });
            if (!Array.isArray(data) && data.type === "file") {
              fileSha = data.sha;
            }
          } catch {
            // File does not exist yet — creating new
          }
        }

        const encoded = Buffer.from(content, "utf-8").toString("base64");
        const { data } = await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path,
          message,
          content: encoded,
          branch,
          sha: fileSha,
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              message: `File '${path}' ${fileSha ? "updated" : "created"} successfully!`,
              commit: {
                sha: data.commit.sha,
                message: data.commit.message,
                url: data.commit.html_url,
              },
              file: {
                path: data.content?.path,
                sha: data.content?.sha,
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
    "delete_file",
    "Delete a file from a GitHub repository (creates a commit)",
    {
      owner: z.string(),
      repo: z.string(),
      path: z.string().describe("Path of the file to delete"),
      message: z.string().describe("Commit message"),
      sha: z
        .string()
        .optional()
        .describe("SHA of the file — auto-fetched if omitted"),
      branch: z.string().optional().describe("Branch to delete from"),
    },
    async ({ owner, repo, path, message, sha, branch }) => {
      try {
        const octokit = getOctokit();
        let fileSha = sha;

        if (!fileSha) {
          const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path,
            ref: branch,
          });
          if (!Array.isArray(data) && data.type === "file") {
            fileSha = data.sha;
          } else {
            throw new Error("Path does not point to a file");
          }
        }

        await octokit.repos.deleteFile({
          owner,
          repo,
          path,
          message,
          sha: fileSha!,
          branch,
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ message: `File '${path}' deleted successfully!` }, null, 2),
          }],
        };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );
}
