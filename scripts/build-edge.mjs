// Genera supabase/functions/tabletop/index.js (un solo file, pronto per Supabase Edge Functions).
import { build } from 'esbuild';
await build({
  entryPoints: ['supabase/functions/tabletop/main.ts'], outfile: 'supabase/functions/tabletop/index.js',
  bundle: true, format: 'esm', platform: 'neutral', target: 'es2022', external: ['npm:*'], loader: { '.json': 'json' },
  banner: { js: '// File generato da scripts/build-edge.mjs: non modificarlo a mano.' }, legalComments: 'none',
});
