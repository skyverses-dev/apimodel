import { NextRequest } from 'next/server'

/**
 * GET /install.ps1?key=sk-xxx
 * Returns a PowerShell script for Windows users.
 *
 * Usage: irm "https://api-v2.itera102.cloud/install.ps1?key=sk-xxx" | iex
 */
export async function GET(request: NextRequest) {
    const key = request.nextUrl.searchParams.get('key') || 'YOUR_API_KEY'
    const baseUrl = request.nextUrl.origin

    const script = `# ============================================
#  2BRAIN API — Quick Setup Script (Windows)
#  Configures Claude Code & Anthropic SDK
# ============================================

$API_KEY = "${key}"
$BASE_URL = "${baseUrl}"

Write-Host ""
Write-Host "🧠 2BRAIN API — Quick Setup (Windows)" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor DarkGray
Write-Host ""

# ---------- 1. Set environment variables ----------
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", $BASE_URL, "User")
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", $API_KEY, "User")
$env:ANTHROPIC_BASE_URL = $BASE_URL
$env:ANTHROPIC_API_KEY = $API_KEY

Write-Host "✅ Environment variables set (User scope)" -ForegroundColor Green

# ---------- 2. Configure Claude Code ----------
$claudeDir = Join-Path $env:USERPROFILE ".claude"
$claudeSettings = Join-Path $claudeDir "settings.json"

if (-not (Test-Path $claudeDir)) {
  New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
}

$settings = @{
  env = @{
    ANTHROPIC_BASE_URL = $BASE_URL
    ANTHROPIC_API_KEY  = $API_KEY
  }
  disableLoginPrompt = $true
}

if (Test-Path $claudeSettings) {
  try {
    $existing = Get-Content $claudeSettings -Raw | ConvertFrom-Json
    $existing.env = $settings.env
    $existing | ConvertTo-Json -Depth 10 | Set-Content $claudeSettings -Encoding UTF8
    Write-Host "✅ Updated existing $claudeSettings" -ForegroundColor Green
  } catch {
    $settings | ConvertTo-Json -Depth 10 | Set-Content $claudeSettings -Encoding UTF8
    Write-Host "✅ Created $claudeSettings" -ForegroundColor Green
  }
} else {
  $settings | ConvertTo-Json -Depth 10 | Set-Content $claudeSettings -Encoding UTF8
  Write-Host "✅ Created $claudeSettings" -ForegroundColor Green
}

# ---------- 3. Summary ----------
Write-Host ""
Write-Host "======================================" -ForegroundColor DarkGray
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "   Base URL : $BASE_URL"
Write-Host "   API Key  : $($API_KEY.Substring(0, 15))..."
Write-Host ""
Write-Host "🚀 Open a new terminal and run: claude" -ForegroundColor Yellow
Write-Host ""
`

    return new Response(script, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache, no-store',
        },
    })
}
