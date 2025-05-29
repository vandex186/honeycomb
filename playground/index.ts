import { defineHex, Grid, rectangle } from '../src'
import { Orientation } from '../src/hex/types'
import { BUILDING, FIELD, ROAD, TREES, WATER } from '../examples/line-of-sight/terrain'

interface GridOptions {
  orientation: Orientation
  width: number
  height: number
}

class CustomHex extends defineHex({ dimensions: 30, origin: 'topLeft' }) {
  custom = 'test'
  transformedCoordinates?: { x: number; y: number }
}

class VerticalHex extends defineHex({ 
  dimensions: 30, 
  origin: 'topLeft',
  orientation: Orientation.FLAT 
}) {
  custom = 'test'
  transformedCoordinates?: { x: number; y: number }
}

// Grid state
let currentGrid: Grid<CustomHex | VerticalHex>
let currentView = 'castle'

function createGrid(options: GridOptions) {
  const HexClass = options.orientation === Orientation.POINTY ? CustomHex : VerticalHex
  return new Grid(HexClass, rectangle({ width: options.width, height: options.height }))
}

function initializeGrid(view: string) {
  document.body.setAttribute('data-view', view)
  const container = document.getElementById('container')
  if (container) {
    container.innerHTML = ''
  }

  let gridOptions: GridOptions

  switch (view) {
    case 'dungeon':
      gridOptions = {
        orientation: Orientation.FLAT,
        width: 7,
        height: 7
      }
      break
    case 'chart':
      gridOptions = {
        orientation: Orientation.POINTY,
        width: 12,
        height: 12
      }
      break
    case 'castle':
    default:
      gridOptions = {
        orientation: Orientation.POINTY,
        width: 7,
        height: 7
      }
      break
  }

  if (view === 'hero') {
    if (container) {
      container.innerHTML = '<div style="color: white; font-size: 2rem;">Hero View Coming Soon</div>'
    }
    return
  }

  currentGrid = createGrid(gridOptions)
  renderGrid(currentGrid, view)
}

const CASTLE = {
  type: 'Castle',
  passable: false,
  opaque: true,
}

function getTerrainEmoji(terrain: any) {
  switch(terrain.type) {
    case 'Water': return '💧'
    case 'Field': return '🌾'
    case 'Road': return '🪨'
    case 'Trees': return '🌳'
    case 'Building': return '🏠'
    case 'Castle': return '🏰'
    default: return ''
  }
}

function getTerrainType(index: number, q: number, r: number) {
  // Center hex becomes castle
  if (q === 6 && r === 6) {
    return CASTLE
  }
  
  const terrains = [FIELD, WATER, TREES, BUILDING, ROAD]
  return terrains[index % terrains.length]
}

function calculateFogOpacity(q: number, r: number, centerQ: number, centerR: number): number {
  const distance = Math.sqrt(Math.pow(q - centerQ, 2) + Math.pow(r - centerR, 2))
  if (distance <= 2) return 0 // Clear visibility
  if (distance <= 4) return 0.5 // Partial fog
  return 0.8 // Heavy fog
}

function renderGrid(grid: Grid<CustomHex | VerticalHex>, view: string) {
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
  svg.style.transform = 'matrix3d(1, 0, 0, 0, 0, 0.4, 0, -0.002, 0, 0, 1, 0, 0, 0, 0, 1)'
  container?.appendChild(svg)

  const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  gridGroup.setAttribute('transform', `translate(${xOffset}, ${yOffset})`)
  svg.appendChild(gridGroup)

  let index = 0
  for (const hex of grid) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    const points = hex.corners.map(({ x, y }) => `${x},${y}`).join(' ')
    polygon.setAttribute('points', points)
    
    if (view === 'chart') {
      const fogOpacity = calculateFogOpacity(hex.q, hex.r, 6, 6)
      polygon.style.fill = `rgba(0, 0, 0, ${fogOpacity})`
    }
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    if (view === 'chart') {
      const terrain = getTerrainType(index, hex.q, hex.r)
      const cellNumber = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
      cellNumber.textContent = `${index}`
      cellNumber.setAttribute('x', hex.x.toString())
      cellNumber.setAttribute('dy', '-1.2em')
      cellNumber.classList.add('cell-number')
      
      const terrainEmoji = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
      terrainEmoji.textContent = getTerrainEmoji(terrain)
      terrainEmoji.setAttribute('x', hex.x.toString())
      terrainEmoji.setAttribute('dy', '1.5em')
      
      text.appendChild(cellNumber)
      text.appendChild(terrainEmoji)
      text.setAttribute('y', hex.y.toString())
    } else {
      text.textContent = `${hex.q},${hex.r}`
      text.setAttribute('y', hex.y.toString())
    }
    text.setAttribute('x', hex.x.toString())
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('dominant-baseline', 'central')
    
    group.appendChild(polygon)
    group.appendChild(text)
    gridGroup.appendChild(group)
    index++
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