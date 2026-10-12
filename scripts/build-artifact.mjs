/*
 * Turns dist-artifact/ (from `vite build --mode artifact`) into one self-contained page for
 * publishing as a claude.ai Artifact. The viewer wraps the file in its own document skeleton, so
 * the output is a fragment: <title>, inlined <style>, a root element, and the inlined module script.
 * A skeleton-wrapped copy (artifact/preview.html) is written for local testing.
 *
 *   npm run build:artifact
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dist = 'dist-artifact'
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const assets = readdirSync(join(dist, 'assets'))
const jsFile = assets.find((f) => f.endsWith('.js'))
const cssFile = assets.find((f) => f.endsWith('.css'))
if (!jsFile || !cssFile) throw new Error('expected one js and one css asset in dist-artifact/assets')
if (assets.length !== 2) console.warn('warning: extra assets will not be inlined:', assets.filter((f) => f !== jsFile && f !== cssFile))

const title = /<title>(.*?)<\/title>/.exec(html)?.[1] ?? 'EDPT Trainer'
const css = readFileSync(join(dist, 'assets', cssFile), 'utf8')
// `</script` inside the bundle would end the inline tag early; the escaped form is identical JavaScript.
const js = readFileSync(join(dist, 'assets', jsFile), 'utf8').replace(/<\/script/gi, '<\\/script')

const fragment = `<title>${title}</title>
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`
mkdirSync('artifact', { recursive: true })
writeFileSync('artifact/edpt-trainer.html', fragment)

// Local preview that mimics the viewer's skeleton (charset, viewport, small reset, safe-area padding).
const preview = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="icon" href="data:,">
<style>
:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0;font:14px system-ui,sans-serif}
img{max-width:100%}
[hidden]{display:none!important}
</style>
</head>
<body>
${fragment}
</body>
</html>
`
writeFileSync('artifact/preview.html', preview)
console.log(`artifact/edpt-trainer.html written (${Math.round(fragment.length / 1024)} KB)`)
