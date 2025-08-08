# 图片上传失败诊断指南

当您遇到图片上传失败的问题时，请按照以下步骤进行系统性诊断。

## 🔍 第一步：检查插件配置

### 1.1 打开浏览器控制台
- 在 Logseq 中按 `F12` 或 `Cmd+Option+I` (Mac) 打开开发者工具
- 切换到 `Console` 标签页

### 1.2 检查插件设置
在控制台中运行：
```javascript
console.log('插件设置:', logseq.settings)
```

**检查要点：**
- `imageUploadEnabled`: 必须为 `true`
- `sites`: 必须包含有效的 Halo 站点配置
- `logLevel`: 建议设置为 `"debug"` 以获取详细日志

### 1.3 检查站点配置
确认站点配置格式正确：
```json
[
  {
    "id": "site-1",
    "name": "我的博客",
    "url": "https://your-halo-site.com",
    "token": "your-api-token",
    "isDefault": true
  }
]
```

## 🖼️ 第二步：测试图片文件访问

### 2.1 运行图片访问测试
将以下代码复制到浏览器控制台执行：

```javascript
// 快速图片访问测试
async function quickImageTest() {
  console.log('🔍 快速图片访问测试');
  console.log('='.repeat(30));
  
  const testPaths = [
    './assets/image_1754625746051_0.png',
    './assets/test-image.svg',
    'assets/image_1754625746051_0.png',
    'assets/test-image.svg',
    '../assets/image_1754625746051_0.png',
    '../assets/test-image.svg'
  ];
  
  for (const path of testPaths) {
    try {
      console.log(`\n📂 测试: ${path}`);
      const response = await fetch(path);
      
      if (response.ok) {
        const size = response.headers.get('content-length');
        const type = response.headers.get('content-type');
        console.log(`✅ 成功! 大小: ${size || '未知'}, 类型: ${type || '未知'}`);
        
        const buffer = await response.arrayBuffer();
        console.log(`📏 实际读取: ${buffer.byteLength} 字节`);
      } else {
        console.log(`❌ 失败: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ 异常: ${error.message}`);
    }
  }
  
  console.log('\n🏁 测试完成');
}

// 运行测试
quickImageTest();
```

### 2.2 检查测试结果
- ✅ **成功**：图片文件可以正常访问
- ❌ **失败**：图片文件无法访问，需要检查文件是否存在

## 🌐 第三步：测试 Halo 连接

### 3.1 测试站点连接
在控制台中运行：
```javascript
// 获取配置的站点
const sites = JSON.parse(logseq.settings?.sites || '[]');
console.log('配置的站点:', sites);

if (sites.length > 0) {
  const site = sites[0];
  console.log('测试站点:', site.name, site.url);
  
  // 测试基本连接
  fetch(site.url + '/apis/api.console.halo.run/v1alpha1/users/-/detail', {
    headers: {
      'Authorization': `Bearer ${site.token}`
    }
  })
  .then(response => {
    console.log('Halo连接测试:', response.status, response.statusText);
    if (response.ok) {
      console.log('✅ Halo连接正常');
    } else {
      console.log('❌ Halo连接失败');
    }
  })
  .catch(error => {
    console.log('❌ Halo连接异常:', error.message);
  });
} else {
  console.log('❌ 未配置Halo站点');
}
```

## 📝 第四步：执行发布测试

### 4.1 使用测试文档
1. 打开 `test-image-upload.md` 文件
2. 按 `Cmd+Option+H` (Mac) 或 `Ctrl+Alt+H` (Windows) 触发发布
3. 观察控制台输出的详细日志

### 4.2 观察关键日志
注意以下关键信息：
- `🖼️ 开始处理图片上传...`
- `📁 正在读取图片文件...`
- `🌐 正在上传到Halo服务器...`
- `📡 Halo服务器响应状态: XXX`

## 🔧 常见问题及解决方案

### 问题1：图片文件无法访问
**症状：** 控制台显示 `❌ 无法读取图片文件`

**解决方案：**
1. 确认图片文件存在于 `assets/` 目录
2. 检查文件名是否正确（注意大小写）
3. 确认文件没有被移动或删除

### 问题2：Halo 连接失败
**症状：** 控制台显示 `❌ Halo上传失败: 401` 或其他HTTP错误

**解决方案：**
1. 检查 Halo 站点 URL 是否正确
2. 验证 API Token 是否有效
3. 确认 Halo 服务器可以访问
4. 检查 Token 权限是否包含文件上传

### 问题3：图片上传功能未启用
**症状：** 没有看到图片处理相关日志

**解决方案：**
1. 在插件设置中启用 `图片上传功能`
2. 重新加载插件或重启 Logseq

### 问题4：图片格式不支持
**症状：** 控制台显示 `❌ 不支持的图片格式`

**解决方案：**
1. 确认图片格式为 PNG、JPG、JPEG、GIF、SVG
2. 检查文件扩展名是否正确

### 问题5：图片文件过大
**症状：** 控制台显示 `❌ 图片文件过大`

**解决方案：**
1. 压缩图片文件大小
2. 检查 Halo 服务器的文件大小限制

## 📊 诊断报告模板

请将以下信息提供给技术支持：

```
=== 图片上传问题诊断报告 ===

1. 插件配置:
   - imageUploadEnabled: [true/false]
   - 站点数量: [X个]
   - 日志级别: [debug/info/warn/error]

2. 图片文件测试:
   - 文件1: [路径] - [成功/失败]
   - 文件2: [路径] - [成功/失败]

3. Halo连接测试:
   - 站点URL: [URL]
   - 连接状态: [成功/失败]
   - 错误信息: [如有]

4. 发布测试结果:
   - 图片处理日志: [有/无]
   - 上传状态: [成功/失败]
   - 错误信息: [详细错误]

5. 浏览器信息:
   - 浏览器: [Chrome/Safari/Firefox等]
   - 版本: [版本号]
   - 操作系统: [macOS/Windows/Linux]
```

## 🚀 快速修复建议

1. **重新构建插件**：
   ```bash
   cd logseq-halo-plugin
   npm run build
   ```

2. **重新加载插件**：
   - 在 Logseq 中禁用插件
   - 重新启用插件

3. **清除缓存**：
   - 清除浏览器缓存
   - 重启 Logseq

4. **检查网络**：
   - 确认网络连接正常
   - 检查防火墙设置

---

如果按照以上步骤仍无法解决问题，请将诊断报告和详细的控制台日志提供给技术支持。