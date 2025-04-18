import { Tool } from '@anthropic-ai/sdk/resources/messages/messages.mjs'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import OpenAI from 'openai'
import qwenConfig from '../config/qwen.json'
import { ChatCompletionMessageParam } from 'openai/resources/chat'

class MCPClient {
  private mcp: Client
  private qwen: OpenAI
  private transport: StdioClientTransport | null = null
  private tools: Tool[] = []
  private messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        '你是一个机器人，名字叫旺财，你可以实现简单的移动，以及目标地点导航。对于需要你去某个地点的指令，你需要先使用robot-get-locations获取所有地点信息，找到正确的需要去的地点的名字，再调用robot-navigation工具',
    },
  ]

  constructor() {
    this.mcp = new Client({ name: 'mcp-client-cli', version: '1.0.0' })
    this.qwen = new OpenAI({
      // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx",
      apiKey: qwenConfig.API_KEY,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    })
  }

  async connectToServer(serverScriptPath: string) {
    try {
      const isJs = serverScriptPath.endsWith('.js')
      const isPy = serverScriptPath.endsWith('.py')
      if (!isJs && !isPy) {
        throw new Error('Server script must be a .js or .py file')
      }
      const command = isPy
        ? process.platform === 'win32'
          ? 'python'
          : 'python3'
        : process.execPath

      this.transport = new StdioClientTransport({
        command,
        args: [serverScriptPath],
      })
      this.mcp.connect(this.transport)

      const toolsResult = await this.mcp.listTools()
      this.tools = toolsResult.tools.map(tool => {
        return {
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
          },
        }
      })
      console.log(
        'Connected to server with tools:',
        this.tools.map(({ function: { name } }) => name),
      )
    } catch (e) {
      console.log('Failed to connect to MCP server: ', e)
      throw e
    }
  }

  async functionCalling() {
    const completion = await this.qwen.chat.completions.create({
      model: 'qwen-plus', // 模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
      messages: this.messages,
      tools: this.tools,
    })

    console.log('返回结果：')
    console.log(JSON.stringify(completion.choices[0].message))
    return completion
  }

  async processQuery(query: string) {
    this.messages.push({
      role: 'user',
      content: query,
    })
    let queryTime = 0
    while (queryTime < 3) {
      // 由AI判断是否需要调用工具，并给出工具调用的参数
      const completion = await this.functionCalling()
      const completionMessage = completion.choices[0].message
      // qwen如果返回的content不为空，则代表不调用工具，直接返回content
      if (completionMessage.content) {
        return completionMessage.content
      }
      this.messages.push(completionMessage)
      // 调用工具
      const toolCalls = completionMessage.tool_calls
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name
        const arguments_string = toolCall.function.arguments
        const args = JSON.parse(arguments_string)
        const result = await this.mcp.callTool({
          name: toolName,
          arguments: args,
        })
        console.debug(
          `[Calling tool ${toolName} with args ${JSON.stringify(args)}]\n`,
        )
        this.messages.push({
          role: 'tool',
          content: result.content as string,
          tool_call_id: toolCall.id,
        })
      }
      queryTime++
    }
    return {
      messages: this.messages,
    }
  }
}

export default MCPClient
