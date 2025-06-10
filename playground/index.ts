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
}

class VerticalHex extends defineHex({ 
  dimensions: 30, 
  origin: 'topLeft',
  orientation: Orientation.FLAT 
}) {
  custom = 'test'
  transformedCoordinates?: { x: number; y: number }
  visibility: 'undiscovered' | 'discovered' | 'visible' = 'undiscovered'
}

// Grid state
let mainGrid: Grid<CustomHex | VerticalHex>
let terrainGrid: Grid<CustomHex | VerticalHex>
let visibilityGrid: Grid<CustomHex | VerticalHex>
let currentView = 'castle'
let showCoordinates = false
let showVisibility = false

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
  terrainGrid = createGrid(gridOptions)
  visibilityGrid = createGrid(gridOptions)
  
  // Initialize visibility states randomly for demo
  let index = 0
  for (const hex of visibilityGrid) {
    const rand = Math.random()
    if (rand < 0.3) hex.visibility = 'undiscovered'
    else if (rand < 0.7) hex.visibility = 'discovered'
    else hex.visibility = 'visible'
    index++
  }
  
  renderGrid(mainGrid, terrainGrid, visibilityGrid, view)
}

function getTerrainEmoji(terrain: any) {
  switch(terrain.type) {
    case 'Water': return '💧'
    case 'Field': return '🌾'
    case 'Road': return '🪨'
    case 'Trees': return '🌳'
    case 'Building': return '🏠'
    default: return ''
  }
}

function getTerrainType(index: number) {
  const terrains = [FIELD, WATER, TREES, BUILDING, ROAD]
  return terrains[index % terrains.length]
}

function getTerrainColor(terrain: any): string {
  switch(terrain.type) {
    case 'Building': return '#616161'
    case 'Road': return '#181818'
    case 'Trees': return '#11580f'
    case 'Field': return '#11580f'
    case 'Water': return '#0d73c9'
    default: return '#ffffff'
  }
}

function renderGrid(
  grid: Grid<CustomHex | VerticalHex>, 
  terrain: Grid<CustomHex | VerticalHex>,
  visibility: Grid<CustomHex | VerticalHex>,
  view: string
) {
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

  // Main grid group
  const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  gridGroup.setAttribute('transform', `translate(${xOffset}, ${yOffset})`)
  gridGroup.setAttribute('id', 'main-grid')
  svg.appendChild(gridGroup)

  // Terrain grid group (no transformation)
  const terrainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  terrainGroup.setAttribute('transform', `translate(${xOffset}, ${yOffset})`)
  terrainGroup.setAttribute('id', 'terrain-grid')
  terrainGroup.style.display = (view === 'chart' && showCoordinates) ? 'block' : 'none'
  // Remove transformation for terrain grid
  terrainGroup.style.transform = 'none'
  terrainGroup.style.transformStyle = 'flat'
  svg.appendChild(terrainGroup)

  // Visibility grid group
  const visibilityGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  visibilityGroup.setAttribute('transform', `translate(${xOffset}, ${yOffset})`)
  visibilityGroup.setAttribute('id', 'visibility-grid')
  visibilityGroup.style.display = (view === 'chart' && showVisibility) ? 'block' : 'none'
  svg.appendChild(visibilityGroup)

  // Render main grid
  let index = 0
  for (const hex of grid) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    const points = hex.corners.map(({ x, y }) => `${x},${y}`).join(' ')
    
    polygon.setAttribute('points', points)
    
    // Add terrain background color for chart view
    if (view === 'chart') {
      const terrainType = getTerrainType(index)
      const terrainColor = getTerrainColor(terrainType)
      polygon.style.fill = terrainColor
    }
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    if (view === 'chart') {
      const terrainType = getTerrainType(index)
      const cellNumber = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
      cellNumber.textContent = `${index}`
      cellNumber.setAttribute('x', hex.x.toString())
      cellNumber.setAttribute('dy', '-1.2em')
      cellNumber.classList.add('cell-number')
      cellNumber.style.opacity = '0.5' // 50% transparency
      
      const terrainEmoji = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
      terrainEmoji.textContent = getTerrainEmoji(terrainType)
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

  // Render terrain grid (face-to-camera, no transformation)
  if (view === 'chart') {
    let terrainIndex = 0
    for (const hex of terrain) {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      const points = hex.corners.map(({ x, y }) => `${x},${y}`).join(' ')
      
      polygon.setAttribute('points', points)
      polygon.classList.add('terrain-polygon')
      
      // Create face-to-camera text with terrain emoji
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      const terrainType = getTerrainType(terrainIndex)
      text.textContent = getTerrainEmoji(terrainType)
      text.setAttribute('x', hex.x.toString())
      text.setAttribute('y', hex.y.toString())
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('dominant-baseline', 'central')
      text.classList.add('terrain-text')
      // Ensure no transformation is applied to this text
      text.style.transform = 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
      text.style.transformStyle = 'flat'
      
      group.appendChild(polygon)
      group.appendChild(text)
      terrainGroup.appendChild(group)
      terrainIndex++
    }
  }

  // Render visibility grid
  if (view === 'chart') {
    for (const hex of visibility) {
      const visHex = hex as CustomHex | VerticalHex
      if (visHex.visibility === 'undiscovered') continue // Skip undiscovered hexes
      
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      const points = hex.corners.map(({ x, y }) => `${x},${y}`).join(' ')
      
      polygon.setAttribute('points', points)
      
      if (visHex.visibility === 'discovered') {
        polygon.classList.add('visibility-discovered')
      } else {
        polygon.classList.add('visibility-visible')
      }
      
      group.appendChild(polygon)
      visibilityGroup.appendChild(group)
    }
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
    const terrainGroup = document.getElementById('terrain-grid')
    const visibilityGroup = document.getElementById('visibility-grid')
    if (terrainGroup) {
      terrainGroup.setAttribute('transform', `translate(${newXOffset}, ${newYOffset})`)
    }
    if (visibilityGroup) {
      visibilityGroup.setAttribute('transform', `translate(${newXOffset}, ${newYOffset})`)
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
      const terrainGroup = document.getElementById('terrain-grid')
      if (terrainGroup) {
        terrainGroup.style.display = (currentView === 'chart' && showCoordinates) ? 'block' : 'none'
      }
    })
  }

  if (visibilityToggle) {
    visibilityToggle.addEventListener('click', () => {
      showVisibility = !showVisibility
      const visibilityGroup = document.getElementById('visibility-grid')
      if (visibilityGroup) {
        visibilityGroup.style.display = (currentView === 'chart' && showVisibility) ? 'block' : 'none'
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
      initializeGrid(view)
    }
  }

  button.addEventListener('click', handleClick)
  button.addEventListener('touchend', handleClick)
})

initializeGrid('castle')