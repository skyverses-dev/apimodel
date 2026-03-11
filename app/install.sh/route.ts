import { NextRequest } from 'next/server'

/**
 * GET /install.sh?key=sk-xxx
 * Returns a bash script that configures Claude Code / Anthropic SDK
 * to use 2BRAIN API proxy.
 *
 * Usage: curl -fsSL "https://api-v2.itera102.cloud/install.sh?key=sk-xxx" | sh
 */
export async function GET(request: NextRequest) {
    const key = request.nextUrl.searchParams.get('key') || 'YOUR_API_KEY'
    const proto = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'api-v2.itera102.cloud'
    const baseUrl = `${proto}://${host}`

    const script = `#!/bin/bash
set -e

# ============================================
#  2BRAIN API — Quick Setup Script
#  Configures Claude Code & Anthropic SDK
# ============================================

API_KEY="${key}"
BASE_URL="${baseUrl}"

echo ""
echo "🧠 2BRAIN API — Quick Setup"
echo "================================"
echo ""

# ---------- 1. Detect shell config ----------
SHELL_RC=""
if [ -n "$ZSH_VERSION" ] || [ "$SHELL" = "/bin/zsh" ]; then
  SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ] || [ "$SHELL" = "/bin/bash" ]; then
  SHELL_RC="$HOME/.bashrc"
  [ -f "$HOME/.bash_profile" ] && SHELL_RC="$HOME/.bash_profile"
fi

# ---------- 2. Set environment variables ----------
if [ -n "$SHELL_RC" ]; then
  # Remove old entries
  sed -i.bak '/ANTHROPIC_BASE_URL/d' "$SHELL_RC" 2>/dev/null || true
  sed -i.bak '/ANTHROPIC_API_KEY/d' "$SHELL_RC" 2>/dev/null || true

  # Add new entries
  echo "" >> "$SHELL_RC"
  echo "# 2BRAIN API (auto-configured)" >> "$SHELL_RC"
  echo "export ANTHROPIC_BASE_URL=\\"$BASE_URL\\"" >> "$SHELL_RC"
  echo "export ANTHROPIC_API_KEY=\\"$API_KEY\\"" >> "$SHELL_RC"

  echo "✅ Environment variables added to $SHELL_RC"
else
  echo "⚠️  Could not detect shell config. Set these manually:"
  echo "   export ANTHROPIC_BASE_URL=\\"$BASE_URL\\""
  echo "   export ANTHROPIC_API_KEY=\\"$API_KEY\\""
fi

# ---------- 3. Export for current session ----------
export ANTHROPIC_BASE_URL="$BASE_URL"
export ANTHROPIC_API_KEY="$API_KEY"

# ---------- 4. Configure Claude Code ----------
CLAUDE_DIR="$HOME/.claude"
CLAUDE_SETTINGS="$CLAUDE_DIR/settings.json"

mkdir -p "$CLAUDE_DIR"

if [ -f "$CLAUDE_SETTINGS" ]; then
  # Check if jq is available for proper JSON merge
  if command -v jq &>/dev/null; then
    TMP=$(mktemp)
    jq --arg base "$BASE_URL" --arg key "$API_KEY" '
      .env.ANTHROPIC_BASE_URL = $base |
      .env.ANTHROPIC_API_KEY = $key
    ' "$CLAUDE_SETTINGS" > "$TMP" && mv "$TMP" "$CLAUDE_SETTINGS"
    echo "✅ Updated existing $CLAUDE_SETTINGS"
  else
    # Fallback: overwrite with new config
    cat > "$CLAUDE_SETTINGS" << JSONEOF
{
  "env": {
    "ANTHROPIC_BASE_URL": "$BASE_URL",
    "ANTHROPIC_API_KEY": "$API_KEY"
  },
  "disableLoginPrompt": true
}
JSONEOF
    echo "✅ Created $CLAUDE_SETTINGS"
  fi
else
  cat > "$CLAUDE_SETTINGS" << JSONEOF
{
  "env": {
    "ANTHROPIC_BASE_URL": "$BASE_URL",
    "ANTHROPIC_API_KEY": "$API_KEY"
  },
  "disableLoginPrompt": true
}
JSONEOF
  echo "✅ Created $CLAUDE_SETTINGS"
fi

# ---------- 5. Summary ----------
echo ""
echo "================================"
echo "✅ Setup complete!"
echo ""
echo "   Base URL : $BASE_URL"
echo "   API Key  : \${API_KEY:0:15}..."
echo ""
echo "🔄 Run 'source $SHELL_RC' or open a new terminal to apply."
echo "🚀 Then run: claude"
echo ""
`

    return new Response(script, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache, no-store',
        },
    })
}
