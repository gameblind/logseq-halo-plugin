# Logseq Halo Plugin 安装指南

## 问题诊断

经过调试发现，插件快捷键没有反应的根本原因是：**插件没有正确安装到 Logseq 中**。

在 `~/.logseq/plugins` 目录中没有找到 `logseq-halo-plugin`，这说明插件根本没有被 Logseq 加载。

## 正确安装步骤

### 1. 开启 Logseq 开发者模式

1. 打开 Logseq 桌面应用
2. 点击右上角的三个点菜单 (⋯)
3. 选择 "Settings" (设置)
4. 切换到 "Advanced" (高级) 标签页
5. 开启 "Developer mode" (开发者模式)

### 2. 构建插件

在插件目录中运行：

```bash
cd /Users/wangchong/DEV/LogseqToHalo/logseq-halo-plugin
npm run build
```

确保 `dist/index.js` 文件已生成。

### 3. 加载插件

1. 在 Logseq 中，开启开发者模式后，三个点菜单中会出现 "Plugins" 选项
2. 点击 "Plugins" 进入插件页面
3. 点击 "Load unpacked plugin" (加载未打包插件) 按钮
4. 选择插件根目录：`/Users/wangchong/DEV/LogseqToHalo/logseq-halo-plugin`
5. 点击确认加载

### 4. 验证安装

安装成功后，你应该能看到：

1. 在插件列表中出现 "Logseq Halo Publisher" 插件
2. 插件状态显示为已启用
3. 可以使用快捷键 `Cmd+Option+H` (Mac) 触发发布功能
4. 在命令面板 (`Cmd+Shift+P`) 中可以找到 "Publish current page to Halo" 命令

### 5. 测试功能

1. 打开一个 Logseq 页面
2. 按下 `Cmd+Option+H` 快捷键
3. 应该会看到 "正在发布当前页面..." 的提示信息
4. 打开开发者工具 (`Cmd+Option+I`) 查看控制台日志

## 常见问题

### Q: 插件加载失败

**A:** 检查以下几点：
- 确保已运行 `npm run build` 构建插件
- 确保 `dist/index.js` 文件存在
- 确保 `package.json` 中的 `logseq.main` 字段指向正确的文件
- 检查控制台是否有错误信息

### Q: 快捷键不工作

**A:** 确保：
- 插件已正确加载并启用
- 没有其他插件或应用占用相同快捷键
- 在 Logseq 窗口中按下快捷键（确保焦点在 Logseq 上）

### Q: 如何重新加载插件

**A:** 在插件页面中：
1. 找到 "Logseq Halo Publisher" 插件
2. 点击插件卡片上的重新加载按钮
3. 或者禁用后重新启用插件

## 调试信息

如果插件仍然不工作，请：

1. 打开开发者工具 (`Cmd+Option+I`)
2. 查看 Console 标签页中的日志
3. 寻找以下调试信息：
   - "Logseq object exists: true"
   - "Plugin instance created successfully"
   - "registerCommand is available: true"
   - "Command registered successfully: halo-publish-current"

这些日志可以帮助诊断插件加载和初始化过程中的问题。

## 下一步

安装成功后，你需要：

1. 配置 Halo 服务器连接信息
2. 设置认证凭据
3. 测试发布功能

详细的配置说明请参考项目的 README 文件。