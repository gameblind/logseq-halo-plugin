/**
 * 当前图片访问测试脚本
 * 用于在Logseq插件环境中测试图片文件的可访问性
 */

// 测试函数：检查图片文件访问
async function testCurrentImageAccess() {
  console.log('🔍 开始测试当前图片文件访问...')
  
  // 测试图片路径（请根据实际情况修改）
  const testImagePath = '../assets/image_1754625746051_0.png'
  
  // 提取文件名
  const fileName = testImagePath.replace('../assets/', '')
  console.log(`📁 测试文件: ${fileName}`)
  
  // 尝试的路径列表
  const fetchPaths = [
    `./assets/${fileName}`,      // 相对于插件根目录
    `assets/${fileName}`,        // 直接相对路径
    `../assets/${fileName}`,     // 上级目录的assets
    `../../assets/${fileName}`,  // 上上级目录的assets
    testImagePath,               // 原始路径
    fileName                     // 仅文件名
  ]
  
  console.log(`📂 将尝试以下路径 (共${fetchPaths.length}个):`)  
  fetchPaths.forEach((path, index) => {
    console.log(`   ${index + 1}. ${path}`)
  })
  
  let successCount = 0
  let results = []
  
  for (let i = 0; i < fetchPaths.length; i++) {
    const path = fetchPaths[i]
    try {
      console.log(`\n🔄 尝试路径 ${i + 1}/${fetchPaths.length}: ${path}`)
      
      const response = await fetch(path)
      const contentType = response.headers.get('content-type')
      const contentLength = response.headers.get('content-length')
      
      console.log(`   响应状态: ${response.status} ${response.statusText}`)
      console.log(`   Content-Type: ${contentType || '未知'}`)
      console.log(`   Content-Length: ${contentLength || '未知'} 字节`)
      
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        console.log(`✅ 成功读取!`)
        console.log(`   实际大小: ${arrayBuffer.byteLength} 字节`)
        console.log(`   文件类型: ${contentType || '未知'}`)
        
        results.push({
          path,
          success: true,
          size: arrayBuffer.byteLength,
          contentType
        })
        successCount++
      } else {
        console.log(`❌ 读取失败: ${response.status} ${response.statusText}`)
        results.push({
          path,
          success: false,
          error: `${response.status} ${response.statusText}`
        })
      }
    } catch (error) {
      console.log(`❌ 访问异常: ${error.message}`)
      results.push({
        path,
        success: false,
        error: error.message
      })
    }
  }
  
  // 输出测试总结
  console.log('\n📊 测试结果总结:')
  console.log(`   成功路径: ${successCount}/${fetchPaths.length}`)
  
  if (successCount > 0) {
    console.log('\n✅ 可用路径:')
    results.filter(r => r.success).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.path} (${result.size} 字节, ${result.contentType})`)
    })
  } else {
    console.log('\n❌ 所有路径都无法访问!')
    console.log('\n可能的原因:')
    console.log('   1. 图片文件不存在')
    console.log('   2. 文件路径权限问题')
    console.log('   3. Logseq插件环境限制')
    console.log('   4. 浏览器安全策略限制')
  }
  
  return results
}

// 测试Logseq API可用性
function testLogseqAPI() {
  console.log('\n🔍 检查Logseq API可用性...')
  
  if (typeof logseq === 'undefined') {
    console.log('❌ logseq对象不可用')
    return false
  }
  
  console.log('✅ logseq对象可用')
  console.log(`   版本: ${logseq.version || '未知'}`)
  
  // 检查Assets API
  if (logseq.Assets) {
    console.log('✅ logseq.Assets API可用')
    console.log(`   可用方法: ${Object.keys(logseq.Assets).join(', ')}`)
  } else {
    console.log('❌ logseq.Assets API不可用')
  }
  
  // 检查FileStorage API
  if (logseq.FileStorage) {
    console.log('✅ logseq.FileStorage API可用')
    console.log(`   可用方法: ${Object.keys(logseq.FileStorage).join(', ')}`)
  } else {
    console.log('❌ logseq.FileStorage API不可用')
  }
  
  return true
}

// 主测试函数
async function runImageAccessTest() {
  console.log('🚀 开始图片访问诊断测试...')
  console.log('=' * 60)
  
  // 1. 检查Logseq API
  testLogseqAPI()
  
  // 2. 测试图片文件访问
  const results = await testCurrentImageAccess()
  
  console.log('\n🎯 诊断完成!')
  console.log('请将以上日志信息提供给开发者以便进一步分析。')
  
  return results
}

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testCurrentImageAccess, testLogseqAPI, runImageAccessTest }
}

// 在浏览器环境中自动运行
if (typeof window !== 'undefined') {
  // 延迟执行，确保页面加载完成
  setTimeout(() => {
    runImageAccessTest().catch(console.error)
  }, 1000)
}

console.log('📝 图片访问测试脚本已加载，请在控制台中运行 runImageAccessTest() 开始测试')