import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getOctokit } from "../github.js";

export function registerUserTools(server: McpServer) {
  server.tool(
    "get_authenticated_user",
    "Get the profile of the currently authenticated GitHub user",
    {},
    async () => {
      try {
        const { data } = await getOctokit().users.getAuthenticated();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              login: data.login,
              name: data.name,
              email: data.email,
              bio: data.bio,
              company: data.company,
              location: data.location,
              public_repos: data.public_repos,
              public_gists: data.public_gists,
              followers: data.followers,
              following: data.following,
              created_at: data.created_at,
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
    "get_user",
    "Get the public profile of any GitHub user",
    {
      username: z.string().describe("GitHub username"),
    },
    async ({ username }) => {
      try {
        const { data } = await getOctokit().users.getByUsername({ username });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              login: data.login,
              name: data.name,
              bio: data.bio,
              company: data.company,
              location: data.location,
              public_repos: data.public_repos,
              followers: data.followers,
              following: data.following,
              created_at: data.created_at,
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
