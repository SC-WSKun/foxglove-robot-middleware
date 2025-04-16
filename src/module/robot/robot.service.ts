import { Injectable } from '@nestjs/common'
import MCPClient from 'src/utils/McpClient'

@Injectable()
export class RobotService {
  mcpClient: MCPClient
  constructor() {
    this.mcpClient = new MCPClient()
    this.mcpClient.connectToServer('src/utils/mcp-server.js')
  }
}
