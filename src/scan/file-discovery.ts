import { glob } from 'glob';

/** Directories to exclude from file discovery. */
const EXCLUDE_DIRS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '__pycache__',
  '.venv',
  'venv',
];

/** File extensions to include in discovery. */
const INCLUDE_EXTENSIONS = ['ts', 'js', 'py'];

/**
 * Build the glob pattern for discovering source files.
 * Matches .ts, .js, and .py files while excluding common build/vendor dirs.
 */
function buildGlobPattern(): string {
  return `**/*.{${INCLUDE_EXTENSIONS.join(',')}}`;
}

/** Build the list of glob ignore patterns from excluded directories. */
function buildIgnorePatterns(): string[] {
  return EXCLUDE_DIRS.map((dir) => `**/${dir}/**`);
}

/**
 * Discover all TypeScript, JavaScript, and Python source files
 * under the given root directory. Excludes common non-source
 * directories (node_modules, dist, build, .git, etc.).
 * Results are sorted alphabetically for deterministic output.
 */
export async function discoverFiles(rootDir: string): Promise<string[]> {
  const pattern = buildGlobPattern();
  const ignore = buildIgnorePatterns();

  const files = await glob(pattern, {
    cwd: rootDir,
    absolute: true,
    ignore,
    nodir: true,
  });

  return files.sort();
}
