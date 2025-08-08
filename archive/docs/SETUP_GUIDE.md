# Halo Publisher 插件配置指南

## 快速开始

### 1. 获取 Halo API Token

1. 登录你的 Halo 后台管理界面
2. 进入 **用户中心** > **个人令牌**
3. 点击 **新建令牌**
4. 填写令牌名称（如：Logseq Publisher）
5. 设置过期时间（建议选择较长时间或永不过期）
6. 点击 **确定** 创建
7. **重要：复制生成的令牌并妥善保存**

### 2. 配置插件

1. 在 Logseq 中点击右上角的 **设置** 图标
2. 在左侧菜单中找到 **插件** 选项
3. 找到 **Halo Publisher** 插件
4. 点击插件右侧的 **设置** 按钮

### 3. 填写站点配置

在 **Halo 站点配置** 字段中，填入以下 JSON 格式的配置：

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

**参数说明：**
- `name`: 站点显示名称，可以自定义
- `url`: 你的 Halo 站点地址（不要包含 /api 路径）
- `token`: 第1步获取的 API Token
- `isDefault`: 是否为默认站点（true/false）

**多站点配置示例：**
```json
[
  {
    "name": "主博客",
    "url": "https://blog.example.com",
    "token": "token1",
    "isDefault": true
  },
  {
    "name": "技术博客",
    "url": "https://tech.example.com",
    "token": "token2",
    "isDefault": false
  }
]
```

### 4. 其他设置

- **默认发布**: 勾选后新文章将直接发布，否则保存为草稿
- **自动生成摘要**: 当文章没有手动设置摘要时，自动从内容生成
- **启用图片上传**: 自动上传文章中的本地图片到 Halo
- **日志级别**: 设置插件的日志输出级别

## 使用方法

### 发布文章

1. 在 Logseq 中打开要发布的页面
2. 使用快捷键 `Cmd+Alt+H` (Mac) 或 `Ctrl+Alt+H` (Windows)
3. 或者使用命令面板：`Cmd+Shift+P` 然后搜索 "发布到 Halo"

### 文章元数据

在页面开头添加以下元数据来控制发布行为：

```markdown
title:: 文章标题
slug:: article-slug
category:: 技术分享
tags:: Logseq, Halo, 博客
excerpt:: 这是文章摘要
published:: true
publishTime:: 2024-01-20
```

## 常见问题

### Q: 为什么看到的是 JSON 编辑器？
A: 这是 Logseq 插件的标准设置界面。请按照上述指南填写 JSON 格式的配置。

### Q: API Token 在哪里获取？
A: 登录 Halo 后台 → 用户中心 → 个人令牌 → 新建令牌

### Q: 配置后无法连接？
A: 请检查：
1. URL 是否正确（不要包含 /api 路径）
2. Token 是否有效
3. Halo 版本是否支持（建议 2.0+）
4. 网络连接是否正常

### Q: 如何测试连接？
A: 使用命令面板搜索 "测试 Halo 连接" 命令

## 技术支持

如果遇到问题，请：
1. 检查浏览器控制台的错误信息
2. 查看 Logseq 的日志输出
3. 确认 Halo 站点的 API 可访问性

---

配置完成后，你就可以开始使用 Halo Publisher 插件将 Logseq 笔记发布到 Halo 博客了！