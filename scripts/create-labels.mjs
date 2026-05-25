import fs from "node:fs";
import { execSync } from "node:child_process";

const labels = JSON.parse(fs.readFileSync(new URL("../.github/labels.json", import.meta.url), "utf8"));

for (const label of labels) {
  const cmd = `gh label create "${label.name}" --color "${label.color}" --description "${label.description}" --force`;
  execSync(cmd, { stdio: "inherit" });
}

console.log("Labels synchronized.");
