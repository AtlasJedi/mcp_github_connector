import { Octokit } from "@octokit/rest";

let _octokit: Octokit | null = null;

export function getOctokit(): Octokit {
  if (!_octokit) {
    const token =
      process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    if (!token) {
      throw new Error(
        "GitHub token not found. Set GITHUB_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN environment variable."
      );
    }
    _octokit = new Octokit({ auth: token });
  }
  return _octokit;
}
