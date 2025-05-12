import { defineHex, Grid, rectangle } from '../src'

class CustomHex extends defineHex({ dimensions: 30, origin: 'topLeft' }) {
  custom = 'test'
  transformedCoordinates?: { x: number; y: number }
}

const grid = new Grid(CustomHex, rectangle({ width: 7, height: 7 }))

const container = document.getElementById('container')
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

// Calculate grid dimensions
const gridWidth = grid.pixelWidth
const gridHeight = grid.pixelHeight
const xOffset = (300 - gridWidth) / 2 // Center horizontally
const yOffset = (300 - gridHeight) / 2 // Center vertically

svg.setAttribute('viewBox', `0 0 300 300`)
svg.classList.add('hex-grid')
container?.appendChild(svg)

// Initial render
for (const hex of grid) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
  
  // Apply offset to center the grid
  const points = hex.corners
    .map(({ x, y }) => `${x + xOffset},${y + yOffset}`)
    .join(' ')
  
  polygon.setAttribute('points', points)
  
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  text.textContent = `${hex.q},${hex.r}`
  text.setAttribute('x', (hex.x + xOffset).toString())
  text.setAttribute('y', (hex.y + yOffset).toString())
  text.setAttribute('text-anchor', 'middle')
  text.setAttribute('dominant-baseline', 'central')
  
  group.appendChild(polygon)
  group.appendChild(text)
  svg.appendChild(group)
}

// Camera control state
const cameraState = {
  matrix: [1, 0, 0, 0, 0, 1, 0, -0.002, 0, 0, 1, 0, 0, 0, 0, 1],
  isDragging: false,
  lastX: 0,
  lastY: 0,
  lastDistance: 0
}

function updateTransform() {
  svg.style.transform = `matrix3d(${cameraState.matrix.join(',')})`
}

function