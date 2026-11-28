// Funzione "tabletop" (Supabase Edge Functions). Generata da scripts/build-edge.mjs.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { createHandler } from 'https://raw.githubusercontent.com/sdaddy76/linea-rossa/128e4399915a147e1878bbab669be6e0c1479bf1/public/edge/tabletop-core.js';
Deno.serve(createHandler({ createClient, webpush, env: (name: string) => Deno.env.get(name) }));
