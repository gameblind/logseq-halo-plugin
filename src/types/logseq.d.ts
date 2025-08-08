/**
 * Logseq API 类型声明
 */
declare global {
  interface Window {
    logseq: LogseqAPI
  }

  const logseq: LogseqAPI
}

interface LogseqAPI {
  /**
   * 插件设置
   */
  settings?: Record<string, any>

  /**
   * 更新设置
   */
  updateSettings(settings: Record<string, any>): Promise<void>

  /**
   * 显示消息
   */
  showMsg(message: string, status?: 'success' | 'warning' | 'error'): void

  /**
   * 编辑器相关API
   */
  Editor: {
    /**
     * 获取当前页面
     */
    getCurrentPage(): Promise<PageEntity | null>

    /**
     * 获取页面内容
     */
    getPageBlocksTree(pageName: string): Promise<BlockEntity[]>

    /**
     * 获取块内容
     */
    getBlock(uuid: string): Promise<BlockEntity | null>

    /**
     * 更新块内容
     */
    updateBlock(uuid: string, content: string): Promise<void>
  }

  /**
   * 应用相关API
   */
  App: {
    /**
     * 注册命令
     */
    registerCommand(
      key: string,
      opts: {
        label: string
        desc?: string
        keybinding?: {
          mode?: string
          binding: string
        }
      },
      action: () => void
    ): void

    /**
     * 注册设置模式
     */
    registerSettingsSchema(schema: Array<{
      key: string
      type: 'string' | 'boolean' | 'number' | 'enum'
      title: string
      description: string
      default?: any
      enumChoices?: string[]
    }>): void

    /**
     * 获取当前图谱
     */
    getCurrentGraph(): Promise<{ name: string; path: string } | null>
  }

  /**
   * 文件系统API
   */
  Assets: {
    /**
     * 列出文件
     */
    listFiles(path?: string): Promise<string[]>

    /**
     * 读取文件
     */
    readFile(path: string): Promise<string>

    /**
     * 写入文件
     */
    writeFile(path: string, content: string): Promise<void>
  }

  /**
   * UI相关API
   */
  provideUI(opts: {
    key: string
    path: string
    template: string
  }): void

  /**
   * 准备就绪回调
   */
  ready(callback?: () => void): Promise<void>

  /**
   * 插件卸载回调
   */
  beforeunload(callback: () => void): void
}

/**
 * 页面实体
 */
interface PageEntity {
  uuid: string
  name: string
  originalName: string
  properties?: Record<string, any>
  file?: {
    path: string
  }
}

/**
 * 块实体
 */
interface BlockEntity {
  uuid: string
  content: string
  properties?: Record<string, any>
  children?: BlockEntity[]
  page?: {
    name: string
  }
}

export {}