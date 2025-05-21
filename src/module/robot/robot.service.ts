import { Injectable } from '@nestjs/common'
import MCPClient from 'src/utils/McpClient'

@Injectable()
export class RobotService {
  mcpClient: MCPClient
  constructor() {
    this.mcpClient = new MCPClient()
    this.mcpClient.connectToServer('src/server/robot-mcp-server/build/index.js')
  }

  /**
   * 测试大模型
   * @param message 向大模型提问的问题
   * @returns string 模型返回的答案
   */
  async testQuery(message: string) {
    return this.mcpClient.processQuery(message)
  }
}
