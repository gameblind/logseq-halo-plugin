/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * 日志管理器
 */
export class Logger {
  private static currentLevel: LogLevel = LogLevel.INFO
  private static prefix = '[Logseq-Halo]'
  private static logBuffer: string[] = []
  private static maxBufferSize = 1000

  /**
   * 设置日志级别
   */
  static setLevel(level: 'debug' | 'info' | 'warn' | 'error') {
    switch (level) {
      case 'debug':
        this.currentLevel = LogLevel.DEBUG
        break
      case 'info':
        this.currentLevel = LogLevel.INFO
        break
      case 'warn':
        this.currentLevel = LogLevel.WARN
        break
      case 'error':
        this.currentLevel = LogLevel.ERROR
        break
    }
  }

  /**
   * 调试日志
   */
  static debug(message: string, data?: any) {
    if (this.currentLevel <= LogLevel.DEBUG) {
      const logMessage = `${this.getTimestamp()} ${this.prefix} [DEBUG] ${message}`
      console.log(logMessage, data || '')
      this.addToBuffer(logMessage + (data ? ` ${JSON.stringify(data)}` : ''))
    }
  }

  /**
   * 信息日志
   */
  static info(message: string, data?: any) {
    if (this.currentLevel <= LogLevel.INFO) {
      const logMessage = `${this.getTimestamp()} ${this.prefix} [INFO] ${message}`
      console.info(logMessage, data || '')
      this.addToBuffer(logMessage + (data ? ` ${JSON.stringify(data)}` : ''))
    }
  }

  /**
   * 警告日志
   */
  static warn(message: string, data?: any) {
    if (this.currentLevel <= LogLevel.WARN) {
      const logMessage = `${this.getTimestamp()} ${this.prefix} [WARN] ${message}`
      console.warn(logMessage, data || '')
      this.addToBuffer(logMessage + (data ? ` ${JSON.stringify(data)}` : ''))
    }
  }

  /**
   * 错误日志
   */
  static error(message: string, error?: any) {
    if (this.currentLevel <= LogLevel.ERROR) {
      const logMessage = `${this.getTimestamp()} ${this.prefix} [ERROR] ${message}`
      console.error(logMessage, error || '')
      const errorInfo = error ? (error instanceof Error ? error.stack || error.message : JSON.stringify(error)) : ''
      this.addToBuffer(logMessage + (errorInfo ? ` ${errorInfo}` : ''))
    }
  }

  /**
   * 添加日志到缓冲区
   */
  private static addToBuffer(message: string) {
    this.logBuffer.push(message)
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift()
    }
  }

  /**
   * 获取所有日志
   */
  static getLogs(): string[] {
    return [...this.logBuffer]
  }

  /**
   * 获取日志文本
   */
  static getLogsAsText(): string {
    return this.logBuffer.join('\n')
  }

  /**
   * 清空日志缓冲区
   */
  static clearLogs(): void {
    this.logBuffer = []
  }

  /**
   * 导出日志到文件
   */
  static exportLogs(): void {
    try {
      const logs = this.getLogsAsText()
      const blob = new Blob([logs], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `halo-plugin-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      this.info('日志已导出到文件')
    } catch (error) {
      console.error('导出日志失败:', error)
    }
  }

  /**
   * 格式化时间戳
   */
  private static getTimestamp(): string {
    return new Date().toISOString()
  }
}