// 调试脚本：获取所有文章列表
const { HaloService } = require('./dist/index.js');

// 从用户配置中读取站点信息（需要用户提供）
const siteConfig = {
  id: 'default',
  name: '默认站点',
  url: 'YOUR_HALO_SITE_URL', // 需要替换为实际的站点URL
  token: 'YOUR_API_TOKEN'    // 需要替换为实际的API Token
};

async function debugGetAllPosts() {
  try {
    console.log('🔍 开始获取文章列表...');
    
    const haloService = new HaloService(siteConfig);
    const posts = await haloService.getAllPosts();
    
    console.log(`\n📊 文章统计:`);
    console.log(`总数: ${posts.length}`);
    
    console.log(`\n📝 文章详情:`);
    posts.forEach((post, index) => {
      const publishStatus = post.spec.publish ? '✅ 已发布' : '📝 草稿';
      const visibleStatus = post.spec.visible ? '👁️ 可见' : '🙈 隐藏';
      
      console.log(`${index + 1}. ${post.spec.title}`);
      console.log(`   状态: ${publishStatus} | ${visibleStatus}`);
      console.log(`   ID: ${post.metadata.name}`);
      console.log(`   创建时间: ${post.metadata.creationTimestamp}`);
      console.log(`   更新时间: ${post.metadata.labels?.['content.halo.run/last-released-snapshot'] || 'N/A'}`);
      console.log(`   分类: ${post.spec.categories?.join(', ') || '无'}`);
      console.log(`   标签: ${post.spec.tags?.join(', ') || '无'}`);
      console.log('   ---');
    });
    
    // 分析可能的问题
    const publishedPosts = posts.filter(p => p.spec.publish);
    const visiblePosts = posts.filter(p => p.spec.visible);
    const publishedAndVisible = posts.filter(p => p.spec.publish && p.spec.visible);
    
    console.log(`\n🔍 问题分析:`);
    console.log(`已发布文章: ${publishedPosts.length}`);
    console.log(`可见文章: ${visiblePosts.length}`);
    console.log(`已发布且可见: ${publishedAndVisible.length}`);
    
    if (publishedAndVisible.length !== posts.length) {
      console.log(`\n⚠️ 发现问题: 有 ${posts.length - publishedAndVisible.length} 篇文章可能不会在前台显示`);
      
      const problematicPosts = posts.filter(p => !p.spec.publish || !p.spec.visible);
      console.log('问题文章:');
      problematicPosts.forEach(post => {
        const issues = [];
        if (!post.spec.publish) issues.push('未发布');
        if (!post.spec.visible) issues.push('不可见');
        console.log(`- ${post.spec.title}: ${issues.join(', ')}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 获取文章列表失败:', error);
  }
}

// 使用说明
console.log('📖 使用说明:');
console.log('1. 请先修改 siteConfig 中的 url 和 token');
console.log('2. 然后运行: node debug-posts.js');
console.log('3. 或者在 Logseq 中使用命令: "获取 Halo 文章列表"');
console.log('');

// 如果直接运行此脚本
if (require.main === module) {
  if (siteConfig.url === 'YOUR_HALO_SITE_URL' || siteConfig.token === 'YOUR_API_TOKEN') {
    console.log('⚠️ 请先配置 siteConfig 中的 url 和 token');
  } else {
    debugGetAllPosts();
  }
}

module.exports = { debugGetAllPosts };