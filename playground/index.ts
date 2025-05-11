import { defineHex, Grid, rectangle } from '../src'

class CustomHex extends defineHex({ dimensions: 30, origin: 'topLeft' }) {
  custom = 'test'
}

const grid = new Grid(CustomHex, rectangle({ width: 7, height: 7 }))

const container = document.getElementById('container')
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
svg.setAttribute('viewBox', '0 0 300 300')
container?.appendChild(svg)

for (const hex of grid) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
  const points = hex.corners.map(({ x, y }) => `${x},${y}`).join(' ')
  
  polygon.setAttribute('points', points)
  
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  text.textContent = `${hex.q},${hex.r}`
  text.setAttribute('x', hex.x.toString())
  text.setAttribute('y', hex.y.toString())
  text.setAttribute('text-anchor', 'middle')
  text.setAttribute('dominant-baseline', 'central')
  
  group.appendChild(polygon)
  group.appendChild(text)
  svg.appendChild(group)
}

// Prevent default touch behaviors
document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false })
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })