// Funzione "tabletop" (Supabase Edge Functions). Generata da scripts/build-edge.mjs.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { createHandler } from 'https://linea-rossa.vercel.app/edge/tabletop-core.js?v=3eb5c2a6a1b7';
Deno.serve(createHandler({ createClient, webpush, env: (name: string) => Deno.env.get(name) }));
