/** Log verbosity level. */
export type LogLevel = 'quiet' | 'normal' | 'verbose';

let currentLevel: LogLevel = 'normal';

/** Set the global log level. */
export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

/** Get the current log level. */
export function getLogLevel(): LogLevel {
  return currentLevel;
}

/** Log an informational message (shown in normal and verbose modes). */
export function info(msg: string): void {
  if (currentLevel === 'normal' || currentLevel === 'verbose') {
    console.log(`[info] ${msg}`);
  }
}

/** Log a warning message (shown in normal and verbose modes). */
export function warn(msg: string): void {
  if (currentLevel === 'normal' || currentLevel === 'verbose') {
    console.warn(`[warn] ${msg}`);
  }
}

/** Log an error message (always shown). */
export function error(msg: string): void {
  console.error(`[error] ${msg}`);
}

/** Log a verbose/debug message (shown only in verbose mode). */
export function verbose(msg: string): void {
  if (currentLevel === 'verbose') {
    console.debug(`[verbose] ${msg}`);
  }
}
