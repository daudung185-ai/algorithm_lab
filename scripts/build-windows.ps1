$ErrorActionPreference = 'Stop'
$appRoot = Split-Path -Parent $PSScriptRoot
$compiler = Join-Path $appRoot 'node_modules/@esbuild/win32-x64/esbuild.exe'
if (!(Test-Path -LiteralPath $compiler)) { throw 'Install dependencies first with npm install on Windows x64.' }
$assets = Join-Path $appRoot 'dist/assets'
New-Item -ItemType Directory -Force -Path $assets | Out-Null
& $compiler (Join-Path $appRoot 'src/main.jsx') --bundle "--outdir=$assets" --minify --loader:.js=jsx --metafile="$appRoot/dist/build-meta.json"
if ($LASTEXITCODE -ne 0) { throw 'Production bundling failed.' }
$html = [IO.File]::ReadAllText((Join-Path $appRoot 'index.html'))
$html = $html.Replace('<script type="module" src="/src/main.jsx"></script>', '<link rel="stylesheet" href="/assets/main.css"/><script type="module" src="/assets/main.js"></script>')
[IO.File]::WriteAllText((Join-Path $appRoot 'dist/index.html'), $html, [Text.UTF8Encoding]::new($false))
Copy-Item -Path (Join-Path $appRoot 'public/*') -Destination (Join-Path $appRoot 'dist') -Recurse -Force
Write-Output 'Production bundle ready in dist. Run npm run preview.'
