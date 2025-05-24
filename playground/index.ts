import { defineHex, Grid, rectangle } from '../src'
import { Orientation } from '../src/hex/types'
import { BUILDING, FIELD, ROAD, TREES, WATER } from './terrain'

interface GridOptions {
  orientation: Orientation
  width: number
  height: number
}

class CustomHex extends defineHex({ 
  dimensions: 30, 
  origin: 'topLeft',
  orientation: Orientation.POINTY 
}) {
  terrain = FIELD
  transformedCoordinates?: { x: number; y: number }
}

let currentGrid: Grid<CustomHex>
let currentView = 'castle'

function createGrid(options: GridOptions) {
  const grid = new Grid(CustomHex, rectangle({ width: options.width, height: options.height }))
  
  grid.forEach(hex => {
    const { q, r } = hex
    
    // Center castle with buildings
    if ((q === 3 && r === 3) || (q === 4 && r === 3) || (q === 3 && r === 4)) {
      hex.terrain = BUILDING
    }
    // Forest ring around castle
    else if ((q === 2 && r === 3) || (q === 2 && r === 4) || 
             (q === 3 && r === 2) || (q === 4 && r === 2) ||
             (q === 5 && r === 3) || (q === 4 && r === 4)) {
      hex.terrain = TREES
    }
    // Water area
    else if ((q >= 5 && r <= 2) || (q >= 6 && r <= 3)) {
      hex.terrain = WATER
    }
    // Roads
    else if ((q <= 1 && r >= 2 && r <= 4)) {
      hex.terrain = ROAD
    }
    // Additional trees
    else if ((q >= 3 && r >= 5) || (q === 2 && r === 5)) {
      hex.terrain = TREES
    }
    // Fields for remaining hexes
    else {
      hex.terrain = FIELD
    }
  })
  
  return grid
}

function initializeGrid(view: string) {
  document.body.setAttribute('data-view', view)

  const container = document.getElementById('container')
  if (container) {
    container.innerHTML = ''
  }

  if (view === 'hero') {
    if (container) {
      container.innerHTML = '<div style="color: white; font-size: 2rem;">Hero View Coming Soon</div>'
    }
    return
  }

  const gridOptions: GridOptions = {
    orientation: Orientation.POINTY,
    width: 8,
    height: 7
  }

  currentGrid = createGrid(gridOptions)
  renderGrid(currentGrid)
}

function renderGrid(grid: Grid<CustomHex>) {
  const container = document.getElementById('container')
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

  const gridWidth = grid.pixelWidth
  const gridHeight = grid.pixelHeight
  const xOffset = (window.innerWidth - gridWidth) / 2
  const yOffset = (window.innerHeight - gridHeight) / 2

  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')
  svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
  svg.classList.add('hex-grid')
  container?.appendChild(svg)

  const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  gridGroup.setAttribute('transform', `translate(${xOffset}, ${yOffset})`)
  svg.appendChild(gridGroup)

  for (const hex of grid) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    const points = hex.corners.map(({ x, y }) => `${x},${y}`).join(' ')
    
    polygon.setAttribute('points', points)
    polygon.setAttribute('fill', `#${hex.terrain.color.toString(16).padStart(6, '0')}`)
    polygon.setAttribute('stroke', '#333')
    polygon.setAttribute('stroke-width', '1')
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    text.textContent = `${hex.q},${hex.r}`
    text.setAttribute('x', hex.x.toString())
    text.setAttribute('y', hex.y.toString())
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('dominant-baseline', 'central')
    text.setAttribute('fill', 'white')
    text.setAttribute('font-size', '8')
    
    group.appendChild(polygon)
    group.appendChild(text)
    gridGroup.appendChild(group)
  }

  setupInteractions(svg, gridGroup, gridWidth, gridHeight)
}

function setupInteractions(svg: SVGElement, gridGroup: SVGGElement, gridWidth: number, gridHeight: number) {
  const cameraState = {
    matrix: [1, 0, 0, 0, 0, 0.4, 0, -0.002, 0, 0, 1, 0, 0, 0, 0, 1],
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

  svg.addEventListener('touchstart', (e) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY)
    }
  })

  svg.addEventListener('touchmove', (e) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY)
    } else if (e.touches.length === 2) {
      handlePinch(e)
    }
  })

  svg.addEventListener('touchend', (e) => {
    e.preventDefault()
    handleEnd()
  })

  svg.addEventListener('touchcancel', (e) => {
    e.preventDefault()
    handleEnd()
  })

  svg.addEventListener('mousedown', (e) => {
    handleStart(e.clientX, e.clientY)
  })

  svg.addEventListener('mousemove', (e) => {
    handleMove(e.clientX, e.clientY)
  })

  svg.addEventListener('mouseup', handleEnd)
  svg.addEventListener('mouseleave', handleEnd)

  window.addEventListener('resize', () => {
    const newXOffset = (window.innerWidth - gridWidth) / 2
    const newYOffset = (window.innerHeight - gridHeight) / 2
    gridGroup.setAttribute('transform', `translate(${newXOffset}, ${newYOffset})`)
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
  })
}

document.querySelectorAll('.nav-button').forEach(button => {
  const handleClick = (e: Event) => {
    e.preventDefault()
    const target = e.target as HTMLElement
    const view = target.dataset.view
    if (view) {
      document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'))
      target.classList.add('active')
      currentView = view
      initializeGrid(view)
    }
  }

  button.addEventListener('click', handleClick)
  button.addEventListener('touchend', handleClick)
})

initializeGrid('castle')