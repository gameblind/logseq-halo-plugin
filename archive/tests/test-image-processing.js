/**
 * 测试图片处理逻辑
 */

// 模拟测试内容
const testContent = `# 测试文章

这是一篇测试文章。

![image.png](../assets/image_1754625746051_0.png)

这里有另一张图片：

![screenshot.jpg](../assets/screenshot_123456.jpg)

还有一些普通文本。`;

console.log('原始内容:');
console.log(testContent);
console.log('\n' + '='.repeat(50) + '\n');

// 测试正则表达式
const imageRegex = /!\[([^\]]*)\]\((\.\.\/assets\/[^\)]+)\)/g;
const matches = Array.from(testContent.matchAll(imageRegex));

console.log('正则表达式匹配结果:');
console.log(`找到 ${matches.length} 个匹配项`);

matches.forEach((match, index) => {
  console.log(`匹配 ${index + 1}:`);
  console.log(`  完整匹配: ${match[0]}`);
  console.log(`  Alt文本: ${match[1]}`);
  console.log(`  图片路径: ${match[2]}`);
  
  // 处理文件名
  const fileName = match[2].replace('../assets/', '');
  console.log(`  处理后文件名: ${fileName}`);
  
  // 生成可能的路径
  const possiblePaths = [
    `assets/${fileName}`,
    `../assets/${fileName}`,
    `../../assets/${fileName}`,
    match[2], // 原始路径
    fileName // 仅文件名
  ];
  
  console.log(`  可能的路径:`);
  possiblePaths.forEach(path => console.log(`    - ${path}`));
  console.log('');
});

// 测试替换逻辑
let processedContent = testContent;
matches.forEach(match => {
  const [fullMatch, altText, imagePath] = match;
  const mockUploadedUrl = `https://halo.example.com/upload/images/${imagePath.replace('../assets/', '')}`;
  processedContent = processedContent.replace(fullMatch, `![${altText}](${mockUploadedUrl})`);
});

console.log('处理后的内容:');
console.log(processedContent);