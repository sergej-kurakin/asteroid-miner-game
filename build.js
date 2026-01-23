require('esbuild').build({
  entryPoints: ['src/game.ts'],
  bundle: true,
  minify: false,
  sourcemap: true,
  target: ['es2020'],
  outfile: 'dist/game.js',
}).catch(() => process.exit(1));
