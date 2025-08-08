/**
 * 图片处理调试脚本
 * 用于测试图片路径解析和处理逻辑
 */

// 模拟测试内容
const testMarkdown = `# 测试文章

这是一篇包含图片的测试文章。

![image.png](../assets/image_1754625746051_0.png)

这是图片后的内容。
`;

console.log('🧪 开始图片处理调试测试...');
console.log('📝 测试内容:');
console.log(testMarkdown);
console.log('\n' + '='.repeat(50));

// 测试图片匹配正则表达式
const imageRegex = /!\[([^\]]*)\]\((\.\.\/assets\/[^\)]+)\)/g;
const matches = Array.from(testMarkdown.matchAll(imageRegex));

console.log(`📊 图片匹配结果: 找到 ${matches.length} 张图片`);

matches.forEach((match, index) => {
  const [fullMatch, altText, imagePath] = match;
  console.log(`📷 图片 ${index + 1}:`);
  console.log(`   完整匹配: ${fullMatch}`);
  console.log(`   Alt文本: "${altText}"`);
  console.log(`   图片路径: "${imagePath}"`);
  
  // 测试路径处理
  const fileName = imagePath.replace('../assets/', '');
  console.log(`   提取文件名: "${fileName}"`);
  
  // 测试可能的路径
  const possiblePaths = [
    `./assets/${fileName}`,
    `assets/${fileName}`,
    `../assets/${fileName}`,
    `../../assets/${fileName}`,
    imagePath,
    fileName
  ];
  
  console.log(`   可能的路径 (${possiblePaths.length}个):`);
  possiblePaths.forEach((path, pathIndex) => {
    console.log(`     ${pathIndex + 1}. ${path}`);
  });
  
  console.log('');
});

console.log('\n' + '='.repeat(50));
console.log('🔍 检查实际文件是否存在...');

// 检查assets目录
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
console.log(`📁 Assets目录: ${assetsDir}`);

if (fs.existsSync(assetsDir)) {
  console.log('✅ Assets目录存在');
  const files = fs.readdirSync(assetsDir);
  console.log(`📄 目录中的文件 (${files.length}个):`);
  files.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
  
  // 检查测试图片是否存在
  const testImageName = 'image_1754625746051_0.png';
  const testImagePath = path.join(assetsDir, testImageName);
  if (fs.existsSync(testImagePath)) {
    console.log(`✅ 测试图片存在: ${testImageName}`);
    const stats = fs.statSync(testImagePath);
    console.log(`   文件大小: ${stats.size} 字节`);
  } else {
    console.log(`❌ 测试图片不存在: ${testImageName}`);
    console.log('💡 建议创建一个测试图片文件');
  }
} else {
  console.log('❌ Assets目录不存在');
  console.log('💡 建议检查目录结构');
}

console.log('\n🏁 调试测试完成');