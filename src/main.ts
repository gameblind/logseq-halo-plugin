import '@logseq/libs'
import { ConfigManager } from './services/ConfigManager'
import { CommandHandler } from './services/CommandHandler'
import { UIManager } from './services/UIManager'
import { Logger } from './utils/Logger'
import { HaloService } from './services/HaloService'
import { ContentProcessor } from './services/ContentProcessor'

/**
 * Logseq-Halo 插件主入口
 */
class LogseqHaloPlugin {
  private configManager: ConfigManager
  private commandHandler: CommandHandler
  private uiManager: UIManager
  private isInitialized = false

  constructor() {
    this.configManager = new ConfigManager()
    this.commandHandler = new CommandHandler(this.configManager)
    this.uiManager = new UIManager(this.configManager, this.commandHandler)
  }

  /**
   * 插件初始化
   */
  async initialize(): Promise<void> {
    try {
      // 设置日志级别为DEBUG，确保所有调试信息都能显示
      Logger.setLevel('debug')
      Logger.info('Logseq-Halo 插件开始初始化...')
      
      // 初始化配置管理器
      await this.configManager.initialize()
      
      // 初始化 UI 管理器
      await this.uiManager.initialize()
      
      this.isInitialized = true
      Logger.info('Logseq-Halo 插件初始化完成')
      
    } catch (error) {
      Logger.error('插件初始化失败:', error)
      throw error
    }
  }

  /**
   * 插件卸载清理
   */
  cleanup(): void {
    if (this.isInitialized) {
      this.commandHandler.cleanup()
      this.uiManager.cleanup()
      Logger.info('Logseq-Halo 插件清理完成')
    }
  }
}

// 插件实例
let pluginInstance: LogseqHaloPlugin | null = null

/**
 * 插件主函数
 */
function main(): void {
  console.log('🚀 Logseq-Halo Plugin loaded')
  
  // 检查 logseq 对象
  if (typeof logseq === 'undefined') {
    console.error('❌ logseq 对象未定义')
    return
  }
  
  console.log('✅ logseq 对象存在')
  
  logseq.ready(() => {
    console.log('🔄 logseq.ready 回调被调用')
    
    try {
      pluginInstance = new LogseqHaloPlugin()
      console.log('✅ 插件实例创建成功')
      
      pluginInstance.initialize().then(() => {
        console.log('🎉 插件初始化完成')
        
        // 测试命令注册
        if (logseq.App && typeof logseq.App.registerCommand === 'function') {
          console.log('✅ logseq.App.registerCommand 可用')
        } else {
          console.error('❌ logseq.App.registerCommand 不可用')
        }
      }).catch(error => {
        console.error('❌ Plugin initialization failed:', error)
      })
    } catch (error) {
      console.error('❌ 创建插件实例失败:', error)
    }
  })
  
  logseq.beforeunload(async () => {
    console.log('🧹 插件卸载中...')
    if (pluginInstance) {
      pluginInstance.cleanup()
      pluginInstance = null
    }
  })
}

// 启动插件
main()

// 导出类供测试使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    HaloService,
    ContentProcessor,
    Logger,
    ConfigManager,
    CommandHandler,
    UIManager
  }
}