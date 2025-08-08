/**
 * 图片上传问题诊断脚本
 * 用于检查图片文件的可访问性和上传流程
 */

// 测试图片路径
const testImages = [
  '../assets/image_1754625746051_0.png',
  '../assets/test-image.svg'
]

// 可能的路径组合
function getPossiblePaths(imagePath) {
  const fileName = imagePath.replace('../assets/', '')
  return [
    `./assets/${fileName}`,
    `assets/${fileName}`,
    `../assets/${fileName}`,
    `../../assets/${fileName}`,
    imagePath,
    fileName
  ]
}

// 测试图片文件访问
async function testImageAccess(imagePath) {
  console.log(`\n🔍 测试图片: ${imagePath}`)
  console.log('=' * 50)
  
  const possiblePaths = getPossiblePaths(imagePath)
  
  for (let i = 0; i < possiblePaths.length; i++) {
    const path = possiblePaths[i]
    try {
      console.log(`\n📂 尝试路径 ${i + 1}/${possiblePaths.length}: ${path}`)
      
      const response = await fetch(path)
      const contentType = response.headers.get('content-type')
      const contentLength = response.headers.get('content-length')
      
      console.log(`   状态: ${response.status} ${response.statusText}`)
      console.log(`   类型: ${contentType || '未知'}`)
      console.log(`   大小: ${contentLength || '未知'} 字节`)
      
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        console.log(`✅ 成功! 实际大小: ${arrayBuffer.byteLength} 字节`)
        return { success: true, path, size: arrayBuffer.byteLength, contentType }
      } else {
        console.log(`❌ 失败: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ 异常: ${error.message}`)
    }
  }
  
  console.log(`\n❌ 所有路径都无法访问!`)
  return { success: false }
}

// 测试Halo连接
async function testHaloConnection() {
  console.log('\n🌐 测试Halo连接...')
  console.log('=' * 30)
  
  // 这里需要从插件配置中获取Halo站点信息
  // 由于这是独立脚本，我们只能提供测试框架
  console.log('⚠️  需要在Logseq插件环境中运行以获取Halo配置')
  
  return false
}

// 主测试函数
async function runDiagnostics() {
  console.log('🔧 开始图片上传问题诊断...')
  console.log('=' * 60)
  
  const results = []
  
  // 测试每个图片文件
  for (const imagePath of testImages) {
    const result = await testImageAccess(imagePath)
    results.push({ imagePath, ...result })
  }
  
  // 测试Halo连接
  const haloConnected = await testHaloConnection()
  
  // 生成诊断报告
  console.log('\n📋 诊断报告')
  console.log('=' * 20)
  
  console.log('\n📁 图片文件访问测试:')
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.imagePath}`)
    if (result.success) {
      console.log(`   ✅ 可访问`)
      console.log(`   📍 路径: ${result.path}`)
      console.log(`   📏 大小: ${result.size} 字节`)
      console.log(`   🎨 类型: ${result.contentType || '未知'}`)
    } else {
      console.log(`   ❌ 无法访问`)
      console.log(`   💡 建议: 检查文件是否存在于assets目录`)
    }
  })
  
  console.log('\n🌐 Halo连接测试:')
  if (haloConnected) {
    console.log('   ✅ 连接正常')
  } else {
    console.log('   ❌ 无法连接或需要在插件环境中测试')
  }
  
  // 提供解决建议
  console.log('\n💡 问题排查建议:')
  console.log('1. 确保图片文件存在于 assets/ 目录')
  console.log('2. 检查文件名是否正确（区分大小写）')
  console.log('3. 验证Halo站点配置和API密钥')
  console.log('4. 检查网络连接和防火墙设置')
  console.log('5. 查看浏览器控制台的详细错误信息')
  
  const successCount = results.filter(r => r.success).length
  console.log(`\n📊 总结: ${successCount}/${results.length} 个图片文件可访问`)
}

// 在浏览器控制台中运行
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.runImageDiagnostics = runDiagnostics
  console.log('💻 在浏览器控制台中运行: runImageDiagnostics()')
} else {
  // Node.js环境
  runDiagnostics().catch(console.error)
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runDiagnostics, testImageAccess, getPossiblePaths }
}