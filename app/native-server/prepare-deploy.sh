#!/bin/bash
# 准备远程部署包
# 自动处理 workspace 依赖

set -e

echo "🚀 准备部署包..."

# 创建临时部署目录
DEPLOY_DIR="deploy-package"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

echo "📦 复制文件..."
# 复制必要文件
cp -r dist "$DEPLOY_DIR/"
cp start-server-only.js "$DEPLOY_DIR/"
cp README.md "$DEPLOY_DIR/" 2>/dev/null || true

echo "📝 处理 package.json..."
# 使用 Node.js 处理 JSON（更可靠）
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
// 移除 workspace 依赖
delete pkg.dependencies['chrome-mcp-shared'];
// 写入新文件
fs.writeFileSync('$DEPLOY_DIR/package.json', JSON.stringify(pkg, null, 2), 'utf8');
console.log('✅ package.json 已处理（移除了 chrome-mcp-shared）');
"

# 检查 shared 包
echo "🔍 检查 chrome-mcp-shared..."
SHARED_DIR="../../packages/shared"
if [ -d "$SHARED_DIR/dist" ]; then
  echo "✅ 找到 shared 包构建产物"
  
  # 复制 shared 包到 node_modules（保持 dist 目录结构）
  mkdir -p "$DEPLOY_DIR/node_modules/chrome-mcp-shared"
  cp -r "$SHARED_DIR/dist" "$DEPLOY_DIR/node_modules/chrome-mcp-shared/"
  cp "$SHARED_DIR/package.json" "$DEPLOY_DIR/node_modules/chrome-mcp-shared/"
  
  echo "✅ chrome-mcp-shared 已复制到 node_modules（包含 dist/ 目录）"
else
  echo "⚠️  警告: 未找到 shared 包构建产物"
  echo "   正在构建 shared 包..."
  
  # 尝试构建 shared 包
  (cd "$SHARED_DIR" && npm run build)
  
  if [ -d "$SHARED_DIR/dist" ]; then
    mkdir -p "$DEPLOY_DIR/node_modules/chrome-mcp-shared"
    cp -r "$SHARED_DIR/dist" "$DEPLOY_DIR/node_modules/chrome-mcp-shared/"
    cp "$SHARED_DIR/package.json" "$DEPLOY_DIR/node_modules/chrome-mcp-shared/"
    echo "✅ shared 包已构建并复制（包含 dist/ 目录）"
  else
    echo "❌ 无法构建 shared 包"
    exit 1
  fi
fi

# 打包
echo "📦 创建部署压缩包..."
cd "$DEPLOY_DIR"
tar -czf ../native-server-deploy.tar.gz .
cd ..

echo ""
echo "✅ 部署包准备完成！"
echo ""
echo "📦 文件: native-server-deploy.tar.gz"
echo "📏 大小: $(du -h native-server-deploy.tar.gz | cut -f1)"
echo ""
echo "🚀 部署步骤："
echo "  1. 上传到服务器:"
echo "     scp native-server-deploy.tar.gz user@your-server:/opt/"
echo ""
echo "  2. 在服务器上解压并安装:"
echo "     ssh user@your-server"
echo "     cd /opt"
echo "     mkdir -p mcp-server"
echo "     tar -xzf native-server-deploy.tar.gz -C mcp-server/"
echo "     cd mcp-server"
echo "     npm install --production"
echo ""
echo "  3. 启动服务:"
echo "     node start-server-only.js 12306"
echo "     # 或使用 PM2:"
echo "     pm2 start start-server-only.js --name mcp-chrome -- 12306"
echo ""

# 清理
# rm -rf "$DEPLOY_DIR"
echo "💡 提示: 部署目录保留在 $DEPLOY_DIR/ 供检查"
