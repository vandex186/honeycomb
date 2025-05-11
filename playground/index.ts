import { defineHex, Grid, rectangle } from '../src'

class CustomHex extends defineHex({ dimensions: 30, origin: 'topLeft' }) {
  custom = 'test'
}

const grid = new Grid(CustomHex, rectangle({ width: 10, height: 7 }))

const container = document.getElementById('container')
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
svg.setAttribute('width', '100%')
svg.setAttribute('height', '100%')
container?.appendChild(svg)

for (const hex of grid) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
  const points = hex.corners.map(({ x, y }) => `${x},${y}`).join(' ')
  
  polygon.setAttribute('points', points)
  polygon.setAttribute('fill', '#fff')
  polygon.setAttribute('stroke', '#999')
  polygon.setAttribute('stroke-width', '1')
  
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  text.textContent = `${hex.q},${hex.r},${hex.s}`
  text.setAttribute('x', hex.x.toString())
  text.setAttribute('y', hex.y.toString())
  text.setAttribute('font-size', (hex.width * 0.25).toString())
  text.setAttribute('text-anchor', 'middle')
  text.setAttribute('dominant-baseline', 'central')
  
  group.appendChild(polygon)
  group.appendChild(text)
  svg.appendChild(group)
}