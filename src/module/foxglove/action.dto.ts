import { NavTranslation, NavRotation } from 'src/typing/action'
export class ActionDto {
  action: string
  data: string
}

export class NavigationDto {
  position: NavTranslation
  orientation: NavRotation
  frame_id: string
}

export class LabelDto {
  label_name: string
  frame_id: string
}
