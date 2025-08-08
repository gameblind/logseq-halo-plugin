import { ConfigManager } from './ConfigManager'
import { HaloService } from './HaloService'
import { ContentProcessor } from './ContentProcessor'
import { Logger } from '../utils/Logger'
import { HaloSite } from '../types'

/**
 * 命令处理器
 * 负责处理插件的各种命令操作
 */
export class CommandHandler {
  private configManager: ConfigManager
  private haloServices: Map<string, HaloService> = new Map()

  constructor(configManager: ConfigManager) {
    this.configManager = configManager
  }

  /**
   * 发布当前页面到默认站点
   */
  async publishCurrentPage(): Promise<void> {
    try {
      // 立即显示快捷键触发提示
      logseq.UI.showMsg('🚀 Halo 发布快捷键已触发...', 'info')
      Logger.info('快捷键触发：开始发布当前页面')
      
      const currentPage = await logseq.Editor.getCurrentPage()
      if (!currentPage || !currentPage.name) {
        logseq.UI.showMsg('请先打开一个页面', 'warning')
        return
      }

      const defaultSite = this.configManager.getDefaultSite()
      if (!defaultSite) {
        logseq.UI.showMsg('请先配置 Halo 站点', 'warning')
        return
      }

      await this.publishPageToSite(String(currentPage.name), defaultSite)
    } catch (error) {
      Logger.error('发布当前页面失败:', error)
      logseq.UI.showMsg(`发布失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
    }
  }

  /**
   * 发布当前页面到指定站点
   */
  async publishCurrentPageToSite(): Promise<void> {
    try {
      const currentPage = await logseq.Editor.getCurrentPage()
      if (!currentPage || !currentPage.name) {
        logseq.UI.showMsg('请先打开一个页面', 'warning')
        return
      }

      const sites = this.configManager.getSites()
      if (sites.length === 0) {
        logseq.UI.showMsg('请先配置 Halo 站点', 'warning')
        return
      }

      // 如果只有一个站点，直接发布
      if (sites.length === 1) {
        await this.publishPageToSite(String(currentPage.name), sites[0])
        return
      }

      // 多个站点时，让用户选择
      // 注意：这里需要实现一个选择界面，暂时使用第一个站点
      await this.publishPageToSite(String(currentPage.name), sites[0])
    } catch (error) {
      Logger.error('发布页面到指定站点失败:', error)
      logseq.UI.showMsg(`发布失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
    }
  }

  /**
   * 发布页面到站点
   */
  private async publishPageToSite(pageName: string, site: HaloSite): Promise<void> {
    try {
      Logger.info(`开始发布页面 "${pageName}" 到站点 "${site.name}"`)
      
      // 获取页面内容
      const pageContent = await this.getPageContent(pageName)
      if (!pageContent) {
        throw new Error('无法获取页面内容')
      }

      // 解析内容和元数据
      const { metadata, content } = ContentProcessor.parsePageContent(pageContent, pageName)
      
      // 验证内容
      const validationErrors = ContentProcessor.validateContent(metadata, content)
      if (validationErrors.length > 0) {
        throw new Error(`内容验证失败: ${validationErrors.join(', ')}`)
      }

      // 获取 Halo 服务
      const haloService = this.getHaloService(site)
      
      // 检查文章是否已存在
      const existingPost = await haloService.getPost(metadata.slug || '')
      
      // 发布文章
      const result = await haloService.publishPost(metadata, content, existingPost || undefined)
      
      if (result.success) {
        // 更新页面的 frontmatter
        await this.updatePageFrontmatter(pageName, {
          'halo-post-name': result.postName,
          'halo-site': site.id,
          'last-published': new Date().toISOString()
        })
        
        const message = existingPost 
          ? `文章更新成功: ${metadata.title}`
          : `文章发布成功: ${metadata.title}`
        
        logseq.UI.showMsg(message, 'success')
        
        if (result.url) {
          Logger.info(`文章URL: ${result.url}`)
        }
      } else {
        throw new Error('发布失败')
      }
    } catch (error) {
      Logger.error(`发布页面失败 (${pageName} -> ${site.name}):`, error)
      throw error
    }
  }

  /**
   * 测试站点连接
   */
  async testSiteConnection(siteId?: string): Promise<void> {
    try {
      const site = siteId 
        ? this.configManager.getSites().find(s => s.id === siteId)
        : this.configManager.getDefaultSite()
      
      if (!site) {
        logseq.UI.showMsg('站点不存在', 'warning')
        return
      }

      Logger.info(`测试站点连接: ${site.name}`)
      const haloService = this.getHaloService(site)
      const isConnected = await haloService.testConnection()
      
      if (isConnected) {
        logseq.UI.showMsg(`站点 "${site.name}" 连接成功`, 'success')
      } else {
        logseq.UI.showMsg(`站点 "${site.name}" 连接失败`, 'error')
      }
    } catch (error) {
      Logger.error('测试站点连接失败:', error)
      logseq.UI.showMsg(`连接测试失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
    }
  }

  /**
   * 同步站点分类和标签
   */
  async syncSiteData(siteId?: string): Promise<void> {
    try {
      const site = siteId 
        ? this.configManager.getSites().find(s => s.id === siteId)
        : this.configManager.getDefaultSite()
      
      if (!site) {
        logseq.UI.showMsg('站点不存在', 'warning')
        return
      }

      Logger.info(`同步站点数据: ${site.name}`)
      const haloService = this.getHaloService(site)
      
      const [categories, tags] = await Promise.all([
        haloService.getCategories(),
        haloService.getTags()
      ])
      
      Logger.info(`同步完成 - 分类: ${categories.length}, 标签: ${tags.length}`)
      logseq.UI.showMsg(`站点 "${site.name}" 数据同步完成`, 'success')
      
      // 这里可以将分类和标签数据缓存到本地，供后续使用
      // 暂时只记录日志
    } catch (error) {
      Logger.error('同步站点数据失败:', error)
      logseq.UI.showMsg(`数据同步失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
    }
  }

  /**
   * 获取所有文章列表
   */
  async getAllPosts(siteId?: string): Promise<void> {
    try {
      const site = siteId 
        ? this.configManager.getSites().find(s => s.id === siteId)
        : this.configManager.getDefaultSite()
      
      if (!site) {
        logseq.UI.showMsg('请先配置 Halo 站点', 'warning')
        return
      }

      logseq.UI.showMsg('正在获取文章列表...', 'info')
      
      const haloService = this.getHaloService(site)
      const posts = await haloService.getAllPosts()
      
      // 显示文章信息
      const postInfo = posts.map((post, index) => {
        const publishStatus = post.spec.publish ? '已发布' : '草稿'
        const visibleStatus = post.spec.visible ? '可见' : '隐藏'
        return `${index + 1}. ${post.spec.title} (${publishStatus}, ${visibleStatus}) - ${post.metadata.name}`
      }).join('\n')
      
      Logger.info(`获取到 ${posts.length} 篇文章:\n${postInfo}`)
      logseq.UI.showMsg(`获取到 ${posts.length} 篇文章`, 'success')
      
    } catch (error) {
      Logger.error('获取文章列表失败:', error)
      logseq.UI.showMsg(`获取文章列表失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
    }
  }

  /**
   * 打开设置页面
   */
  async openSettings(): Promise<void> {
    try {
      // 这里需要实现设置页面的打开逻辑
      // 暂时显示提示信息
      logseq.UI.showMsg('设置页面开发中...', 'warning')
    } catch (error) {
      Logger.error('打开设置页面失败:', error)
      logseq.UI.showMsg('无法打开设置页面', 'error')
    }
  }

  /**
   * 获取页面内容
   */
  private async getPageContent(pageName: string): Promise<string | null> {
    try {
      const blocks = await logseq.Editor.getPageBlocksTree(pageName)
      if (!blocks || blocks.length === 0) {
        return null
      }

      // 将块内容组合成完整的页面内容
      const content = this.blocksToMarkdown(blocks)
      return content
    } catch (error) {
      Logger.error(`获取页面内容失败 (${pageName}):`, error)
      return null
    }
  }

  /**
   * 将块转换为 Markdown
   */
  private blocksToMarkdown(blocks: any[], level: number = 0): string {
    const lines: string[] = []
    
    for (const block of blocks) {
      if (block.content) {
        const indent = '  '.repeat(level)
        lines.push(`${indent}- ${block.content}`)
      }
      
      if (block.children && block.children.length > 0) {
        lines.push(this.blocksToMarkdown(block.children, level + 1))
      }
    }
    
    return lines.join('\n')
  }

  /**
   * 更新页面 frontmatter
   */
  private async updatePageFrontmatter(pageName: string, updates: Record<string, any>): Promise<void> {
    try {
      // 这里需要实现更新页面 frontmatter 的逻辑
      // Logseq 的 API 可能不直接支持，需要通过其他方式实现
      Logger.debug(`更新页面 frontmatter: ${pageName}`, updates)
    } catch (error) {
      Logger.warn(`更新页面 frontmatter 失败 (${pageName}):`, error)
    }
  }

  /**
   * 获取 Halo 服务实例
   */
  private getHaloService(site: HaloSite): HaloService {
    if (!this.haloServices.has(site.id)) {
      this.haloServices.set(site.id, new HaloService(site))
    }
    return this.haloServices.get(site.id)!
  }

  /**
   * 清理服务缓存
   */
  cleanup(): void {
    this.haloServices.clear()
  }
}