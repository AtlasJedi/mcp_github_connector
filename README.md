<div align="center">

# github-mcp-server

**Talk to GitHub with natural language — powered by the Model Context Protocol**

[![npm version](https://img.shields.io/npm/v/github-mcp-server?style=flat-square&color=cb3837&logo=npm)](https://www.npmjs.com/package/github-mcp-server)
[![GitHub](https://img.shields.io/badge/GitHub-AtlasJedi%2Fmcp__github__connector-181717?style=flat-square&logo=github)](https://github.com/AtlasJedi/mcp_github_connector)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/MCP-compatible-6f42c1?style=flat-square)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

</div>

---

`github-mcp-server` is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that exposes the GitHub API as a set of AI-callable tools. Connect it to Claude, Cursor, Windsurf, or any MCP-compatible client and start managing your repositories, issues, pull requests, branches, and files using plain English — no GitHub UI, no manual API calls.

> **"List my open issues" • "Create a PR from feature-branch to main" • "What changed in the last 5 commits?"**

---

## How it works

```
You (natural language prompt)
        │
        ▼
AI Client  ─────────────────────────────────────────  Claude Desktop
(MCP host)                                            Cursor / Windsurf
        │                                             VS Code + Copilot
        │  MCP protocol over stdio
        ▼
github-mcp-server  (this project, runs locally)
        │
        │  GitHub REST API  (authenticated with your token)
        ▼
GitHub
```

The server runs as a **local subprocess** that your AI client spawns automatically when you start a conversation. It communicates over **stdio** — no ports, no cloud services, no proxies. Your GitHub Personal Access Token never leaves your machine.

---

## Features

**26 tools across 8 categories:**

- **Repositories** — list, inspect, create, fork, delete
- **Issues** — list, read, create, update, comment
- **Pull Requests** — list, inspect, open, merge
- **Files & Content** — read files, list directories, write & delete with commits
- **Branches** — list, inspect, create, delete
- **Commits** — browse history, inspect diffs and stats
- **Search** — repositories, code, issues & PRs with full GitHub search syntax
- **Users** — your profile or any public user

---

## Quick Start

### 1. Get a GitHub Personal Access Token

Go to **[GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)** and generate a classic token or a fine-grained token with the scopes you need.

| Scope | Needed for |
|---|---|
| `repo` | Private repos, files, branches, PRs |
| `public_repo` | Public repositories only |
| `read:user` | User profile lookup |

### 2. Configure your AI client

**Claude Desktop** — edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "github-mcp-server"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

**Cursor / Windsurf** — edit `.cursor/mcp.json` or `.windsurf/mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "github-mcp-server"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

**VS Code (GitHub Copilot)** — add to your `settings.json`:

```json
{
  "mcp": {
    "servers": {
      "github": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "github-mcp-server"],
        "env": {
          "GITHUB_TOKEN": "ghp_your_token_here"
        }
      }
    }
  }
}
```

### 3. Restart your AI client — that's it

The server starts automatically on demand. No daemon, no background process.

---

## Installation

### Zero-install via npx _(recommended)_

No global install needed. Your client config handles this:

```bash
GITHUB_TOKEN=ghp_... npx github-mcp-server
```

### Global install via npm

```bash
npm install -g github-mcp-server
GITHUB_TOKEN=ghp_... github-mcp-server
```

### From source

```bash
git clone https://github.com/AtlasJedi/mcp_github_connector
cd github-mcp-server
npm install
npm run build
GITHUB_TOKEN=ghp_... npm start
```

---

## Available Tools

### Repositories

| Tool | Description |
|---|---|
| `list_repos` | List repositories for yourself or another user |
| `get_repo` | Inspect a repository — stars, language, topics, URLs |
| `create_repo` | Create a new public or private repository |
| `fork_repo` | Fork any repository to your account or an org |
| `delete_repo` | Permanently delete a repository |

### Issues

| Tool | Description |
|---|---|
| `list_issues` | List open/closed issues with label and state filters |
| `get_issue` | Read full issue body and metadata |
| `create_issue` | Open a new issue with labels and assignees |
| `update_issue` | Edit title, body, state, labels, or assignees |
| `add_issue_comment` | Post a comment on any issue or PR |

### Pull Requests

| Tool | Description |
|---|---|
| `list_pull_requests` | List open, closed, or all PRs |
| `get_pull_request` | Read PR body, diff stats, and merge status |
| `create_pull_request` | Open a PR from one branch to another |
| `merge_pull_request` | Merge via merge commit, squash, or rebase |

### Files & Content

| Tool | Description |
|---|---|
| `get_file_contents` | Read a file or list a directory at any ref |
| `create_or_update_file` | Write a file — creates a commit automatically |
| `delete_file` | Remove a file — creates a commit automatically |

### Branches

| Tool | Description |
|---|---|
| `list_branches` | List all branches |
| `get_branch` | Inspect a branch and its latest commit |
| `create_branch` | Branch from any branch or SHA |
| `delete_branch` | Delete a branch |

### Commits

| Tool | Description |
|---|---|
| `list_commits` | Browse commit history with optional path filter |
| `get_commit` | View a commit's message, author, and file diffs |

### Search

| Tool | Description |
|---|---|
| `search_repositories` | Search repos with full GitHub search syntax |
| `search_code` | Search code across all public repositories |
| `search_issues` | Search issues and PRs across GitHub |

### Users

| Tool | Description |
|---|---|
| `get_authenticated_user` | Your own GitHub profile |
| `get_user` | Any user's public profile |

---

## Example Prompts

Once connected, try these in your AI client:

```
What are my most recently updated repositories?
```

```
Create an issue in myorg/myrepo titled "Fix the login timeout" with the label "bug"
```

```
Show me all open PRs in facebook/react
```

```
Create a pull request from feature/new-auth to main — write a description based on the branch name
```

```
What files changed in the last commit on the main branch of myorg/myrepo?
```

```
Search for TypeScript MCP server repositories sorted by stars
```

```
Create a new file at docs/guide.md in myrepo with the content "# Guide\n\nWelcome."
```

---

## Security

- Your token is passed via environment variable and never logged or transmitted anywhere except the GitHub API.
- The server process exits when your AI client session ends.
- Use fine-grained tokens with the minimum required scopes for your workflow.

---

## Contributing

Issues and PRs are welcome.

```bash
git clone https://github.com/AtlasJedi/mcp_github_connector
cd github-mcp-server
npm install
npm run dev   # runs directly with tsx, no build step needed
```

---

## License

MIT © 2025
