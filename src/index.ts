#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerRepoTools } from "./tools/repos.js";
import { registerIssueTools } from "./tools/issues.js";
import { registerPullRequestTools } from "./tools/pulls.js";
import { registerFileTools } from "./tools/files.js";
import { registerBranchTools } from "./tools/branches.js";
import { registerCommitTools } from "./tools/commits.js";
import { registerSearchTools } from "./tools/search.js";
import { registerUserTools } from "./tools/users.js";

const server = new McpServer({
  name: "github-mcp-server",
  version: "1.0.0",
});

registerRepoTools(server);
registerIssueTools(server);
registerPullRequestTools(server);
registerFileTools(server);
registerBranchTools(server);
registerCommitTools(server);
registerSearchTools(server);
registerUserTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
