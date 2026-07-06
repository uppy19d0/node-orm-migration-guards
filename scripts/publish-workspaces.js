import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const registry = "https://registry.npmjs.org";
const rootDirectory = process.cwd();
const packageDirectory = path.join(rootDirectory, "packages");
const args = new Set(process.argv.slice(2));
const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

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

function commandLabel(command, commandArgs) {
  return [command, ...commandArgs].join(" ");
}

function logGroup(title, callback) {
  if (isGitHubActions) {
    console.log(`::group::${title}`);
  } else {
    console.log(`\n== ${title} ==`);
  }

  try {
    return callback();
  } finally {
    if (isGitHubActions) {
      console.log("::endgroup::");
    }
  }
}

function getNpmVersion() {
  try {
    return run("npm", ["--version"]).trim();
  } catch {
    return "unknown";
  }
}

function printRunContext(workspacePackages) {
  logGroup("Publish script context", () => {
    console.log(`Mode: ${args.has("--publish") ? "publish" : args.has("--verify") ? "verify" : "check"}`);
    console.log(`Registry: ${registry}`);
    console.log(`Working directory: ${rootDirectory}`);
    console.log(`Node.js: ${process.version}`);
    console.log(`npm: ${getNpmVersion()}`);
    console.log(`GitHub Actions: ${isGitHubActions ? "yes" : "no"}`);
    console.log(`NODE_AUTH_TOKEN present: ${process.env.NODE_AUTH_TOKEN ? "yes" : "no"}`);
    console.log(`Workspace packages: ${workspacePackages.length}`);
    console.log("Publish order:");
    workspacePackages.forEach((workspacePackage, index) => {
      console.log(`  ${index + 1}. ${workspacePackage.name}@${workspacePackage.version} (${workspacePackage.relativeDirectory})`);
    });
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
  const spec = `${packageName}@${version}`;
  const viewArgs = ["view", spec, "version", `--registry=${registry}`];
  console.log(`Checking npm: ${commandLabel("npm", viewArgs)}`);

  try {
    const publishedVersion = run("npm", viewArgs).trim();
    console.log(`Found on npm: ${spec} -> ${publishedVersion}`);
    return true;
  } catch (error) {
    const output = `${error.stdout || ""}\n${error.stderr || ""}`;
    if (output.includes("E404") || output.includes("404 Not Found")) {
      console.log(`Not found on npm: ${spec}`);
      return false;
    }

    console.error(`Unexpected npm view failure for ${spec}.`);
    if (error.stdout) {
      console.error("npm stdout:");
      console.error(String(error.stdout).trim());
    }
    if (error.stderr) {
      console.error("npm stderr:");
      console.error(String(error.stderr).trim());
    }

    throw error;
  }
}

function getPackageStatuses() {
  const workspacePackages = getWorkspacePackages();
  printRunContext(workspacePackages);

  return logGroup("npm registry version check", () =>
    workspacePackages.map((workspacePackage) => ({
      ...workspacePackage,
      published: packageVersionExists(workspacePackage.name, workspacePackage.version)
    }))
  );
}

function printStatus(statuses) {
  logGroup("Workspace publish status", () => {
    const unpublished = statuses.filter((workspacePackage) => !workspacePackage.published);
    const published = statuses.filter((workspacePackage) => workspacePackage.published);

    console.log("| Package | Version | Directory | npm status |");
    console.log("| --- | --- | --- | --- |");
    for (const workspacePackage of statuses) {
      const state = workspacePackage.published ? "published" : "unpublished";
      console.log(`| ${workspacePackage.name} | ${workspacePackage.version} | ${workspacePackage.relativeDirectory} | ${state} |`);
    }

    console.log("");
    console.log(`Published at this version: ${published.length}`);
    console.log(`Pending publish: ${unpublished.length}`);
    if (unpublished.length > 0) {
      console.log(`Pending packages: ${unpublished.map((workspacePackage) => workspacePackage.name).join(", ")}`);
    }
  });

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
  appendFileSync(outputFile, `checked_count=${statuses.length}\n`);
  appendFileSync(outputFile, `registry=${registry}\n`);
}

function verifyPublished(statuses) {
  logGroup("Published package verification", () => {
    for (const workspacePackage of statuses) {
      for (let attempt = 1; attempt <= 6; attempt += 1) {
        console.log(`Verify attempt ${attempt}/6 for ${workspacePackage.name}@${workspacePackage.version}`);
        if (packageVersionExists(workspacePackage.name, workspacePackage.version)) {
          console.log(`${workspacePackage.name}@${workspacePackage.version} is visible on npm.`);
          break;
        }

        if (attempt === 6) {
          throw new Error(`${workspacePackage.name}@${workspacePackage.version} was not visible on npm after retries.`);
        }

        console.log(`npm registry has not exposed ${workspacePackage.name}@${workspacePackage.version} yet. Waiting 10s...`);
        run("node", ["-e", "setTimeout(() => {}, 10000)"]);
      }
    }
  });
}

function publishUnpublished(statuses) {
  const unpublished = statuses.filter((workspacePackage) => !workspacePackage.published);

  if (unpublished.length === 0) {
    console.log("All workspace package versions already exist on npm. Nothing to publish.");
    return;
  }

  logGroup("npm authentication check", () => {
    console.log(`Running npm whoami against ${registry}.`);
    console.log(`NODE_AUTH_TOKEN present: ${process.env.NODE_AUTH_TOKEN ? "yes" : "no"}`);
    if (!process.env.NODE_AUTH_TOKEN && isGitHubActions) {
      console.log("NODE_AUTH_TOKEN is missing in GitHub Actions. Confirm the NPM_TOKEN repository secret exists and the environment allows access to it.");
    }
  });

  run("npm", ["whoami", `--registry=${registry}`], { stdio: "inherit" });

  logGroup("npm publish", () => {
    for (const workspacePackage of unpublished) {
      const publishArgs = [
        "publish",
        "--workspace",
        workspacePackage.relativeDirectory,
        "--access",
        "public",
        `--registry=${registry}`
      ];

      if (args.has("--provenance") || isGitHubActions) {
        publishArgs.push("--provenance");
      } else {
        publishArgs.push("--provenance=false");
      }

      console.log(`Publishing ${workspacePackage.name}@${workspacePackage.version}.`);
      console.log(`Command: ${commandLabel("npm", publishArgs)}`);
      run("npm", publishArgs, { stdio: "inherit" });
      console.log(`Publish command completed for ${workspacePackage.name}@${workspacePackage.version}.`);
    }
  });
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
