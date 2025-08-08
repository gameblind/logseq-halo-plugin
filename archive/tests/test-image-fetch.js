/**
 * 测试图片文件读取功能
 */

const fs = require('fs');
const path = require('path');

// 模拟图片路径
const imagePath = '../assets/test-image.svg';
const fileName = imagePath.replace('../assets/', '');

console.log('测试图片文件读取功能');
console.log(`原始路径: ${imagePath}`);
console.log(`文件名: ${fileName}`);
console.log('');

// 生成可能的路径
const possiblePaths = [
  `assets/${fileName}`,
  `../assets/${fileName}`,
  `../../assets/${fileName}`,
  imagePath, // 原始路径
  fileName // 仅文件名
];

console.log('尝试的路径列表:');
possiblePaths.forEach((testPath, index) => {
  console.log(`${index + 1}. ${testPath}`);
  
  try {
    // 检查文件是否存在
    const fullPath = path.resolve(testPath);
    if (fs.existsSync(fullPath)) {
      console.log(`   ✅ 文件存在: ${fullPath}`);
      
      // 读取文件内容
      const content = fs.readFileSync(fullPath);
      console.log(`   📄 文件大小: ${content.length} 字节`);
      console.log(`   📝 文件内容预览: ${content.toString().substring(0, 100)}...`);
    } else {
      console.log(`   ❌ 文件不存在: ${fullPath}`);
    }
  } catch (error) {
    console.log(`   ⚠️  读取错误: ${error.message}`);
  }
  console.log('');
});

// 检查当前工作目录
console.log('当前工作目录信息:');
console.log(`当前目录: ${process.cwd()}`);
console.log('当前目录内容:');
try {
  const files = fs.readdirSync('.');
  files.forEach(file => {
    const stat = fs.statSync(file);
    console.log(`  ${stat.isDirectory() ? '📁' : '📄'} ${file}`);
  });
} catch (error) {
  console.log(`读取目录失败: ${error.message}`);
}

// 检查assets目录
console.log('\nassets目录内容:');
try {
  if (fs.existsSync('assets')) {
    const files = fs.readdirSync('assets');
    files.forEach(file => {
      const stat = fs.statSync(path.join('assets', file));
      console.log(`  ${stat.isDirectory() ? '📁' : '📄'} ${file}`);
    });
  } else {
    console.log('  assets目录不存在');
  }
} catch (error) {
  console.log(`读取assets目录失败: ${error.message}`);
}