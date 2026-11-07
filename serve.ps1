# Minimal static file server for previewing the map: powershell -File serve.ps1
$root = $PSScriptRoot
$l = New-Object System.Net.HttpListener
$port = if ($env:PORT) { $env:PORT } else { 8765 }
$l.Prefixes.Add("http://localhost:$port/")
$l.Start()
Write-Host "Serving $root on http://localhost:$port/"
while ($l.IsListening) {
  $ctx = $l.GetContext()
  $p = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ($p -eq '') { $p = 'taiwan-architecture.html' }
  $f = Join-Path $root $p
  if ((Test-Path $f -PathType Leaf) -and ((Resolve-Path $f).Path.StartsWith($root))) {
    $b = [IO.File]::ReadAllBytes($f)
    if ($f -like '*.html') { $ctx.Response.ContentType = 'text/html; charset=utf-8' }
    elseif ($f -like '*.css') { $ctx.Response.ContentType = 'text/css; charset=utf-8' }
    elseif ($f -like '*.js') { $ctx.Response.ContentType = 'text/javascript; charset=utf-8' }
    $ctx.Response.OutputStream.Write($b, 0, $b.Length)
  } else { $ctx.Response.StatusCode = 404 }
  $ctx.Response.Close()
}
