// Best-effort DB seed at container boot (production).
// Runs once when the DB is empty. Never blocks `next start`.
import { execSync } from 'node:child_process';

try {
  execSync('npx --no-install tsx scripts/seed-if-empty.ts', { stdio: 'inherit' });
} catch (e) {
  console.warn('[boot] seed skipped:', e.message || e);
}