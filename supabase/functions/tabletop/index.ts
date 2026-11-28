// Funzione "tabletop" (Supabase Edge Functions). Generata da scripts/build-edge.mjs.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { createHandler } from 'https://raw.githubusercontent.com/sdaddy76/linea-rossa/08b920a6b26c48bf90b82f1ee3c09f5e4592518d/public/edge/tabletop-core.js';
Deno.serve(createHandler({ createClient, webpush, env: (name: string) => Deno.env.get(name) }));
