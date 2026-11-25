import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const directory = mkdtempSync(join(tmpdir(), 'linea-rossa-sala-'));
const outfile = join(directory, 'sala.test.cjs');
await build({
  entryPoints: ['src/pages/lobby/sala.test.tsx'], outfile,
  platform: 'node', format: 'cjs', bundle: true, jsx: 'automatic',
});
const result = spawnSync(process.execPath, ['--test', outfile], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
