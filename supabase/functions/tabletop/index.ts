// Funzione "tabletop" (Supabase Edge Functions). Generata da scripts/build-edge.mjs.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { createHandler } from 'https://raw.githubusercontent.com/sdaddy76/linea-rossa/e38069fbec6634abb32460ad98bc64685fc7afbc/public/edge/tabletop-core.js';
Deno.serve(createHandler({ createClient, webpush, env: (name: string) => Deno.env.get(name) }));
