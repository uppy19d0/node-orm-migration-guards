import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const rootDirectory = process.cwd();
const packageDirectory = path.join(rootDirectory, "packages");

function git(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function tryGit(args) {
  try {
    return git(args);
  } catch {
    return "";
  }
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function readPackageAt(ref, packagePath) {
  if (!ref) {
    return null;
  }

  const content = tryGit(["show", `${ref}:${packagePath}`]);
  return content ? JSON.parse(content) : null;
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version);

  if (!match) {
    throw new Error(`Invalid SemVer version: ${version}`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

function compareVersions(current, previous) {
  const currentParts = parseVersion(current);
  const previousParts = parseVersion(previous);

  for (const part of ["major", "minor", "patch"]) {
    if (currentParts[part] > previousParts[part]) {
      return 1;
    }

    if (currentParts[part] < previousParts[part]) {
      return -1;
    }
  }

  return 0;
}

function getBumpType(current, previous) {
  const currentParts = parseVersion(current);
  const previousParts = parseVersion(previous);

  if (currentParts.major > previousParts.major) {
    return "major";
  }

  if (currentParts.minor > previousParts.minor) {
    return "minor";
  }

  if (currentParts.patch > previousParts.patch) {
    return "patch";
  }

  return "none";
}

function getBaseRef() {
  if (process.env.GITHUB_BASE_REF) {
    const baseRef = `origin/${process.env.GITHUB_BASE_REF}`;
    tryGit(["fetch", "origin", process.env.GITHUB_BASE_REF, "--depth=1"]);
    return baseRef;
  }

  if (tryGit(["rev-parse", "--verify", "HEAD^"])) {
    return "HEAD^";
  }

  return "";
}

function getChangedFiles(baseRef) {
  if (!baseRef) {
    return [];
  }

  return git(["diff", "--name-only", baseRef, "HEAD"])
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);
}

function normalizeForCompare(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeForCompare);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, normalizeForCompare(nestedValue)])
    );
  }

  return value;
}

function stable(value) {
  return JSON.stringify(normalizeForCompare(value));
}

function packagePublicFieldsChanged(currentPackage, previousPackage) {
  const publicFields = ["name", "type", "main", "module", "types", "exports", "engines", "peerDependencies"];

  return publicFields.some((field) => stable(currentPackage[field]) !== stable(previousPackage[field]));
}

function isPackageContent(relativeFile) {
  return (
    relativeFile === "README.md" ||
    relativeFile === "LICENSE" ||
    relativeFile === "package.json" ||
    relativeFile.startsWith("src/")
  );
}

function isPublicApiFile(relativeFile) {
  return relativeFile === "src/index.d.ts" || relativeFile === "src/index.js" || relativeFile === "src/index.cjs";
}

function getWorkspacePackages() {
  return readdirSync(packageDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const directory = path.join(packageDirectory, entry.name);
      const relativeDirectory = path.relative(rootDirectory, directory);
      const packagePath = path.join(relativeDirectory, "package.json");

      return {
        directory,
        relativeDirectory,
        packagePath,
        packageJson: readJson(path.join(directory, "package.json"))
      };
    })
    .sort((left, right) => left.packageJson.name.localeCompare(right.packageJson.name));
}

const rootPackage = readJson(path.join(rootDirectory, "package.json"));
const workspacePackages = getWorkspacePackages();
const corePackage = workspacePackages.find((workspacePackage) => workspacePackage.packageJson.name === "migration-guard-core");

if (!corePackage) {
  console.error("Missing migration-guard-core workspace package.");
  process.exit(1);
}

for (const workspacePackage of workspacePackages) {
  if (workspacePackage.packageJson.version !== rootPackage.version) {
    console.error(`${workspacePackage.packageJson.name} version ${workspacePackage.packageJson.version} must match root version ${rootPackage.version}.`);
    process.exit(1);
  }

  const coreDependency = workspacePackage.packageJson.dependencies?.["migration-guard-core"];
  if (workspacePackage.packageJson.name !== "migration-guard-core" && coreDependency !== corePackage.packageJson.version) {
    console.error(`${workspacePackage.packageJson.name} must depend on migration-guard-core@${corePackage.packageJson.version}. Current dependency: ${coreDependency || "(missing)"}.`);
    process.exit(1);
  }
}

const baseRef = getBaseRef();

if (!baseRef || !existsSync(".git")) {
  console.log("No previous git ref found. Skipping historical SemVer guard.");
  console.log("Workspace version consistency passed.");
  process.exit(0);
}

const changedFiles = getChangedFiles(baseRef);

for (const workspacePackage of workspacePackages) {
  const previousPackage = readPackageAt(baseRef, workspacePackage.packagePath);

  if (!previousPackage) {
    console.log(`${workspacePackage.packageJson.name}: no previous package.json found. Skipping package SemVer history.`);
    continue;
  }

  const changedPackageFiles = changedFiles
    .filter((file) => file.startsWith(`${workspacePackage.relativeDirectory}/`))
    .map((file) => file.slice(workspacePackage.relativeDirectory.length + 1));

  const packageContentChanged = changedPackageFiles.some(isPackageContent);
  const publicApiChanged =
    changedPackageFiles.some(isPublicApiFile) ||
    packagePublicFieldsChanged(workspacePackage.packageJson, previousPackage);

  const comparison = compareVersions(workspacePackage.packageJson.version, previousPackage.version);
  const bumpType = getBumpType(workspacePackage.packageJson.version, previousPackage.version);

  console.log(`${workspacePackage.packageJson.name}: previous=${previousPackage.version} current=${workspacePackage.packageJson.version} bump=${bumpType}`);

  if (packageContentChanged && comparison <= 0) {
    console.error(`${workspacePackage.packageJson.name}: package content changed, but package.json version did not increase.`);
    process.exit(1);
  }

  if (publicApiChanged && bumpType === "patch") {
    console.error(`${workspacePackage.packageJson.name}: public API changed in a patch release. Use at least a minor version bump.`);
    process.exit(1);
  }
}

console.log("SemVer guard passed.");

