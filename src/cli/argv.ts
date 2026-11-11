/**
 * pnpm (and some npm versions) may forward the script separator literally:
 * `pnpm run monitor -- --network mainnet` becomes
 * `node dist/src/index.js monitor -- --network mainnet`.
 * This CLI has no positional arguments, so the first standalone separator is
 * safe to remove while preserving normal Commander option parsing.
 */
export function normalizeCliArgv(argv: readonly string[]): string[] {
  const separator = argv.indexOf('--', 2);
  if (separator < 0) return [...argv];
  return [...argv.slice(0, separator), ...argv.slice(separator + 1)];
}
