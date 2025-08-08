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

  constructor(site: HaloSite) {
    this.site = site
    this.baseUrl = site.url.endsWith('/') ? site.url.slice(0, -1) : site.url
    this.headers = {
      'Authorization': `Bearer ${site.token}`,
      'Content-Type': 'application/json'
    }
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
      const processedContent = await this.processImages(markdownContent)
      
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
      
      // 发布文章（如果需要）
      if (metadata.published || metadata.publish) {
        await this.setPostPublished(post.metadata?.name || '', true)
        Logger.info(`文章发布成功: ${metadata.title}`)
      } else {
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
    // 处理图片上传和替换
    const processedContent = await this.processImages(markdownContent)
    
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
    // 处理图片上传和替换
    const processedContent = await this.processImages(markdownContent)
    
    // 创建新快照
    const newSnapshot = await this.createSnapshot(processedContent)
    
    // 更新文章信息
    const updatedPost: Post = {
      ...existing.post,
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
        categories: metadata.categories || existing.post.spec.categories,
        tags: metadata.tags || existing.post.spec.tags
      }
    }
    
    const postResponse = await this.request(
      `/apis/uc.api.content.halo.run/v1alpha1/posts/${existing.post.metadata?.name || ''}`,
      'PUT',
      updatedPost
    )
    
    if (!postResponse.ok) {
      throw new Error(`更新文章失败: ${postResponse.status}`)
    }
    
    const post: Post = await postResponse.json()
    
    // 更新内容（通过快照方式）
    const updatedContent: Content = {
      rawType: 'markdown',
      raw: processedContent,
      content: processedContent // 简化处理，直接使用markdown
    }
    
    // 获取并更新快照
    const snapshotResponse = await this.request(
      `/apis/uc.api.content.halo.run/v1alpha1/posts/${post.metadata?.name || ''}/draft?patched=true`,
      'GET'
    )
    
    if (snapshotResponse.ok) {
      const snapshot = await snapshotResponse.json()
      snapshot.metadata.annotations = {
        ...snapshot.metadata.annotations,
        'content.halo.run/content-json': JSON.stringify(updatedContent)
      }
      
      await this.request(
        `/apis/uc.api.content.halo.run/v1alpha1/posts/${post.metadata?.name || ''}/draft`,
        'PUT',
        snapshot
      )
    }
    
    const content = updatedContent
    
    Logger.debug(`文章更新成功: ${post.spec.title}`)
    return { post, content }
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
      const allTags = await this.getTags()
      
      const notExistDisplayNames = displayNames.filter(
        (name) => !allTags.find((item) => item.spec.displayName === name)
      )
      
      const promises = notExistDisplayNames.map((name) =>
        this.request('/apis/content.halo.run/v1alpha1/tags', 'POST', {
          spec: {
            displayName: name,
            slug: slugify(name, { trim: true }),
            color: '#ffffff',
            cover: ''
          },
          apiVersion: 'content.halo.run/v1alpha1',
          kind: 'Tag',
          metadata: { name: '', generateName: 'tag-' }
        })
      )
      
      const newTagResponses = await Promise.all(promises)
      const newTags = await Promise.all(
        newTagResponses.map(response => response.json())
      )
      
      const existNames = displayNames
        .map((name) => {
          const found = allTags.find((item) => item.spec.displayName === name)
          return found ? found.metadata.name : undefined
        })
        .filter(Boolean) as string[]
      
      return [...existNames, ...newTags.map((item) => item.metadata.name)]
    } catch (error) {
      Logger.error('获取标签名称失败:', error)
      return []
    }
  }

  /**
   * 获取文章URL
   */
  private getPostUrl(post: Post): string {
    return `${this.baseUrl}/archives/${post.spec.slug}`
  }

  /**
   * 处理图片上传
   */
  private async processImages(markdownContent: string): Promise<string> {
    try {
      // 前端提示开始处理图片
      logseq.UI.showMsg('🖼️ 开始处理图片上传...', 'info')
      Logger.info('🖼️ 开始处理图片上传...')
      Logger.info('📝 原始Markdown内容:', markdownContent)
      
      // 匹配 Logseq 图片语法: ![image.png](../assets/image_xxx.png)
      const imageRegex = /!\[([^\]]*)\]\((\.\.\/assets\/[^\)]+)\)/g
      const matches = Array.from(markdownContent.matchAll(imageRegex))
      
      Logger.info(`📊 图片匹配统计: 找到 ${matches.length} 张图片`)
      
      if (matches.length === 0) {
        logseq.UI.showMsg('✅ 没有找到需要上传的图片', 'info')
        Logger.info('✅ 没有找到需要上传的图片，跳过图片处理')
        return markdownContent
      }
      
      // 前端提示找到的图片数量
      logseq.UI.showMsg(`📊 找到 ${matches.length} 张图片，开始上传...`, 'info')
      
      // 显示所有匹配到的图片信息
      matches.forEach((match, index) => {
        const [fullMatch, altText, imagePath] = match
        Logger.info(`📷 图片 ${index + 1}: alt="${altText}", path="${imagePath}"`)
      })
      
      let processedContent = markdownContent
      let successCount = 0
      let failCount = 0
      
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i]
        const [fullMatch, altText, imagePath] = match
        
        // 前端提示当前处理进度
        logseq.UI.showMsg(`🔄 正在上传第 ${i + 1}/${matches.length} 张图片...`, 'info')
        Logger.info(`🔄 正在处理第 ${i + 1}/${matches.length} 张图片...`)
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
      
      // 前端提示最终统计结果
      if (failCount === 0) {
        logseq.UI.showMsg(`🎉 所有图片上传完成！成功 ${successCount} 张`, 'success')
      } else {
        logseq.UI.showMsg(`📈 图片处理完成: 成功 ${successCount} 张, 失败 ${failCount} 张`, 'warning')
      }
      Logger.info(`📈 图片处理完成: 成功 ${successCount} 张, 失败 ${failCount} 张`)
      
      if (successCount > 0) {
        Logger.info('🔄 最终处理后的内容:')
        Logger.info('📄 处理后内容:', processedContent)
      }
      
      return processedContent
    } catch (error) {
      Logger.error('❌ 处理图片时发生严重错误:', error)
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
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml'
    }
    return mimeTypes[extension || ''] || 'image/png'
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