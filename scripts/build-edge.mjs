// Genera il motore della funzione "tabletop" in public/edge/tabletop-core.js (servito dal sito):
// supabase/functions/tabletop/index.ts lo importa e gli passa le librerie npm.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
const out = 'public/edge/tabletop-core.js';
await build({
  entryPoints: ['supabase/functions/tabletop/main.ts'], outfile: out,
  bundle: true, format: 'esm', platform: 'neutral', target: 'es2022', loader: { '.json': 'json' }, minify: true,
  banner: { js: '// Linea Rossa · motore della funzione "tabletop". File generato da scripts/build-edge.mjs.' }, legalComments: 'none',
});
const hash = createHash('sha256').update(readFileSync(out)).digest('hex').slice(0, 12);
writeFileSync('supabase/functions/tabletop/index.ts', `// Funzione "tabletop" (Supabase Edge Functions). Generata da scripts/build-edge.mjs.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { createHandler } from 'https://linea-rossa.vercel.app/edge/tabletop-core.js?v=${hash}';
Deno.serve(createHandler({ createClient, webpush, env: (name: string) => Deno.env.get(name) }));
`);
console.log('tabletop-core', hash);
