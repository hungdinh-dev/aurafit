#!/usr/bin/env node
// Bundles each Edge Function into supabase/.deploy/<name>/{index.js,deno.json}.
//
// Why: the functions import @aurafit/core and @aurafit/db (files outside supabase/, with
// extensionless imports). A single bundled file per function deploys the same way through the
// Supabase CLI (`--use-api`), the dashboard, or the Supabase MCP `deploy_edge_function` tool,
// without relying on sloppy imports. Only npm packages stay external; their versions come from
// the function's own deno.json import map.
//
// Usage: node supabase/scripts/bundle-functions.mjs [name ...]   (default: every function)
import { build } from 'esbuild';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const functionsDir = join(root, 'supabase/functions');
const outRoot = join(root, 'supabase/.deploy');

const all = readdirSync(functionsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_') && existsSync(join(functionsDir, d.name, 'index.ts')))
  .map((d) => d.name);
const names = process.argv.slice(2).length > 0 ? process.argv.slice(2) : all;

for (const name of names) {
  if (!all.includes(name)) throw new Error(`unknown function ${name} (have: ${all.join(', ')})`);
  const denoJson = JSON.parse(readFileSync(join(functionsDir, name, 'deno.json'), 'utf8'));
  // Keep only remote specifiers (npm:/jsr:/https:); local workspace packages are bundled.
  const imports = Object.fromEntries(
    Object.entries(denoJson.imports ?? {}).filter(([, target]) => /^(npm|jsr|https?):/.test(String(target))),
  );

  const outDir = join(outRoot, name);
  mkdirSync(outDir, { recursive: true });
  const result = await build({
    entryPoints: [join(functionsDir, name, 'index.ts')],
    outfile: join(outDir, 'index.js'),
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    target: 'es2022',
    external: Object.keys(imports),
    alias: {
      '@aurafit/core': join(root, 'packages/core/src/index.ts'),
      '@aurafit/db': join(root, 'packages/db/src/index.ts'),
    },
    banner: { js: `// Bundled from supabase/functions/${name} by supabase/scripts/bundle-functions.mjs. Do not edit.` },
    legalComments: 'none',
    // Minified so the bundle stays small enough for API / MCP upload; the source of truth is
    // supabase/functions + packages/*, so read those (not the bundle) when debugging.
    minify: true,
    charset: 'utf8',
    lineLimit: 400,
    metafile: true,
    logLevel: 'warning',
  });
  writeFileSync(join(outDir, 'deno.json'), `${JSON.stringify({ imports }, null, 2)}\n`);
  const bytes = Object.values(result.metafile.outputs).reduce((n, o) => n + o.bytes, 0);
  console.log(`${name}: ${(bytes / 1024).toFixed(1)} KiB -> ${outDir}`);
}
