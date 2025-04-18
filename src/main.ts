import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

import session from 'express-session'
import * as fs from 'fs'
import * as path from 'path'

const configPath = path.join(__dirname, 'config/session.json')
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  })

  app.enableCors({
    origin: '*',
    methods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
    credentials: true,
  })

  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    }),
  )

  await app.listen(3000)
}
bootstrap()
