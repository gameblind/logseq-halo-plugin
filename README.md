# Logseq Halo Publisher

一个用于将 Logseq 笔记发布到 Halo 博客系统的插件。

## 功能特性

### 核心功能
- 📝 **一键发布**: 将 Logseq 页面直接发布到 Halo 博客
- 🔄 **智能同步**: 自动检测文章更新，支持增量同步
- 🏷️ **元数据管理**: 支持标题、摘要、分类、标签等完整元数据
- 🎯 **多站点支持**: 可配置多个 Halo 站点，灵活选择发布目标

### 内容处理
- 📄 **Frontmatter 支持**: 完整支持 YAML frontmatter 元数据
- 🔗 **链接转换**: 自动转换 Logseq 页面链接为博客链接
- 📝 **内容优化**: 自动处理 Logseq 特有语法，生成标准 Markdown
- 📊 **摘要生成**: 支持自动生成文章摘要

### 用户体验
- ⚡ **快捷键支持**: `Cmd/Ctrl + Alt + H` 快速发布
- 🎛️ **灵活配置**: 丰富的设置选项，满足不同需求
- 📱 **状态反馈**: 实时显示发布进度和结果
- 🔧 **错误处理**: 完善的错误提示和处理机制

## 安装方法

### 方法一：从 Logseq 插件市场安装（推荐）
1. 打开 Logseq
2. 进入设置 → 插件
3. 搜索 "Halo Publisher"
4. 点击安装

### 方法二：手动安装
1. 下载最新版本的插件文件
2. 解压到 Logseq 插件目录
3. 重启 Logseq

## 配置说明

### ⚠️ 重要提示

如果你在配置时看到 JSON 编辑器界面，这是正常的！这是 Logseq 插件的标准设置方式。请按照以下步骤进行配置：

### 快速配置步骤

1. **获取 API Token**
   - 登录 Halo 后台 → 用户中心 → 个人令牌 → 新建令牌
   - 复制生成的令牌

2. **配置插件**
   - 点击 Logseq 右上角设置图标
   - 找到 "Halo Publisher" 插件
   - 点击设置按钮

3. **填写站点配置**
   在 "Halo 站点配置" 字段中填入：
   ```json
   [
     {
       "name": "我的博客",
       "url": "https://your-halo-site.com",
       "token": "your-api-token-here",
       "isDefault": true
     }
   ]
   ```

### 详细配置指南

请查看 [SETUP_GUIDE.md](./SETUP_GUIDE.md) 获取完整的配置说明，包括：
- 详细的 API Token 获取步骤
- 多站点配置示例
- 常见问题解答
- 故障排除指南

### 配置参数说明

- `name`: 站点显示名称
- `url`: Halo 站点地址（不包含 /api 路径）
- `token`: API 个人令牌
- `isDefault`: 是否为默认站点

### 高级配置
- **默认发布**: 新文章是否默认发布（否则保存为草稿）
- **自动生成摘要**: 当文章没有手动设置摘要时自动生成
- **图片上传**: 自动上传本地图片到 Halo（开发中）
- **日志级别**: 设置插件日志输出级别

## 使用方法

### 基本发布流程
1. 在 Logseq 中创建或编辑页面
2. 使用快捷键 `Cmd/Ctrl + Alt + H` 或命令面板中的 "发布到 Halo"
3. 插件会自动处理内容并发布到配置的 Halo 站点

### Frontmatter 配置
在页面开头添加 YAML frontmatter 来控制发布行为：

```yaml
---
title: 文章标题
slug: article-slug
excerpt: 文章摘要
cover: https://example.com/cover.jpg
categories: [技术, 教程]
tags: [Logseq, Halo, 博客]
publish: true
visible: PUBLIC
pinned: false
allowComment: true
priority: 0
---
```

### 支持的 Frontmatter 字段
- `title`: 文章标题（默认使用页面名称）
- `slug`: 文章别名/URL（默认根据标题生成）
- `excerpt`: 文章摘要
- `cover`: 封面图片 URL
- `categories`: 分类列表
- `tags`: 标签列表
- `publish`: 是否发布（true/false）
- `visible`: 可见性（PUBLIC/INTERNAL/PRIVATE）
- `pinned`: 是否置顶
- `allowComment`: 是否允许评论
- `priority`: 优先级（数字）

## 命令列表

| 命令 | 快捷键 | 描述 |
|------|--------|------|
| 发布到 Halo | `Cmd/Ctrl + Shift + H` | 发布当前页面到默认站点 |
| 发布到指定站点 | - | 选择站点并发布当前页面 |
| 测试连接 | - | 测试与 Halo 站点的连接 |
| 同步数据 | - | 同步站点的分类和标签 |
| 打开设置 | - | 打开插件设置页面 |

## 开发说明

### 技术栈
- **TypeScript**: 主要开发语言
- **Vite**: 构建工具
- **Logseq Plugin API**: 插件接口
- **Halo API**: 博客系统接口

### 项目结构
```
src/
├── main.ts              # 插件入口
├── types.ts             # 类型定义
├── services/            # 核心服务
│   ├── ConfigManager.ts # 配置管理
│   ├── HaloService.ts   # Halo API 服务
│   ├── ContentProcessor.ts # 内容处理
│   ├── CommandHandler.ts # 命令处理
│   └── UIManager.ts     # UI 管理
├── utils/               # 工具函数
│   └── Logger.ts        # 日志工具
└── types/               # 类型声明
    └── logseq.d.ts      # Logseq API 类型
```

### 本地开发
```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 类型检查
npm run type-check
```

## 常见问题

### Q: 发布失败，提示连接错误
A: 请检查：
1. Halo 站点 URL 是否正确
2. API Token 是否有效
3. 网络连接是否正常
4. Halo 站点是否正常运行

### Q: 文章内容格式不正确
A: 插件会自动处理 Logseq 特有语法，如果遇到问题：
1. 检查 Markdown 语法是否正确
2. 确认 frontmatter 格式是否正确
3. 查看插件日志获取详细错误信息

### Q: 如何设置多个站点
A: 在插件设置中可以添加多个站点配置，发布时可以选择目标站点。

### Q: 图片无法显示
A: 目前需要使用网络图片 URL，本地图片上传功能正在开发中。

## 更新日志

### v1.0.0
- 🎉 初始版本发布
- ✅ 基础发布功能
- ✅ Frontmatter 支持
- ✅ 多站点配置
- ✅ 快捷键支持

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 支持

如果这个插件对你有帮助，欢迎：
- ⭐ 给项目点个星
- 🐛 报告问题和建议
- 💡 提出新功能想法
- 📢 推荐给其他用户

---

**享受从 Logseq 到 Halo 的无缝发布体验！** 🚀