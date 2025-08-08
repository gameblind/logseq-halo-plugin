const { HaloService, ContentProcessor } = require('./dist/index.js')

// 从环境变量或用户输入获取Halo配置
const siteConfig = {
  id: 'test-site',
  name: '测试站点',
  url: process.env.HALO_URL || 'http://localhost:8090',
  token: process.env.HALO_TOKEN || 'your-token-here'
}

// 测试页面内容
const testContent = `title:: 十五年十五图
categories:: [项目]
tags:: [个人总结, 好人立志, 方法论]
published:: true
date:: 2021-7-20

## 目录

一、建筑是对土之本
二、人民立场，好人立志
三、社会主义民主主义
四、数据十年，建设十年
五、四个To Be
六、互联网建设方法
七、管理

这是一篇测试文章的内容。`

async function testHaloCategoriesAndTags() {
  console.log('🧪 开始测试Halo分类和标签功能...')
  
  // 检查配置
  if (siteConfig.token === 'your-token-here') {
    console.log('❌ 请设置正确的HALO_URL和HALO_TOKEN环境变量')
    console.log('示例:')
    console.log('export HALO_URL="https://your-halo-site.com"')
    console.log('export HALO_TOKEN="your-api-token"')
    return
  }
  
  try {
    // 解析内容
    console.log('\n📝 解析页面内容...')
    const result = ContentProcessor.parsePageContent(testContent, '十五年十五图')
    console.log('解析结果:')
    console.log('- 标题:', result.metadata.title)
    console.log('- 分类:', result.metadata.categories)
    console.log('- 标签:', result.metadata.tags)
    console.log('- 发布状态:', result.metadata.published)
    
    // 创建Halo服务实例
    console.log('\n🔗 连接Halo服务...')
    const haloService = new HaloService(siteConfig)
    
    // 测试连接
    const connected = await haloService.testConnection()
    if (!connected) {
      console.log('❌ Halo连接失败，请检查URL和Token')
      return
    }
    console.log('✅ Halo连接成功')
    
    // 获取当前分类和标签
    console.log('\n📊 获取当前分类和标签...')
    const [categories, tags] = await Promise.all([
      haloService.getCategories(),
      haloService.getTags()
    ])
    
    console.log('\n当前分类列表:')
    categories.forEach(cat => {
      console.log(`  - ${cat.spec.displayName} (${cat.metadata.name})`)
    })
    
    console.log('\n当前标签列表:')
    tags.forEach(tag => {
      console.log(`  - ${tag.spec.displayName} (${tag.metadata.name})`)
    })
    
    // 测试分类处理
    console.log('\n📂 测试分类处理...')
    const categoryNames = await haloService.getCategoryNames(result.metadata.categories)
    console.log('分类处理结果:', categoryNames)
    
    // 测试标签处理
    console.log('\n🏷️ 测试标签处理...')
    const tagNames = await haloService.getTagNames(result.metadata.tags)
    console.log('标签处理结果:', tagNames)
    
    // 再次获取分类和标签，查看是否有新创建的
    console.log('\n📊 获取更新后的分类和标签...')
    const [newCategories, newTags] = await Promise.all([
      haloService.getCategories(),
      haloService.getTags()
    ])
    
    console.log('\n更新后分类列表:')
    newCategories.forEach(cat => {
      const isNew = !categories.find(c => c.metadata.name === cat.metadata.name)
      console.log(`  ${isNew ? '🆕' : '  '} ${cat.spec.displayName} (${cat.metadata.name})`)
    })
    
    console.log('\n更新后标签列表:')
    newTags.forEach(tag => {
      const isNew = !tags.find(t => t.metadata.name === tag.metadata.name)
      console.log(`  ${isNew ? '🆕' : '  '} ${tag.spec.displayName} (${tag.metadata.name})`)
    })
    
    // 测试文章发布（可选）
    const shouldPublish = process.env.TEST_PUBLISH === 'true'
    if (shouldPublish) {
      console.log('\n📝 测试文章发布...')
      const publishResult = await haloService.publishPost(result.metadata, result.content)
      if (publishResult.success) {
        console.log('✅ 文章发布成功!')
        console.log('文章名称:', publishResult.postName)
        if (publishResult.url) {
          console.log('文章URL:', publishResult.url)
        }
      } else {
        console.log('❌ 文章发布失败')
      }
    } else {
      console.log('\n💡 如需测试文章发布，请设置环境变量: export TEST_PUBLISH=true')
    }
    
    console.log('\n✅ 测试完成！')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
    console.error('错误详情:', error.stack)
  }
}

// 运行测试
if (require.main === module) {
  testHaloCategoriesAndTags()
}

module.exports = { testHaloCategoriesAndTags }