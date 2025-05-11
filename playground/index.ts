import { defineHex, Grid, rectangle } from '../src'

class CustomHex extends defineHex({ dimensions: 30, origin: 'topLeft' }) {
  custom = 'test'
  transformedCoordinates?: { x: number; y: number }
}

const grid = new Grid(CustomHex, rectangle({ width: 7, height: 7 }))

const container = document.getElementById('container')
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
svg.setAttribute('viewBox', '0 0 300 300')
svg.classList.add('hex-grid') // Added class for the SVG
container?.appendChild(svg)

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

function handleStart(x: number, y: number) {
  cameraState.isDragging = true
  cameraState.lastX = x
  cameraState.lastY = y
}

function handleMove(x: number, y: number) {
  if (!cameraState.isDragging) return

  const deltaX = (x - cameraState.lastX) * 0.5
  const deltaY = (y - cameraState.lastY) * 0.5

  // Update translation (elements 12 and 13 in the matrix)
  cameraState.matrix[12] += deltaX
  cameraState.matrix[13] += deltaY

  updateTransform()

  cameraState.lastX = x
  cameraState.lastY = y
}

function handlePinch(e: TouchEvent) {
  if (e.touches.length !== 2) return

  const touch1 = e.touches[0]
  const touch2 = e.touches[1]
  const distance = Math.hypot(
    touch2.clientX - touch1.clientX,
    touch2.clientY - touch1.clientY
  )

  if (cameraState.lastDistance) {
    const delta = (distance - cameraState.lastDistance) * 0.01
    // Update scale (elements 0 and 5 in the matrix)
    cameraState.matrix[0] = Math.max(0.5, Math.min(2, cameraState.matrix[0] + delta))
    cameraState.matrix[5] = Math.max(0.5, Math.min(2, cameraState.matrix[5] + delta))
    updateTransform()
  }

  cameraState.lastDistance = distance
}

function handleEnd() {
  cameraState.isDragging = false
  cameraState.lastDistance = 0
}

// Touch events
svg.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    handleStart(e.touches[0].clientX, e.touches[0].clientY)
  }
}, { passive: false })

svg.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1) {
    handleMove(e.touches[0].clientX, e.touches[0].clientY)
  } else if (e.touches.length === 2) {
    handlePinch(e)
  }
}, { passive: false })

svg.addEventListener('touchend', handleEnd, { passive: false })
svg.addEventListener('touchcancel', handleEnd, { passive: false })

// Mouse events
svg.addEventListener('mousedown', (e) => {
  handleStart(e.clientX, e.clientY)
})

svg.addEventListener('mousemove', (e) => {
  handleMove(e.clientX, e.clientY)
})

svg.addEventListener('mouseup', handleEnd)
svg.addEventListener('mouseleave', handleEnd)

// Prevent default touch behaviors
document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false })
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

// Prevent zooming on double tap
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false })