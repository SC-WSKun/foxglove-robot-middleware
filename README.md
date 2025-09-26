# 351Robot 通讯模块
本模块采用Nest框架作为服务端框架，同时使用FoxgloveBridge第三方库与ROS进行通信。

## Todo

- [ ] 为A2A框架提供安全认证
- [ ] 为A2A框架提供备用通信通道
- [ ] 新增A2A框架，支持动态接入

## 开发笔记

目前打算把foxglove client下移到mcp server中，中间层只保留一个mcp client与部分功能接口

后续这一层应该以鉴权为主，然后调度不同的agent去实现大模型服务

取消 MCP Server 的 Stdio 模式



## 环境准备
1. 安装nodejs和bun环境，推荐使用nvm进行管理。
2. foxgloveService需要连接机器人，需要在foxglove.module.ts中修改引入的配置
3. ~~hunyuan.module.ts引入了混元模型调用需要的信息，需要自行配置~~
4. ~~wsproxy.ts引入了火山引擎调用需要的信息，需要自行配置~~
5. main.ts引入了session，需要在config中自行配置sessionSecret

## 本地调试
```
npm run start
```

## API Doc
链接: https://g6ce0748se.apifox.cn