// 简单的插件测试脚本
// 模拟 Logseq 环境来测试插件的基本功能

// 模拟 Logseq API
const mockLogseq = {
  ready: (callback) => {
    console.log('✓ Logseq 准备就绪，开始初始化插件');
    if (typeof callback === 'function') {
      setTimeout(callback, 100); // 模拟异步初始化
    }
    return Promise.resolve();
  },
  App: {
    registerCommand: (key, config, callback) => {
      console.log(`✓ 命令注册成功: ${key}`);
      console.log(`  - 标签: ${config.label}`);
      console.log(`  - 描述: ${config.desc}`);
      if (config.keybinding) {
        console.log(`  - 快捷键: ${config.keybinding.binding}`);
      }
      console.log('');
      return true;
    }
  },
  useSettingsSchema: (schema) => {
    console.log(`✓ 设置模式注册成功，包含 ${schema.length} 个配置项`);
    schema.forEach(item => {
      console.log(`  - ${item.title}: ${item.type}`);
    });
    console.log('');
  },
  settings: {
    sites: '[]',
    publishByDefault: false,
    autoGenerateExcerpt: true,
    imageUploadEnabled: false,
    logLevel: 'info'
  },
  updateSettings: async (settings) => {
    console.log('✓ 设置更新:', settings);
    return true;
  },
  showMsg: (message, type = 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
  },
  Editor: {
    getCurrentPage: async () => {
      return { name: 'test-page' };
    },
    getPageBlocksTree: async (pageName) => {
      return [
        {
          content: '这是一个测试页面',
          children: [
            { content: '子块内容 1' },
            { content: '子块内容 2' }
          ]
        }
      ];
    }
  }
};

// 将模拟的 logseq 对象设置为全局变量
global.logseq = mockLogseq;
global.console = console;
global.fetch = async () => ({ ok: true, json: async () => ({}) });
global.URL = URL;
global.Blob = class Blob {
  constructor(parts, options) {
    this.parts = parts;
    this.options = options;
  }
};
global.document = {
  createElement: () => ({ 
    click: () => console.log('模拟文件下载'), 
    remove: () => {},
    href: '',
    download: ''
  }),
  body: { 
    appendChild: () => {}, 
    removeChild: () => {} 
  }
};
global.window = {
  open: () => console.log('模拟打开新窗口')
};
global.Date = Date;

// 加载插件代码
console.log('🚀 开始测试 Logseq Halo 插件\n');

try {
  // 加载构建后的插件文件
  require('./dist/index.js');
  
  console.log('\n✅ 插件测试完成！');
  console.log('\n📝 测试结果说明:');
  console.log('- 如果看到命令注册成功的消息，说明插件可以正常注册命令');
  console.log('- 如果看到设置模式注册成功，说明插件配置界面可以正常工作');
  console.log('- 如果没有错误信息，说明插件代码没有语法错误');
  console.log('\n🔧 下一步:');
  console.log('1. 在 Logseq 中重新加载插件');
  console.log('2. 使用 Cmd+P 打开命令面板，搜索 "Halo"');
  console.log('3. 尝试使用 Cmd+Option+H 快捷键');
  
} catch (error) {
  console.error('❌ 插件测试失败:', error.message);
  console.error('\n错误详情:', error.stack);
}