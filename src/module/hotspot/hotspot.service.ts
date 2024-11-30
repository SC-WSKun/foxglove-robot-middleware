import { Injectable } from '@nestjs/common'
import { exec } from 'node:child_process'

@Injectable()
export class HotSpotService {
  getWiFiList() {
    // 使用nmcli获取wifi列表
    return new Promise((resolve, reject) => {
      const command =
        'nmcli -t -f ssid,bssid,strength,mode,chan,rate,signal,security dev wifi list'
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error)
        }
        resolve(stdout)
      })
    })
  }
}
