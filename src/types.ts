// 设置模式描述类型
interface SettingSchemaDesc {
  key: string
  type: 'string' | 'boolean' | 'number' | 'enum'
  title: string
  description: string
  default?: any
  enumChoices?: string[]
}

/**
 * Halo 站点配置
 */
export interface HaloSite {
  id: string
  name: string
  url: string
  token: string
  isDefault?: boolean
}

/**
 * 插件设置
 */
export interface PluginSettings {
  sites: HaloSite[]
  defaultSite?: string
  publishByDefault: boolean
  autoGenerateExcerpt: boolean
  imageUploadEnabled: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

/**
 * 文章元数据
 */
export interface ArticleMetadata {
  title?: string
  slug?: string
  excerpt?: string
  cover?: string
  categories?: string[]
  tags?: string[]
  publish?: boolean
  published?: boolean
  publishTime?: string
  pinned?: boolean
  allowComment?: boolean
  visible?: 'PUBLIC' | 'INTERNAL' | 'PRIVATE'
  priority?: number
  halo?: {
    site: string
    name: string
    publish: boolean
  }
}

/**
 * Halo API 相关类型
 */
export interface Post {
  apiVersion: string
  kind: string
  metadata: {
    annotations?: Record<string, string>
    name: string
  }
  spec: {
    allowComment: boolean
    baseSnapshot: string
    categories: string[]
    cover: string
    deleted: boolean
    excerpt: {
      autoGenerate: boolean
      raw: string
    }
    headSnapshot: string
    htmlMetas: any[]
    owner: string
    pinned: boolean
    priority: number
    publish: boolean
    publishTime: string
    releaseSnapshot: string
    slug: string
    tags: string[]
    template: string
    title: string
    visible: 'PUBLIC' | 'PRIVATE'
  }
}

/**
 * 文章内容（参照index.ts中的简单结构）
 */
export interface Content {
  rawType: string
  raw: string
  content: string
}

/**
 * 快照
 */
export interface Snapshot {
  metadata: {
    name: string
    annotations?: Record<string, string>
  }
  spec: {
    subjectRef: {
      kind: string
      name: string
      apiVersion: string
    }
    rawType: string
    rawPatch: string
    contentPatch: string
  }
  apiVersion: string
  kind: string
}

export interface Category {
  metadata: {
    name: string
  }
  spec: {
    displayName: string
    slug: string
  }
}

export interface Tag {
  metadata: {
    name: string
  }
  spec: {
    displayName: string
    slug: string
  }
}

/**
 * 插件设置模式
 */
export const SettingsSchema: SettingSchemaDesc[] = [
  {
    key: 'sites',
    type: 'string',
    title: 'Halo 站点配置',
    description: 'JSON 格式的站点配置列表',
    default: '[]'
  },
  {
    key: 'publishByDefault',
    type: 'boolean',
    title: '默认发布',
    description: '创建文章时是否默认发布',
    default: false
  },
  {
    key: 'autoGenerateExcerpt',
    type: 'boolean',
    title: '自动生成摘要',
    description: '是否自动生成文章摘要',
    default: true
  },
  {
    key: 'imageUploadEnabled',
    type: 'boolean',
    title: '启用图片上传',
    description: '是否启用图片上传功能',
    default: false
  },
  {
    key: 'logLevel',
    type: 'enum',
    title: '日志级别',
    description: '设置日志输出级别',
    enumChoices: ['debug', 'info', 'warn', 'error'],
    default: 'info'
  }
]