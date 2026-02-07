#!/usr/bin/env node
/**
 * 添加新的扩展 ID 到 Native Messaging Host 配置
 * 使用方法: node add-extension-id.js <extension-id>
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// 获取 manifest 文件路径
function getManifestPath() {
  const platform = os.platform();
  const homeDir = os.homedir();

  if (platform === 'darwin') {
    return path.join(
      homeDir,
      'Library/Application Support/Google/Chrome/NativeMessagingHosts/com.chromemcp.nativehost.json',
    );
  } else if (platform === 'linux') {
    return path.join(
      homeDir,
      '.config/google-chrome/NativeMessagingHosts/com.chromemcp.nativehost.json',
    );
  } else if (platform === 'win32') {
    return path.join(
      homeDir,
      'AppData/Local/Google/Chrome/User Data/NativeMessagingHosts/com.chromemcp.nativehost.json',
    );
  }

  throw new Error('Unsupported platform');
}

function main() {
  const extensionId = process.argv[2];

  if (!extensionId) {
    console.error('❌ 请提供扩展 ID');
    console.log('\n使用方法:');
    console.log('  node add-extension-id.js <extension-id>');
    console.log('\n如何获取扩展 ID:');
    console.log('  1. 打开 Chrome，访问 chrome://extensions/');
    console.log('  2. 开启"开发者模式"');
    console.log('  3. 找到您的扩展，复制"ID"字段');
    process.exit(1);
  }

  try {
    const manifestPath = getManifestPath();

    if (!fs.existsSync(manifestPath)) {
      console.error(`❌ Native Messaging Host 配置文件不存在: ${manifestPath}`);
      console.log('请先运行: node dist/cli.js register');
      process.exit(1);
    }

    // 读取现有配置
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // 构造新的 origin
    const newOrigin = `chrome-extension://${extensionId}/`;

    // 检查是否已存在
    if (manifest.allowed_origins && manifest.allowed_origins.includes(newOrigin)) {
      console.log(`✅ 扩展 ID 已存在: ${extensionId}`);
      return;
    }

    // 添加新的 origin
    if (!manifest.allowed_origins) {
      manifest.allowed_origins = [];
    }
    manifest.allowed_origins.push(newOrigin);

    // 写回文件
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`✅ 成功添加扩展 ID: ${extensionId}`);
    console.log(`📄 配置文件: ${manifestPath}`);
    console.log('\n当前允许的扩展:');
    manifest.allowed_origins.forEach((origin, index) => {
      console.log(`  ${index + 1}. ${origin}`);
    });
    console.log('\n🔄 请重新加载 Chrome 扩展以使更改生效');
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

main();
