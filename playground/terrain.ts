import { HexType } from './types'

export const FIELD: HexType = {
  type: 'field',
  color: 0xFFEB3B, // Yellow
  passable: true,
  buildable: true
}

export const WATER: HexType = {
  type: 'water',
  color: 0x2196F3, // Blue
  passable: false,
  buildable: false
}

export const TREES: HexType = {
  type: 'trees',
  color: 0x4CAF50, // Green
  passable: false,
  buildable: true
}

export const BUILDING: HexType = {
  type: 'building',
  color: 0xE91E63, // Ruby
  passable: false,
  buildable: false
}

export const ROAD: HexType = {
  type: 'road',
  color: 0x9E9E9E, // Gray
  passable: true,
  buildable: false
}