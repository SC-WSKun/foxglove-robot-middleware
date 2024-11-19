export const action = ['subscribeTopic', 'movingPrepare']

export type RobotSpeed = {
  angularSpeed: number
  linearSpeed: number
}

export type Move = {
  angular: number
  linear: number
}

export type TargetPosition = {
  angular: number
  linear: number
}

export type Position = {
  x: number
  y: number
  z: number
}

export type Quaternion = {
  w: number
  x: number
  y: number
  z: number
}

export type NavTranslation = {
  x: number
  y: number
  z: number
} | null

export type NavRotation = {
  x: number
  y: number
  z: number
  w: number
} | null
