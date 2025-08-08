# YAML 格式标签使用指南

## 基本语法

在 Logseq 页面的开头使用 YAML frontmatter 来定义文章的元数据，包括标签：

```yaml
---
categories: [技术分享, 教程]
tags: [Logseq, Halo, 博客]
---
```

## 标签格式详解

### 1. 数组格式（推荐）

```yaml
---
tags: [标签1, 标签2, 标签3]
---
```

**特点：**
- 使用方括号 `[]` 包围
- 标签之间用逗号 `,` 分隔
- 支持中文标签
- 支持英文标签
- 支持数字

### 2. 多行数组格式

```yaml
---
tags:
  - 标签1
  - 标签2
  - 标签3
---
```

**注意：** 当前插件的简化 YAML 解析器主要支持单行数组格式，推荐使用方括号格式。

## 实际使用示例

### 示例 1：技术博客

```yaml
---
title: Vue.js 组件开发指南
slug: vuejs-component-guide
excerpt: 详细介绍 Vue.js 组件的开发方法和最佳实践
categories: [前端开发, 教程]
tags: [Vue.js, JavaScript, 组件, 前端]
published: true
visible: PUBLIC
---

# Vue.js 组件开发指南

这里是文章内容...
```

### 示例 2：生活分享

```yaml
---
title: 我的读书笔记
categories: [生活, 读书]
tags: [读书笔记, 个人成长, 思考]
published: true
---

# 我的读书笔记

今天读了一本很有意思的书...
```

### 示例 3：项目记录

```yaml
---
title: Logseq-Halo 插件开发日志
categories: [技术分享, 项目]
tags: [Logseq, Halo, 插件开发, TypeScript, 开源]
published: false
visible: PRIVATE
---

# 开发日志

今天完成了标签功能的开发...
```

## 标签处理机制

### 自动创建
- 如果 Halo 博客中不存在指定的标签，插件会自动创建
- 标签的 slug 会自动转换为拼音（中文标签）

### 标签映射
根据 `ContentProcessor.ts` 中的处理逻辑：

```typescript
// 数组格式处理
if (value.startsWith('[') && value.endsWith(']')) {
  const arrayContent = value.slice(1, -1)
  result[key] = arrayContent.split(',').map(item => item.trim().replace(/["']/g, ''))
}
```

### 支持的标签格式

| 格式 | 示例 | 说明 |
|------|------|------|
| 中文标签 | `[技术分享, 个人博客]` | 完全支持 |
| 英文标签 | `[JavaScript, Vue.js]` | 完全支持 |
| 混合标签 | `[Vue.js, 前端开发, JavaScript]` | 完全支持 |
| 带空格 | `[Web 开发, API 设计]` | 完全支持 |
| 特殊字符 | `[C++, .NET]` | 支持大部分 |

## 常见问题

### Q1: 标签中可以包含特殊字符吗？
**A:** 可以，但建议避免使用引号、方括号等可能影响解析的字符。

### Q2: 标签数量有限制吗？
**A:** 没有硬性限制，但建议每篇文章的标签数量控制在 3-8 个之间，便于管理。

### Q3: 如何处理标签中的逗号？
**A:** 如果标签本身包含逗号，建议使用其他分隔符或重新命名标签。

### Q4: 标签会自动去重吗？
**A:** 是的，Halo 系统会自动处理重复标签。

## 最佳实践

### 1. 标签命名规范
- 使用简洁明了的名称
- 保持一致的命名风格
- 避免过于宽泛或过于具体的标签

### 2. 标签分类建议
- **技术类**：编程语言、框架、工具
- **内容类**：教程、笔记、总结、分享
- **主题类**：项目名称、系列文章

### 3. 示例标签体系

```yaml
# 前端开发文章
tags: [前端, JavaScript, Vue.js, 组件开发]

# 后端开发文章  
tags: [后端, Node.js, API, 数据库]

# 工具使用文章
tags: [工具, Logseq, 效率, 笔记]

# 个人思考文章
tags: [思考, 个人成长, 读书笔记]
```

## 调试和验证

### 查看解析结果
插件会在控制台输出解析的标签信息：

```
[Logseq-Halo] [DEBUG] 提取的Logseq属性: { tags: ['Logseq', 'Halo', '博客'] }
[Logseq-Halo] [INFO] 处理标签: Logseq, Halo, 博客
[Logseq-Halo] [INFO] 标签处理完成: logseq, halo, bo-ke
```

### 验证标签创建
发布文章后，可以在 Halo 后台的「标签管理」中查看是否正确创建了标签。

## 总结

YAML 格式的标签使用非常简单：

1. **基本格式**：`tags: [标签1, 标签2, 标签3]`
2. **支持中英文**：完全支持中文和英文标签
3. **自动创建**：不存在的标签会自动创建
4. **灵活配置**：可以与其他元数据字段组合使用

按照这个指南，你就可以轻松地为你的 Logseq 文章添加标签，并成功发布到 Halo 博客了！