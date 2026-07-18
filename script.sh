#!/usr/bin/env bash
set -Eeuo pipefail

readonly registry="https://registry.npmjs.org"
readonly package_name="@imisbahk/mstack"

die() {
  printf 'release: %s\n' "$1" >&2
  exit 1
}

on_error() {
  local status=$?
  printf 'release: failed (exit %s). No automatic rollback was attempted.\n' "$status" >&2
  if [[ -n "${tag_name:-}" ]]; then
    printf 'release: recovery state: version %s, tag %s\n' "${release_version:-unknown}" "$tag_name" >&2
    printf 'release: retry npm publish with: npm publish --workspace %s --access public --provenance=false\n' "$package_name" >&2
    printf 'release: retry the git push with: git push origin %s %s\n' "${branch_name:-<branch>}" "$tag_name" >&2
  fi
  exit "$status"
}

trap on_error ERR

if [[ $# -ne 1 || ! "$1" =~ ^(major|minor|patch)$ ]]; then
  printf 'Usage: %s major|minor|patch\n' "$0" >&2
  exit 2
fi

bump="$1"
repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || die "run this command inside the repository"
cd "$repo_root"

branch_name="$(git symbolic-ref --quiet --short HEAD)" || die "release requires a named branch"
expected_branch="${RELEASE_BRANCH:-main}"
[[ "$branch_name" == "$expected_branch" ]] || die "release must run from '$expected_branch' (set RELEASE_BRANCH to override)"
git remote get-url origin >/dev/null 2>&1 || die "git remote 'origin' is required"
[[ -z "$(git status --porcelain)" ]] || die "working tree is not clean; commit or stash changes before releasing"

previous_version="$(node -e 'console.log(JSON.parse(require("node:fs").readFileSync("packages/cli/package.json", "utf8")).version)')"
release_version="$(node - "$bump" <<'NODE'
const fs = require("node:fs");
const bump = process.argv[2];
const packageFiles = ["package.json", "packages/cli/package.json", "packages/ai-integrations/package.json"];
const packageVersions = packageFiles.map((file) => JSON.parse(fs.readFileSync(file, "utf8")).version);
if (new Set(packageVersions).size !== 1) throw new Error(`workspace versions are inconsistent: ${packageVersions.join(", ")}`);
const packageJson = JSON.parse(fs.readFileSync("packages/cli/package.json", "utf8"));
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(packageJson.version);
if (!match) throw new Error(`unsupported current version: ${packageJson.version}`);
const parts = match.slice(1).map(Number);
if (bump === "major") parts[0] += 1, parts[1] = 0, parts[2] = 0;
if (bump === "minor") parts[1] += 1, parts[2] = 0;
if (bump === "patch") parts[2] += 1;
console.log(parts.join("."));
NODE
)"
tag_name="mstack-v${release_version}"

if git rev-parse --verify --quiet "refs/tags/$tag_name" >/dev/null; then
  die "tag $tag_name already exists locally"
fi
if git ls-remote --exit-code --tags origin "refs/tags/$tag_name" >/dev/null 2>&1; then
  die "tag $tag_name already exists on origin"
fi
if npm view "${package_name}@${release_version}" version --registry "$registry" >/dev/null 2>&1; then
  die "${package_name}@${release_version} is already published"
fi

printf 'release: validating the current tree\n'
pnpm release:check

RELEASE_VERSION="$release_version" node <<'NODE'
const fs = require("node:fs");
const version = process.env.RELEASE_VERSION;
for (const file of ["package.json", "packages/cli/package.json", "packages/ai-integrations/package.json"]) {
  const packageJson = JSON.parse(fs.readFileSync(file, "utf8"));
  packageJson.version = version;
  fs.writeFileSync(file, `${JSON.stringify(packageJson, null, 2)}\n`);
}
NODE

RELEASE_VERSION="$release_version" PREVIOUS_VERSION="$previous_version" node <<'NODE'
const fs = require("node:fs");
const version = process.env.RELEASE_VERSION;
const previous = process.env.PREVIOUS_VERSION;
const path = "CHANGELOG.md";
const changelog = fs.readFileSync(path, "utf8");
if (changelog.includes("## Unreleased")) {
  const date = new Date().toISOString().slice(0, 10);
  const heading = `## [${version}] - ${date}`;
  const link = `[${version}]: https://github.com/IMisbahk/mstack/compare/mstack-v${previous}...mstack-v${version}`;
  const next = changelog.replace("## Unreleased", heading);
  fs.writeFileSync(path, next.includes(link) ? next : `${next.trimEnd()}\n${link}\n`);
}
NODE

printf 'release: bumped workspace packages to %s\n' "$release_version"
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @imisbahk/mstack docs:generate
pnpm release:check
git diff --check

git add -A
git commit -m "chore(release): prepare mstack ${release_version}"
git tag -a "$tag_name" -m "mstack ${release_version}"

printf 'release: pushing %s and %s\n' "$branch_name" "$tag_name"
git push origin "$branch_name" "$tag_name"

if ! npm whoami --registry "$registry" >/dev/null 2>&1; then
  printf 'release: npm authentication is required; opening npm login\n'
  npm login --registry "$registry" --auth-type=web
fi

printf 'release: publishing %s@%s\n' "$package_name" "$release_version"
npm publish --workspace "$package_name" --access public --provenance=false

published_version="$(npm view "${package_name}@${release_version}" version --registry "$registry")"
[[ "$published_version" == "$release_version" ]] || die "registry verification returned $published_version"
printf 'release: published %s and pushed %s\n' "$package_name@$release_version" "$tag_name"
