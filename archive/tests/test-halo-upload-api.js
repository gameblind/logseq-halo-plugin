/**
 * Halo图片上传API独立测试脚本
 * 用于测试Halo服务器的附件上传功能
 */

// 配置信息 - 请根据实际情况修改
const HALO_CONFIG = {
  baseUrl: 'https://your-halo-site.com', // 替换为你的Halo站点地址
  token: 'your-api-token' // 替换为你的API Token
}

// 测试用的图片文件路径
const TEST_IMAGE_PATHS = [
  './assets/test-image.png',
  './assets/test-image.svg',
  './assets/image_1754625746051_0.png'
]

/**
 * 获取MIME类型
 */
function getMimeType(fileName) {
  const extension = fileName.toLowerCase().split('.').pop()
  const mimeTypes = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml'
  }
  return mimeTypes[extension] || 'image/png'
}

/**
 * 提取文件名
 */
function extractFileName(imagePath) {
  const parts = imagePath.split('/')
  return parts[parts.length - 1] || 'image.png'
}

/**
 * 测试单个图片上传
 */
async function testImageUpload(imagePath) {
  console.log(`\n🔍 测试图片上传: ${imagePath}`)
  console.log('=' * 50)
  
  try {
    // 1. 读取图片文件
    console.log('📁 正在读取图片文件...')
    const response = await fetch(imagePath)
    
    if (!response.ok) {
      throw new Error(`无法读取图片文件: ${response.status} ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type')
    
    console.log(`✅ 图片文件读取成功`)
    console.log(`   文件大小: ${arrayBuffer.byteLength} 字节`)
    console.log(`   Content-Type: ${contentType}`)
    
    // 2. 准备上传数据
    const fileName = extractFileName(imagePath)
    const mimeType = getMimeType(fileName)
    
    console.log(`\n📋 准备上传数据:`)
    console.log(`   文件名: ${fileName}`)
    console.log(`   MIME类型: ${mimeType}`)
    
    const formData = new FormData()
    const blob = new Blob([arrayBuffer], { type: mimeType })
    
    formData.append('file', blob, fileName)
    formData.append('policyName', 'default-policy')
    formData.append('groupName', 'default')
    
    // 3. 上传到Halo
    console.log(`\n🌐 正在上传到Halo服务器...`)
    console.log(`   Halo站点: ${HALO_CONFIG.baseUrl}`)
    console.log(`   上传端点: /apis/api.console.halo.run/v1alpha1/attachments/upload`)
    
    const uploadUrl = `${HALO_CONFIG.baseUrl}/apis/api.console.halo.run/v1alpha1/attachments/upload`
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HALO_CONFIG.token}`
      },
      body: formData
    })
    
    console.log(`\n📡 Halo服务器响应:`)
    console.log(`   状态码: ${uploadResponse.status}`)
    console.log(`   状态文本: ${uploadResponse.statusText}`)
    
    // 4. 处理响应
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.log(`❌ 上传失败:`)
      console.log(`   错误内容: ${errorText}`)
      return { success: false, error: `${uploadResponse.status}: ${errorText}` }
    }
    
    const result = await uploadResponse.json()
    console.log(`\n📄 响应数据:`, JSON.stringify(result, null, 2))
    
    // 5. 提取图片URL
    const imageUrl = result.spec?.url || result.url || null
    
    if (imageUrl) {
      console.log(`\n🎉 上传成功!`)
      console.log(`   图片URL: ${imageUrl}`)
      return { success: true, url: imageUrl, response: result }
    } else {
      console.log(`\n❌ 响应中未找到图片URL`)
      console.log(`   完整响应: ${JSON.stringify(result, null, 2)}`)
      return { success: false, error: '响应中未找到图片URL', response: result }
    }
    
  } catch (error) {
    console.log(`\n❌ 上传过程中发生错误:`)
    console.log(`   错误信息: ${error.message}`)
    console.log(`   错误详情:`, error)
    return { success: false, error: error.message }
  }
}

/**
 * 测试Halo连接
 */
async function testHaloConnection() {
  console.log('\n🌐 测试Halo连接...')
  console.log('=' * 30)
  
  try {
    const testUrl = `${HALO_CONFIG.baseUrl}/apis/api.console.halo.run/v1alpha1/users/-/detail`
    
    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${HALO_CONFIG.token}`
      }
    })
    
    console.log(`连接测试结果: ${response.status} ${response.statusText}`)
    
    if (response.ok) {
      console.log('✅ Halo连接正常')
      return true
    } else {
      const errorText = await response.text()
      console.log('❌ Halo连接失败')
      console.log(`错误信息: ${errorText}`)
      return false
    }
  } catch (error) {
    console.log('❌ Halo连接异常')
    console.log(`错误信息: ${error.message}`)
    return false
  }
}

/**
 * 主测试函数
 */
async function runUploadTest() {
  console.log('🚀 开始Halo图片上传API测试')
  console.log('=' * 60)
  
  // 检查配置
  if (HALO_CONFIG.baseUrl === 'https://your-halo-site.com' || HALO_CONFIG.token === 'your-api-token') {
    console.log('❌ 请先配置HALO_CONFIG中的baseUrl和token')
    return
  }
  
  // 测试连接
  const connected = await testHaloConnection()
  if (!connected) {
    console.log('\n❌ Halo连接失败，请检查配置后重试')
    return
  }
  
  // 测试图片上传
  const results = []
  
  for (const imagePath of TEST_IMAGE_PATHS) {
    const result = await testImageUpload(imagePath)
    results.push({ imagePath, ...result })
  }
  
  // 生成测试报告
  console.log('\n\n📊 测试报告')
  console.log('=' * 20)
  
  const successCount = results.filter(r => r.success).length
  const failCount = results.length - successCount
  
  console.log(`\n📈 总体统计:`)
  console.log(`   测试图片数量: ${results.length}`)
  console.log(`   成功上传: ${successCount}`)
  console.log(`   失败数量: ${failCount}`)
  
  console.log(`\n📋 详细结果:`)
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.imagePath}`)
    if (result.success) {
      console.log(`   ✅ 上传成功`)
      console.log(`   🔗 图片URL: ${result.url}`)
    } else {
      console.log(`   ❌ 上传失败`)
      console.log(`   💥 错误: ${result.error}`)
    }
  })
  
  if (successCount > 0) {
    console.log('\n🎉 部分或全部图片上传成功！')
  } else {
    console.log('\n😞 所有图片上传都失败了，请检查:')
    console.log('   1. Halo站点URL是否正确')
    console.log('   2. API Token是否有效且有上传权限')
    console.log('   3. 图片文件是否存在')
    console.log('   4. 网络连接是否正常')
    console.log('   5. Halo服务器的附件上传设置')
  }
}

// 使用说明
console.log('📖 使用说明:')
console.log('1. 修改HALO_CONFIG中的baseUrl和token')
console.log('2. 确保测试图片文件存在于assets目录')
console.log('3. 在浏览器控制台中运行: runUploadTest()')
console.log('')
console.log('💻 快速开始: runUploadTest()')

// 导出函数供控制台使用
if (typeof window !== 'undefined') {
  window.runUploadTest = runUploadTest
  window.testImageUpload = testImageUpload
  window.testHaloConnection = testHaloConnection
}

// Node.js环境支持
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runUploadTest, testImageUpload, testHaloConnection }
}