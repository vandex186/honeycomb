import { defineHex, Grid, rectangle, spiral, ring, Direction } from '../src'

// Define terrain types
const CASTLE = 'castle'
const FIELDS = 'fields'
const FOREST = 'forest'
const NORTH_FOREST = 'north_forest'
const COAST = 'coast'
const DEEP_BLUE = 'deep_blue'
const STEPPO = 'steppo'

type TerrainType = typeof CASTLE | typeof FIELDS | typeof FOREST | typeof NORTH_FOREST | typeof COAST | typeof DEEP_BLUE | typeof STEPPO

// Define custom hex classes
class CustomHex extends defineHex({ dimensions: 30, origin: 'topLeft' }) {
  radialDistance!: number
  ringPosition!: number
  visibility: 'undiscovered' | 'discovered' | 'visible' = 'undiscovered'
  terrain!: TerrainType
}

class VerticalHex extends defineHex({ dimensions: 30, origin: 'topLeft' }) {
  radialDistance!: number
  ringPosition!: number
  visibility: 'undiscovered' | 'discovered' | 'visible' = 'undiscovered'
  terrain!: TerrainType
}

// Game state
let currentView = 'castle'
let showCoordinates = true
let showVisibility = false
let mainGrid: Grid<CustomHex | VerticalHex>

// Camera state for 3D transformations
const cameraState = {
  isDragging: false,
  lastX: 0,
  lastY: 0,
  rotationX: 0,
  rotationY: 0,
  scale: 1,
  translateX: 0,
  translateY: 0,
  matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
}

// Update camera matrix based on current state
function updateCameraMatrix() {
  if (currentView === 'castle') {
    // 3D transformation matrix for castle view
    const cosX = Math.cos(cameraState.rotationX)
    const sinX = Math.sin(cameraState.rotationX)
    const cosY = Math.cos(cameraState.rotationY)
    const sinY = Math.sin(cameraState.rotationY)

    cameraState.matrix = [
      cosY * cameraState.scale, sinX * sinY * cameraState.scale, -cosX * sinY * cameraState.scale, 0,
      0, cosX * cameraState.scale, sinX * cameraState.scale, -0.002,
      sinY * cameraState.scale, -sinX * cosY * cameraState.scale, cosX * cosY * cameraState.scale, 0,
      cameraState.translateX, cameraState.translateY, 0, 1
    ]
  } else {
    // 2D transformation matrix for other views
    cameraState.matrix = [
      cameraState.scale, 0, 0, 0,
      0, cameraState.scale, 0, 0,
      0, 0, 1, 0,
      cameraState.translateX, cameraState.translateY, 0, 1
    ]
  }
}

// Initialize the application
function init() {
  setupNavigation()
  setupControls()
  createGrid()
  renderGrid(currentView)
}

// Setup navigation
function setupNavigation() {
  // Handle navigation buttons
  document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault()
      const view = (e.target as HTMLElement).getAttribute('data-view')
      if (view) {
        switchView(view)
      }
    })
  })

  // Setup burger menu
  const burgerMenu = document.getElementById('burger-menu')
  const menuOverlay = document.getElementById('menu-overlay')
  const closeMenu = document.getElementById('close-menu')

  if (burgerMenu && menuOverlay && closeMenu) {
    burgerMenu.addEventListener('click', () => {
      menuOverlay.classList.add('active')
      burgerMenu.classList.add('active')
    })

    closeMenu.addEventListener('click', () => {
      menuOverlay.classList.remove('active')
      burgerMenu.classList.remove('active')
    })

    // Close menu when clicking overlay
    menuOverlay.addEventListener('click', (e) => {
      if (e.target === menuOverlay) {
        menuOverlay.classList.remove('active')
        burgerMenu.classList.remove('active')
      }
    })

    // Handle menu item clicks
    menuOverlay.querySelectorAll('.menu-item[data-view]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault()
        const view = (e.target as HTMLElement).closest('[data-view]')?.getAttribute('data-view')
        if (view) {
          switchView(view)
          menuOverlay.classList.remove('active')
          burgerMenu.classList.remove('active')
        }
      })
    })
  }
}

// Setup control buttons
function setupControls() {
  const coordinatesToggle = document.getElementById('coordinates-toggle')
  const visibilityToggle = document.getElementById('visibility-toggle')

  if (coordinatesToggle) {
    coordinatesToggle.addEventListener('click', () => {
      showCoordinates = !showCoordinates
      renderGrid(currentView)
    })
  }

  if (visibilityToggle) {
    visibilityToggle.addEventListener('click', () => {
      showVisibility = !showVisibility
      renderGrid(currentView)
    })
  }
}

// Switch between different views
function switchView(view: string) {
  currentView = view
  document.body.setAttribute('data-view', view)
  
  // Update active states
  document.querySelectorAll('[data-view]').forEach(button => {
    button.classList.remove('active')
  })
  document.querySelectorAll(`[data-view="${view}"]`).forEach(button => {
    button.classList.add('active')
  })

  // Reset camera state when switching views
  cameraState.rotationX = 0
  cameraState.rotationY = 0
  cameraState.scale = 1
  cameraState.translateX = 0
  cameraState.translateY = 0

  createGrid()
  renderGrid(view)
}

// Create the hex grid based on current view
function createGrid() {
  if (currentView === 'castle') {
    // Create a spiral grid for castle view
    mainGrid = new Grid(CustomHex, spiral({ radius: 5 }))
    
    // Calculate radial distance and ring position for each hex
    let index = 0
    for (const hex of mainGrid) {
      const customHex = hex as CustomHex
      customHex.radialDistance = Math.max(Math.abs(hex.q), Math.abs(hex.r), Math.abs(hex.s))
      customHex.ringPosition = calculateRingPosition(hex.q, hex.r, customHex.radialDistance)
      customHex.visibility = 'visible'
      customHex.terrain = getTerrainType(index, customHex.radialDistance)
      index++
    }
  } else {
    // Create a rectangular grid for other views
    mainGrid = new Grid(VerticalHex, rectangle({ width: 8, height: 6 }))
    
    let index = 0
    for (const hex of mainGrid) {
      const verticalHex = hex as VerticalHex
      verticalHex.radialDistance = 0
      verticalHex.ringPosition = 0
      verticalHex.visibility = Math.random() > 0.3 ? 'visible' : Math.random() > 0.5 ? 'discovered' : 'undiscovered'
      verticalHex.terrain = getTerrainType(index)
      index++
    }
  }
}

// Calculate ring position for a hex
function calculateRingPosition(q: number, r: number, ring: number): number {
  if (ring === 0) return 0
  
  const s = -q - r
  
  // For each ring, we need to determine position based on which "side" of the hexagon the hex is on
  // A hexagon has 6 sides, and we traverse clockwise starting from the right side
  
  if (ring === 1) {
    // Ring 1: 6 hexes
    if (q === 1 && r === 0) return 1      // Right
    if (q === 1 && r === -1) return 2     // Top-right
    if (q === 0 && r === -1) return 3     // Top-left
    if (q === -1 && r === 0) return 4     // Left
    if (q === -1 && r === 1) return 5     // Bottom-left
    if (q === 0 && r === 1) return 6      // Bottom-right
  } else if (ring === 2) {
    // Ring 2: 12 hexes
    const positions = [
      [2, 0], [2, -1], [2, -2],           // Right side (3 hexes)
      [1, -2], [0, -2],                   // Top-right side (2 hexes)
      [-1, -1], [-2, 0],                  // Top-left side (2 hexes)
      [-2, 1], [-2, 2],                   // Left side (2 hexes)
      [-1, 2], [0, 2],                    // Bottom-left side (2 hexes)
      [1, 1]                              // Bottom-right side (1 hex)
    ]
    
    for (let i = 0; i < positions.length; i++) {
      if (positions[i][0] === q && positions[i][1] === r) {
        return i + 1
      }
    }
  } else if (ring === 3) {
    // Ring 3: 18 hexes
    const positions = [
      [3, 0], [3, -1], [3, -2], [3, -3],  // Right side (4 hexes)
      [2, -3], [1, -3], [0, -3],          // Top-right side (3 hexes)
      [-1, -2], [-2, -1], [-3, 0],        // Top-left side (3 hexes)
      [-3, 1], [-3, 2], [-3, 3],          // Left side (3 hexes)
      [-2, 3], [-1, 3], [0, 3],           // Bottom-left side (3 hexes)
      [1, 2], [2, 1]                      // Bottom-right side (2 hexes)
    ]
    
    for (let i = 0; i < positions.length; i++) {
      if (positions[i][0] === q && positions[i][1] === r) {
        return i + 1
      }
    }
  } else if (ring === 4) {
    // Ring 4: 24 hexes
    const positions = [
      [4, 0], [4, -1], [4, -2], [4, -3], [4, -4],     // Right side (5 hexes)
      [3, -4], [2, -4], [1, -4], [0, -4],             // Top-right side (4 hexes)
      [-1, -3], [-2, -2], [-3, -1], [-4, 0],          // Top-left side (4 hexes)
      [-4, 1], [-4, 2], [-4, 3], [-4, 4],             // Left side (4 hexes)
      [-3, 4], [-2, 4], [-1, 4], [0, 4],              // Bottom-left side (4 hexes)
      [1, 3], [2, 2], [3, 1]                          // Bottom-right side (3 hexes)
    ]
    
    for (let i = 0; i < positions.length; i++) {
      if (positions[i][0] === q && positions[i][1] === r) {
        return i + 1
      }
    }
  }
  
  // Fallback for other rings or unmatched positions
  return 1
}

function getTerrainType(index: number, radialDistance?: number) {
  // For castle view (formerly chart), use ring-based terrain assignment
  if (radialDistance !== undefined) {
    switch (radialDistance) {
      case 0: return CASTLE        // Center - Castle
      case 1: return FIELDS        // Ring 1 - Fields around castle
      case 2: return FOREST        // Ring 2 - Forest
      case 3: return NORTH_FOREST  // Ring 3 - North Forest (darker)
      case 4: return COAST         // Ring 4 - Coast
      case 5: return DEEP_BLUE     // Ring 5 - Deep Blue (outer ring)
      default: return STEPPO      // Default for outer rings
    }
  }
  
  // For other views, use index-based assignment
  const terrainTypes = [FIELDS, FOREST, NORTH_FOREST, COAST, DEEP_BLUE, STEPPO]
  return terrainTypes[index % terrainTypes.length]
}

function getTerrainColor(terrain: TerrainType): string {
  switch (terrain) {
    case CASTLE: return '#8B4513'      // Brown for castle
    case FIELDS: return '#FFD700'      // Yellow for fields
    case FOREST: return '#228B22'      // Green for forest
    case NORTH_FOREST: return '#006400' // Dark green for north forest
    case COAST: return '#4169E1'       // Blue for coast
    case DEEP_BLUE: return '#191970'   // Dark blue for deep water
    case STEPPO: return '#9ACD32'      // Yellow-green for steppo
    default: return '#808080'          // Gray default
  }
}

function getTerrainEmoji(terrain: TerrainType): string {
  switch (terrain) {
    case CASTLE: return '🏰'
    case FIELDS: return '🌾'
    case FOREST: return '🌲'
    case NORTH_FOREST: return '🌲'
    case COAST: return '🌊'
    case DEEP_BLUE: return '🌊'
    case STEPPO: return '🌿'
    default: return '❓'
  }
}

function shouldHideHex(radialDistance: number): boolean {
  return currentView === 'castle' && radialDistance > 4
}

function shouldShowButtonEffects(radialDistance: number): boolean {
  return currentView === 'castle' && radialDistance <= 4
}

function renderGrid(view: string) {
  const container = document.getElementById('container')
  if (!container) return

  // Clear existing content
  container.innerHTML = ''

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.classList.add('hex-grid')
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')
  svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)

  // Create main group for the grid
  const mainGridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  svg.appendChild(mainGridGroup)

  // Calculate grid dimensions and centering
  const gridWidth = mainGrid.pixelWidth
  const gridHeight = mainGrid.pixelHeight
  const xOffset = (window.innerWidth - gridWidth) / 2
  const yOffset = (window.innerHeight - gridHeight) / 2

  // Apply transformation
  updateCameraMatrix()
  svg.style.transform = `matrix3d(${cameraState.matrix.join(',')})`

  let index = 0
  for (const hex of mainGrid) {
    const customHex = hex as CustomHex | VerticalHex

    // Skip hexes that should be hidden
    if (shouldHideHex(customHex.radialDistance)) {
      index++
      continue
    }

    // Create hex group
    const hexGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    hexGroup.setAttribute('transform', `translate(${hex.x + xOffset}, ${hex.y + yOffset})`)

    // Create polygon
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    const points = hex.corners.map(corner => `${corner.x - hex.x},${corner.y - hex.y}`).join(' ')
    polygon.setAttribute('points', points)

    // Add terrain background color for castle view
    if (view === 'castle') {
      const terrainType = getTerrainType(index, customHex.radialDistance)
      const terrainColor = getTerrainColor(terrainType)
      polygon.style.fill = terrainColor
      polygon.style.stroke = 'rgba(255, 255, 255, 0.5)'
      polygon.style.strokeWidth = '1'
    } else {
      // Default styling for other views
      polygon.style.fill = 'rgba(255, 255, 255, 0.1)'
      polygon.style.stroke = 'rgba(255, 255, 255, 0.5)'
      polygon.style.strokeWidth = '1'
    }

    // Add visibility effects
    if (showVisibility) {
      polygon.classList.add(`visibility-${customHex.visibility}`)
    }

    hexGroup.appendChild(polygon)

    // Add coordinate text
    if (showCoordinates) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('x', '0')
      text.setAttribute('y', '0')
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('dominant-baseline', 'central')
      text.style.fontSize = '12px'
      text.style.fill = 'white'
      text.style.fontWeight = 'bold'
      text.style.userSelect = 'none'
      text.style.pointerEvents = 'none'

      if (view === 'castle') {
        // Show ring/position format for castle view
        if (customHex.radialDistance === 0) {
          text.textContent = '0'
        } else {
          text.textContent = `${customHex.radialDistance}/${customHex.ringPosition}`
        }
        text.style.fill = '#FFFF00' // Yellow for castle view
      } else {
        // Show index for other views
        text.textContent = index.toString()
        text.style.fill = 'white'
      }

      hexGroup.appendChild(text)
    }

    // Add terrain emoji for castle view
    if (view === 'castle' && showCoordinates && shouldShowButtonEffects(customHex.radialDistance)) {
      const terrainText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      const terrainType = getTerrainType(index, customHex.radialDistance)
      const emoji = getTerrainEmoji(terrainType)
      
      terrainText.setAttribute('x', '0')
      terrainText.setAttribute('y', '15')
      terrainText.setAttribute('text-anchor', 'middle')
      terrainText.setAttribute('dominant-baseline', 'central')
      terrainText.style.fontSize = '16px'
      terrainText.style.userSelect = 'none'
      terrainText.style.pointerEvents = 'none'
      terrainText.classList.add('terrain-text')
      terrainText.textContent = emoji

      hexGroup.appendChild(terrainText)
    }

    mainGridGroup.appendChild(hexGroup)
    index++
  }

  container.appendChild(svg)

  setupInteractions(svg, mainGridGroup, gridWidth, gridHeight)
}

function setupInteractions(svg: SVGElement, gridGroup: SVGElement, gridWidth: number, gridHeight: number) {
  function updateTransform() {
    updateCameraMatrix()
    svg.style.transform = `matrix3d(${cameraState.matrix.join(',')})`
  }

  function handleStart(x: number, y: number) {
    cameraState.isDragging = true
    cameraState.lastX = x
    cameraState.lastY = y
  }

  function handleMove(x: number, y: number) {
    if (!cameraState.isDragging) return

    const deltaX = x - cameraState.lastX
    const deltaY = y - cameraState.lastY

    if (currentView === 'castle') {
      // 3D rotation for castle view
      cameraState.rotationY += deltaX * 0.01
      cameraState.rotationX += deltaY * 0.01

      // Limit rotation
      cameraState.rotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 6, cameraState.rotationX))
      
      // Also update translation for panning
      cameraState.translateX += deltaX * 0.5
      cameraState.translateY += deltaY * 0.5
    } else {
      // 2D panning for other views
      cameraState.translateX += deltaX
      cameraState.translateY += deltaY
    }

    updateTransform()

    cameraState.lastX = x
    cameraState.lastY = y
  }

  function handleEnd() {
    cameraState.isDragging = false
  }

  function handleWheel(event: WheelEvent) {
    event.preventDefault()
    
    const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1
    cameraState.scale = Math.max(0.1, Math.min(3, cameraState.scale * scaleFactor))
    
    updateTransform()
  }

  // Mouse events
  svg.addEventListener('mousedown', (e) => {
    e.preventDefault()
    handleStart(e.clientX, e.clientY)
  })

  document.addEventListener('mousemove', (e) => {
    handleMove(e.clientX, e.clientY)
  })

  document.addEventListener('mouseup', handleEnd)

  // Touch events
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
    }
  })

  svg.addEventListener('touchend', (e) => {
    e.preventDefault()
    handleEnd()
  })

  // Wheel events
  svg.addEventListener('wheel', handleWheel)

  // Handle window resize
  window.addEventListener('resize', () => {
    const gridWidth = mainGrid.pixelWidth
    const gridHeight = mainGrid.pixelHeight
    
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
  })
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init)