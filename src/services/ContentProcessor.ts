import { ArticleMetadata } from '../types'
import { Logger } from '../utils/Logger'
import { slugify } from 'transliteration'

/**
 * 内容处理器
 * 负责解析 Logseq 页面内容和元数据
 */
export class ContentProcessor {
  /**
   * 解析页面内容
   */
  static parsePageContent(pageContent: string, pageName: string): {
    metadata: ArticleMetadata
    content: string
  } {
    try {
      Logger.debug(`解析页面内容: ${pageName}`)
      
      const { frontmatter, content } = this.extractFrontmatter(pageContent)
      const logseqProperties = this.extractLogseqProperties(content)
      
      // 合并 frontmatter 和 Logseq 属性，Logseq 属性优先
      const combinedMetadata = { ...frontmatter, ...logseqProperties }
      const metadata = this.buildMetadata(combinedMetadata, pageName)
      const processedContent = this.processContent(content)
      
      Logger.debug(`页面解析完成: ${metadata.title}`)
      Logger.debug(`分类: ${metadata.categories?.join(', ') || '无'}`)
      Logger.debug(`标签: ${metadata.tags?.join(', ') || '无'}`)
      return { metadata, content: processedContent }
    } catch (error) {
      Logger.error(`页面内容解析失败 (${pageName}):`, error)
      throw error
    }
  }

  /**
   * 提取 Logseq 页面属性
   */
  private static extractLogseqProperties(content: string): Record<string, any> {
    const properties: Record<string, any> = {}
    const lines = content.split('\n')
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine.includes('::')) {
        continue
      }
      
      const [key, ...valueParts] = trimmedLine.split('::')
      if (!key || valueParts.length === 0) {
        continue
      }
      
      const cleanKey = key.trim().toLowerCase()
      const value = valueParts.join('::').trim()
      
      // 处理数组格式 [item1, item2, item3]
      if (value.startsWith('[') && value.endsWith(']')) {
        const arrayContent = value.slice(1, -1)
        properties[cleanKey] = arrayContent.split(',').map(item => item.trim().replace(/["']/g, ''))
      } else if (value === 'true' || value === 'false') {
        properties[cleanKey] = value === 'true'
      } else if (!isNaN(Number(value))) {
        properties[cleanKey] = Number(value)
      } else {
        properties[cleanKey] = value.replace(/["']/g, '')
      }
    }
    
    Logger.debug('提取的Logseq属性:', properties)
    return properties
  }

  /**
   * 提取 frontmatter
   */
  private static extractFrontmatter(content: string): {
    frontmatter: Record<string, any>
    content: string
  } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
    const match = content.match(frontmatterRegex)
    
    if (!match) {
      return {
        frontmatter: {},
        content: content
      }
    }
    
    try {
      // 简单的 YAML 解析（仅支持基本格式）
      const frontmatter = this.parseSimpleYaml(match[1])
      return {
        frontmatter,
        content: match[2].trim()
      }
    } catch (error) {
      Logger.warn('Frontmatter 解析失败，忽略:', error)
      return {
        frontmatter: {},
        content: content
      }
    }
  }

  /**
   * 简单的 YAML 解析器
   */
  private static parseSimpleYaml(yamlString: string): Record<string, any> {
    const result: Record<string, any> = {}
    const lines = yamlString.split('\n')
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue
      }
      
      const colonIndex = trimmedLine.indexOf(':')
      if (colonIndex === -1) {
        continue
      }
      
      const key = trimmedLine.substring(0, colonIndex).trim()
      const value = trimmedLine.substring(colonIndex + 1).trim()
      
      // 处理不同类型的值
      if (value.startsWith('[') && value.endsWith(']')) {
        // 数组
        const arrayContent = value.slice(1, -1)
        result[key] = arrayContent.split(',').map(item => item.trim().replace(/["']/g, ''))
      } else if (value === 'true' || value === 'false') {
        // 布尔值
        result[key] = value === 'true'
      } else if (!isNaN(Number(value))) {
        // 数字
        result[key] = Number(value)
      } else {
        // 字符串
        result[key] = value.replace(/["']/g, '')
      }
    }
    
    return result
  }

  /**
   * 构建文章元数据
   */
  private static buildMetadata(frontmatter: Record<string, any>, pageName: string): ArticleMetadata {
    const title = frontmatter.title || pageName
    const slug = frontmatter.slug || this.generateSlug(title)
    
    // 解析 Halo 相关信息
    let haloInfo: ArticleMetadata['halo'] | undefined
    if (frontmatter.halo || frontmatter['halo-site'] || frontmatter['halo-post-name']) {
      haloInfo = {
        site: frontmatter.halo?.site || frontmatter['halo-site'] || '',
        name: frontmatter.halo?.name || frontmatter['halo-post-name'] || '',
        publish: frontmatter.halo?.publish ?? frontmatter.publish ?? frontmatter.published ?? false
      }
    }
    
    return {
      title,
      slug,
      excerpt: frontmatter.excerpt || frontmatter.description,
      cover: frontmatter.cover || frontmatter.image,
      categories: this.normalizeArray(frontmatter.categories || frontmatter.category),
      tags: this.normalizeArray(frontmatter.tags || frontmatter.tag),
      publish: frontmatter.publish ?? frontmatter.published ?? false,
      published: frontmatter.publish ?? frontmatter.published ?? false,
      publishTime: frontmatter.publishTime || frontmatter.date,
      pinned: frontmatter.pinned ?? false,
      allowComment: frontmatter.allowComment ?? frontmatter.comments ?? true,
      visible: frontmatter.visible || 'PUBLIC',
      priority: frontmatter.priority ?? 0,
      halo: haloInfo
    }
  }

  /**
   * 处理内容
   */
  private static processContent(content: string): string {
    let processedContent = content
    
    // 处理 Logseq 特有的语法
    processedContent = this.processLogseqBlocks(processedContent)
    processedContent = this.processLogseqLinks(processedContent)
    processedContent = this.processLogseqProperties(processedContent)
    
    return processedContent.trim()
  }

  /**
   * 处理 Logseq 块引用
   */
  private static processLogseqBlocks(content: string): string {
    // 移除块引用语法 ((block-id))
    return content.replace(/\(\([a-f0-9-]+\)\)/g, '')
  }

  /**
   * 处理 Logseq 链接
   */
  private static processLogseqLinks(content: string): string {
    // 转换页面链接 [[Page Name]] 为 Markdown 链接
    return content.replace(/\[\[([^\]]+)\]\]/g, (match, pageName) => {
      const slug = this.generateSlug(pageName)
      return `[${pageName}](/archives/${slug})`
    })
  }

  /**
   * 处理 Logseq 属性
   */
  private static processLogseqProperties(content: string): string {
    // 移除属性行（以 :: 结尾的行）
    return content.replace(/^.+::\s*.*$/gm, '').replace(/\n\s*\n\s*\n/g, '\n\n')
  }

  /**
   * 生成 slug（使用transliteration库处理中文）
   */
  private static generateSlug(title: string): string {
    return slugify(title, { trim: true }).substring(0, 50)
  }

  /**
   * 标准化数组
   */
  private static normalizeArray(value: any): string[] {
    if (!value) {
      return []
    }
    
    if (Array.isArray(value)) {
      return value.map(item => String(item).trim()).filter(Boolean)
    }
    
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(Boolean)
    }
    
    return [String(value).trim()].filter(Boolean)
  }

  /**
   * 生成摘要
   */
  static generateExcerpt(content: string, maxLength: number = 200): string {
    // 移除 Markdown 语法
    let plainText = content
      .replace(/#{1,6}\s+/g, '') // 标题
      .replace(/\*\*([^*]+)\*\*/g, '$1') // 粗体
      .replace(/\*([^*]+)\*/g, '$1') // 斜体
      .replace(/`([^`]+)`/g, '$1') // 行内代码
      .replace(/```[\s\S]*?```/g, '') // 代码块
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // 图片
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接
      .replace(/\n+/g, ' ') // 换行
      .trim()
    
    if (plainText.length <= maxLength) {
      return plainText
    }
    
    return plainText.substring(0, maxLength).replace(/\s+\S*$/, '') + '...'
  }

  /**
   * 验证内容
   */
  static validateContent(metadata: ArticleMetadata, content: string): string[] {
    const errors: string[] = []
    
    if (!metadata.title?.trim()) {
      errors.push('文章标题不能为空')
    }
    
    if (!metadata.slug?.trim()) {
      errors.push('文章别名不能为空')
    }
    
    if (!content?.trim()) {
      errors.push('文章内容不能为空')
    }
    
    if (metadata.slug && !/^[a-z0-9\u4e00-\u9fa5-]+$/.test(metadata.slug)) {
      errors.push('文章别名只能包含字母、数字、中文和连字符')
    }
    
    return errors
  }
}