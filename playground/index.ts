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

// Calculate radial distance from castle hex (center)
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
    container.innerHTML = '' // Clear previous content
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
        width: 11,  // Increased to accommodate 5 rings
        height: 11  // Increased to accommodate 5 rings
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
  
  // Calculate radial distances and initialize visibility for chart view
  if (view === 'chart') {
    // Castle is now at the center of the 11x11 grid
    const castleIndex = Math.floor((gridOptions.width * gridOptions.height) / 2) // Center hex
    let index = 0
    for (const hex of mainGrid) {
      const customHex = hex as CustomHex | VerticalHex
      customHex.radialDistance = calculateRadialDistance(index, castleIndex, gridOptions.width)
      
      // Set visibility based on ring distance
      if (customHex.radialDistance === 5) {
        customHex.visibility = 'undiscovered'  // All 5 ring - undiscoverable
      } else if (customHex.radialDistance === 3 || customHex.radialDistance === 4) {
        customHex.visibility = 'discovered'    // All 4 and 3 ring - discoverable
      } else {
        customHex.visibility = 'visible'       // Other rings - visible
      }
      
      index++
    }
  }
  
  renderGrid(view)
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

function getTerrainType(index: number, radialDistance?: number) {
  // For chart view, use ring-based terrain assignment
  if (radialDistance !== undefined) {
    switch (radialDistance) {
      case 0: return CASTLE  // Center - Castle
      case 1: return FIELD   // Ring 1 - Fields around castle
      case 2: return FIELD   // Ring 2 - All fields
      case 3: return TREES   // Ring 3 - All forest
      case 4: return WATER   // Ring 4 - All water
      case 5: return TREES   // Ring 5 - All forest (outer ring)
      default: return FIELD  // Fallback
    }
  }
  
  // For other views, use the original logic
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

function shouldHideHex(radialDistance?: number): boolean {
  // Hide hexes with radial distance 6 or 7
  return radialDistance !== undefined && radialDistance >= 6
}

// Check if hex should show button effects (only within ring 4)
function shouldShowButtonEffects(radialDistance?: number): boolean {
  return radialDistance !== undefined && radialDistance <= 4
}

function renderGrid(view: string) {
  const container = document.getElementById('container')
  if (!container) return

  // Clear container completely
  container.innerHTML = ''

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
  container.appendChild(svg)

  // Main grid group (with 3D transformation)
  const mainGridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  mainGridGroup.setAttribute('transform', `translate(${xOffset}, ${yOffset})`)
  mainGridGroup.setAttribute('id', 'main-grid')
  svg.appendChild(mainGridGroup)

  // Render main grid
  let index = 0
  for (const hex of mainGrid) {
    const customHex = hex as CustomHex | VerticalHex
    
    // Skip rendering hexes with radial distance 6 or 7 in chart view
    if (view === 'chart' && shouldHideHex(customHex.radialDistance)) {
      index++
      continue
    }
    
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    const points = hex.corners.map(({ x, y }) => `${x},${y}`).join(' ')
    
    polygon.setAttribute('points', points)
    
    // Add terrain background color for chart view
    if (view === 'chart') {
      const terrainType = getTerrainType(index, customHex.radialDistance)
      const terrainColor = getTerrainColor(terrainType)
      polygon.style.fill = terrainColor
    } else {
      polygon.style.fill = 'rgba(255, 255, 255, 0.1)'
    }
    
    polygon.style.stroke = 'rgba(255, 255, 255, 0.5)'
    polygon.style.strokeWidth = '1'
    
    group.appendChild(polygon)
    
    // Add visibility overlay if visibility is enabled and in chart view
    if (view === 'chart' && showVisibility && shouldShowButtonEffects(customHex.radialDistance)) {
      const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      overlay.setAttribute('points', points)
      overlay.style.stroke = 'none'
      
      if (customHex.visibility === 'undiscovered') {
        overlay.style.fill = 'rgba(0, 0, 0, 0.8)'
      } else if (customHex.visibility === 'discovered') {
        overlay.style.fill = 'rgba(0, 255, 0, 0.1)'
      } else if (customHex.visibility === 'visible') {
        overlay.style.fill = 'rgba(255, 255, 255, 0.2)'
      }
      
      group.appendChild(overlay)
    }
    
    // Add number text (centered vertically)
    const numberText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    
    // Use radial distance for chart view, regular index for others
    if (view === 'chart' && customHex.radialDistance !== undefined) {
      numberText.textContent = `${customHex.radialDistance}`
      numberText.style.fill = 'yellow'  // Make radial distances more visible
      numberText.style.fontWeight = 'bold'
    } else {
      numberText.textContent = `${index}`
      numberText.style.fill = 'white'
    }
    
    numberText.setAttribute('x', hex.x.toString())
    numberText.setAttribute('y', hex.y.toString()) // Centered vertically
    numberText.setAttribute('text-anchor', 'middle')
    numberText.setAttribute('dominant-baseline', 'central')
    numberText.style.fontSize = '0.8rem' // Smaller font size
    numberText.style.fill = 'black' // Black color
    numberText.style.userSelect = 'none'
    numberText.style.pointerEvents = 'none'
    
    group.appendChild(numberText)
    
    // Add terrain emoji if coordinates are enabled and in chart view
    if (view === 'chart' && showCoordinates && shouldShowButtonEffects(customHex.radialDistance)) {
      const terrainText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      const terrainType = getTerrainType(index, customHex.radialDistance)
      const emoji = getTerrainEmoji(terrainType)
      
      // Make castle emoji bigger
      if (terrainType.type === 'Castle') {
        terrainText.textContent = emoji
        terrainText.style.fontSize = '2.5rem' // Bigger castle emoji
      } else {
        terrainText.textContent = emoji
        terrainText.style.fontSize = '2rem' // Bigger terrain emojis
      }
      
      terrainText.setAttribute('x', hex.x.toString())
      terrainText.setAttribute('y', (hex.y + 15).toString()) // Offset down more
      terrainText.setAttribute('text-anchor', 'middle')
      terrainText.setAttribute('dominant-baseline', 'central')
      terrainText.style.userSelect = 'none'
      terrainText.style.pointerEvents = 'none'
      
      group.appendChild(terrainText)
    }
    
    mainGridGroup.appendChild(group)
    index++
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
    
    if (mainGridGroup) {
      mainGridGroup.setAttribute('transform', `translate(${newXOffset}, ${newYOffset})`)
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
      // Re-render the grid to show/hide terrain emojis
      if (currentView === 'chart') {
        renderGrid(currentView)
      }
    })
  }

  if (visibilityToggle) {
    visibilityToggle.addEventListener('click', () => {
      showVisibility = !showVisibility
      visibilityToggle.style.background = showVisibility ? 'rgba(255, 255, 255, 0.3)' : 'transparent'
      // Re-render the grid to show/hide visibility overlays
      if (currentView === 'chart') {
        renderGrid(currentView)
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