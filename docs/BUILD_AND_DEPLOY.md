# 📦 构建和部署命令清单

## 🎯 完整构建流程

### 方式一：一键构建所有（推荐）

```bash
cd mcp-chrome-master

# 1. 构建 shared 包
cd packages/shared
pnpm build

# 2. 构建 native-server
cd ../../app/native-server
pnpm build

# 3. 准备远程部署包
chmod +x prepare-deploy.sh
./prepare-deploy.sh

# 4. 构建 Chrome 插件
cd ../chrome-extension
pnpm build

echo "✅ 所有构建完成！"
echo "📦 插件目录: app/chrome-extension/.output/chrome-mv3/"
echo "📦 服务器部署包: app/native-server/native-server-deploy.tar.gz"
```

### 方式二：从根目录构建

```bash
cd mcp-chrome-master

# 构建 shared 包
pnpm --filter chrome-mcp-shared build

# 构建 native-server
pnpm --filter mcp-chrome-bridge build

# 准备部署包
cd app/native-server && ./prepare-deploy.sh && cd ../..

# 构建 Chrome 插件
cd app/chrome-extension && pnpm build && cd ../..
```

---

## 📂 构建产物位置

### Chrome 插件

```
app/chrome-extension/.output/chrome-mv3/
├── manifest.json          # 插件清单
├── background.js          # 后台脚本（含远程连接）
├── popup.html            # 弹窗界面
├── content-scripts/      # 内容脚本
└── assets/              # 资源文件
```

**大小**: 约 13.27 MB

### Native Server 部署包

```
app/native-server/native-server-deploy.tar.gz  # 约 264KB

解压后包含：
├── dist/                 # 编译后的服务器代码
│   ├── index.js         # 主入口
│   ├── server/          # HTTP 服务器
│   ├── mcp/             # MCP 协议实现
│   ├── browser-connection/  # WebSocket 连接管理
│   └── ...
├── node_modules/        # 依赖（含 chrome-mcp-shared）
├── package.json         # 已处理的依赖配置
└── start-server-only.js # 启动脚本
```

---

## 🚀 部署到远程服务器

### 1. 上传部署包

```bash
# 从本地上传到服务器
scp /mcp-chrome-master/app/native-server/native-server-deploy.tar.gz \
    root@your-server:/root/
```

### 2. 在服务器上部署

```bash
# SSH 到服务器
ssh root@your-server

# 创建目录并解压
cd /root
mkdir -p mcp-server
tar -xzf native-server-deploy.tar.gz -C mcp-server/
cd mcp-server

# 安装依赖
npm install --production

# 测试启动
node start-server-only.js 12306

# 如果测试成功，使用 PM2 管理
pm2 start start-server-only.js --name mcp-chrome -- 12306
pm2 save
pm2 startup

# 查看状态
pm2 status
pm2 logs mcp-chrome --lines 50
```

### 3. 验证服务器

```bash
# 测试健康检查
curl http://localhost:12306/ping
# 应返回: {"status":"ok","message":"pong"}

# 查看浏览器连接状态
curl http://localhost:12306/browser-connections
# 应返回: {"enabled":true,"totalClients":0,...}
```

---

## 🔧 本地安装 Chrome 插件

### 方法一：开发者模式加载（推荐）

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 启用右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择目录：`/mcp-chrome-master/app/chrome-extension/.output/chrome-mv3/`
6. 插件加载成功！

### 方法二：打包成 CRX（用于分发）

```bash
cd /mcp-chrome-master/app/chrome-extension

# 使用 Chrome 打包
# 在 chrome://extensions/ 页面点击「打包扩展程序」
# 选择 .output/chrome-mv3/ 目录
# 生成 chrome-mv3.crx 文件
```

---

## 🔄 更新流程

### 更新插件

```bash
# 1. 重新构建
cd /mcp-chrome-master/app/chrome-extension
pnpm build

# 2. 在 Chrome 中刷新
# 访问 chrome://extensions/
# 找到插件，点击「🔄 重新加载」按钮
```

### 更新服务器

```bash
# 1. 本地重新构建和打包
cd /mcp-chrome-master/app/native-server
pnpm build
./prepare-deploy.sh

# 2. 上传到服务器
scp native-server-deploy.tar.gz root@your-server:/root/

# 3. 在服务器上更新
ssh root@your-server
cd /root

# 停止旧服务
pm2 stop mcp-chrome

# 备份（可选）
mv mcp-server mcp-server.backup.$(date +%Y%m%d_%H%M%S)

# 部署新版本
mkdir mcp-server
tar -xzf native-server-deploy.tar.gz -C mcp-server/
cd mcp-server
npm install --production

# 启动新服务
pm2 start start-server-only.js --name mcp-chrome -- 12306
pm2 save

# 查看日志
pm2 logs mcp-chrome --lines 50
```

---

## 🧪 快速测试脚本

### 本地测试 Native Server

```bash
cd /mcp-chrome-master/app/native-server

# 启动测试服务器
node start-server-only.js 12306

# 在另一个终端测试
curl http://localhost:12306/ping
curl http://localhost:12306/browser-connections
```

### 测试 Chrome 插件连接

```bash
# 在浏览器插件中：
# 1. 点击工具栏的插件图标
# 2. 选择「远程 WebSocket」模式
# 3. 输入: ws://localhost:12306/browser-ws
# 4. 点击「连接」
# 5. 查看状态是否显示「✅ 已连接」
```

---

## 📋 常用维护命令

### PM2 管理命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs mcp-chrome
pm2 logs mcp-chrome --lines 100
pm2 logs mcp-chrome --err  # 只看错误

# 重启服务
pm2 restart mcp-chrome

# 停止服务
pm2 stop mcp-chrome

# 删除服务
pm2 delete mcp-chrome

# 查看详细信息
pm2 show mcp-chrome

# 监控
pm2 monit
```

### 服务器状态检查

```bash
# 检查端口占用
netstat -tuln | grep 12306
lsof -i :12306

# 检查进程
ps aux | grep start-server-only

# 查看磁盘空间
df -h

# 查看内存使用
free -h
```

---

## 🔍 问题排查

### 构建失败

```bash
# 清理缓存重新构建
cd mcp-chrome-master

# 清理 node_modules
rm -rf node_modules app/*/node_modules packages/*/node_modules
pnpm install

# 重新构建
pnpm --filter chrome-mcp-shared build
pnpm --filter mcp-chrome-bridge build
cd app/chrome-extension && pnpm build
```

### 服务器部署失败

```bash
# 检查 Node.js 版本
node --version  # 需要 >= 18

# 检查 npm 版本
npm --version

# 手动安装依赖
cd /root/mcp-server
rm -rf node_modules package-lock.json
npm install --production

# 查看详细错误
npm install --production --verbose
```

### 插件加载失败

```bash
# 检查构建产物
ls -lh /mcp-chrome-master/app/chrome-extension/.output/chrome-mv3/

# 检查 manifest.json
cat app/chrome-extension/.output/chrome-mv3/manifest.json

# 重新构建
cd app/chrome-extension
rm -rf .output
pnpm build
```

---

## 📝 完整部署 Checklist

### 本地准备

- [ ] 构建 shared 包
- [ ] 构建 native-server
- [ ] 生成部署包 (native-server-deploy.tar.gz)
- [ ] 构建 Chrome 插件
- [ ] 验证构建产物完整性

### 服务器部署

- [ ] 上传部署包到服务器
- [ ] 解压并安装依赖
- [ ] 测试启动服务器
- [ ] 使用 PM2 管理进程
- [ ] 配置开机自启
- [ ] 验证健康检查接口
- [ ] 检查防火墙规则

### 插件安装

- [ ] 在 Chrome 中加载插件
- [ ] 配置远程 WebSocket 地址
- [ ] 测试连接
- [ ] 验证工具调用

### 集成测试

- [ ] 在 Dify 中配置 MCP 服务器
- [ ] 测试基本工具调用（如 chrome_navigate）
- [ ] 测试复杂场景（截图、填表等）
- [ ] 验证日志无错误

---

## 🎉 完成！

按照以上步骤，您应该可以成功构建和部署完整的远程浏览器控制系统！

**快速命令总结**：

```bash
# 本地构建所有
cd mcp-chrome-master
pnpm --filter chrome-mcp-shared build && \
pnpm --filter mcp-chrome-bridge build && \
cd app/native-server && ./prepare-deploy.sh && cd ../chrome-extension && pnpm build

# 部署到服务器
scp app/native-server/native-server-deploy.tar.gz root@server:/root/ && \
ssh root@server "cd /root && mkdir -p mcp-server && \
tar -xzf native-server-deploy.tar.gz -C mcp-server/ && \
cd mcp-server && npm install --production && \
pm2 start start-server-only.js --name mcp-chrome -- 12306"
```

开始使用吧！🚀
