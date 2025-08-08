const { HaloService, ContentProcessor } = require('./dist/index.js')

// 测试配置
const siteConfig = {
  id: 'test-site',
  name: '测试站点',
  url: process.env.HALO_URL || 'http://localhost:8090',
  token: process.env.HALO_TOKEN || 'your-token-here'
}

// 测试页面内容（包含Logseq页面属性格式的分类和标签）
const testPageContent = `title:: 测试文章标题
categories:: [技术分享, 教程]
tags:: [Logseq, Halo, 博客, 测试]
published:: true

这是一篇测试文章的内容。

## 测试标题

这里是一些测试内容。

- 列表项1
- 列表项2
- 列表项3

**粗体文本** 和 *斜体文本*。`

// 测试frontmatter格式
const testFrontmatterContent = `---
title: 另一篇测试文章
categories: [前端开发, Vue.js]
tags: [JavaScript, Vue, 前端]
published: true
---

这是使用frontmatter格式的测试文章。

### 子标题

内容测试。`

async function testCategoriesAndTags() {
  console.log('🧪 开始测试分类和标签处理...')
  
  try {
    // 测试1: Logseq页面属性格式
    console.log('\n📝 测试1: Logseq页面属性格式')
    const result1 = ContentProcessor.parsePageContent(testPageContent, '测试页面1')
    console.log('解析结果:')
    console.log('- 标题:', result1.metadata.title)
    console.log('- 分类:', result1.metadata.categories)
    console.log('- 标签:', result1.metadata.tags)
    console.log('- 发布状态:', result1.metadata.published)
    
    // 测试2: Frontmatter格式
    console.log('\n📝 测试2: Frontmatter格式')
    const result2 = ContentProcessor.parsePageContent(testFrontmatterContent, '测试页面2')
    console.log('解析结果:')
    console.log('- 标题:', result2.metadata.title)
    console.log('- 分类:', result2.metadata.categories)
    console.log('- 标签:', result2.metadata.tags)
    console.log('- 发布状态:', result2.metadata.published)
    
    // 测试3: 如果配置了Halo连接，测试实际的分类和标签创建
    if (siteConfig.token !== 'your-token-here') {
      console.log('\n🔗 测试3: 实际Halo API调用')
      const haloService = new HaloService(siteConfig)
      
      // 测试连接
      const connected = await haloService.testConnection()
      if (connected) {
        console.log('✅ Halo连接成功')
        
        // 测试分类处理
        console.log('\n📂 测试分类处理...')
        const categoryNames = await haloService.getCategoryNames(result1.metadata.categories)
        console.log('分类处理结果:', categoryNames)
        
        // 测试标签处理
        console.log('\n🏷️ 测试标签处理...')
        const tagNames = await haloService.getTagNames(result1.metadata.tags)
        console.log('标签处理结果:', tagNames)
        
        // 获取现有分类和标签
        console.log('\n📊 当前站点分类和标签:')
        const [categories, tags] = await Promise.all([
          haloService.getCategories(),
          haloService.getTags()
        ])
        
        console.log('分类列表:')
        categories.forEach(cat => {
          console.log(`  - ${cat.spec.displayName} (${cat.metadata.name})`)
        })
        
        console.log('标签列表:')
        tags.forEach(tag => {
          console.log(`  - ${tag.spec.displayName} (${tag.metadata.name})`)
        })
        
      } else {
        console.log('❌ Halo连接失败，跳过API测试')
      }
    } else {
      console.log('\n⚠️ 未配置Halo连接信息，跳过API测试')
      console.log('请设置环境变量 HALO_URL 和 HALO_TOKEN 来测试实际API调用')
    }
    
    console.log('\n✅ 测试完成！')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
    console.error('错误详情:', error.stack)
  }
}

// 运行测试
if (require.main === module) {
  testCategoriesAndTags()
}

module.exports = { testCategoriesAndTags }