import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const registry = "https://registry.npmjs.org";
const rootDirectory = process.cwd();
const packageDirectory = path.join(rootDirectory, "packages");
const args = new Set(process.argv.slice(2));

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function run(command, commandArgs, options = {}) {
  return execFileSync(command, commandArgs, {
    cwd: rootDirectory,
    encoding: "utf8",
    stdio: options.stdio || ["ignore", "pipe", "pipe"],
    env: process.env
  });
}

function getWorkspacePackages() {
  const packages = readdirSync(packageDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const directory = path.join(packageDirectory, entry.name);
      const relativeDirectory = path.relative(rootDirectory, directory);
      const packageJson = readJson(path.join(directory, "package.json"));

      return {
        directory,
        relativeDirectory,
        name: packageJson.name,
        version: packageJson.version,
        packageJson
      };
    });

  return packages.sort((left, right) => {
    if (left.name === "migration-guard-core") {
      return -1;
    }

    if (right.name === "migration-guard-core") {
      return 1;
    }

    return left.name.localeCompare(right.name);
  });
}

function packageVersionExists(packageName, version) {
  try {
    run("npm", ["view", `${packageName}@${version}`, "version", `--registry=${registry}`]);
    return true;
  } catch (error) {
    const output = `${error.stdout || ""}\n${error.stderr || ""}`;
    if (output.includes("E404") || output.includes("404 Not Found")) {
      return false;
    }

    throw error;
  }
}

function getPackageStatuses() {
  return getWorkspacePackages().map((workspacePackage) => ({
    ...workspacePackage,
    published: packageVersionExists(workspacePackage.name, workspacePackage.version)
  }));
}

function printStatus(statuses) {
  for (const workspacePackage of statuses) {
    const state = workspacePackage.published ? "published" : "unpublished";
    console.log(`${workspacePackage.name}@${workspacePackage.version}: ${state}`);
  }
}

function writeGitHubOutput(statuses, outputFile) {
  if (!outputFile) {
    return;
  }

  const unpublished = statuses.filter((workspacePackage) => !workspacePackage.published);
  appendFileSync(outputFile, `unpublished_count=${unpublished.length}\n`);
  appendFileSync(outputFile, `unpublished=${unpublished.map((workspacePackage) => workspacePackage.name).join(",")}\n`);
}

function verifyPublished(statuses) {
  for (const workspacePackage of statuses) {
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      if (packageVersionExists(workspacePackage.name, workspacePackage.version)) {
        console.log(`${workspacePackage.name}@${workspacePackage.version} is visible on npm.`);
        break;
      }

      if (attempt === 6) {
        throw new Error(`${workspacePackage.name}@${workspacePackage.version} was not visible on npm after retries.`);
      }

      console.log(`npm registry has not exposed ${workspacePackage.name}@${workspacePackage.version} yet. Retry ${attempt}/6...`);
      run("node", ["-e", "setTimeout(() => {}, 10000)"]);
    }
  }
}

function publishUnpublished(statuses) {
  const unpublished = statuses.filter((workspacePackage) => !workspacePackage.published);

  if (unpublished.length === 0) {
    console.log("All workspace package versions already exist on npm. Nothing to publish.");
    return;
  }

  run("npm", ["whoami", `--registry=${registry}`], { stdio: "inherit" });

  for (const workspacePackage of unpublished) {
    const publishArgs = [
      "publish",
      "--workspace",
      workspacePackage.relativeDirectory,
      "--access",
      "public",
      `--registry=${registry}`
    ];

    if (args.has("--provenance") || process.env.GITHUB_ACTIONS === "true") {
      publishArgs.push("--provenance");
    }

    console.log(`Publishing ${workspacePackage.name}@${workspacePackage.version}...`);
    run("npm", publishArgs, { stdio: "inherit" });
  }
}

function main() {
  const outputIndex = process.argv.indexOf("--github-output");
  const githubOutputFile = outputIndex >= 0 ? process.argv[outputIndex + 1] : "";
  const statuses = getPackageStatuses();

  printStatus(statuses);
  writeGitHubOutput(statuses, githubOutputFile);

  if (args.has("--verify")) {
    verifyPublished(statuses);
  } else if (args.has("--publish")) {
    publishUnpublished(statuses);
  }
}

try {
  main();
} catch (error) {
  if (error?.status) {
    console.error("Publish workflow stopped before completion. See the npm error above.");
    process.exit(error.status);
  }

  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
