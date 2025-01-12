import { Injectable } from '@nestjs/common'
import { exec } from 'node:child_process'

@Injectable()
export class HotSpotService {
  getWiFiList() {
    // 使用nmcli获取wifi列表
    return new Promise((resolve, reject) => {
      const command = 'nmcli -t -f ssid dev wifi list'
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error)
        }
        resolve(stdout)
      })
    })
  }

  connectHotspot(ssid: string, password: string) {
    return new Promise((resolve, reject) => {
      const command = `sudo nmcli dev wifi connect ${ssid} password ${password}`
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error)
        }
        resolve(stdout)
      })
    })
  }
}
