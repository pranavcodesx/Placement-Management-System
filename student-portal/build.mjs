// Compiles the TypeScript in src/ into browser files in dist/  (run: npm run build)
import { build, context } from 'esbuild';
const options = { entryPoints: { app:'src/app.ts',onboarding:'src/onboarding.ts',auth:'src/auth.ts',site:'src/site.ts' }, bundle: true, outdir: 'dist', format: 'iife', target: 'es2020', logLevel: 'info' };
if (process.argv.includes('--watch')) { await (await context(options)).watch(); console.log('Watching src/ for changes...'); }
else await build(options);
