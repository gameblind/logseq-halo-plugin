#!/usr/bin/env node

/**
 * Halo图片上传API命令行测试工具
 * 使用方法: node test-upload-cli.js
 */

const fs = require('fs');
const path = require('path');

// 配置信息 - 请根据实际情况修改
const HALO_CONFIG = {
  baseUrl: 'https://your-halo-site.com', // 替换为你的Halo站点地址
  token: 'your-api-token' // 替换为你的API Token
};

// 测试图片文件路径
const TEST_IMAGES = [
  './assets/test-image.png',
  './assets/test-image.svg',
  './assets/image_1754625746051_0.png'
];

/**
 * 获取MIME类型
 */
function getMimeType(fileName) {
  const extension = fileName.toLowerCase().split('.').pop();
  const mimeTypes = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml'
  };
  return mimeTypes[extension] || 'image/png';
}

/**
 * 创建FormData (Node.js版本)
 */
function createFormData(imageBuffer, fileName) {
  const boundary = '----formdata-' + Math.random().toString(36);
  const mimeType = getMimeType(fileName);
  
  let formData = '';
  
  // 添加file字段
  formData += `--${boundary}\r\n`;
  formData += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
  formData += `Content-Type: ${mimeType}\r\n\r\n`;
  
  // 将buffer转换为二进制字符串
  const binaryString = imageBuffer.toString('binary');
  formData += binaryString;
  formData += '\r\n';
  
  // 添加policyName字段
  formData += `--${boundary}\r\n`;
  formData += `Content-Disposition: form-data; name="policyName"\r\n\r\n`;
  formData += 'default-policy\r\n';
  
  // 不指定groupName，让Halo使用默认设置
  // formData += `--${boundary}\r\n`;
  // formData += `Content-Disposition: form-data; name="groupName"\r\n\r\n`;
  // formData += 'default\r\n';
  
  // 结束边界
  formData += `--${boundary}--\r\n`;
  
  return {
    data: Buffer.from(formData, 'binary'),
    contentType: `multipart/form-data; boundary=${boundary}`
  };
}

/**
 * 测试Halo连接
 */
async function testConnection() {
  console.log('\n🌐 测试Halo连接...');
  console.log('='.repeat(30));
  
  try {
    const testUrl = `${HALO_CONFIG.baseUrl}/apis/api.console.halo.run/v1alpha1/users/-/detail`;
    console.log(`📡 请求地址: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${HALO_CONFIG.token}`
      }
    });
    
    console.log(`📡 响应状态: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('✅ Halo连接正常');
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Halo连接失败');
      console.log(`错误信息: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Halo连接异常');
    console.log(`错误信息: ${error.message}`);
    return false;
  }
}

/**
 * 测试单个图片上传
 */
async function testImageUpload(imagePath) {
  console.log(`\n🔍 测试图片上传: ${imagePath}`);
  console.log('='.repeat(50));
  
  try {
    // 1. 检查文件是否存在
    if (!fs.existsSync(imagePath)) {
      throw new Error(`图片文件不存在: ${imagePath}`);
    }
    
    // 2. 读取图片文件
    console.log('📁 正在读取图片文件...');
    const imageBuffer = fs.readFileSync(imagePath);
    const fileName = path.basename(imagePath);
    const stats = fs.statSync(imagePath);
    
    console.log(`✅ 图片文件读取成功`);
    console.log(`   文件名: ${fileName}`);
    console.log(`   文件大小: ${stats.size} 字节`);
    console.log(`   MIME类型: ${getMimeType(fileName)}`);
    
    // 3. 准备FormData
    console.log('\n📋 准备上传数据...');
    const formData = createFormData(imageBuffer, fileName);
    
    // 4. 上传到Halo
    console.log('\n🌐 正在上传到Halo服务器...');
    const uploadUrl = `${HALO_CONFIG.baseUrl}/apis/api.console.halo.run/v1alpha1/attachments/upload`;
    console.log(`   上传地址: ${uploadUrl}`);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HALO_CONFIG.token}`,
        'Content-Type': formData.contentType
      },
      body: formData.data
    });
    
    console.log(`\n📡 服务器响应: ${response.status} ${response.statusText}`);
    
    // 5. 处理响应
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ 上传失败:`);
      console.log(`   错误内容: ${errorText}`);
      return { success: false, error: `${response.status}: ${errorText}` };
    }
    
    const result = await response.json();
    console.log('\n📄 响应数据:');
    console.log(JSON.stringify(result, null, 2));
    
    // 6. 提取图片URL - 根据Halo API响应结构解析
    let imageUrl = null;
    
    // 方法1: 从annotations中获取uri（Halo标准响应）
    if (result.metadata?.annotations?.['storage.halo.run/uri']) {
      imageUrl = result.metadata.annotations['storage.halo.run/uri'];
      console.log(`\n📍 从annotations获取到图片URI: ${imageUrl}`);
    }
    // 方法2: 从spec.url获取（备用）
    else if (result.spec?.url) {
      imageUrl = result.spec.url;
      console.log(`\n📍 从spec.url获取到图片URL: ${imageUrl}`);
    }
    // 方法3: 从根级url获取（备用）
    else if (result.url) {
      imageUrl = result.url;
      console.log(`\n📍 从根级url获取到图片URL: ${imageUrl}`);
    }
    
    if (imageUrl) {
      console.log('\n🎉 上传成功!');
      console.log(`   原始URI: ${imageUrl}`);
      
      // 构建完整访问地址
      let fullUrl = imageUrl;
      if (imageUrl.startsWith('/')) {
        fullUrl = HALO_CONFIG.baseUrl + imageUrl;
      }
      console.log(`   完整访问地址: ${fullUrl}`);
      console.log(`   💡 说明: 图片已成功上传到Halo，可以在文章中使用相对路径 ${imageUrl}`);
      
      return {
        success: true,
        url: imageUrl,
        fullUrl: fullUrl,
        response: result
      };
    } else {
      console.log('\n❌ 响应中未找到图片URL');
      console.log('   💡 预期字段: metadata.annotations["storage.halo.run/uri"] 或 spec.url 或 url');
      return { success: false, error: '响应中未找到图片URL', response: result };
    }
    
  } catch (error) {
    console.log(`\n❌ 上传过程中发生错误:`);
    console.log(`   错误信息: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 主测试函数
 */
async function runTest() {
  console.log('🚀 Halo图片上传API命令行测试');
  console.log('='.repeat(60));
  
  // 检查配置
  if (HALO_CONFIG.baseUrl === 'https://your-halo-site.com' || HALO_CONFIG.token === 'your-api-token') {
    console.log('❌ 请先在脚本中配置HALO_CONFIG的baseUrl和token');
    console.log('\n📝 配置步骤:');
    console.log('1. 打开 test-upload-cli.js 文件');
    console.log('2. 修改 HALO_CONFIG 中的 baseUrl 和 token');
    console.log('3. 重新运行测试');
    return;
  }
  
  // 检查Node.js版本和fetch支持
  if (typeof fetch === 'undefined') {
    console.log('❌ 当前Node.js版本不支持fetch API');
    console.log('请使用Node.js 18+版本，或安装node-fetch包');
    return;
  }
  
  // 测试连接
  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ Halo连接失败，请检查配置后重试');
    return;
  }
  
  // 测试图片上传
  const results = [];
  
  for (const imagePath of TEST_IMAGES) {
    const result = await testImageUpload(imagePath);
    results.push({ imagePath, ...result });
  }
  
  // 生成测试报告
  console.log('\n\n📊 测试报告');
  console.log('='.repeat(20));
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;
  
  console.log(`\n📈 总体统计:`);
  console.log(`   测试图片数量: ${results.length}`);
  console.log(`   成功上传: ${successCount}`);
  console.log(`   失败数量: ${failCount}`);
  
  console.log(`\n📋 详细结果:`);
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.imagePath}`);
    if (result.success) {
      console.log(`   ✅ 上传成功`);
      console.log(`   📍 图片URI: ${result.url}`);
      if (result.fullUrl) {
        console.log(`   🔗 完整URL: ${result.fullUrl}`);
      }
    } else {
      console.log(`   ❌ 上传失败`);
      console.log(`   💥 错误: ${result.error}`);
    }
  });
  
  if (successCount > 0) {
    console.log('\n🎉 部分或全部图片上传成功！');
    console.log('\n💡 接下来可以:');
    console.log('1. 在Halo后台查看附件库');
    console.log('2. 访问返回的图片URL验证');
    console.log('3. 检查插件中的图片上传逻辑');
  } else {
    console.log('\n😞 所有图片上传都失败了，请检查:');
    console.log('   1. Halo站点URL是否正确');
    console.log('   2. API Token是否有效且有上传权限');
    console.log('   3. 图片文件是否存在');
    console.log('   4. 网络连接是否正常');
    console.log('   5. Halo服务器的附件上传设置');
  }
}

// 运行测试
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { runTest, testImageUpload, testConnection };