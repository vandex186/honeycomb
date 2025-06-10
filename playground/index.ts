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
  visibility: 'undiscovered' | 'discovered' | 'visible' = 'undiscovered'
  radialDistance?: number
}

class VerticalHex extends defineHex({ 
  dimensions: 30, 
  origin: 'topLeft',
  orientation: Orientation.FLAT 
}) {
  custom = 'test'
  transformedCoordinates?: { x: number; y: number }
  visibility: 'undiscovered' | 'discovered' | 'visible' = 'undiscovered'
  radialDistance?: number
}

// Grid state
let mainGrid: Grid<CustomHex | VerticalHex>
let numberGrid: Grid<CustomHex | VerticalHex>
let terrainGrid: Grid<CustomHex | VerticalHex>
let visibilityGrid: Grid<CustomHex | VerticalHex>
let currentView = 'castle'
let showCoordinates = false
let showVisibility = false

// New Castle terrain type
const CASTLE = {
  type: 'Castle',
  passable: false,
  opaque: true,
}

function createGrid(options: GridOptions) {
  const HexClass = options.orientation === Orientation.POINTY ? CustomHex : VerticalHex
  return new Grid(HexClass, rectangle({ width: options.width, height: options.height }))
}

// Calculate radial distance from castle hex (index 36)
function calculateRadialDistance(fromIndex: number, toIndex: number, gridWidth: number): number {
  // Convert linear index to grid coordinates
  const fromRow = Math.floor(fromIndex / gridWidth)
  const fromCol = fromIndex % gridWidth
  const toRow = Math.floor(toIndex / gridWidth)
  const toCol = toIndex % gridWidth
  
  // Convert to axial coordinates (for pointy-top hexes)
  const fromQ = fromCol - Math.floor(fromRow / 2)
  const fromR = fromRow
  const toQ = toCol - Math.floor(toRow / 2)
  const toR = toRow
  
  // Calculate cube coordinates
  const fromS = -fromQ - fromR
  const toS = -toQ - toR
  
  // Calculate distance using cube coordinates
  return Math.max(
    Math.abs(fromQ - toQ),
    Math.abs(fromR - toR),
    Math.abs(fromS - toS)
  )
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
        width: 8,
        height: 8
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

  mainGrid = createGrid(gridOptions)
  numberGrid = createGrid(gridOptions)
  terrainGrid = createGrid(gridOptions)
  visibilityGrid = createGrid(gridOptions)
  
  // Calculate radial distances for chart view
  if (view === 'chart') {
    const castleIndex = 36
    let index = 0
    for (const hex of mainGrid) {
      const customHex = hex as CustomHex | VerticalHex
      customHex.radialDistance = calculateRadialDistance(index, castleIndex, gridOptions.width)
      index++
    }
  }
  
  // Initialize visibility states randomly for demo
  let index = 0
  for (const hex of visibilityGrid) {
    const rand = Math.random()
    if (rand < 0.3) hex.visibility = 'undiscovered'
    else if (rand < 0.7) hex.visibility = 'discovered'
    else hex.visibility = 'visible'
    index++
  }
  
  renderGrids(view)
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

function getTerrainType(index: number) {
  // Special cases for specific hexes
  if (index === 36) {
    return CASTLE
  }
  
  // Specific field hexes: 27, 28, 37, 44, 43, 35
  if ([27, 28, 37, 44, 43, 35].includes(index)) {
    return FIELD
  }
  
  const terrains = [FIELD, WATER, TREES, BUILDING, ROAD]
  return terrains[index % terrains.length]
}

function getTerrainColor(terrain: any): string {
  switch(terrain.type) {
    case 'Building': return '#616161'
    case 'Road': return '#181818'
    case 'Trees': return '#11580f'
    case 'Field': return '#009221'  // New green color for fields
    case 'Water': return '#0d73c9'
    case 'Castle': return '#ff0000'  // Red color for castle
    default: return '#ffffff'
  }
}

function renderGrids(view: string) {
  const container = document.getElementById('container')
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

  const gridWidth = mainGrid.pixelWidth
  const gridHeight = mainGrid.pixelHeight
  const xOffset = (window.innerWidth - gridWidth) / 2
  const yOffset = (window.innerHeight - gridHeight) / 2

  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')
  svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
  svg.classList.add('hex-grid')
  svg.style.transform = 'matrix3d(1, 0, 0, 0, 0, 0.4, 0, -0.002, 0, 0, 1, 0, 0, 0, 0, 1)'
  container?.appendChild(svg)

  // Main grid group (with 3D transformation)
  const mainGridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  mainGridGroup.setAttribute('transform', `translate(${xOffset}, ${yOffset})`)
  mainGridGroup.setAttribute('id', 'main-grid')
  svg.appendChild(mainGridGroup)

  // Number grid group (with 3D transformation)
  const numberGridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  numberGridGroup.setAttribute('transform', `translate(${xOffset}, ${yOffset})`)
  numberGridGroup.setAttribute('id', 'number-grid')
  svg.appendChild(numberGridGroup)

  // Terrain grid group (NO transformation - face to camera)
  const terrainGridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  terrainGridGroup.setAttribute('transform', `translate(${xOffset}, ${yOffset})`)
  terrainGridGroup.setAttribute('id', 'terrain-grid')
  terrainGridGroup.style.display = (view === 'chart' && showCoordinates) ? 'block' : 'none'
  svg.appendChild(terrainGridGroup)

  // Visibility grid group (with 3D transformation)
  const visibilityGridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  visibilityGridGroup.setAttribute('transform', `translate(${xOffset}, ${yOffset})`)
  visibilityGridGroup.setAttribute('id', 'visibility-grid')
  visibilityGridGroup.style.display = (view === 'chart' && showVisibility) ? 'block' : 'none'
  svg.appendChild(visibilityGridGroup)

  // Render main grid (terrain background colors only)
  let index = 0
  for (const hex of mainGrid) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    const points = hex.corners.map(({ x, y }) => `${x},${y}`).join(' ')
    
    polygon.setAttribute('points', points)
    
    // Add terrain background color for chart view
    if (view === 'chart') {
      const terrainType = getTerrainType(index)
      const terrainColor = getTerrainColor(terrainType)
      polygon.style.fill = terrainColor
    } else {
      polygon.style.fill = 'rgba(255, 255, 255, 0.1)'
    }
    
    polygon.style.stroke = 'rgba(255, 255, 255, 0.5)'
    polygon.style.strokeWidth = '1'
    
    group.appendChild(polygon)
    mainGridGroup.appendChild(group)
    index++
  }

  // Render number grid (numbers only) - ALWAYS VISIBLE
  let numberIndex = 0
  for (const hex of numberGrid) {
    const customHex = hex as CustomHex | VerticalHex
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    
    // Use radial distance for chart view, regular index for others
    if (view === 'chart' && customHex.radialDistance !== undefined) {
      text.textContent = `${customHex.radialDistance}`
    } else {
      text.textContent = `${numberIndex}`
    }
    
    text.setAttribute('x', hex.x.toString())
    text.setAttribute('y', hex.y.toString())
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('dominant-baseline', 'central')
    text.style.fill = 'white'
    text.style.fontSize = '1.5rem'
    text.style.opacity = '0.8'
    text.style.userSelect = 'none'
    text.style.pointerEvents = 'none'
    
    numberGridGroup.appendChild(text)
    numberIndex++
  }

  // Render terrain grid (face-to-camera, no transformation)
  if (view === 'chart') {
    let terrainIndex = 0
    for (const hex of terrainGrid) {
      // Create face-to-camera text with terrain emoji
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      const terrainType = getTerrainType(terrainIndex)
      text.textContent = getTerrainEmoji(terrainType)
      text.setAttribute('x', hex.x.toString())
      text.setAttribute('y', hex.y.toString())
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('dominant-baseline', 'central')
      text.classList.add('terrain-text')
      
      terrainGridGroup.appendChild(text)
      terrainIndex++
    }
  }

  // Render visibility grid
  if (view === 'chart') {
    for (const hex of visibilityGrid) {
      const visHex = hex as CustomHex | VerticalHex
      
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      const points = hex.corners.map(({ x, y }) => `${x},${y}`).join(' ')
      
      polygon.setAttribute('points', points)
      
      if (visHex.visibility === 'undiscovered') {
        polygon.classList.add('visibility-undiscovered')
      } else if (visHex.visibility === 'discovered') {
        polygon.classList.add('visibility-discovered')
      } else {
        polygon.classList.add('visibility-visible')
      }
      
      visibilityGridGroup.appendChild(polygon)
    }
  }

  setupInteractions(svg, mainGridGroup, gridWidth, gridHeight)
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
    
    const mainGridGroup = document.getElementById('main-grid')
    const numberGridGroup = document.getElementById('number-grid')
    const terrainGridGroup = document.getElementById('terrain-grid')
    const visibilityGridGroup = document.getElementById('visibility-grid')
    
    if (mainGridGroup) {
      mainGridGroup.setAttribute('transform', `translate(${newXOffset}, ${newYOffset})`)
    }
    if (numberGridGroup) {
      numberGridGroup.setAttribute('transform', `translate(${newXOffset}, ${newYOffset})`)
    }
    if (terrainGridGroup) {
      terrainGridGroup.setAttribute('transform', `translate(${newXOffset}, ${newYOffset})`)
    }
    if (visibilityGridGroup) {
      visibilityGridGroup.setAttribute('transform', `translate(${newXOffset}, ${newYOffset})`)
    }
    
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
  })
}

// Setup button functionality
document.addEventListener('DOMContentLoaded', () => {
  const coordinatesToggle = document.getElementById('coordinates-toggle') as HTMLButtonElement
  const visibilityToggle = document.getElementById('visibility-toggle') as HTMLButtonElement
  
  if (coordinatesToggle) {
    coordinatesToggle.addEventListener('click', () => {
      showCoordinates = !showCoordinates
      coordinatesToggle.style.background = showCoordinates ? 'rgba(255, 255, 255, 0.3)' : 'transparent'
      const terrainGridGroup = document.getElementById('terrain-grid')
      if (terrainGridGroup) {
        terrainGridGroup.style.display = (currentView === 'chart' && showCoordinates) ? 'block' : 'none'
      }
    })
  }

  if (visibilityToggle) {
    visibilityToggle.addEventListener('click', () => {
      showVisibility = !showVisibility
      visibilityToggle.style.background = showVisibility ? 'rgba(255, 255, 255, 0.3)' : 'transparent'
      const visibilityGridGroup = document.getElementById('visibility-grid')
      if (visibilityGridGroup) {
        visibilityGridGroup.style.display = (currentView === 'chart' && showVisibility) ? 'block' : 'none'
      }
    })
  }
})

document.querySelectorAll('.nav-button').forEach(button => {
  const handleClick = (e: Event) => {
    e.preventDefault()
    const target = e.target as HTMLElement
    const view = target.dataset.view
    if (view) {
      document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'))
      target.classList.add('active')
      currentView = view
      // Reset states when switching views
      showCoordinates = false
      showVisibility = false
      // Reset button states
      const coordinatesToggle = document.getElementById('coordinates-toggle') as HTMLButtonElement
      const visibilityToggle = document.getElementById('visibility-toggle') as HTMLButtonElement
      if (coordinatesToggle) coordinatesToggle.style.background = 'transparent'
      if (visibilityToggle) visibilityToggle.style.background = 'transparent'
      initializeGrid(view)
    }
  }

  button.addEventListener('click', handleClick)
  button.addEventListener('touchend', handleClick)
})

initializeGrid('castle')