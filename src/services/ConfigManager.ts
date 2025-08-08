import { PluginSettings, HaloSite } from '../types'
import { Logger } from '../utils/Logger'

/**
 * 配置管理器
 * 负责插件设置的读取、保存和管理
 */
export class ConfigManager {
  private settings: PluginSettings
  private readonly defaultSettings: PluginSettings = {
    sites: [],
    publishByDefault: false,
    autoGenerateExcerpt: true,
    imageUploadEnabled: false,
    logLevel: 'info'
  }

  constructor() {
    this.settings = { ...this.defaultSettings }
  }

  /**
   * 初始化配置管理器
   */
  async initialize(): Promise<void> {
    try {
      await this.loadSettings()
      Logger.setLevel(this.settings.logLevel)
      Logger.info('配置管理器初始化完成')
    } catch (error) {
      Logger.error('配置管理器初始化失败:', error)
      throw error
    }
  }

  /**
   * 加载设置
   */
  private async loadSettings(): Promise<void> {
    try {
      // 从 Logseq 设置中读取配置
      const sitesJson = logseq.settings?.sites || '[]'
      const sites = JSON.parse(sitesJson) as HaloSite[]
      
      this.settings = {
        sites,
        publishByDefault: logseq.settings?.publishByDefault ?? this.defaultSettings.publishByDefault,
        autoGenerateExcerpt: logseq.settings?.autoGenerateExcerpt ?? this.defaultSettings.autoGenerateExcerpt,
        imageUploadEnabled: logseq.settings?.imageUploadEnabled ?? this.defaultSettings.imageUploadEnabled,
        logLevel: logseq.settings?.logLevel ?? this.defaultSettings.logLevel
      }

      Logger.debug('设置加载完成:', this.settings)
    } catch (error) {
      Logger.warn('设置加载失败，使用默认设置:', error)
      this.settings = { ...this.defaultSettings }
    }
  }

  /**
   * 保存设置
   */
  async saveSettings(newSettings: Partial<PluginSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings }
      
      // 保存到 Logseq 设置
      if (newSettings.sites) {
        await logseq.updateSettings({ sites: JSON.stringify(newSettings.sites) })
      }
      
      if (newSettings.publishByDefault !== undefined) {
        await logseq.updateSettings({ publishByDefault: newSettings.publishByDefault })
      }
      
      if (newSettings.autoGenerateExcerpt !== undefined) {
        await logseq.updateSettings({ autoGenerateExcerpt: newSettings.autoGenerateExcerpt })
      }
      
      if (newSettings.imageUploadEnabled !== undefined) {
        await logseq.updateSettings({ imageUploadEnabled: newSettings.imageUploadEnabled })
      }
      
      if (newSettings.logLevel) {
        await logseq.updateSettings({ logLevel: newSettings.logLevel })
        Logger.setLevel(newSettings.logLevel)
      }

      Logger.info('设置保存成功')
    } catch (error) {
      Logger.error('设置保存失败:', error)
      throw error
    }
  }

  /**
   * 获取当前设置
   */
  getSettings(): PluginSettings {
    return { ...this.settings }
  }

  /**
   * 获取所有站点
   */
  getSites(): HaloSite[] {
    return [...this.settings.sites]
  }

  /**
   * 获取默认站点
   */
  getDefaultSite(): HaloSite | undefined {
    if (this.settings.defaultSite) {
      return this.settings.sites.find(site => site.id === this.settings.defaultSite)
    }
    return this.settings.sites.find(site => site.isDefault) || this.settings.sites[0]
  }

  /**
   * 添加站点
   */
  async addSite(site: Omit<HaloSite, 'id'>): Promise<HaloSite> {
    const newSite: HaloSite = {
      ...site,
      id: this.generateSiteId()
    }

    const updatedSites = [...this.settings.sites, newSite]
    await this.saveSettings({ sites: updatedSites })
    
    Logger.info(`站点添加成功: ${newSite.name}`)
    return newSite
  }

  /**
   * 更新站点
   */
  async updateSite(siteId: string, updates: Partial<Omit<HaloSite, 'id'>>): Promise<void> {
    const siteIndex = this.settings.sites.findIndex(site => site.id === siteId)
    if (siteIndex === -1) {
      throw new Error(`站点不存在: ${siteId}`)
    }

    const updatedSites = [...this.settings.sites]
    updatedSites[siteIndex] = { ...updatedSites[siteIndex], ...updates }
    
    await this.saveSettings({ sites: updatedSites })
    Logger.info(`站点更新成功: ${siteId}`)
  }

  /**
   * 删除站点
   */
  async removeSite(siteId: string): Promise<void> {
    const updatedSites = this.settings.sites.filter(site => site.id !== siteId)
    await this.saveSettings({ sites: updatedSites })
    Logger.info(`站点删除成功: ${siteId}`)
  }

  /**
   * 设置默认站点
   */
  async setDefaultSite(siteId: string): Promise<void> {
    const site = this.settings.sites.find(s => s.id === siteId)
    if (!site) {
      throw new Error(`站点不存在: ${siteId}`)
    }

    await this.saveSettings({ defaultSite: siteId })
    Logger.info(`默认站点设置成功: ${site.name}`)
  }

  /**
   * 生成站点ID
   */
  private generateSiteId(): string {
    return `site_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 验证站点配置
   */
  validateSite(site: Partial<HaloSite>): string[] {
    const errors: string[] = []
    
    if (!site.name?.trim()) {
      errors.push('站点名称不能为空')
    }
    
    if (!site.url?.trim()) {
      errors.push('站点URL不能为空')
    } else if (!this.isValidUrl(site.url)) {
      errors.push('站点URL格式不正确')
    }
    
    if (!site.token?.trim()) {
      errors.push('API Token不能为空')
    }
    
    return errors
  }

  /**
   * 验证URL格式
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}