import { Injectable, Logger } from '@nestjs/common'
import { FoxgloveService } from './foxglove.service'
import { Move, Position } from 'src/typing/action'
import to from 'await-to-js'
import { quaternionToEuler } from 'src/utils/util'

@Injectable()
export class RobotService {
  constructor(private foxgloveService: FoxgloveService) {
    this.carPositionListener = this.carPositionListener.bind(this)
    this.startMoving = this.startMoving.bind(this)
    this.stopMoving = this.stopMoving.bind(this)
    const that = this
    function subInitTopic() {
      if (that.foxgloveService.connected) {
        that.logger.log('ws connected')
        that.subTfTopic()
        that.advMoveTopic()
      } else {
        setTimeout(() => {
          subInitTopic()
        }, 1000)
      }
    }
    subInitTopic()
  }
  private readonly logger = new Logger('RobotService')
  private channels: Map<string, number> = new Map()
  private odomToBaseFootprint: any
  private tfMsgLimit: boolean = true

  /**
   * subscribe tf topic
   */
  async subTfTopic() {
    this.foxgloveService
      .subscribeTopic('/tf')
      .then((subId: number) => {
        this.channels.set('/tf', subId)
        this.foxgloveService.addHandler('/tf', this.carPositionListener)
      })
      .catch((err: any) => {
        this.logger.error('subscribe tf fail:', err)
      })
  }

  carPositionListener(timestamp: number, data: DataView) {
    const parseData: any = this.foxgloveService.readMsgWithSubId('/tf', data)
    if (
      parseData?.transforms.find(
        (transform: any) =>
          transform.child_frame_id === 'base_footprint' &&
          transform.header.frame_id === 'odom',
      )
    ) {
      this.odomToBaseFootprint =
        parseData.transforms.find(
          (transform: any) =>
            transform.child_frame_id === 'base_footprint' &&
            transform.header.frame_id === 'odom',
        )?.transform || this.odomToBaseFootprint
      if (this.tfMsgLimit) {
        this.tfMsgLimit = false
        // this.logger.debug('odomToBaseFootprint:', this.odomToBaseFootprint)
        setTimeout(() => {
          this.tfMsgLimit = true
        }, 1000)
      }
      // this.mapToOdom =
      //   parseData.transforms.find(
      //     (transform: any) =>
      //       transform.child_frame_id === 'odom' &&
      //       transform.header.frame_id === 'map',
      //   )?.transform || this.mapToOdom;
      // this.carPose = mapToBaseFootprint(
      //   this.mapToOdom,
      //   this.odomToBaseFootprint,
      // );
      // this.updateCarPose();
    }
  }

  /**
   * advertise move topic
   */
  async advMoveTopic() {
    const moveTopicConfig = {
      encoding: 'cdr',
      schema:
        '# This expresses velocity in free space broken into its linear and angular parts.\n\nVector3  linear\nVector3  angular\n\n================================================================================\nMSG: geometry_msgs/Vector3\n# This represents a vector in free space.\n\n# This is semantically different than a point.\n# A vector is always anchored at the origin.\n# When a transform is applied to a vector, only the rotational component is applied.\n\nfloat64 x\nfloat64 y\nfloat64 z\n',
      schemaEncoding: 'ros2msg',
      schemaName: 'geometry_msgs/msg/Twist',
      topic: '/cmd_vel',
    }
    const [err, result] = await to(
      this.foxgloveService.advertiseTopic(moveTopicConfig),
    )
    if (err) {
      this.logger.error('advertise topic fail:', err)
    }
    if (result) {
      this.logger.log(`advertise topic success: ${result}`)
    }
  }

  startMoving({ angularSpeed, linearSpeed }: Move) {
    this.logger.log(
      `robot run with angularSpeed: ${angularSpeed} and linearSpeed: ${linearSpeed}`,
    )
    return this.foxgloveService.publishMessage('/cmd_vel', {
      linear: { x: linearSpeed, y: 0.0, z: 0.0 },
      angular: { x: 0.0, y: 0.0, z: angularSpeed },
    })
  }

  stopMoving() {
    this.foxgloveService.publishMessage('/cmd_vel', {
      linear: { x: 0.0, y: 0.0, z: 0.0 },
      angular: { x: 0.0, y: 0.0, z: 0.0 },
    })
  }

  moveToAngular(angular: number) {
    this.logger.log('--- start moving to angular ---')
    this.logger.log(`angular: ${angular}`)
    const that = this
    if (angular === 0) {
      return Promise.resolve(true)
    }

    let angularSpeed = 0

    if (angular < 0) {
      angularSpeed = -0.5
    } else {
      angularSpeed = 0.5
    }

    // 角度规范化，跨界处理
    function normalizeAngle(angle: number) {
      return Math.atan2(Math.sin(angle), Math.cos(angle))
    }

    // 计算出起始偏航角
    const startPose = normalizeAngle(
      quaternionToEuler(that.odomToBaseFootprint.rotation)[2],
    )
    const reg = (2 * Math.PI) / 360

    function checkPosition() {
      const currentPose = normalizeAngle(
        quaternionToEuler(that.odomToBaseFootprint.rotation)[2],
      )
      const delta = normalizeAngle(currentPose - startPose)
      const tolerance = 0.2
      that.logger.debug('current angular:', Math.abs(delta - angular * reg))
      if (Math.abs(delta - angular * reg) > tolerance) {
        that.startMoving({ linearSpeed: 0, angularSpeed: angularSpeed })
        return false
      } else {
        return true
      }
    }
    return new Promise((resolve, reject) => {
      function loop() {
        setTimeout(() => {
          if (!checkPosition()) {
            loop()
          } else {
            that.logger.log('小车到达指定位置')
            that.stopMoving()
            resolve('success')
          }
        }, 250)
      }
      loop()
    })
  }

  moveToLinear(linear: number) {
    const that = this
    if (linear === 0) {
      return Promise.resolve(true)
    }

    // 计算欧几里得距离
    function calculateDistance(start: Position, current: Position): number {
      const dx = current.x - start.x
      const dy = current.y - start.y
      return Math.sqrt(dx * dx + dy * dy)
    }

    const startPosition = that.odomToBaseFootprint.translation
    let linearSpeed = 0
    if (linear < 0) {
      linearSpeed = -0.3
    } else {
      linearSpeed = 0.3
    }

    function checkPosition() {
      const currentPostion = that.odomToBaseFootprint.translation
      const distance = calculateDistance(startPosition, currentPostion)
      if (distance < Math.abs(linear)) {
        that.startMoving({ linearSpeed, angularSpeed: 0 })
        return false
      } else {
        return true
      }
    }

    return new Promise((resolve, reject) => {
      function loop() {
        setTimeout(() => {
          if (!checkPosition()) {
            loop()
          } else {
            that.logger.log('到达目标位置')
            that.stopMoving()
            resolve('success')
          }
        }, 250)
      }
      loop()
    })
  }

  handleMoveCommand(command: string) {
    this.logger.log('--- start handle move command ---')
    this.logger.debug('command:', command)
  }
}
