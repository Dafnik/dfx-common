#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const PACKAGES_DIR = './libs'; // Adjust to your monorepo structure

// Utility functions
function exec(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
    return result ? result.trim() : '';
  } catch (error) {
    if (options.silent) {
      return '';
    }
    throw error;
  }
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

class VersionNumber {
  static versionRegex = /^\d+\.\d+\.\d+$/;

  constructor(major, minor, patch) {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
  }

  toString() {
    return `${this.major}.${this.minor}.${this.patch}`;
  }

  increaseMajor() {
    this.major += 1;
    this.minor = 0;
    this.patch = 0;
    return this;
  }

  increaseMinor() {
    this.minor += 1;
    this.patch = 0;
    return this;
  }

  increasePatch() {
    this.patch += 1;
    return this;
  }

  compareTo(other) {
    if (this.major !== other.major) return this.major - other.major;
    if (this.minor !== other.minor) return this.minor - other.minor;
    return this.patch - other.patch;
  }

  static fromString(version) {
    if (version.includes('beta')) {
      return BetaVersionNumber.fromString(version);
    }
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!match) {
      throw new Error(`Invalid version '${version}'. Must match pattern: x.y.z`);
    }
    return new VersionNumber(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
  }
}

class BetaVersionNumber extends VersionNumber {
  constructor(major, minor, patch, betaCount = 0) {
    super(major, minor, patch);
    this.betaCount = betaCount;
  }

  toString() {
    return `${super.toString()}-beta.${this.betaCount}`;
  }

  increaseBeta() {
    this.betaCount += 1;
    return this;
  }

  toVersionNumber() {
    return new VersionNumber(this.major, this.minor, this.patch);
  }

  static fromString(version) {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)-beta\.(\d+)/);
    if (!match) {
      throw new Error(`Invalid beta version '${version}'. Must match pattern: x.y.z-beta.n`);
    }
    return new BetaVersionNumber(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), parseInt(match[4]));
  }
}

function getPackages() {
  if (!fs.existsSync(PACKAGES_DIR)) {
    throw new Error(`Packages directory '${PACKAGES_DIR}' not found`);
  }

  return fs
    .readdirSync(PACKAGES_DIR)
    .filter((dir) => {
      const packageJsonPath = path.join(PACKAGES_DIR, dir, 'package.json');
      return fs.existsSync(packageJsonPath);
    })
    .map((dir) => {
      const packageJsonPath = path.join(PACKAGES_DIR, dir, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      return {
        name: packageJson.name,
        path: path.join(PACKAGES_DIR, dir),
        packageJsonPath,
        version: packageJson.version,
      };
    });
}

async function selectPackage() {
  const packages = getPackages();

  if (packages.length === 0) {
    throw new Error('No packages found in monorepo');
  }

  console.log('\nAvailable packages:');
  packages.forEach((pkg, index) => {
    console.log(`${index + 1}: ${pkg.name} (current: ${pkg.version})`);
  });

  const answer = await prompt('\nSelect package number: ');
  const index = parseInt(answer) - 1;

  if (index < 0 || index >= packages.length) {
    throw new Error('Invalid package selection');
  }

  return packages[index];
}

function getAllTags() {
  exec('git fetch --tags');
  const tags = exec('git tag -l', { silent: true });
  return tags ? tags.split('\n').filter(Boolean) : [];
}

function getLastTag(packageName, isProd) {
  const allTags = getAllTags();
  const prefix = `${packageName}-`;

  const filteredTags = allTags
    .filter((tag) => tag.startsWith(prefix))
    .filter((tag) => {
      const versionPart = tag.substring(prefix.length);
      return isProd ? !versionPart.includes('beta') : versionPart.includes('beta');
    })
    .filter((tag) => {
      const versionPart = tag.substring(prefix.length).replace(/-beta\.\d+$/, '');
      return VersionNumber.versionRegex.test(versionPart);
    });

  if (filteredTags.length === 0) {
    return isProd ? `${prefix}0.0.0` : `${prefix}0.0.0-beta.0`;
  }

  return filteredTags.sort().reverse()[0];
}

function getLastVersion(packageName, isProd) {
  const lastTag = getLastTag(packageName, isProd);
  const prefix = `${packageName}-`;
  const versionPart = lastTag.substring(prefix.length);

  if (isProd) {
    return VersionNumber.fromString(versionPart);
  } else {
    return BetaVersionNumber.fromString(versionPart);
  }
}

function getNextBetaVersion(packageName, baseVersion) {
  const allTags = getAllTags();
  const prefix = `${packageName}-${baseVersion}-beta.`;

  const betaTags = allTags.filter((tag) => tag.startsWith(prefix));

  if (betaTags.length === 0) {
    return new BetaVersionNumber(baseVersion.major, baseVersion.minor, baseVersion.patch, 0);
  }

  const betaCounts = betaTags
    .map((tag) => {
      const match = tag.match(/beta\.(\d+)$/);
      return match ? parseInt(match[1]) : -1;
    })
    .filter((count) => count >= 0);

  const nextCount = betaCounts.length > 0 ? Math.max(...betaCounts) + 1 : 0;

  return new BetaVersionNumber(baseVersion.major, baseVersion.minor, baseVersion.patch, nextCount);
}

async function getNewBetaVersion(packageName, versionParam) {
  if (versionParam) {
    const baseVersion = VersionNumber.fromString(versionParam);
    return getNextBetaVersion(packageName, baseVersion);
  }

  const lastBetaVersion = getLastVersion(packageName, false);
  const lastProdVersion = getLastVersion(packageName, true);

  console.log(`\nLatest beta tag: ${lastBetaVersion}`);
  console.log(`Latest production tag: ${lastProdVersion}`);
  console.log(`\nVersion: ${lastBetaVersion.toVersionNumber()}`);
  console.log('What do you want to increase?');
  console.log('1: Major');
  console.log('2: Minor');
  console.log('3: Patch');
  console.log('4: Reuse from current beta tag (default)');

  const answer = await prompt('\nYour choice: ');
  const baseVersion = lastBetaVersion.toVersionNumber();

  switch (answer) {
    case '1':
      baseVersion.increaseMajor();
      break;
    case '2':
      baseVersion.increaseMinor();
      break;
    case '3':
      baseVersion.increasePatch();
      break;
    // Default: reuse current version
  }

  return getNextBetaVersion(packageName, baseVersion);
}

async function getNewProdVersion(packageName, versionParam) {
  if (versionParam) {
    return VersionNumber.fromString(versionParam);
  }

  const lastBetaVersion = getLastVersion(packageName, false);
  const lastProdVersion = getLastVersion(packageName, true);

  console.log(`\nLatest beta tag: ${lastBetaVersion}`);
  console.log(`Latest production tag: ${lastProdVersion}`);
  console.log(`\nVersion: ${lastProdVersion}`);
  console.log('What do you want to increase?');
  console.log('1: Major');
  console.log('2: Minor');
  console.log('3: Patch (default)');

  const answer = await prompt('\nYour choice: ');
  const newVersion = new VersionNumber(lastProdVersion.major, lastProdVersion.minor, lastProdVersion.patch);

  switch (answer) {
    case '1':
      newVersion.increaseMajor();
      break;
    case '2':
      newVersion.increaseMinor();
      break;
    default:
      newVersion.increasePatch();
      break;
  }

  return newVersion;
}

function updatePackageVersion(packageJsonPath, version) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  packageJson.version = version;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`Updated ${packageJsonPath} to version ${version}`);
}

function commitChanges(message, files) {
  files.forEach((file) => {
    exec(`git add ${file}`);
  });
  exec(`git commit -m "${message}"`);
  console.log(`Committed changes: ${message}`);
}

function generateChangelog(pkg, tagName, isProd) {
  const changelogPath = path.join(pkg.path, 'CHANGELOG.md');
  const packageRelativePath = path.relative(process.cwd(), pkg.path);

  // Filter git-cliff to only include changes in the package directory
  const cliffArgs = [
    'git-cliff',
    '--unreleased',
    '--include-path',
    `${packageRelativePath}/**/*`,
    '--prepend',
    changelogPath,
    '--tag',
    tagName,
  ];

  if (isProd) {
    cliffArgs.push('--ignore-tags', 'beta');
  } else {
    cliffArgs.push('--count-tags', 'beta');
  }

  exec(cliffArgs.join(' '));
  exec(`pnpm exec prettier --write ${changelogPath}`);

  return changelogPath;
}

async function releaseBeta() {
  const versionParam = process.argv[3];
  const pkg = await selectPackage();

  const version = await getNewBetaVersion(pkg.name, versionParam);
  const fullVersion = version.toString();
  const tagName = `${pkg.name}-${fullVersion}`;

  updatePackageVersion(pkg.packageJsonPath, fullVersion);

  const changelogPath = generateChangelog(pkg, tagName, false);

  console.log('\nReview changelog changes');
  await prompt('Press Enter to continue...');

  commitChanges(`chore(${pkg.name}): release ${fullVersion}`, [pkg.packageJsonPath, changelogPath]);

  console.log(`\nCreating git tag ${tagName}`);
  exec(`git tag ${tagName}`);

  console.log(`\n✅ Beta release ${tagName} created successfully!`);
  console.log(`To push: git push && git push origin ${tagName}`);
}

async function releaseProd() {
  const versionParam = process.argv[3];
  const pkg = await selectPackage();

  const version = await getNewProdVersion(pkg.name, versionParam);
  const fullVersion = version.toString();
  const tagName = `${pkg.name}-${fullVersion}`;

  updatePackageVersion(pkg.packageJsonPath, fullVersion);

  const changelogPath = generateChangelog(pkg, tagName, true);

  console.log('\nReview changelog changes');
  await prompt('Press Enter to continue...');

  commitChanges(`chore(${pkg.name}): release ${fullVersion}`, [pkg.packageJsonPath, changelogPath]);

  console.log(`\nCreating git tag ${tagName}`);
  exec(`git tag ${tagName}`);

  console.log(`\n✅ Production release ${tagName} created successfully!`);
  console.log(`To push: git push && git push origin ${tagName}`);
}

// Main execution
async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'beta':
        await releaseBeta();
        break;
      case 'prod':
        await releaseProd();
        break;
      default:
        console.log('Usage:');
        console.log('  node release.js beta [version]');
        console.log('  node release.js prod [version]');
        console.log('\nExamples:');
        console.log('  node release.js beta        # Interactive');
        console.log('  node release.js beta 1.2.3  # Specify version');
        console.log('  node release.js prod        # Interactive');
        console.log('  node release.js prod 2.0.0  # Specify version');
        process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
