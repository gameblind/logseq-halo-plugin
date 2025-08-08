# Halo图片地址格式和替换原则说明

## 📋 概述

本文档详细说明了Logseq文章发布到Halo时，图片上传和地址替换的完整流程。

## 🔄 图片处理流程

### 1. 图片识别阶段

**正则表达式匹配:**
```javascript
const imageRegex = /!\[([^\]]*)\]\((\.\.\/assets\/[^\)]+)\)/g
```

**匹配的图片格式:**
- `![image.png](../assets/image_1754625746051_0.png)`
- `![screenshot](../assets/screenshot_20241201.png)`
- `![](../assets/diagram.svg)`

**提取信息:**
- `altText`: 图片的alt文本（方括号内的内容）
- `imagePath`: 图片的相对路径（圆括号内的内容）

### 2. 图片读取阶段

**路径尝试顺序:**
1. `./assets/filename.png` - 相对于插件根目录
2. `assets/filename.png` - 直接相对路径
3. `../assets/filename.png` - 上级目录的assets
4. `../../assets/filename.png` - 上上级目录的assets
5. `../assets/filename.png` - 原始路径
6. `filename.png` - 仅文件名

**读取方式:**
- 使用 `fetch()` API 读取本地文件
- 转换为 `ArrayBuffer` 格式
- 验证文件大小和类型

### 3. 图片上传阶段

**上传端点:**
```
POST /apis/api.console.halo.run/v1alpha1/attachments/upload
```

**上传参数:**
- `file`: 图片文件（Blob格式）
- `policyName`: 'default-policy'
- `groupName`: 'default'

**请求格式:**
- Content-Type: `multipart/form-data`
- Authorization: `Bearer {token}`

## 🌐 Halo图片地址格式

### 相对地址格式（推荐）

```
/upload/2024/12/filename-uuid.png
```

**地址组成部分:**
1. **上传路径**: `/upload/`
2. **日期目录**: `2024/12/` (年/月)
3. **文件名**: `filename-uuid.png` (原文件名+UUID+扩展名)

### 完整URL格式（仅供参考）

```
https://your-halo-site.com/upload/2024/12/filename-uuid.png
```

**使用相对地址的优势:**
- 🔄 **域名无关**: 不受域名变更影响
- 🚀 **迁移友好**: 站点迁移时图片链接自动适配
- 📱 **协议自适应**: 自动适配HTTP/HTTPS
- 🎯 **简洁高效**: 减少URL长度

### 响应数据结构

**成功响应示例:**
```json
{
  "spec": {
    "url": "https://your-halo-site.com/upload/2024/12/image-abc123.png",
    "mediaType": "image/png",
    "size": 12345
  },
  "metadata": {
    "name": "attachment-uuid"
  }
}
```

**URL提取逻辑:**
```javascript
const imageUrl = result.spec?.url || result.url || null
```

## 🔄 地址替换原则

### 替换规则

**原始Logseq格式:**
```markdown
![image.png](../assets/image_1754625746051_0.png)
```

**替换后Halo格式（相对地址）:**
```markdown
![image.png](/upload/2024/12/image_1754625746051_0-uuid.png)
```

### 替换过程

1. **保持alt文本不变**: `![image.png]` 部分保持原样
2. **替换URL部分**: `(../assets/...)` 替换为 `(https://halo-url)`
3. **一对一替换**: 每个成功上传的图片都会被替换
4. **失败处理**: 上传失败的图片保持原始链接不变

### 替换代码逻辑

```javascript
// 1. 获取完整URL并转换为相对地址
const fullImageUrl = result.spec?.url || result.url || null
const relativeUrl = this.convertToRelativeUrl(fullImageUrl)

// 2. 替换图片链接
if (relativeUrl) {
  const newImageLink = `![${altText}](${relativeUrl})`
  processedContent = processedContent.replace(fullMatch, newImageLink)
}
```

**URL转换方法:**
```javascript
private convertToRelativeUrl(fullUrl: string): string {
  try {
    const url = new URL(fullUrl)
    return url.pathname  // 只返回路径部分
  } catch (error) {
    return fullUrl  // 解析失败时返回原始地址
  }
}
```

## 🎯 地址特点

### Halo图片URL的优势

1. **永久访问**: 图片存储在Halo服务器，可长期访问
2. **CDN支持**: 支持CDN加速（如果Halo配置了CDN）
3. **权限控制**: 遵循Halo的访问权限设置
4. **备份同步**: 随Halo数据一起备份

### 与Logseq本地路径的区别

| 特性 | Logseq本地路径 | Halo图片URL |
|------|----------------|-------------|
| 访问范围 | 仅本地Logseq | 全网访问 |
| 依赖性 | 依赖本地文件 | 独立存储 |
| 分享能力 | 无法分享 | 可直接分享 |
| 备份 | 需手动备份 | 自动备份 |

## 🔧 配置要求

### Halo站点配置

1. **上传策略**: 确保 'default-policy' 存在且可用
2. **存储组**: 确保 'default' 组存在
3. **权限设置**: API token需要附件上传权限
4. **存储空间**: 确保有足够的存储空间

### 网络要求

1. **网络连接**: 插件运行环境能访问Halo站点
2. **CORS设置**: Halo需要允许跨域请求（如果需要）
3. **HTTPS**: 建议使用HTTPS确保安全

## 🐛 常见问题

### 图片上传失败

**可能原因:**
1. 图片文件读取失败
2. Halo API配置错误
3. 网络连接问题
4. 权限不足
5. 存储空间不足

**解决方案:**
1. 检查图片文件是否存在
2. 验证Halo API配置
3. 测试网络连接
4. 确认API token权限
5. 检查Halo存储空间

### 地址替换不完整

**可能原因:**
1. 部分图片上传失败
2. 正则表达式匹配问题
3. 图片格式不支持

**解决方案:**
1. 查看详细日志确定失败原因
2. 检查图片路径格式
3. 确认图片格式支持

## 📊 调试信息

插件会输出详细的调试信息，包括:

- 🖼️ 图片处理开始
- 📊 匹配到的图片统计
- 📷 每张图片的详细信息
- 🔄 处理进度
- 📤 上传过程
- 📁 文件读取详情
- 🌐 Halo服务器响应
- ✅ 成功/失败统计

通过这些信息可以准确定位问题所在。