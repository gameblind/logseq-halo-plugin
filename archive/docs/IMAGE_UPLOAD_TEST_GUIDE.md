# 图片上传API测试指南

当遇到"Halo服务器未返回图片地址"的问题时，可以使用以下测试工具来独立验证图片上传API的功能。

## 🛠️ 测试工具说明

我们提供了三种测试工具，可以独立测试Halo的图片上传API：

### 1. 浏览器测试工具 (推荐)
**文件**: `test-upload.html`
**优点**: 界面友好，操作简单，实时查看结果
**适用**: 所有用户

### 2. 浏览器控制台脚本
**文件**: `test-halo-upload-api.js`
**优点**: 可在Logseq环境中运行，模拟插件环境
**适用**: 熟悉浏览器开发者工具的用户

### 3. 命令行工具
**文件**: `test-upload-cli.js`
**优点**: 可脱离浏览器运行，适合服务器环境测试
**适用**: 熟悉命令行的开发者

## 🚀 快速开始 - 浏览器测试工具

### 步骤1: 打开测试页面
1. 双击打开 `test-upload.html` 文件
2. 或在浏览器中打开该文件

### 步骤2: 配置Halo信息
1. **Halo站点地址**: 填入你的Halo站点URL（如：`https://blog.example.com`）
2. **API Token**: 填入你的Halo API密钥

### 步骤3: 选择测试图片
1. 点击"选择图片文件"按钮
2. 选择一张本地图片文件（支持PNG、JPG、GIF、SVG等格式）

### 步骤4: 执行测试
1. 先点击"🌐 测试连接"验证Halo配置是否正确
2. 如果连接成功，点击"📤 上传图片"开始测试
3. 观察日志输出和测试结果

## 🔧 浏览器控制台测试

### 步骤1: 配置脚本
1. 打开 `test-halo-upload-api.js` 文件
2. 修改 `HALO_CONFIG` 中的配置：
   ```javascript
   const HALO_CONFIG = {
     baseUrl: 'https://your-halo-site.com', // 替换为你的Halo站点
     token: 'your-api-token' // 替换为你的API Token
   }
   ```

### 步骤2: 准备测试图片
1. 确保 `assets/` 目录下有测试图片文件
2. 可以使用现有的：
   - `test-image.png`
   - `test-image.svg`
   - `image_1754625746051_0.png`

### 步骤3: 运行测试
1. 在浏览器中打开Logseq或任意网页
2. 按 `F12` 打开开发者工具
3. 切换到 `Console` 标签页
4. 将 `test-halo-upload-api.js` 的内容复制粘贴到控制台
5. 运行 `runUploadTest()` 开始测试

## 💻 命令行测试

### 前提条件
- Node.js 18+ (支持fetch API)
- 或安装 `node-fetch` 包

### 步骤1: 配置脚本
1. 打开 `test-upload-cli.js` 文件
2. 修改 `HALO_CONFIG` 中的配置：
   ```javascript
   const HALO_CONFIG = {
     baseUrl: 'https://your-halo-site.com',
     token: 'your-api-token'
   }
   ```

### 步骤2: 运行测试
```bash
cd logseq-halo-plugin
node test-upload-cli.js
```

## 📊 测试结果分析

### ✅ 成功情况
如果测试成功，你会看到：
- 连接测试通过
- 图片上传成功
- 返回有效的图片URL
- 可以访问上传的图片

**这说明**：
- Halo API配置正确
- 图片上传功能正常
- 问题可能在插件的图片处理逻辑中

### ❌ 失败情况

#### 连接失败
**症状**: 测试连接时返回401、403或其他错误
**可能原因**:
- Halo站点地址错误
- API Token无效或过期
- API Token权限不足
- 网络连接问题

**解决方案**:
1. 检查Halo站点地址是否正确
2. 重新生成API Token
3. 确认Token有附件管理权限
4. 检查网络连接

#### 上传失败
**症状**: 连接成功但图片上传失败
**可能原因**:
- 图片文件格式不支持
- 图片文件过大
- Halo服务器存储空间不足
- 附件上传策略配置问题

**解决方案**:
1. 尝试不同格式和大小的图片
2. 检查Halo后台的附件设置
3. 查看Halo服务器日志
4. 确认存储策略配置正确

#### 上传成功但无URL
**症状**: 上传返回200但没有图片地址
**可能原因**:
- Halo API响应格式变化
- 存储策略配置问题
- 图片处理异步延迟

**解决方案**:
1. 查看完整的API响应数据
2. 检查Halo后台附件库
3. 确认存储策略正确配置
4. 联系Halo技术支持

## 🔍 深度诊断

### 检查API端点
当前使用的端点：`/apis/api.console.halo.run/v1alpha1/attachments/upload`

如果此端点有问题，可以尝试：
1. 查看Halo官方文档确认正确的API端点
2. 检查Halo版本兼容性
3. 尝试其他可能的端点

### 检查请求格式
当前使用的请求格式：
- Method: POST
- Content-Type: multipart/form-data
- Body: FormData with file, policyName, groupName

### 检查响应格式
期望的响应格式：
```json
{
  "spec": {
    "url": "https://example.com/path/to/image.png"
  }
}
```
或
```json
{
  "url": "https://example.com/path/to/image.png"
}
```

## 🛠️ 问题排查清单

- [ ] Halo站点地址正确且可访问
- [ ] API Token有效且有附件管理权限
- [ ] 网络连接正常
- [ ] 图片文件存在且格式支持
- [ ] 图片文件大小在限制范围内
- [ ] Halo后台附件设置正确
- [ ] 存储策略配置正确
- [ ] API端点正确
- [ ] 请求格式正确
- [ ] 响应格式符合预期

## 📞 获取帮助

如果测试后仍有问题，请提供以下信息：

1. **测试结果**：
   - 连接测试结果
   - 上传测试结果
   - 完整的错误日志

2. **环境信息**：
   - Halo版本
   - 浏览器版本
   - 操作系统

3. **配置信息**：
   - Halo附件设置截图
   - 存储策略配置
   - API Token权限设置

4. **测试数据**：
   - 测试图片信息（大小、格式）
   - API响应数据
   - 服务器日志（如有）

通过这些独立测试，可以快速定位问题是在Halo服务器端还是在插件逻辑中，从而有针对性地解决图片上传问题。