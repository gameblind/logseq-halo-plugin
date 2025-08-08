# Halo 插件调试指南

## 问题：按快捷键没有反应

### 步骤 1：检查插件是否正确加载

1. **打开 Logseq 开发者工具**
   - 在 Logseq 中按 `Cmd+Option+I` (macOS) 或 `Ctrl+Shift+I` (Windows/Linux)
   - 切换到 "Console" 标签页

2. **查看控制台日志**
   - 重新加载插件或重启 Logseq
   - 在控制台中查找以下日志信息：
   ```
   🚀 Logseq-Halo Plugin loaded
   ✅ logseq 对象存在
   🔄 logseq.ready 回调被调用
   ✅ 插件实例创建成功
   🎉 插件初始化完成
   ✅ logseq.App.registerCommand 可用
   🔧 开始注册命令...
   ✅ halo-publish-current 命令注册成功
   ✅ halo-publish-to-site 命令注册成功
   ✅ halo-test-connection 命令注册成功
   ✅ halo-sync-data 命令注册成功
   ✅ halo-open-settings 命令注册成功
   ✅ halo-view-logs 命令注册成功
   ✅ halo-export-logs 命令注册成功
   🎉 所有命令注册完成
   ```

3. **如果看到错误信息**
   - 记录具体的错误信息
   - 检查是否有 `❌` 标记的错误日志

### 步骤 2：检查命令是否注册成功

1. **使用命令面板**
   - 按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux) 打开命令面板
   - 输入 "halo" 搜索相关命令
   - 应该能看到以下命令：
     - 🔧 Halo Debug Test (如果运行了调试脚本)
     - 发布到 Halo
     - 发布到指定 Halo 站点
     - 测试 Halo 连接
     - 同步 Halo 数据
     - Halo 设置
     - 查看 Halo 插件日志
     - 导出 Halo 插件日志

2. **测试命令执行**
   - 在命令面板中选择 "发布到 Halo" 命令
   - 查看控制台是否出现：`🚀 halo-publish-current 命令被触发！`

### 步骤 3：测试快捷键

1. **确认快捷键配置**
   - 快捷键应该是 `Cmd+Option+H` (macOS)
   - 确保没有其他应用或插件占用了这个快捷键

2. **测试快捷键**
   - 在 Logseq 中打开任意页面
   - 按 `Cmd+Option+H`
   - 查看控制台是否出现：`🚀 halo-publish-current 命令被触发！`

### 步骤 4：运行调试脚本

1. **在控制台中运行调试代码**
   ```javascript
   // 检查 logseq 对象
   console.log('logseq 对象:', typeof logseq !== 'undefined' ? '存在' : '不存在');
   
   // 检查 App 对象
   if (typeof logseq !== 'undefined' && logseq.App) {
     console.log('logseq.App:', '存在');
     console.log('registerCommand:', typeof logseq.App.registerCommand === 'function' ? '可用' : '不可用');
   }
   
   // 注册测试命令
   if (typeof logseq !== 'undefined' && logseq.App && typeof logseq.App.registerCommand === 'function') {
     logseq.App.registerCommand(
       'halo-debug-test-manual',
       {
         key: 'halo-debug-test-manual',
         label: '🔧 手动调试测试',
         desc: '手动注册的测试命令',
         keybinding: {
           binding: 'mod+shift+d'
         }
       },
       () => {
         console.log('🎉 手动测试命令被触发！');
         alert('Halo 插件命令系统正常工作！');
       }
     );
     console.log('✅ 手动测试命令注册成功，请按 Cmd+Shift+D 测试');
   }
   ```

### 常见问题和解决方案

#### 问题 1：插件未加载
- **症状**：控制台中没有看到 `🚀 Logseq-Halo Plugin loaded`
- **解决方案**：
  1. 检查插件是否正确安装在 Logseq 插件目录
  2. 确认 `package.json` 中的 `logseq` 配置正确
  3. 重启 Logseq

#### 问题 2：logseq 对象未定义
- **症状**：看到 `❌ logseq 对象未定义`
- **解决方案**：
  1. 确认使用的是最新版本的 Logseq
  2. 检查插件是否在正确的环境中运行

#### 问题 3：命令注册失败
- **症状**：看到 `❌ logseq.App.registerCommand 不可用`
- **解决方案**：
  1. 更新 Logseq 到最新版本
  2. 检查 `@logseq/libs` 依赖是否正确安装

#### 问题 4：快捷键冲突
- **症状**：命令注册成功但快捷键不响应
- **解决方案**：
  1. 检查系统或其他应用是否占用了 `Cmd+Option+H`
  2. 尝试使用命令面板手动执行命令
  3. 考虑更改快捷键配置

### 获取帮助

如果以上步骤都无法解决问题，请提供以下信息：

1. **系统信息**
   - 操作系统版本
   - Logseq 版本

2. **控制台日志**
   - 完整的控制台输出
   - 任何错误信息

3. **插件状态**
   - 插件是否在插件列表中显示为已启用
   - 是否能在命令面板中找到 Halo 相关命令

4. **测试结果**
   - 手动调试脚本的执行结果
   - 命令面板中命令的执行情况