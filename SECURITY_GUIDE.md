# 安全指南 (Security Guide)

## 概述

本文档提供了 Logseq Halo 插件开发和使用过程中的安全最佳实践，确保敏感信息得到妥善保护。

## 🔒 敏感信息处理

### 禁止硬编码的信息

**绝对不要在代码中硬编码以下信息：**

- API Token/密钥
- 密码
- 服务器地址（生产环境）
- 数据库连接字符串
- 任何个人或敏感配置信息

### ✅ 正确的做法

1. **使用配置文件**
   ```typescript
   // 从配置中获取 token
   const token = await logseq.App.getUserConfigs().haloToken;
   ```

2. **环境变量**
   ```bash
   # 开发环境
   export HALO_TOKEN="your-token-here"
   ```

3. **用户输入**
   - 通过 UI 界面让用户输入配置
   - 使用 Logseq 的设置系统存储

## 🛡️ 代码安全检查

### 提交前检查清单

- [ ] 检查所有文件中是否包含硬编码的 token
- [ ] 确认测试文件不包含真实的 API 密钥
- [ ] 验证 `.gitignore` 包含敏感文件
- [ ] 检查日志输出不包含敏感信息

### 搜索命令

```bash
# 搜索可能的硬编码 token
grep -r "token.*=.*['\"]" src/
grep -r "password.*=.*['\"]" src/
grep -r "api.*key.*=.*['\"]" src/
```

## 📁 文件安全

### .gitignore 配置

确保以下文件类型被忽略：

```gitignore
# 敏感配置
.env
.env.local
.env.production
config.local.json

# 测试文件（包含真实数据）
test-data/
*.test.local.*

# 临时文件
*.tmp
*.log
```

### 测试文件安全

- 使用模拟数据而非真实 API 密钥
- 测试文件应使用 `MOCK_TOKEN` 或 `TEST_TOKEN`
- 真实测试数据应存储在本地且不提交到版本控制

## 🔍 已修复的安全问题

### v1.0.1 修复

- ✅ 删除了包含硬编码 token 的测试文件
- ✅ 确认主代码使用动态 token 获取
- ✅ 添加了安全检查指南

## 📋 安全审计

### 定期检查

1. **代码审查**
   - 每次提交前进行安全检查
   - 使用自动化工具扫描敏感信息

2. **依赖安全**
   ```bash
   npm audit
   npm audit fix
   ```

3. **权限最小化**
   - 只请求必要的 API 权限
   - 定期轮换 API 密钥

## 🚨 应急响应

### 如果意外泄露敏感信息

1. **立即行动**
   - 撤销/更换泄露的 API 密钥
   - 从版本历史中移除敏感信息
   - 通知相关用户更新配置

2. **清理历史**
   ```bash
   # 从 Git 历史中移除敏感文件
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch path/to/sensitive/file' \
     --prune-empty --tag-name-filter cat -- --all
   ```

## 📞 联系方式

如发现安全问题，请通过以下方式报告：

- 创建 GitHub Issue（非敏感问题）
- 发送邮件至维护者（敏感安全问题）

---

**记住：安全是每个人的责任！**