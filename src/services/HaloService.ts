import { HaloSite, Post, Content, Snapshot, Category, Tag, ArticleMetadata } from '../types'
import { Logger } from '../utils/Logger'
import { slugify } from 'transliteration'

/**
 * Halo API 服务
 * 负责与 Halo 站点的 API 交互
 */
export class HaloService {
  private site: HaloSite
  private baseUrl: string
  private headers: Record<string, string>
  private imageCache: Map<string, string> = new Map() // 图片缓存：路径 -> Halo URL

  constructor(site: HaloSite) {
    this.site = site
    this.baseUrl = site.url.replace(/\/$/, '') // 移除末尾斜杠
    this.headers = {
      'Authorization': `Bearer ${site.token}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * 获取站点 ID
   */
  getSiteId(): string {
    return this.site.id
  }

  /**
   * 获取站点 URL
   */
  getSiteUrl(): string {
    return this.site.url
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.request('/apis/content.halo.run/v1alpha1/posts', 'GET')
      return response.ok
    } catch (error) {
      Logger.error('连接测试失败:', error)
      return false
    }
  }

  /**
   * 获取文章
   */
  async getPost(name: string): Promise<{ post: Post; content: Content; snapshot: Snapshot } | null> {
    try {
      Logger.debug(`获取文章: ${name}`)
      
      // 获取文章基本信息
      const postResponse = await this.request(`/apis/uc.api.content.halo.run/v1alpha1/posts/${name}`, 'GET')
      if (!postResponse.ok) {
        if (postResponse.status === 404) {
          return null
        }
        throw new Error(`获取文章失败: ${postResponse.status}`)
      }

      const post: Post = await postResponse.json()

      // 获取文章快照内容
      const snapshotResponse = await this.request(
        `/apis/uc.api.content.halo.run/v1alpha1/posts/${name}/draft?patched=true`,
        'GET'
      )
      
      let content: Content = {
        rawType: 'markdown',
        raw: '',
        content: ''
      }
      
      if (snapshotResponse.ok) {
        const snapshot = await snapshotResponse.json()
        const annotations = snapshot.metadata?.annotations || {}
        content = {
          content: annotations['content.halo.run/patched-content'] || '',
          raw: annotations['content.halo.run/patched-raw'] || '',
          rawType: snapshot.spec?.rawType || 'markdown'
        }
      }
      
      // 创建一个简单的快照对象（因为Content结构已简化）
      const snapshot: Snapshot = {
        metadata: {
          name: `${name}-snapshot`
        },
        spec: {
          subjectRef: {
            kind: 'Post',
            name: name,
            apiVersion: 'content.halo.run/v1alpha1'
          },
          rawType: 'markdown',
          rawPatch: '',
          contentPatch: ''
        },
        apiVersion: 'content.halo.run/v1alpha1',
        kind: 'Snapshot'
      }
      
      Logger.debug(`文章获取成功: ${post.spec.title}`)
      return { post, content, snapshot }
    } catch (error) {
      Logger.error(`获取文章失败 (${name}):`, error)
      throw error
    }
  }

  /**
   * 发布文章
   */
  async publishPost(
    metadata: ArticleMetadata,
    markdownContent: string,
    existingPost?: { post: Post; content: Content; snapshot: Snapshot }
  ): Promise<{ success: boolean; postName: string; url?: string }> {
    try {
      Logger.info(`开始发布文章: ${metadata.title}`)
      
      // 处理图片上传
      const processedContent = await this.processAttachments(markdownContent)
      
      let post: Post
      let content: Content
      
      if (existingPost) {
        // 更新现有文章
        const result = await this.updatePost(existingPost, metadata, processedContent)
        post = result.post
        content = result.content
      } else {
        // 创建新文章
        const result = await this.createPost(metadata, processedContent)
        post = result.post
        content = result.content
      }
      
      // 发布文章状态控制（参考 index.ts 的逻辑）
      let shouldPublish = false
      
      // 检查发布状态的优先级
      if (metadata.halo?.hasOwnProperty('publish')) {
        // 优先使用 halo.publish 设置
        shouldPublish = metadata.halo.publish
      } else if (metadata.hasOwnProperty('publish')) {
        // 其次使用 publish 属性
        shouldPublish = metadata.publish || false
      } else if (metadata.hasOwnProperty('published')) {
        // 再次使用 published 属性
        shouldPublish = metadata.published || false
      } else {
        // 最后使用默认设置（这里暂时默认为 false，可以后续从配置中读取）
        shouldPublish = false
      }
      
      if (shouldPublish) {
        await this.setPostPublished(post.metadata?.name || '', true)
        Logger.info(`文章发布成功: ${metadata.title}`)
      } else {
        await this.setPostPublished(post.metadata?.name || '', false)
        Logger.info(`文章保存为草稿: ${metadata.title}`)
      }
      
      return {
        success: true,
        postName: post.metadata?.name || '',
        url: (metadata.published || metadata.publish) ? this.getPostUrl(post) : undefined
      }
    } catch (error) {
      Logger.error(`文章发布失败 (${metadata.title}):`, error)
      throw error
    }
  }

  /**
   * 创建新文章
   */
  private async createPost(
    metadata: ArticleMetadata,
    markdownContent: string
  ): Promise<{ post: Post; content: Content }> {
    // 处理附件上传和替换（包括图片和其他文件）
    const processedContent = await this.processAttachments(markdownContent)
    
    // 生成随机UUID（参照index.ts的方式）
    const postId = this.generateUUID()
    
    // 准备内容对象（参照index.ts的简单结构）
    const content: Content = {
      rawType: 'markdown',
      raw: processedContent,
      content: processedContent // 简化处理，直接使用markdown
    }
    
    // 处理分类和标签
    let categoryNames: string[] = []
    let tagNames: string[] = []
    
    if (metadata.categories && metadata.categories.length > 0) {
      Logger.info(`处理分类: ${metadata.categories.join(', ')}`)
      categoryNames = await this.getCategoryNames(metadata.categories)
      Logger.info(`分类处理完成: ${categoryNames.join(', ')}`)
    }
    
    if (metadata.tags && metadata.tags.length > 0) {
      Logger.info(`处理标签: ${metadata.tags.join(', ')}`)
      tagNames = await this.getTagNames(metadata.tags)
      Logger.info(`标签处理完成: ${tagNames.join(', ')}`)
    }
    
    // 创建文章（参照index.ts的结构）
    const postData: Post = {
      apiVersion: 'content.halo.run/v1alpha1',
      kind: 'Post',
      metadata: {
        name: postId,
        annotations: {
          'content.halo.run/content-json': JSON.stringify(content)
        }
      },
      spec: {
        title: metadata.title || '',
        slug: metadata.slug || this.generateSlug(metadata.title || ''),
        template: '',
        cover: metadata.cover || '',
        deleted: false,
        publish: false,
        publishTime: metadata.publishTime || '',
        pinned: metadata.pinned || false,
        allowComment: metadata.allowComment ?? true,
        visible: (metadata.visible === 'INTERNAL' ? 'PUBLIC' : metadata.visible) || 'PUBLIC',
        priority: metadata.priority || 0,
        excerpt: {
          autoGenerate: metadata.excerpt ? false : true,
          raw: metadata.excerpt || ''
        },
        categories: categoryNames,
        tags: tagNames,
        htmlMetas: [],
        baseSnapshot: '',
        headSnapshot: '',
        owner: '', // 保持为空字符串，与index.ts一致
        releaseSnapshot: ''
      }
    }
    
    const postResponse = await this.request('/apis/uc.api.content.halo.run/v1alpha1/posts', 'POST', postData)
    if (!postResponse.ok) {
      const errorText = await postResponse.text()
      Logger.error(`创建文章失败: ${postResponse.status} - ${errorText}`)
      throw new Error(`创建文章失败: ${postResponse.status}`)
    }
    
    const post: Post = await postResponse.json()
    
    Logger.debug(`文章创建成功: ${post.spec.title}`)
    return { post, content }
  }

  /**
   * 更新现有文章
   */
  private async updatePost(
    existing: { post: Post; content: Content; snapshot: Snapshot },
    metadata: ArticleMetadata,
    markdownContent: string
  ): Promise<{ post: Post; content: Content }> {
    // 处理附件上传和替换（包括图片和其他文件）
    const processedContent = await this.processAttachments(markdownContent)
    
    // 准备更新的内容对象
    const updatedContent: Content = {
      rawType: 'markdown',
      raw: processedContent,
      content: processedContent // 简化处理，直接使用markdown
    }
    
    // 处理分类和标签
    let categoryNames: string[] = existing.post.spec.categories || []
    let tagNames: string[] = existing.post.spec.tags || []
    
    if (metadata.categories && metadata.categories.length > 0) {
      Logger.info(`处理分类: ${metadata.categories.join(', ')}`)
      categoryNames = await this.getCategoryNames(metadata.categories)
      Logger.info(`分类处理完成: ${categoryNames.join(', ')}`)
    }
    
    if (metadata.tags && metadata.tags.length > 0) {
      Logger.info(`处理标签: ${metadata.tags.join(', ')}`)
      tagNames = await this.getTagNames(metadata.tags)
      Logger.info(`标签处理完成: ${tagNames.join(', ')}`)
    }
    
    // 更新文章信息（使用简化的annotations方式）
    const updatedPost: Post = {
      ...existing.post,
      metadata: {
        ...existing.post.metadata,
        annotations: {
          ...existing.post.metadata?.annotations,
          'content.halo.run/content-json': JSON.stringify(updatedContent)
        }
      },
      spec: {
        ...existing.post.spec,
        title: metadata.title || existing.post.spec.title,
        slug: metadata.slug || existing.post.spec.slug,
        cover: metadata.cover || existing.post.spec.cover,
        publishTime: metadata.publishTime || existing.post.spec.publishTime,
        pinned: metadata.pinned ?? existing.post.spec.pinned,
        allowComment: metadata.allowComment ?? existing.post.spec.allowComment,
        visible: (metadata.visible === 'INTERNAL' ? 'PUBLIC' : metadata.visible) || existing.post.spec.visible,
        priority: metadata.priority ?? existing.post.spec.priority,
        excerpt: {
          autoGenerate: metadata.excerpt ? false : existing.post.spec.excerpt.autoGenerate,
          raw: metadata.excerpt || existing.post.spec.excerpt.raw
        },
        categories: categoryNames,
        tags: tagNames
      }
    }
    
    const postResponse = await this.request(
      `/apis/uc.api.content.halo.run/v1alpha1/posts/${existing.post.metadata?.name || ''}`,
      'PUT',
      updatedPost
    )
    
    if (!postResponse.ok) {
      const errorText = await postResponse.text()
      Logger.error(`更新文章失败: ${postResponse.status} - ${errorText}`)
      throw new Error(`更新文章失败: ${postResponse.status}`)
    }
    
    const post: Post = await postResponse.json()
    
    // 获取并更新快照（参考improved-article-publisher.js的实现）
    try {
      const snapshotResponse = await this.request(
        `/apis/uc.api.content.halo.run/v1alpha1/posts/${existing.post.metadata?.name}/draft?patched=true`,
        'GET'
      )
      
      if (snapshotResponse.ok) {
        const snapshot = await snapshotResponse.json()
        snapshot.metadata.annotations = {
          ...snapshot.metadata.annotations,
          'content.halo.run/content-json': JSON.stringify(updatedContent)
        }
        
        const updateSnapshotResponse = await this.request(
          `/apis/uc.api.content.halo.run/v1alpha1/posts/${existing.post.metadata?.name}/draft`,
          'PUT',
          snapshot
        )
        
        if (!updateSnapshotResponse.ok) {
          Logger.warn(`更新快照失败，但文章已更新: ${updateSnapshotResponse.status}`)
        } else {
          Logger.debug(`快照更新成功`)
        }
      } else {
        Logger.warn(`获取快照失败，但文章已更新: ${snapshotResponse.status}`)
      }
    } catch (error) {
      Logger.warn(`快照更新过程中出错，但文章已更新:`, error)
    }
    
    Logger.debug(`文章更新成功: ${post.spec.title}`)
    return { post, content: updatedContent }
  }

  /**
   * 生成UUID（参照index.ts的randomUUID）
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  /**
   * 生成slug（使用transliteration库处理中文）
   */
  private generateSlug(title: string): string {
    return slugify(title, { trim: true }).substring(0, 50)
  }

  /**
   * 生成标签slug（支持中文）
   */
  private generateTagSlug(name: string): string {
    // Halo支持中文标签，只需要简单处理特殊字符
    return name
      .trim()
      .replace(/[\s\t\n\r]+/g, '-')  // 空白字符替换为连字符
      .replace(/[<>:"/\\|?*]/g, '')   // 移除文件系统不支持的字符
      .replace(/^-+|-+$/g, '')        // 移除首尾的连字符
      .substring(0, 50)               // 限制长度
  }

  /**
   * 创建快照（暂时禁用，使用简化的内容创建方式）
   */
  private async createSnapshot(markdownContent: string): Promise<Snapshot> {
    // 注意：根据测试结果，快照API可能返回500错误
    // 暂时使用简化的方式，不直接创建快照
    throw new Error('快照创建功能暂时不可用，请使用简化的文章创建方式')
  }

  /**
   * 创建内容（暂时禁用，使用简化的内容创建方式）
   */
  private async createContent(snapshotName: string): Promise<Content> {
    // 注意：根据测试结果，内容创建API可能返回500错误
    // 现在直接在文章创建时包含内容信息
    throw new Error('内容创建功能暂时不可用，请使用简化的文章创建方式')
  }

  /**
   * 设置文章发布状态
   */
  private async setPostPublished(postName: string, published: boolean): Promise<void> {
    const response = await this.request(
      `/apis/uc.api.content.halo.run/v1alpha1/posts/${postName}/${published ? 'publish' : 'unpublish'}`,
      'PUT'
    )
    
    if (!response.ok) {
      throw new Error(`设置发布状态失败: ${response.status}`)
    }
    
    Logger.debug(`文章发布状态更新: ${postName} -> ${published}`)
  }

  /**
   * 获取分类列表
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.request('/apis/content.halo.run/v1alpha1/categories', 'GET')
      if (!response.ok) {
        throw new Error(`获取分类失败: ${response.status}`)
      }
      
      const data = await response.json()
      return data.items || []
    } catch (error) {
      Logger.error('获取分类失败:', error)
      return []
    }
  }

  /**
   * 获取所有文章列表
   */
  async getAllPosts(): Promise<Post[]> {
    try {
      const response = await this.request('/apis/content.halo.run/v1alpha1/posts?size=100', 'GET')
      if (!response.ok) {
        throw new Error(`获取文章列表失败: ${response.status}`)
      }
      
      const data = await response.json()
      Logger.info(`获取到 ${data.items?.length || 0} 篇文章，总数: ${data.total || 0}`)
      return data.items || []
    } catch (error) {
      Logger.error('获取文章列表失败:', error)
      return []
    }
  }

  /**
   * 通过 slug 获取文章
   */
  async getPostBySlug(slug: string): Promise<{ post: Post; content: Content; snapshot: Snapshot } | null> {
    try {
      Logger.debug(`通过 slug 获取文章: ${slug}`)
      
      // 获取所有文章列表
      const allPosts = await this.getAllPosts()
      
      // 查找匹配的文章
      const foundPost = allPosts.find(post => post.spec.slug === slug)
      
      if (!foundPost) {
        Logger.debug(`未找到 slug 为 ${slug} 的文章`)
        return null
      }
      
      Logger.debug(`找到文章: ${foundPost.metadata.name}, slug: ${foundPost.spec.slug}`)
      
      // 通过文章的 name 获取完整信息
      return await this.getPost(foundPost.metadata.name)
    } catch (error) {
      Logger.error('通过 slug 获取文章失败:', error)
      return null
    }
  }

  /**
   * 获取标签列表
   */
  async getTags(): Promise<Tag[]> {
    try {
      const response = await this.request('/apis/content.halo.run/v1alpha1/tags', 'GET')
      if (!response.ok) {
        throw new Error(`获取标签失败: ${response.status}`)
      }
      
      const data = await response.json()
      return data.items || []
    } catch (error) {
      Logger.error('获取标签失败:', error)
      return []
    }
  }

  /**
   * 根据显示名称获取分类名称，如果不存在则创建
   */
  async getCategoryNames(displayNames: string[]): Promise<string[]> {
    try {
      const allCategories = await this.getCategories()
      
      const notExistDisplayNames = displayNames.filter(
        (name) => !allCategories.find((item) => item.spec.displayName === name)
      )
      
      const promises = notExistDisplayNames.map((name, index) =>
        this.request('/apis/content.halo.run/v1alpha1/categories', 'POST', {
          spec: {
            displayName: name,
            slug: slugify(name, { trim: true }),
            description: '',
            cover: '',
            template: '',
            priority: allCategories.length + index,
            children: []
          },
          apiVersion: 'content.halo.run/v1alpha1',
          kind: 'Category',
          metadata: { name: '', generateName: 'category-' }
        })
      )
      
      const newCategoryResponses = await Promise.all(promises)
      const newCategories = await Promise.all(
        newCategoryResponses.map(response => response.json())
      )
      
      const existNames = displayNames
        .map((name) => {
          const found = allCategories.find((item) => item.spec.displayName === name)
          return found ? found.metadata.name : undefined
        })
        .filter(Boolean) as string[]
      
      return [...existNames, ...newCategories.map((item) => item.metadata.name)]
    } catch (error) {
      Logger.error('获取分类名称失败:', error)
      return []
    }
  }

  /**
   * 根据显示名称获取标签名称，如果不存在则创建
   */
  async getTagNames(displayNames: string[]): Promise<string[]> {
    try {
      Logger.debug(`开始处理标签: ${displayNames.join(', ')}`)
      const allTags = await this.getTags()
      Logger.debug(`获取到 ${allTags.length} 个现有标签`)
      
      const notExistDisplayNames = displayNames.filter(
        (name) => !allTags.find((item) => item.spec.displayName === name)
      )
      Logger.debug(`需要创建的新标签: ${notExistDisplayNames.join(', ')}`)
      
      // 处理需要创建的新标签
      const newTags = []
      for (const name of notExistDisplayNames) {
        try {
          Logger.debug(`创建标签: ${name}`)
          const response = await this.request('/apis/content.halo.run/v1alpha1/tags', 'POST', {
            spec: {
              displayName: name,
              slug: this.generateTagSlug(name),
              color: '#ffffff',
              cover: ''
            },
            apiVersion: 'content.halo.run/v1alpha1',
            kind: 'Tag',
            metadata: { name: '', generateName: 'tag-' }
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            Logger.error(`创建标签失败 (${name}): ${response.status} ${response.statusText}`, errorText)
            continue
          }
          
          const newTag = await response.json()
          newTags.push(newTag)
          Logger.debug(`标签创建成功: ${name} -> ${newTag.metadata.name}`)
        } catch (error) {
          Logger.error(`创建标签异常 (${name}):`, error)
        }
      }
      
      // 获取现有标签的名称
      const existNames = displayNames
        .map((name) => {
          const found = allTags.find((item) => item.spec.displayName === name)
          if (found) {
            Logger.debug(`找到现有标签: ${name} -> ${found.metadata.name}`)
            return found.metadata.name
          }
          return undefined
        })
        .filter(Boolean) as string[]
      
      const result = [...existNames, ...newTags.map((item) => item.metadata.name)]
      Logger.debug(`标签处理完成: ${result.join(', ')}`)
      return result
    } catch (error) {
      Logger.error('获取标签名称失败:', error)
      // 即使出错，也尝试返回一些基本的标签名称
      Logger.warn('尝试使用 displayName 作为标签名称')
      return displayNames.map(name => this.generateTagSlug(name))
    }
  }

  /**
   * 根据标签名称获取显示名称
   */
  async getTagDisplayNames(names?: string[]): Promise<string[]> {
    if (!names || names.length === 0) {
      return []
    }
    
    try {
      const allTags = await this.getTags()
      return names
        .map((name) => {
          const found = allTags.find((item) => item.metadata.name === name)
          return found ? found.spec.displayName : undefined
        })
        .filter(Boolean) as string[]
    } catch (error) {
      Logger.error('获取标签显示名称失败:', error)
      return []
    }
  }

  /**
   * 根据分类名称获取显示名称
   */
  async getCategoryDisplayNames(names?: string[]): Promise<string[]> {
    if (!names || names.length === 0) {
      return []
    }
    
    try {
      const allCategories = await this.getCategories()
      return names
        .map((name) => {
          const found = allCategories.find((item) => item.metadata.name === name)
          return found ? found.spec.displayName : undefined
        })
        .filter(Boolean) as string[]
    } catch (error) {
      Logger.error('获取分类显示名称失败:', error)
      return []
    }
  }

  /**
   * 拉取文章到 Logseq
   */
  async pullPost(name: string): Promise<{ title: string; content: string; frontmatter: any } | null> {
    try {
      const post = await this.getPost(name)
      
      if (!post) {
        Logger.error(`文章不存在: ${name}`)
        return null
      }
      
      // 获取分类和标签的显示名称
      const postCategories = await this.getCategoryDisplayNames(post.post.spec.categories)
      const postTags = await this.getTagDisplayNames(post.post.spec.tags)
      
      // 构建 frontmatter
      const frontmatter = {
        title: post.post.spec.title,
        slug: post.post.spec.slug,
        cover: post.post.spec.cover,
        excerpt: post.post.spec.excerpt.autoGenerate ? undefined : post.post.spec.excerpt.raw,
        categories: postCategories,
        tags: postTags,
        halo: {
          site: this.site.url,
          name: name,
          publish: post.post.spec.publish
        }
      }
      
      Logger.info(`文章拉取成功: ${post.post.spec.title}`)
      Logger.debug(`分类: ${postCategories.join(', ')}`)
      Logger.debug(`标签: ${postTags.join(', ')}`)
      
      return {
        title: post.post.spec.title,
        content: post.content.raw,
        frontmatter
      }
    } catch (error) {
      Logger.error(`拉取文章失败 (${name}):`, error)
      return null
    }
  }

  /**
   * 获取文章URL
   */
  private getPostUrl(post: Post): string {
    return `${this.baseUrl}/archives/${post.spec.slug}`
  }

  /**
   * 处理附件上传（包括图片和其他文件类型）
   */
  private async processAttachments(markdownContent: string): Promise<string> {
    try {
      // 前端提示开始处理附件
      logseq.UI.showMsg('📎 开始处理附件上传...', 'info')
      Logger.info('📎 开始处理附件上传...')
      Logger.info('📝 原始Markdown内容:', markdownContent)
      
      // 匹配 Logseq 图片语法: ![image.png](../assets/image_xxx.png)
      const imageRegex = /!\[([^\]]*)\]\((\.\.\/assets\/[^\)]+)\)/g
      const imageMatches = Array.from(markdownContent.matchAll(imageRegex))
      
      // 匹配 Logseq 附件语法: [filename.ext](../assets/filename.ext)
      const attachmentRegex = /\[([^\]]+\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|zip|rar|7z|tar|gz|mp3|wav|mp4|avi|mov|json|xml|csv))\]\((\.\.\/assets\/[^\)]+)\)/gi
      const attachmentMatches = Array.from(markdownContent.matchAll(attachmentRegex))
      
      const totalMatches = imageMatches.length + attachmentMatches.length
      
      Logger.info(`📊 附件匹配统计: 找到 ${imageMatches.length} 张图片, ${attachmentMatches.length} 个其他附件，共 ${totalMatches} 个文件`)
      
      if (totalMatches === 0) {
        logseq.UI.showMsg('✅ 没有找到需要上传的附件', 'info')
        Logger.info('✅ 没有找到需要上传的附件，跳过附件处理')
        return markdownContent
      }
      
      // 前端提示找到的附件数量
      logseq.UI.showMsg(`📊 找到 ${totalMatches} 个附件（${imageMatches.length} 张图片，${attachmentMatches.length} 个其他文件），开始上传...`, 'info')
      
      // 显示所有匹配到的文件信息
      imageMatches.forEach((match, index) => {
        const [fullMatch, altText, imagePath] = match
        Logger.info(`📷 图片 ${index + 1}: alt="${altText}", path="${imagePath}"`)
      })
      
      attachmentMatches.forEach((match, index) => {
        const [fullMatch, fileName, extension, filePath] = match
        Logger.info(`📎 附件 ${index + 1}: ${fileName} -> ${filePath}`)
      })

      let processedContent = markdownContent
      let successCount = 0
      let failCount = 0
      
      // 处理图片上传
      for (let i = 0; i < imageMatches.length; i++) {
        const match = imageMatches[i]
        const [fullMatch, altText, imagePath] = match
        
        // 前端提示当前处理进度
        logseq.UI.showMsg(`🔄 正在上传第 ${i + 1}/${totalMatches} 个文件...`, 'info')
        Logger.info(`🔄 正在处理第 ${i + 1}/${totalMatches} 个文件...`)
        Logger.info(`   原始链接: ${fullMatch}`)
        
        try {
          // 上传图片并获取新的URL
          const uploadedUrl = await this.uploadImage(imagePath, altText)
          
          // 替换原始图片链接
          const newImageLink = `![${altText}](${uploadedUrl})`
          processedContent = processedContent.replace(fullMatch, newImageLink)
          
          Logger.info(`✅ 图片上传成功!`)
          Logger.info(`   原始路径: ${imagePath}`)
          Logger.info(`   Halo地址: ${uploadedUrl}`)
          Logger.info(`   替换结果: ${newImageLink}`)
          successCount++
        } catch (error) {
          // uploadImage方法已经显示了详细的错误提示，这里只记录日志
          Logger.error(`❌ 图片上传异常: ${imagePath}`, error)
          failCount++
          // 继续处理其他图片，不中断整个流程
        }
      }
      
      // 处理其他附件上传
      for (let i = 0; i < attachmentMatches.length; i++) {
        const match = attachmentMatches[i]
        const [fullMatch, fileName, extension, filePath] = match
        
        // 前端提示当前处理进度
        logseq.UI.showMsg(`🔄 正在上传第 ${imageMatches.length + i + 1}/${totalMatches} 个文件...`, 'info')
        Logger.info(`🔄 正在处理第 ${imageMatches.length + i + 1}/${totalMatches} 个文件...`)
        Logger.info(`   原始链接: ${fullMatch}`)
        
        try {
          // 上传附件并获取新的URL
          const uploadedUrl = await this.uploadImage(filePath, fileName)
          
          // 替换原始附件链接
          const newAttachmentLink = `[${fileName}](${uploadedUrl})`
          processedContent = processedContent.replace(fullMatch, newAttachmentLink)
          
          Logger.info(`✅ 附件上传成功!`)
          Logger.info(`   原始路径: ${filePath}`)
          Logger.info(`   Halo地址: ${uploadedUrl}`)
          Logger.info(`   替换结果: ${newAttachmentLink}`)
          successCount++
        } catch (error) {
          // uploadImage方法已经显示了详细的错误提示，这里只记录日志
          Logger.error(`❌ 附件上传异常: ${filePath}`, error)
          failCount++
          // 继续处理其他附件，不中断整个流程
        }
      }
      
      // 统计缓存使用情况
       const cacheHits = totalMatches - (successCount + failCount)
       
       // 前端提示最终统计结果
       if (failCount === 0) {
         if (cacheHits > 0) {
           logseq.UI.showMsg(`🎉 附件处理完成！新上传 ${successCount} 个，缓存命中 ${cacheHits} 个`, 'success')
         } else {
           logseq.UI.showMsg(`🎉 所有附件上传完成！成功 ${successCount} 个`, 'success')
         }
       } else {
         logseq.UI.showMsg(`📈 附件处理完成: 新上传 ${successCount} 个, 缓存命中 ${cacheHits} 个, 失败 ${failCount} 个`, 'warning')
       }
       Logger.info(`📈 附件处理完成: 新上传 ${successCount} 个, 缓存命中 ${cacheHits} 个, 失败 ${failCount} 个`)
       Logger.info(`💾 当前缓存中共有 ${this.imageCache.size} 个文件`)
      
      if (successCount > 0) {
        Logger.info('🔄 最终处理后的内容:')
        Logger.info('📄 处理后内容:', processedContent)
      }
      
      return processedContent
    } catch (error) {
      Logger.error('❌ 处理附件时发生严重错误:', error)
      return markdownContent // 返回原始内容，不中断发布流程
    }
  }

  /**
   * 上传单张图片到 Halo
   */
  private async uploadImage(imagePath: string, altText: string): Promise<string> {
    try {
      Logger.info(`📤 开始上传图片到Halo...`)
      Logger.info(`   图片路径: ${imagePath}`)
      Logger.info(`   Alt文本: ${altText}`)
      
      // 检查缓存中是否已有该图片
      const cachedUrl = this.imageCache.get(imagePath)
      if (cachedUrl) {
        Logger.info(`🎯 图片已存在缓存中，跳过上传`)
        Logger.info(`   缓存路径: ${imagePath}`)
        Logger.info(`   缓存URL: ${cachedUrl}`)
        logseq.UI.showMsg(`⚡ 图片已缓存，跳过上传: ${this.extractFileName(imagePath)}`, 'info')
        return cachedUrl
      }
      
      // 显示上传开始提示
      logseq.UI.showMsg(`🔄 正在上传图片: ${this.extractFileName(imagePath)}`, 'info')
      
      // 从 Logseq 读取图片文件
      Logger.info(`📁 正在读取图片文件...`)
      const imageData = await this.readImageFromLogseq(imagePath)
      if (!imageData) {
        Logger.error(`❌ 无法读取图片文件: ${imagePath}`)
        throw new Error('无法读取图片文件')
      }
      
      Logger.info(`✅ 图片文件读取成功，大小: ${imageData.byteLength} 字节`)
      
      // 准备上传数据
      const fileName = this.extractFileName(imagePath)
      const mimeType = this.getMimeType(fileName)
      Logger.info(`📋 准备上传数据:`)
      Logger.info(`   文件名: ${fileName}`)
      Logger.info(`   MIME类型: ${mimeType}`)
      
      const formData = new FormData()
      const blob = new Blob([imageData], { type: mimeType })
      
      formData.append('file', blob, fileName)
      formData.append('policyName', 'default-policy')
      // 不指定groupName，让Halo使用默认设置
      
      Logger.info(`🌐 正在上传到Halo服务器...`)
      Logger.info(`   上传端点: /apis/api.console.halo.run/v1alpha1/attachments/upload`)
      Logger.info(`   Halo站点: ${this.baseUrl}`)
      
      // 上传到 Halo
      const uploadResponse = await this.request(
        '/apis/api.console.halo.run/v1alpha1/attachments/upload',
        'POST',
        formData,
        {} // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
      )
      
      Logger.info(`📡 Halo服务器响应状态: ${uploadResponse.status}`)
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        Logger.error(`❌ Halo上传失败:`)
        Logger.error(`   状态码: ${uploadResponse.status}`)
        Logger.error(`   状态文本: ${uploadResponse.statusText}`)
        Logger.error(`   响应内容: ${errorText}`)
        throw new Error(`上传失败: ${uploadResponse.status} - ${uploadResponse.statusText}`)
      }
      
      const result = await uploadResponse.json()
      Logger.info(`📄 Halo响应数据:`, result)
      
      // 提取图片URL - 使用与测试代码相同的逻辑
      let imageUrl = null
      
      // 方法1: 从annotations中获取uri（Halo标准响应）
      if (result.metadata?.annotations?.['storage.halo.run/uri']) {
        imageUrl = result.metadata.annotations['storage.halo.run/uri']
        Logger.info(`📍 ✅ 从annotations获取到图片URI: ${imageUrl}`)
      }
      // 方法2: 从spec.url获取（备用）
      else if (result.spec?.url) {
        imageUrl = result.spec.url
        Logger.info(`📍 从spec.url获取到图片URL: ${imageUrl}`)
      }
      // 方法3: 从根级url获取（备用）
      else if (result.url) {
        imageUrl = result.url
        Logger.info(`📍 从根级url获取到图片URL: ${imageUrl}`)
      }
      
      if (!imageUrl) {
        Logger.error(`❌ 上传响应中未找到图片URL`)
        Logger.error(`   响应结构: ${JSON.stringify(result, null, 2)}`)
        Logger.error(`   预期字段: metadata.annotations["storage.halo.run/uri"] 或 spec.url 或 url`)
        throw new Error(`Halo服务器响应中未找到图片URL。响应结构: ${JSON.stringify(result, null, 2)}`)
      }
      
      // 构建完整访问地址
      let fullUrl = imageUrl
      if (imageUrl.startsWith('/')) {
        fullUrl = this.baseUrl + imageUrl
      }
      
      // 转换为相对地址，避免域名变更问题
      const relativeUrl = this.convertToRelativeUrl(fullUrl)
      
      Logger.info(`🎉 图片上传成功!`)
      Logger.info(`   原始URI: ${imageUrl}`)
      Logger.info(`   完整地址: ${fullUrl}`)
      Logger.info(`   相对地址: ${relativeUrl}`)
      Logger.info(`   地址格式说明: 使用相对地址避免域名变更影响`)
      
      // 显示上传成功提示
      logseq.UI.showMsg(`✅ 图片上传成功: ${fileName}`, 'success')
      
      // 将上传成功的图片URL缓存起来
      this.imageCache.set(imagePath, relativeUrl)
      Logger.info(`💾 图片URL已缓存: ${imagePath} -> ${relativeUrl}`)
      
      return relativeUrl
    } catch (error) {
      Logger.error(`❌ 上传图片失败: ${imagePath}`, error)
      // 显示上传失败提示
      logseq.UI.showMsg(`❌ 图片上传失败: ${this.extractFileName(imagePath)} - ${error instanceof Error ? error.message : String(error)}`, 'error')
      throw error
    }
  }

  /**
   * 从 Logseq 读取图片文件
   */
  private async readImageFromLogseq(imagePath: string): Promise<ArrayBuffer | null> {
    try {
      Logger.info(`🔍 开始读取Logseq图片文件...`)
      Logger.info(`   原始路径: ${imagePath}`)
      
      // 处理路径，移除 ../assets/ 前缀
      const fileName = imagePath.replace('../assets/', '')
      Logger.info(`   提取文件名: ${fileName}`)
      
      // 检查 Logseq API 可用性
      Logger.info(`🔍 检查 Logseq API 可用性...`)
      if (typeof logseq !== 'undefined') {
        Logger.info(`✅ logseq 对象可用`)
        if (logseq.Assets) {
          Logger.info(`✅ logseq.Assets 可用，方法: ${Object.keys(logseq.Assets).join(', ')}`)
        } else {
          Logger.warn(`⚠️  logseq.Assets 不可用`)
        }
      } else {
        Logger.warn(`⚠️  logseq 对象不可用`)
      }
      
      // 如果 Assets API 不可用或失败，尝试获取当前图谱路径
      let graphPath = ''
      try {
        if (typeof logseq !== 'undefined' && logseq.App && logseq.App.getCurrentGraph) {
          const graph = await logseq.App.getCurrentGraph()
          if (graph && graph.path) {
            graphPath = graph.path
            Logger.info(`📁 获取到图谱路径: ${graphPath}`)
          }
        }
      } catch (graphError) {
        Logger.warn(`⚠️  获取图谱路径失败: ${graphError instanceof Error ? graphError.message : String(graphError)}`)
      }
      
      // 构建可能的文件路径
      const fetchPaths = [
        // 如果有图谱路径，尝试构建完整路径
        ...(graphPath ? [
          `file://${graphPath}/assets/${fileName}`,
          `${graphPath}/assets/${fileName}`
        ] : []),
        // 标准相对路径
        `./assets/${fileName}`,
        `assets/${fileName}`,
        `../assets/${fileName}`,
        `../../assets/${fileName}`,
        imagePath,
        fileName
      ]
      
      Logger.info(`📂 将尝试以下路径 (共${fetchPaths.length}个):`)
      fetchPaths.forEach((path, index) => {
        Logger.info(`   ${index + 1}. ${path}`)
      })
      
      for (let i = 0; i < fetchPaths.length; i++) {
        const path = fetchPaths[i]
        try {
          Logger.info(`🔄 尝试fetch路径 ${i + 1}/${fetchPaths.length}: ${path}`)
          
          const response = await fetch(path)
          const contentType = response.headers.get('content-type')
          const contentLength = response.headers.get('content-length')
          
          Logger.info(`   响应状态: ${response.status} ${response.statusText}`)
          Logger.info(`   Content-Type: ${contentType || '未知'}`)
          Logger.info(`   Content-Length: ${contentLength || '未知'} 字节`)
          
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer()
            Logger.info(`✅ 通过fetch成功读取图片文件!`)
            Logger.info(`   成功路径: ${path}`)
            Logger.info(`   实际大小: ${arrayBuffer.byteLength} 字节`)
            Logger.info(`   文件类型: ${contentType || '未知'}`)
            return arrayBuffer
          } else {
            Logger.warn(`⚠️  fetch路径无效: ${response.status} ${response.statusText}`)
          }
        } catch (error) {
          Logger.warn(`⚠️  fetch路径访问异常: ${error instanceof Error ? error.message : String(error)}`)
          continue
        }
      }
      
      // 最后尝试提示用户手动处理
      Logger.error(`❌ 所有方法都无法访问图片文件!`)
      Logger.error(`   尝试的路径: ${fetchPaths.join(', ')}`)
      Logger.error(`   可能的原因:`)
      Logger.error(`   1. 图片文件不存在或已被移动`)
      Logger.error(`   2. Logseq插件环境限制文件访问`)
      Logger.error(`   3. 浏览器安全策略限制本地文件访问`)
      Logger.error(`   4. 文件路径权限问题`)
      
      // 给用户一个更友好的错误提示
      throw new Error(`无法读取图片文件。请确保图片文件存在于 assets 目录中，文件名为: ${fileName}`)
    } catch (error) {
      Logger.error(`❌ 读取图片文件失败: ${imagePath}`, error)
      return null
    }
  }

  /**
   * 清理图片缓存
   */
  public clearImageCache(): void {
    const cacheSize = this.imageCache.size
    this.imageCache.clear()
    Logger.info(`🗑️ 图片缓存已清理，清理了 ${cacheSize} 张图片的缓存`)
    logseq.UI.showMsg(`🗑️ 图片缓存已清理 (${cacheSize} 张图片)`, 'info')
  }

  /**
   * 获取缓存状态
   */
  public getImageCacheStatus(): { size: number; entries: Array<{ path: string; url: string }> } {
    const entries = Array.from(this.imageCache.entries()).map(([path, url]) => ({ path, url }))
    return {
      size: this.imageCache.size,
      entries
    }
  }

  /**
   * 从缓存中移除特定图片
   */
  public removeFromImageCache(imagePath: string): boolean {
    const removed = this.imageCache.delete(imagePath)
    if (removed) {
      Logger.info(`🗑️ 已从缓存中移除图片: ${imagePath}`)
      logseq.UI.showMsg(`🗑️ 已从缓存中移除: ${this.extractFileName(imagePath)}`, 'info')
    }
    return removed
  }

  /**
   * 将完整URL转换为相对地址
   */
  private convertToRelativeUrl(fullUrl: string): string {
    try {
      const url = new URL(fullUrl)
      // 返回路径部分（不包含域名）
      return url.pathname
    } catch (error) {
      Logger.warn(`⚠️ URL解析失败，返回原始地址: ${fullUrl}`, error)
      return fullUrl
    }
  }

  /**
   * 解析图片路径
   */
  private resolveImagePath(imagePath: string): string {
    // 处理 Logseq 的相对路径
    if (imagePath.startsWith('../assets/')) {
      // 在浏览器环境中，尝试构建完整的文件路径
      // 假设当前页面在 logseq 的某个子目录中，需要回到根目录再进入 assets
      const fileName = imagePath.replace('../assets/', '')
      
      // 尝试多种可能的路径
      const possiblePaths = [
        `assets/${fileName}`,
        `../assets/${fileName}`,
        `../../assets/${fileName}`,
        imagePath // 原始路径作为后备
      ]
      
      // 返回第一个可能的路径，实际验证将在 readImageFromLogseq 中进行
      return possiblePaths[0]
    }
    return imagePath
  }

  /**
   * 提取文件名
   */
  private extractFileName(imagePath: string): string {
    const parts = imagePath.split('/')
    return parts[parts.length - 1] || 'image.png'
  }

  /**
   * 获取 MIME 类型
   */
  private getMimeType(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop()
    const mimeTypes: Record<string, string> = {
      // 图片类型
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'ico': 'image/x-icon',
      // 文档类型
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'rtf': 'application/rtf',
      // 压缩文件
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
      // 音视频
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      // 其他常见格式
      'json': 'application/json',
      'xml': 'application/xml',
      'csv': 'text/csv'
    }
    return mimeTypes[extension || ''] || 'application/octet-stream'
  }

  /**
   * 发送HTTP请求
   */
  private async request(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body?: any,
    additionalHeaders?: Record<string, string>
  ): Promise<Response> {
    const url = `${this.baseUrl}${path}`
    const headers = { ...this.headers, ...additionalHeaders }
    
    // 如果是 FormData，删除 Content-Type 让浏览器自动设置
     if (body instanceof FormData) {
       delete headers['Content-Type']
     }
    
    const options: RequestInit = {
      method,
      headers,
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined)
    }
    
    Logger.debug(`API请求: ${method} ${url}`)
    
    try {
      const response = await fetch(url, options)
      Logger.debug(`API响应: ${response.status} ${response.statusText}`)
      return response
    } catch (error) {
      Logger.error(`API请求失败: ${method} ${url}`, error)
      throw error
    }
  }
}