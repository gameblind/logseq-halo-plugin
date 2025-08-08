/**
 * 快速图片访问测试脚本
 * 在浏览器控制台中运行，快速检查图片文件是否可访问
 */

// 快速测试函数
async function quickImageTest() {
  console.log('🔍 快速图片访问测试');
  console.log('='.repeat(30));
  
  const testPaths = [
    './assets/image_1754625746051_0.png',
    './assets/test-image.svg',
    'assets/image_1754625746051_0.png',
    'assets/test-image.svg',
    '../assets/image_1754625746051_0.png',
    '../assets/test-image.svg'
  ];
  
  for (const path of testPaths) {
    try {
      console.log(`\n📂 测试: ${path}`);
      const response = await fetch(path);
      
      if (response.ok) {
        const size = response.headers.get('content-length');
        const type = response.headers.get('content-type');
        console.log(`✅ 成功! 大小: ${size || '未知'}, 类型: ${type || '未知'}`);
        
        // 尝试读取数据
        const buffer = await response.arrayBuffer();
        console.log(`📏 实际读取: ${buffer.byteLength} 字节`);
      } else {
        console.log(`❌ 失败: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ 异常: ${error.message}`);
    }
  }
  
  console.log('\n🏁 测试完成');
}

// 测试单个图片
async function testSingleImage(path) {
  console.log(`🔍 测试单个图片: ${path}`);
  
  try {
    const response = await fetch(path);
    
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const type = response.headers.get('content-type');
      
      console.log('✅ 图片访问成功!');
      console.log(`📏 大小: ${buffer.byteLength} 字节`);
      console.log(`🎨 类型: ${type || '未知'}`);
      
      return { success: true, size: buffer.byteLength, type };
    } else {
      console.log(`❌ 访问失败: ${response.status} ${response.statusText}`);
      return { success: false, error: `${response.status} ${response.statusText}` };
    }
  } catch (error) {
    console.log(`❌ 访问异常: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 检查当前目录结构
async function checkCurrentDirectory() {
  console.log('📁 检查当前目录结构');
  console.log('='.repeat(25));
  
  const testFiles = [
    './package.json',
    './assets/',
    './src/',
    './dist/',
    './vite.config.ts'
  ];
  
  for (const file of testFiles) {
    try {
      const response = await fetch(file);
      if (response.ok) {
        console.log(`✅ 存在: ${file}`);
      } else {
        console.log(`❌ 不存在: ${file}`);
      }
    } catch (error) {
      console.log(`❌ 无法访问: ${file}`);
    }
  }
}

// 全面诊断
async function fullDiagnostic() {
  console.log('🔧 开始全面诊断...');
  console.log('='.repeat(40));
  
  // 1. 检查目录结构
  await checkCurrentDirectory();
  
  console.log('\n');
  
  // 2. 测试图片访问
  await quickImageTest();
  
  console.log('\n💡 如果图片无法访问，请检查:');
  console.log('1. 文件是否存在于 assets/ 目录');
  console.log('2. 文件名是否正确（注意大小写）');
  console.log('3. 浏览器是否允许本地文件访问');
  console.log('4. 插件是否正确加载');
}

// 导出到全局
if (typeof window !== 'undefined') {
  window.quickImageTest = quickImageTest;
  window.testSingleImage = testSingleImage;
  window.checkCurrentDirectory = checkCurrentDirectory;
  window.fullDiagnostic = fullDiagnostic;
  
  console.log('🚀 图片测试工具已加载!');
  console.log('可用命令:');
  console.log('- quickImageTest() - 快速测试所有图片');
  console.log('- testSingleImage(path) - 测试单个图片');
  console.log('- checkCurrentDirectory() - 检查目录结构');
  console.log('- fullDiagnostic() - 全面诊断');
  console.log('\n建议先运行: fullDiagnostic()');
}