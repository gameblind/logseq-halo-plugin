import { ConfigManager } from './ConfigManager'
import { CommandHandler } from './CommandHandler'
import { Logger } from '../utils/Logger'
import { HaloSite } from '../types'

/**
 * UI 管理器
 * 负责插件的用户界面管理
 */
export class UIManager {
  private configManager: ConfigManager
  private commandHandler: CommandHandler

  constructor(configManager: ConfigManager, commandHandler: CommandHandler) {
    this.configManager = configManager
    this.commandHandler = commandHandler
  }

  /**
   * 初始化 UI
   */
  async initialize(): Promise<void> {
    try {
      this.registerCommands()
      this.registerSettingsUI()
      Logger.info('UI 管理器初始化完成')
    } catch (error) {
      Logger.error('UI 管理器初始化失败:', error)
      throw error
    }
  }

  /**
   * 注册命令
   */
  private registerCommands(): void {
    console.log('🔧 开始注册命令...')
    
    // 检查 logseq.App.registerCommand 是否可用
    if (!logseq.App || typeof logseq.App.registerCommand !== 'function') {
      console.error('❌ logseq.App.registerCommand 不可用')
      return
    }
    
    try {
      // 发布当前页面到默认站点
      logseq.App.registerCommand(
        'halo-publish-current',
        {
          key: 'halo-publish-current',
          label: '发布到 Halo',
          desc: '将当前页面发布到默认的 Halo 站点',
          keybinding: {
            binding: 'mod+option+h'
          }
        },
        () => {
          console.log('🚀 halo-publish-current 命令被触发！')
          this.commandHandler.publishCurrentPage()
        }
      )
      console.log('✅ halo-publish-current 命令注册成功')

      // 发布当前页面到指定站点
      logseq.App.registerCommand(
        'halo-publish-to-site',
        {
          key: 'halo-publish-to-site',
          label: '发布到指定 Halo 站点',
          desc: '选择站点并发布当前页面'
        },
        () => this.commandHandler.publishCurrentPageToSite()
      )
      console.log('✅ halo-publish-to-site 命令注册成功')

      // 测试站点连接
      logseq.App.registerCommand(
        'halo-test-connection',
        {
          key: 'halo-test-connection',
          label: '测试 Halo 连接',
          desc: '测试与 Halo 站点的连接'
        },
        () => this.commandHandler.testSiteConnection()
      )
      console.log('✅ halo-test-connection 命令注册成功')

      // 同步站点数据
      logseq.App.registerCommand(
        'halo-sync-data',
        {
          key: 'halo-sync-data',
          label: '同步 Halo 数据',
          desc: '同步站点的分类和标签数据'
        },
        () => this.commandHandler.syncSiteData()
      )
      console.log('✅ halo-sync-data 命令注册成功')

      // 打开设置
      logseq.App.registerCommand(
        'halo-open-settings',
        {
          key: 'halo-open-settings',
          label: 'Halo 设置',
          desc: '打开 Halo 插件设置页面'
        },
        () => this.commandHandler.openSettings()
      )
      console.log('✅ halo-open-settings 命令注册成功')

      // 查看日志
      logseq.App.registerCommand(
        'halo-view-logs',
        {
          key: 'halo-view-logs',
          label: '查看 Halo 插件日志',
          desc: '查看插件运行日志'
        },
        () => this.showLogs()
      )
      console.log('✅ halo-view-logs 命令注册成功')

      // 导出日志
      logseq.App.registerCommand(
        'halo-export-logs',
        {
          key: 'halo-export-logs',
          label: '导出 Halo 插件日志',
          desc: '导出插件日志到文件'
        },
        () => this.exportLogs()
      )
      console.log('✅ halo-export-logs 命令注册成功')

      // 获取所有文章列表
      logseq.App.registerCommand(
        'halo-get-all-posts',
        {
          key: 'halo-get-all-posts',
          label: '获取 Halo 文章列表',
          desc: '获取并显示所有 Halo 文章列表'
        },
        () => this.commandHandler.getAllPosts()
      )
      console.log('✅ halo-get-all-posts 命令注册成功')

      // 从 Halo 拉取文章
      logseq.App.registerCommand(
        'halo-pull-post',
        {
          key: 'halo-pull-post',
          label: '从 Halo 拉取文章',
          desc: '从 Halo 站点拉取指定文章到 Logseq'
        },
        async () => {
          const postName = prompt('请输入文章名称 (metadata.name):', 'post-')
          if (postName && postName.trim()) {
            await this.commandHandler.pullPostFromHalo(postName.trim())
          }
        }
      )
      console.log('✅ halo-pull-post 命令注册成功')

      console.log('🎉 所有命令注册完成')
      Logger.debug('命令注册完成')
    } catch (error) {
      console.error('❌ 命令注册失败:', error)
      Logger.error('命令注册失败:', error)
    }
  }

  /**
   * 注册设置界面
   */
  private registerSettingsUI(): void {
    const settingsSchema = [
      {
        key: 'sites',
        type: 'string' as const,
        title: 'Halo 站点配置',
        description: 'JSON 格式的站点配置。示例: [{"name":"我的博客","url":"https://your-site.com","token":"your-token","isDefault":true}]',
        default: '[]'
      },
      {
        key: 'publishByDefault',
        type: 'boolean' as const,
        title: '默认发布',
        description: '新文章是否默认发布（而非保存为草稿）',
        default: false
      },
      {
        key: 'autoGenerateExcerpt',
        type: 'boolean' as const,
        title: '自动生成摘要',
        description: '当文章没有手动设置摘要时，自动从内容生成',
        default: true
      },
      {
        key: 'imageUploadEnabled',
        type: 'boolean' as const,
        title: '启用图片上传',
        description: '自动上传文章中的本地图片到 Halo',
        default: false
      },
      {
        key: 'logLevel',
        type: 'enum' as const,
        title: '日志级别',
        description: '设置插件的日志输出级别',
        default: 'info',
        enumChoices: ['debug', 'info', 'warn', 'error']
      }
    ]

    logseq.useSettingsSchema(settingsSchema)
    
    // 注册帮助命令
    logseq.App.registerCommand(
      'halo-show-help',
      {
        key: 'halo-show-help',
        label: 'Halo 配置帮助',
        desc: '显示 Halo 插件配置帮助信息'
      },
      () => this.showConfigHelp()
    )

    Logger.debug('设置界面注册完成')
  }

  /**
   * 显示配置帮助
   */
  private async showConfigHelp(): Promise<void> {
    try {
      const message = `Halo 插件配置帮助：

1. 站点配置格式：
[{
  "name": "我的博客",
  "url": "https://your-halo-site.com",
  "token": "your-api-token",
  "isDefault": true
}]

2. 获取API Token：
- 登录Halo后台
- 进入用户中心 > 个人令牌
- 创建新的个人令牌

3. 配置方法：
- 点击右上角设置图标
- 找到 Halo Publisher 插件
- 在站点配置中填入上述JSON格式`
      
      console.log(message)
       logseq.UI.showMsg('配置帮助已输出到控制台，请按F12查看', 'info')
      
    } catch (error) {
      Logger.error('显示配置帮助失败:', error)
      this.showError('无法显示配置帮助', error)
    }
  }

  /**
   * 绑定设置页面事件
   */
  private bindSettingsEvents(): void {
    // 这里可以添加设置页面的事件绑定逻辑
    // 由于 Logseq 的限制，我们暂时使用简化的设置方式
    Logger.debug('设置页面事件绑定完成')
  }

  /**
   * 显示站点选择对话框
   */
  async showSiteSelector(): Promise<HaloSite | null> {
    const sites = this.configManager.getSites()
    
    if (sites.length === 0) {
      logseq.UI.showMsg('请先配置 Halo 站点', 'warning')
      return null
    }

    if (sites.length === 1) {
      return sites[0]
    }

    // 这里需要实现一个站点选择界面
    // 暂时返回第一个站点
    return sites[0]
  }

  /**
   * 显示发布确认对话框
   */
  async showPublishConfirmation(title: string, siteName: string): Promise<boolean> {
    // 这里需要实现确认对话框
    // 暂时直接返回 true
    return true
  }

  /**
   * 显示进度提示
   */
  showProgress(message: string): void {
    logseq.UI.showMsg(message, 'info')
  }

  /**
   * 显示错误信息
   */
  showError(message: string, error?: any): void {
    Logger.error(message, error)
    logseq.UI.showMsg(`❌ ${message}`, 'error')
  }

  /**
   * 显示成功信息
   */
  showSuccess(message: string): void {
    Logger.info(message)
    logseq.UI.showMsg(`✅ ${message}`, 'success')
  }

  /**
   * 显示警告信息
   */
  showWarning(message: string): void {
    Logger.warn(message)
    logseq.UI.showMsg(`⚠️ ${message}`, 'warning')
  }

  /**
   * 显示日志
   */
  showLogs(): void {
    try {
      const logs = Logger.getLogs()
      if (logs.length === 0) {
        logseq.UI.showMsg('暂无日志记录', 'info')
        return
      }

      // 显示最近的20条日志
      const recentLogs = logs.slice(-20)
      const logText = recentLogs.join('\n')
      
      // 创建一个简单的日志显示窗口
      const logWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
      if (logWindow) {
        logWindow.document.write(`
          <html>
            <head>
              <title>Halo 插件日志</title>
              <style>
                body { font-family: monospace; padding: 20px; background: #f5f5f5; }
                .log-container { background: white; padding: 15px; border-radius: 5px; white-space: pre-wrap; }
                .header { margin-bottom: 15px; }
                button { margin-right: 10px; padding: 5px 10px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>Halo 插件日志 (最近20条)</h2>
                <button onclick="window.close()">关闭</button>
                <button onclick="location.reload()">刷新</button>
              </div>
              <div class="log-container">${logText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </body>
          </html>
        `)
        logWindow.document.close()
      } else {
        // 如果无法打开新窗口，则在控制台输出
        console.log('=== Halo 插件日志 ===')
        recentLogs.forEach(log => console.log(log))
        logseq.UI.showMsg('日志已输出到控制台', 'info')
      }
    } catch (error) {
      Logger.error('显示日志失败:', error)
      logseq.UI.showMsg('显示日志失败', 'error')
    }
  }

  /**
   * 导出日志
   */
  exportLogs(): void {
    try {
      Logger.exportLogs()
    } catch (error) {
      Logger.error('导出日志失败:', error)
      logseq.UI.showMsg('导出日志失败', 'error')
    }
  }

  /**
   * 创建设置页面 HTML
   */
  private createSettingsHTML(): string {
    return `
      <div id="halo-settings" class="halo-settings-container">
        <h2>Halo 插件设置</h2>
        
        <div class="settings-section">
          <h3>站点管理</h3>
          <div id="sites-list"></div>
          <button id="add-site-btn" class="btn btn-primary">添加站点</button>
        </div>
        
        <div class="settings-section">
          <h3>发布设置</h3>
          <label>
            <input type="checkbox" id="publish-by-default"> 默认发布文章
          </label>
          <label>
            <input type="checkbox" id="auto-generate-excerpt"> 自动生成摘要
          </label>
          <label>
            <input type="checkbox" id="image-upload-enabled"> 启用图片上传
          </label>
        </div>
        
        <div class="settings-section">
          <h3>其他设置</h3>
          <label>
            日志级别:
            <select id="log-level">
              <option value="debug">调试</option>
              <option value="info">信息</option>
              <option value="warn">警告</option>
              <option value="error">错误</option>
            </select>
          </label>
        </div>
        
        <div class="settings-actions">
          <button id="save-settings-btn" class="btn btn-primary">保存设置</button>
          <button id="test-connection-btn" class="btn btn-secondary">测试连接</button>
        </div>
      </div>
      
      <style>
        .halo-settings-container {
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .settings-section {
          margin-bottom: 30px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        
        .settings-section h3 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #333;
        }
        
        .settings-section label {
          display: block;
          margin-bottom: 10px;
        }
        
        .settings-section input,
        .settings-section select {
          margin-left: 10px;
        }
        
        .settings-actions {
          text-align: center;
        }
        
        .btn {
          padding: 8px 16px;
          margin: 0 5px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .btn-primary {
          background-color: #007bff;
          color: white;
        }
        
        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }
        
        .btn:hover {
          opacity: 0.8;
        }
      </style>
    `
  }

  /**
   * 清理 UI 资源
   */
  cleanup(): void {
    // 清理 UI 相关资源
    Logger.debug('UI 管理器清理完成')
  }
}