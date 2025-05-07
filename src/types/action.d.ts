 type RobotSpeed = {
  angularSpeed: number
  linearSpeed: number
}

 type Move = {
  angular: number
  linear: number
}

 type TargetPosition = {
  angular: number
  linear: number
}

 type Position = {
  x: number
  y: number
  z: number
}

 type Quaternion = {
  w: number
  x: number
  y: number
  z: number
}

 type NavTranslation = {
  x: number
  y: number
  z: number
} | null

 type NavRotation = {
  x: number
  y: number
  z: number
  w: number
} | null
