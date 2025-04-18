import { Injectable, Logger } from '@nestjs/common'
import { FoxgloveService } from './foxglove.service'
import to from 'await-to-js'
import { NavRotation, NavTranslation } from 'src/types/action'

@Injectable()
export class NavigationService {
  private logger = new Logger('NavigationService')
  private goalSeq: number = 0 // 导航点发布序号
  constructor(private foxgloveService: FoxgloveService) {
    const that = this
    function subInitTopic() {
      if (that.foxgloveService.connected) {
        that.advNavigationTopic()
        // that.advLabelNavigationTopic()
      } else {
        setTimeout(() => {
          subInitTopic()
        }, 1000)
      }
    }
    subInitTopic()
  }

  // 发布导航Topic
  async advNavigationTopic() {
    // if (this.panzoomIns) this.pzRemoveListener()
    // this.navAddListener()
    const [err, result] = await to(
      this.foxgloveService.advertiseTopic({
        encoding: 'cdr',
        schema:
          '# A Pose with reference coordinate frame and timestamp\n\nstd_msgs/Header header\nPose pose\n\n================================================================================\nMSG: geometry_msgs/Pose\n# A representation of pose in free space, composed of position and orientation.\n\nPoint position\nQuaternion orientation\n\n================================================================================\nMSG: geometry_msgs/Point\n# This contains the position of a point in free space\nfloat64 x\nfloat64 y\nfloat64 z\n\n================================================================================\nMSG: geometry_msgs/Quaternion\n# This represents an orientation in free space in quaternion form.\n\nfloat64 x 0\nfloat64 y 0\nfloat64 z 0\nfloat64 w 1\n\n================================================================================\nMSG: std_msgs/Header\n# Standard metadata for higher-level stamped data types.\n# This is generally used to communicate timestamped data\n# in a particular coordinate frame.\n\n# Two-integer timestamp that is expressed as seconds and nanoseconds.\nbuiltin_interfaces/Time stamp\n\n# Transform frame with which this data is associated.\nstring frame_id\n\n================================================================================\nMSG: builtin_interfaces/Time\n# This message communicates ROS Time defined here:\n# https://design.ros2.org/articles/clock_and_time.html\n\n# The seconds component, valid over all int32 values.\nint32 sec\n\n# The nanoseconds component, valid in the range [0, 1e9).\nuint32 nanosec\n',
        schemaEncoding: 'ros2msg',
        schemaName: 'geometry_msgs/msg/PoseStamped',
        topic: '/goal_pose',
      }),
    )
    if (err) {
      this.logger.error(`advertise navigation topic error:${err}`)
    } else {
      this.logger.log(`advertise navigation topic success:${result}`)
    }
  }

  // 发布导航信息
  async publishNavigation(
    position: NavTranslation,
    orientation: NavRotation = null,
    frame_id: string = 'map',
  ) {
    await this.foxgloveService.publishMessage('/goal_pose', {
      header: {
        seq: this.goalSeq++,
        stamp: {
          secs: Math.floor(Date.now() / 1000),
          nsecs: (Date.now() / 1000) * 1000000,
        },
        frame_id,
      },
      pose: {
        position,
        orientation,
      },
    })
  }

  // 发布标签导航Topic
  async advLabelNavigationTopic() {
    // if (this.panzoomIns) this.pzRemoveListener()
    // this.navAddListener()
    const [err, result] = await to(
      this.foxgloveService.advertiseTopic({
        encoding: 'cdr',
        schema:
          'std_msgs/Header header\nstring label_name\n================================================================================\nMSG: std_msgs/Header\n# Standard metadata for higher-level stamped data types.\n# This is generally used to communicate timestamped data\n# in a particular coordinate frame.\n\n# Two-integer timestamp that is expressed as seconds and nanoseconds.\nbuiltin_interfaces/Time stamp\n\n# Transform frame with which this data is associated.\nstring frame_id\n\n================================================================================\nMSG: builtin_interfaces/Time\n# This message communicates ROS Time defined here:\n# https://design.ros2.org/articles/clock_and_time.html\n\n# The seconds component, valid over all int32 values.\nint32 sec\n\n# The nanoseconds component, valid in the range [0, 1e9).\nuint32 nanosec\n',
        schemaEncoding: 'ros2msg',
        schemaName: 'goal_pose_label/msg/LabelGoalPose',
        topic: '/label_manager/label_goal_pose',
      }),
    )
    if (err) {
      this.logger.error(`advertise navigation topic error:${err}`)
    } else {
      this.logger.log(`advertise navigation topic success:${result}`)
    }
  }

  /**
   * 进行标签导航
   * 这里frame_id恒为map
   * @param label_name
   * @returns
   */
  async publishMarkingNavigation(label_name: string) {
    this.logger.log('--- start navigation to label ---')
    label_name = new TextEncoder().encode(label_name).toString()
    const [err, res] = await to(
      this.foxgloveService.callService('/label_manager/label_goal_pose', {
        header: {
          seq: this.goalSeq++,
          stamp: {
            secs: Math.floor(Date.now() / 1000),
            nsecs: (Date.now() / 1000) * 1000000,
          },
          frame_id: 'map',
        },
        label_name,
      }),
    )
    if (err || res.result !== true) {
      this.logger.error(`navigate to label fail:${err}`)
      return Promise.reject(err)
    } else {
      return Promise.resolve(res)
    }
  }
}
