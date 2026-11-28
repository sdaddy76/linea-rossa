// Genera il motore della funzione "tabletop" in public/edge/tabletop-core.js.
// supabase/functions/tabletop/index.ts lo importa da GitHub, fissato al commit che lo contiene
// (il bundler di Supabase accetta solo host noti), e gli passa le librerie npm.
// Uso: node scripts/build-edge.mjs → commit e push → CORE_REF=<sha del commit> node scripts/build-edge.mjs → pubblica index.ts.
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
if (process.env.CORE_REF) writeFileSync('supabase/functions/tabletop/index.ts', `// Funzione "tabletop" (Supabase Edge Functions). Generata da scripts/build-edge.mjs.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { createHandler } from 'https://raw.githubusercontent.com/sdaddy76/linea-rossa/${process.env.CORE_REF ?? 'main'}/public/edge/tabletop-core.js';
Deno.serve(createHandler({ createClient, webpush, env: (name: string) => Deno.env.get(name) }));
`);
console.log('tabletop-core', hash, process.env.CORE_REF ? 'index.ts aggiornato' : 'index.ts invariato (manca CORE_REF)');
