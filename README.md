# 351Robot 通讯模块
本模块采用Nest框架作为服务端框架，同时使用FoxgloveBridge第三方库与ROS进行通信。

## 开发笔记

目前打算把foxglove client下移到mcp server中，大模型服务全部都转移到mcp server，foxglove只保留一个mcp client

后续这一层应该以鉴权为主，然后调度不同的agent去实现大模型服务



## 环境准备
1. 安装nodejs和bun环境，推荐使用nvm进行管理。
2. foxgloveService需要连接机器人，需要在foxglove.module.ts中修改引入的配置
3. ~~hunyuan.module.ts引入了混元模型调用需要的信息，需要自行配置~~
4. main.ts引入了session，需要在config中自行配置sessionSecret

## 本地调试
```
npm run start
```

## API Doc
链接: https://g6ce0748se.apifox.cn