# 文章发布精调指南

## 修复内容

### 1. Slug 规则修复

**问题**: 之前的 slug 生成保留了中文字符，但 Halo 不支持中文 slug。

**解决方案**: 使用 `transliteration` 库将中文转换为拼音：

```typescript
// 修复前
return title
  .toLowerCase()
  .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .substring(0, 50)

// 修复后
return slugify(title, { trim: true }).substring(0, 50)
```

**效果**:
- 中文标题 "Logseq插件开发" → slug: "logseq-cha-jian-kai-fa"
- 英文标题 "My Blog Post" → slug: "my-blog-post"

### 2. 分类和标签处理

**新增功能**: 自动创建不存在的分类和标签

## 使用方法

### 1. 在页面中设置元数据

在 Logseq 页面开头添加以下属性：

```markdown
title:: 我的文章标题
slug:: my-custom-slug
categories:: [技术分享, 教程]
tags:: [Logseq, Halo, 博客]
excerpt:: 这是文章摘要
published:: true
```

### 2. 分类设置

**方式一**: 使用页面属性
```markdown
categories:: [技术分享, 生活随笔]
```

**方式二**: 使用 Frontmatter
```yaml
---
categories: [技术分享, 生活随笔]
---
```

**注意事项**:
- 分类名称支持中文
- 如果分类不存在，插件会自动创建
- 分类的 slug 会自动转换为拼音

### 3. 标签设置

**方式一**: 使用页面属性
```markdown
tags:: [Logseq, Halo, 博客, 技术]
```

**方式二**: 使用 Frontmatter
```yaml
---
tags: [Logseq, Halo, 博客, 技术]
---
```

**注意事项**:
- 标签名称支持中文
- 如果标签不存在，插件会自动创建
- 标签的 slug 会自动转换为拼音

### 4. 完整示例

```markdown
---
title: Logseq 插件开发指南
slug: logseq-plugin-development-guide
excerpt: 详细介绍如何开发 Logseq 插件
categories: [技术分享, 教程]
tags: [Logseq, 插件开发, JavaScript, TypeScript]
published: true
visible: PUBLIC
pinned: false
allowComment: true
priority: 0
---

# Logseq 插件开发指南

这里是文章内容...
```

## 支持的元数据字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `title` | 字符串 | 文章标题 | `我的博客文章` |
| `slug` | 字符串 | URL 别名（可选） | `my-blog-post` |
| `excerpt` | 字符串 | 文章摘要 | `这是文章摘要` |
| `cover` | 字符串 | 封面图片 URL | `https://example.com/cover.jpg` |
| `categories` | 数组 | 分类列表 | `[技术, 教程]` |
| `tags` | 数组 | 标签列表 | `[Logseq, Halo]` |
| `published` | 布尔值 | 是否发布 | `true` |
| `visible` | 字符串 | 可见性 | `PUBLIC`/`INTERNAL`/`PRIVATE` |
| `pinned` | 布尔值 | 是否置顶 | `false` |
| `allowComment` | 布尔值 | 是否允许评论 | `true` |
| `priority` | 数字 | 优先级 | `0` |

## 发布流程

1. **准备文章**: 在 Logseq 中编写文章内容
2. **设置元数据**: 添加标题、分类、标签等信息
3. **发布文章**: 使用快捷键 `Cmd/Ctrl + Shift + H` 或命令面板
4. **检查结果**: 查看控制台日志确认发布状态

## 常见问题

### Q: 为什么我的中文标题变成了拼音 slug？
A: 这是正常的，Halo 不支持中文 slug。插件会自动将中文转换为拼音，确保 URL 的兼容性。

### Q: 如何自定义 slug？
A: 在页面属性中添加 `slug::` 字段，例如：`slug:: my-custom-url`

### Q: 分类和标签不存在怎么办？
A: 插件会自动创建不存在的分类和标签，无需手动在 Halo 后台创建。

### Q: 如何查看发布日志？
A: 打开浏览器开发者工具的控制台，可以看到详细的发布过程日志。

## 技术细节

### Slug 生成规则
- 使用 `transliteration` 库进行中文转拼音
- 自动处理特殊字符和空格
- 限制长度为 50 字符
- 自动去除首尾的连字符

### 分类和标签处理
- 发布前检查分类和标签是否存在
- 自动创建不存在的分类和标签
- 分类和标签的 slug 也会自动转换为拼音
- 支持批量处理多个分类和标签

### 错误处理
- 详细的日志记录
- 友好的错误提示
- 失败时不影响其他功能

---

**注意**: 修改完成后，请重新加载插件以应用更改。