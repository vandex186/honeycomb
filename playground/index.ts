import { defineHex, Grid, rectangle } from '../src'

class CustomHex extends defineHex({ dimensions: 30, origin: 'topLeft' }) {
  custom = 'test'
  transformedCoordinates?: { x: number; y: number }
}

const grid = new Grid(CustomHex, rectangle({ width: 7, height: 7 }))

const container = document.getElementById('container')
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
svg.setAttribute('viewBox', '0 0 300 300')
container?.appendChild(svg)

function applyMatrix3DTransform(x: number, y: number): { x: number; y: number } {
  // Matrix3D values from the example: matrix3d(1, 0, 0, 0, 0, 1, 0, -0.002, 0, 0, 1, 0, 0, 0, 0, 1)
  const matrix = [
    1, 0, 0, 0,
    0, 1, 0, -0.002,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]
  
  // Apply transformation
  const transformedX = x * matrix[0] + y * matrix[4] + matrix[12]
  const transformedY = x * matrix[1] + y * matrix[5] + matrix[13]
  
  return { x: transformedX, y: transformedY }
}

function updateHexCoordinates() {
  for (const hex of grid) {
    // Store original center coordinates
    const originalX = hex.x
    const originalY = hex.y
    
    // Apply 3D transform and store result
    hex.transformedCoordinates = applyMatrix3DTransform(originalX, originalY)
    
    // Update visual position
    const group = svg.children[grid.toArray().indexOf(hex)]
    if (group) {
      const transform = `translate(${hex.transformedCoordinates.x - originalX} ${hex.transformedCoordinates.y - originalY})`
      group.setAttribute('transform', transform)
    }
  }
}

// Initial render
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

// Apply initial 3D transform
updateHexCoordinates()

// Prevent default touch behaviors
document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false })
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })