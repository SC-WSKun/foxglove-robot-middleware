export const action = ['subscribeTopic', 'movingPrepare']

export type Move = {
  angularSpeed: number
  linearSpeed: number
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
