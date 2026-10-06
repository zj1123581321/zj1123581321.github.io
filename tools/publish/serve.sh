#!/usr/bin/env bash
set -euo pipefail

# tools/publish/serve.sh
# 挂载 tools/publish 目录到 tailscale serve /md2p 路径下

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "正在注册 Tailscale serve 挂载点..."
echo "挂载目录: ${SCRIPT_DIR}"
echo "挂载路径: /md2p"

# 仅注册 /md2p，不影响本机其他 serve 路径
tailscale serve --bg --set-path /md2p "${SCRIPT_DIR}"

DOMAIN="$(tailscale status --json | jq -r '.Self.DNSName' 2>/dev/null | sed 's/\.$//' || true)"
if [ -z "${DOMAIN}" ] || [ "${DOMAIN}" = "null" ]; then
  DOMAIN="<本机 tailnet 域名>"
fi

echo ""
echo "Tailscale serve 挂载完成！"
echo "复制页访问样例:"
echo "  https://${DOMAIN}/md2p/page/?post=<目录名>"
echo "示例:"
echo "  https://${DOMAIN}/md2p/page/?post=261004-context-and-loop"
