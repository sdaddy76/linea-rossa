import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

const runtime = process.env.SKYWORK_INTERMEDIATE_ROOT
  ? resolve(process.env.SKYWORK_INTERMEDIATE_ROOT, 'tabletop-tests')
  : mkdtempSync(join(tmpdir(), 'linea-rossa-tests-'));
mkdirSync(runtime, { recursive: true });
for (const name of ['engine', 'online', 'ui', 'tutorial/model', 'tutorial/ui']) {
  const outfile = resolve(runtime, `${name.replace('/', '-')}.test.cjs`);
  const isUI = name === 'ui' || name === 'tutorial/ui';
  await build({
    entryPoints: [`src/game-v3/${name}.test.${isUI ? 'tsx' : 'ts'}`], outfile, platform: 'node', format: 'cjs', bundle: true,
    jsx: 'automatic',
    loader: {'.css':'empty'},
    plugins: name !== 'engine' ? [{
      name: 'isolated-database',
      setup(builder) {
        builder.onResolve({ filter: /^@\/integrations\/supabase\/client$/ }, () => ({ path: resolve('src/game-v3/test-client.ts') }));
        if (isUI) builder.onResolve({ filter: /^@\/store\/onlineGameStore$/ }, () => ({ path: resolve('src/game-v3/test-ui-store.ts') }));
      },
    }] : [],
  });
  const result = spawnSync(process.execPath, ['--test', outfile], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
