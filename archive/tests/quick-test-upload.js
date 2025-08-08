#!/usr/bin/env node

/**
 * 快速测试Halo图片上传API修复
 * 使用方法: node quick-test-upload.js [图片文件路径]
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Halo配置 - 请根据实际情况修改
const HALO_CONFIG = {
  baseUrl: 'https://s3.z100.vip:30053',
  token: 'pat_eyJraWQiOiJ2Q2EzZFQ1anRaaVZSdjF0X21ZOVBYNi1HbTB4Y0RyM2R1UE0yV3htMmlJIiwiYWxnIjoiUlMyNTYifQ.eyJpc3MiOiJodHRwOi8vMTkyLjE2OC4wLjI3OjgwOTAvIiwic3ViIjoiYnVkZHkiLCJpYXQiOjE3NTQ1NTk1NTMsImp0aSI6IjI1NWM2NGE1LWJiM2QtYTMzNS05MjNiLTU2NTY5NDAxZTkwOCIsInBhdF9uYW1lIjoicGF0LXl3a2trcW9wIn0.ZtBQoO0Eo9Z-j8UqpSv0kLwbUF7tYPA6OQTNRfP7HF-OFVfRvzkvl1U25Fs23zqCQnkCeLj9xzJD9xVUWjx-WywYG4Pdu-T48S8BCa8ChO5RNQu1B3pwGwVUBuMgKy4QmYXvii7Wj_AvQ47bw9mSpUdpgvfy0TMn3Tu9UaE3akJBleVWHBIXUFEtcZTy4hfnkz3fN8xyr2YQmrCt3xpSdNPHF92kGAoSHUft_SpPNRvuJnhV6_d2CSJrHiCEd0bOZeoRSkblr6K9BsRvxPA_6GqWDoXsRvZUqs34jMOQRFhj7e2rVNeKCzpXw4E2zxo5b9dbt1TJ2ZKJCYPZ0_BV5jYvdg0b0WarmV37aphsEZObhd-vN0MgyUjYdXrXPSE0-P01V_PeqI3gz9ESNXAB0iLyI3bnygIuPcMzi7w5t9nAI-0Gj8SF8RpZb2B_PbO5dG5MxHulQ9PhyqdrFdcFTplRqdXmn4p1zZcFKyn4pE7NWUiYHQGC2HbWCFKEuRXA9p1kSduLchzOPnp-eX4Ff_M742L2rI20Z0Uu_cjZ32c5XI45mvcS9aDMzx3zBFPUZOZ4qIv7INwxCZwSrNaO-jt8kXR0RrMu2NG4r54H5jUvvV2q4c_abAbc53I_Qn8sAty_a34QgquRhUHsHNpOwTpYa0pIAzvqiOlDFP04Cx0'
};

// 获取MIME类型
function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// 发送HTTP请求
function makeRequest(url, options, formData = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (formData) {
      formData.pipe(req);
    } else {
      req.end();
    }
  });
}

// 上传图片到Halo
async function uploadImage(imagePath) {
  try {
    console.log('🚀 开始测试Halo图片上传API修复...');
    console.log(`📁 图片文件: ${imagePath}`);
    
    // 1. 检查文件是否存在
    if (!fs.existsSync(imagePath)) {
      throw new Error(`图片文件不存在: ${imagePath}`);
    }
    
    // 2. 读取文件信息
    const fileName = path.basename(imagePath);
    const mimeType = getMimeType(fileName);
    const fileSize = fs.statSync(imagePath).size;
    
    console.log(`📋 文件信息:`);
    console.log(`   文件名: ${fileName}`);
    console.log(`   MIME类型: ${mimeType}`);
    console.log(`   文件大小: ${fileSize} 字节`);
    
    // 3. 准备FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath), {
      filename: fileName,
      contentType: mimeType
    });
    formData.append('policyName', 'default-policy');
    // 不指定groupName，让Halo使用默认设置
    // formData.append('groupName', 'default');
    
    // 4. 发送上传请求
    const uploadUrl = `${HALO_CONFIG.baseUrl}/apis/api.console.halo.run/v1alpha1/attachments/upload`;
    console.log(`🌐 上传地址: ${uploadUrl}`);
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HALO_CONFIG.token}`,
        ...formData.getHeaders()
      }
    };
    
    console.log('📤 正在上传...');
    const response = await makeRequest(uploadUrl, options, formData);
    
    console.log(`📡 服务器响应: ${response.status}`);
    
    if (response.status !== 200) {
      throw new Error(`上传失败: HTTP ${response.status}`);
    }
    
    const result = response.data;
    console.log('📄 响应数据:');
    console.log(JSON.stringify(result, null, 2));
    
    // 5. 解析图片URL（使用修复后的逻辑）
    let imageUrl = null;
    
    // 方法1: 从annotations中获取uri（Halo标准响应）
    if (result.metadata?.annotations?.['storage.halo.run/uri']) {
      imageUrl = result.metadata.annotations['storage.halo.run/uri'];
      console.log(`\n📍 ✅ 从annotations获取到图片URI: ${imageUrl}`);
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
      // 构建完整访问地址
      let fullUrl = imageUrl;
      if (imageUrl.startsWith('/')) {
        fullUrl = HALO_CONFIG.baseUrl + imageUrl;
      }
      
      console.log('\n🎉 图片上传成功!');
      console.log(`📍 原始URI: ${imageUrl}`);
      console.log(`🔗 完整访问地址: ${fullUrl}`);
      console.log(`💡 说明: 图片已成功上传到Halo，可以在文章中使用相对路径 ${imageUrl}`);
      
      return {
        success: true,
        uri: imageUrl,
        fullUrl: fullUrl,
        response: result
      };
    } else {
      console.log('\n❌ 响应中未找到图片URL');
      console.log('💡 预期字段: metadata.annotations["storage.halo.run/uri"] 或 spec.url 或 url');
      
      return {
        success: false,
        error: '响应中未找到图片URL',
        response: result
      };
    }
    
  } catch (error) {
    console.error('\n❌ 上传失败:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 主函数
async function main() {
  const imagePath = process.argv[2];
  
  if (!imagePath) {
    console.log('使用方法: node quick-test-upload.js [图片文件路径]');
    console.log('示例: node quick-test-upload.js ./test-image.png');
    process.exit(1);
  }
  
  const result = await uploadImage(imagePath);
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果总结:');
  
  if (result.success) {
    console.log('✅ 修复成功! 图片上传API现在可以正确解析响应中的图片URL了');
    console.log(`📍 图片URI: ${result.uri}`);
    console.log(`🔗 完整URL: ${result.fullUrl}`);
  } else {
    console.log('❌ 修复可能还有问题，请检查:');
    console.log(`   错误信息: ${result.error}`);
    if (result.response) {
      console.log('   响应结构可能与预期不符，请查看上面的响应数据');
    }
  }
  
  console.log('='.repeat(50));
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { uploadImage };