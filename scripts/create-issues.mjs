import fs from "node:fs";
import { execSync } from "node:child_process";

const issues = JSON.parse(fs.readFileSync(new URL("../.github/issues.json", import.meta.url), "utf8"));

for (const issue of issues) {
  const labels = issue.labels.join(",");
  const cmd = `gh issue create --title "${issue.title}" --body-file "${issue.bodyFile}" --label "${labels}"`;
  execSync(cmd, { stdio: "inherit" });
}

console.log("Issues created.");
