import { defineHex, Grid, rectangle, spiral, ring, Direction } from '../src'

// Define terrain types with colors and emojis
const TERRAIN_TYPES = {
  FIELDS: { color: '#FFD700', emoji: '🌾', name: 'Fields' },
  NORTH_FOREST: { color: '#1B4332', emoji: '🌲', name: 'North Forest' },
  FOREST: { color: '#2D5016', emoji: '🌲', name: 'Forest' },
  COAST: { color: '#4A90E2', emoji: '🏖️', name: 'Coast' },
  DEEP_BLUE: { color: '#1E3A8A', emoji: '🌊', name: 'Deep Blue' },
  STEPPO: { color: '#8B7355', emoji: '🌿', name: 'Steppo' }
} as const

const { FIELDS, NORTH_FOREST, FOREST, COAST, DEEP_BLUE, STEPPO } = TERRAIN_TYPES

// Define hex classes for different views
class CustomHex extends defineHex({ dimensions: 30, origin: 'topLeft' }) {
  radialDistance!: number
  ringPosition!: number
  visibility: 'undiscovered' | 'discovered' | 'visible' = 'visible'
  terrain!: typeof TERRAIN_TYPES[keyof typeof TERRAIN_TYPES]
}

class VerticalHex extends defineHex({ dimensions: 30, origin: 'topLeft' }) {
  radialDistance!: number
  ringPosition!: number
  visibility: 'undiscovered' | 'discovered' | 'visible' = 'visible'
  terrain!: typeof TERRAIN_TYPES[keyof typeof TERRAIN_TYPES]
}

// Current view state
let currentView = 'castle'
let showCoordinates = false
let showVisibility = false

// Grid instances
let mainGrid: Grid<CustomHex | VerticalHex>

// Camera state for 3D transformations
const cameraState = {
  matrix: [1, 0, 0, 0, 0, 0.4, 0, -0.002, 0, 0, 1, 0, 0, 0, 0, 1],
  isDragging: false,
  lastX: 0,
  lastY: 0,
  rotationX: 0,
  rotationY: 0,
  scale: 1,
  translateX: 0,
  translateY: 0
}

// Initialize the application
function init() {
  setupNavigation()
  setupControls()
  setupMenuSystem()
  createGrid()
  renderGrid(currentView)
}

// Setup navigation between views
function setupNavigation() {
  const navButtons = document.querySelectorAll('[data-view]')
  
  navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault()
      const view = (e.target as HTMLElement).dataset.view
      if (view) {
        switchView(view)
      }
    })
  })
}

// Setup control buttons
function setupControls() {
  const coordinatesToggle = document.getElementById('coordinates-toggle')
  const visibilityToggle = document.getElementById('visibility-toggle')
  
  coordinatesToggle?.addEventListener('click', () => {
    showCoordinates = !showCoordinates
    renderGrid(currentView)
  })
  
  visibilityToggle?.addEventListener('click', () => {
    showVisibility = !showVisibility
    renderGrid(currentView)
  })
}

// Setup menu system
function setupMenuSystem() {
  const burgerMenu = document.getElementById('burger-menu')
  const menuOverlay = document.getElementById('menu-overlay')
  const closeMenu = document.getElementById('close-menu')
  
  burgerMenu?.addEventListener('click', () => {
    menuOverlay?.classList.add('active')
    burgerMenu.classList.add('active')
  })
  
  closeMenu?.addEventListener('click', () => {
    menuOverlay?.classList.remove('active')
    burgerMenu?.classList.remove('active')
  })
  
  menuOverlay?.addEventListener('click', (e) => {
    if (e.target === menuOverlay) {
      menuOverlay.classList.remove('active')
      burgerMenu?.classList.remove('active')
    }
  })
  
  // Handle menu item clicks
  const menuItems = document.querySelectorAll('.menu-item[data-view]')
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const view = (e.currentTarget as HTMLElement).dataset.view
      if (view) {
        switchView(view)
        menuOverlay?.classList.remove('active')
        burgerMenu?.classList.remove('active')
      }
    })
  })
}

// Switch between different views
function switchView(view: string) {
  // Update body data attribute for CSS styling
  document.body.dataset.view = view
  
  // Update active nav buttons
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.classList.remove('active')
  })
  document.querySelectorAll(`[data-view="${view}"]`).forEach(btn => {
    btn.classList.add('active')
  })
  
  currentView = view
  createGrid()
  renderGrid(view)
}

// Create grid based on current view
function createGrid() {
  switch (currentView) {
    case 'castle':
      mainGrid = createCastleGrid()
      break
    case 'dungeon':
      mainGrid = createDungeonGrid()
      break
    case 'hero':
      mainGrid = createHeroGrid()
      break
    case 'library':
      mainGrid = createLibraryGrid()
      break
    default:
      mainGrid = createCastleGrid()
  }
}

// Create castle view grid (hexagonal with rings)
function createCastleGrid(): Grid<CustomHex> {
  const grid = new Grid(CustomHex)
  
  // Create hexagonal grid with rings
  for (let ring = 0; ring <= 5; ring++) {
    if (ring === 0) {
      // Center hex
      const centerHex = new CustomHex([0, 0])
      centerHex.radialDistance = 0
      centerHex.ringPosition = 0
      centerHex.terrain = getTerrainType(0, 0)
      grid.setHexes([centerHex])
    } else {
      // Ring hexes
      const ringHexes = grid.traverse(ring({ center: [0, 0], radius: ring }))
      let position = 1
      
      ringHexes.forEach(hex => {
        const customHex = hex as CustomHex
        customHex.radialDistance = ring
        customHex.ringPosition = position
        customHex.terrain = getTerrainType(ring, position)
        position++
      })
    }
  }
  
  return grid
}

// Create dungeon view grid (vertical layout)
function createDungeonGrid(): Grid<VerticalHex> {
  const grid = new Grid(VerticalHex)
  
  // Create vertical dungeon layout
  for (let floor = 0; floor < 10; floor++) {
    for (let room = 0; room < 5; room++) {
      const hex = new VerticalHex([room - 2, floor])
      hex.radialDistance = floor
      hex.ringPosition = room + 1
      hex.terrain = getDungeonTerrain(floor, room)
      grid.setHexes([hex])
    }
  }
  
  return grid
}

// Create hero view grid
function createHeroGrid(): Grid<CustomHex> {
  const grid = new Grid(CustomHex)
  
  // Create small grid around hero
  for (let q = -2; q <= 2; q++) {
    for (let r = -2; r <= 2; r++) {
      if (Math.abs(q + r) <= 2) {
        const hex = new CustomHex([q, r])
        hex.radialDistance = Math.abs(q) + Math.abs(r) + Math.abs(-q - r)
        hex.ringPosition = 1
        hex.terrain = FIELDS
        grid.setHexes([hex])
      }
    }
  }
  
  return grid
}

// Create library view grid
function createLibraryGrid(): Grid<CustomHex> {
  const grid = new Grid(CustomHex)
  
  // Create rectangular grid for library
  const rectGrid = new Grid(CustomHex, rectangle({ width: 8, height: 6 }))
  rectGrid.forEach(hex => {
    const customHex = hex as CustomHex
    customHex.radialDistance = 0
    customHex.ringPosition = 1
    customHex.terrain = FIELDS
  })
  
  return rectGrid
}

// Get terrain type based on ring and position
function getTerrainType(ring: number, position: number): typeof TERRAIN_TYPES[keyof typeof TERRAIN_TYPES] {
  switch (ring) {
    case 0: return FIELDS          // Center - Fields
    case 1: return FIELDS          // Ring 1 - Fields
    case 2: 
      // Ring 2 specific assignments
      if ([1, 2, 3, 4].includes(position)) {
        return FOREST  // 2/1, 2/2, 2/3, 2/4 - forest
      } else if ([5, 6].includes(position)) {
        return STEPPO  // 2/5, 2/6 - steppo
      } else if ([7, 8, 9, 12].includes(position)) {
        return FOREST  // 2/7, 2/8, 2/9, 2/12 - forest
      } else if ([10, 11].includes(position)) {
        return NORTH_FOREST  // 2/10, 2/11 - north forest
      } else {
        return FOREST  // Default for other positions in ring 2
      }
    case 3: return NORTH_FOREST  // Ring 3 - North Forest (darker)
    case 4: return COAST         // Ring 4 - Coast
    case 5: return DEEP_BLUE     // Ring 5 - Deep Blue (outer ring)
    default: return FIELDS
  }
}

// Get dungeon terrain type
function getDungeonTerrain(floor: number, room: number): typeof TERRAIN_TYPES[keyof typeof TERRAIN_TYPES] {
  if (floor === 0) return FIELDS
  if (floor < 3) return FOREST
  if (floor < 6) return NORTH_FOREST
  return DEEP_BLUE
}

// Check if hex should be hidden in castle view
function shouldHideHex(radialDistance: number): boolean {
  return currentView === 'castle' && showVisibility && radialDistance > 3
}

function renderGrid(view: string) {
  const container = document.getElementById('container')
  if (!container) return

  // Clear container
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

  // Apply transform to center the grid
  mainGridGroup.setAttribute('transform', `translate(${xOffset}, ${yOffset})`)

  // Create legend for castle view
  if (view === 'castle') {
    createLegend(container)
  }

  // Render hexes
  let index = 0
  for (const hex of mainGrid) {
    const customHex = hex as CustomHex | VerticalHex
    
    // Skip hidden hexes
    if (shouldHideHex(customHex.radialDistance)) {
      index++
      continue
    }

    // Create hex group
    const hexGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    
    // Create hex polygon
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    const points = hex.corners.map(corner => `${corner.x},${corner.y}`).join(' ')
    polygon.setAttribute('points', points)
    
    // Apply terrain styling
    if (showVisibility) {
      polygon.classList.add(`visibility-${customHex.visibility}`)
    } else {
      polygon.style.fill = customHex.terrain.color
      polygon.style.stroke = 'rgba(255, 255, 255, 0.3)'
      polygon.style.strokeWidth = '1'
    }
    
    hexGroup.appendChild(polygon)

    // Add text content
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    text.setAttribute('x', hex.x.toString())
    text.setAttribute('y', hex.y.toString())
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('dominant-baseline', 'central')
    text.style.fontSize = '12px'
    text.style.fill = 'white'
    text.style.fontWeight = 'bold'
    text.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.8)'

    if (showCoordinates) {
      // Show coordinates
      text.textContent = `${hex.q},${hex.r}`
      text.classList.add('cell-number')
    } else if (view === 'castle') {
      // Show ring/position for castle view
      if (customHex.radialDistance === 0) {
        text.textContent = '🏰'
        text.style.fontSize = '20px'
      } else {
        text.textContent = `${customHex.radialDistance}/${customHex.ringPosition}`
      }
    } else if (showVisibility) {
      // Show terrain emoji when visibility is enabled
      text.textContent = customHex.terrain.emoji
      text.classList.add('terrain-text')
      text.style.fontSize = '16px'
    } else {
      // Show terrain emoji
      text.textContent = customHex.terrain.emoji
      text.style.fontSize = '16px'
    }

    hexGroup.appendChild(text)
    mainGridGroup.appendChild(hexGroup)
    index++
  }

  container.appendChild(svg)

  setupInteractions(svg, mainGridGroup, gridWidth, gridHeight)
}

// Setup 3D interactions for castle view
function setupInteractions(svg: SVGElement, gridGroup: SVGElement, gridWidth: number, gridHeight: number) {
  if (currentView !== 'castle') return

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

    const deltaX = x - cameraState.lastX
    const deltaY = y - cameraState.lastY

    // Update rotation
    cameraState.rotationY += deltaX * 0.01
    cameraState.rotationX += deltaY * 0.01

    // Clamp rotation
    cameraState.rotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 6, cameraState.rotationX))

    // Update matrix
    const cosX = Math.cos(cameraState.rotationX)
    const sinX = Math.sin(cameraState.rotationX)
    const cosY = Math.cos(cameraState.rotationY)
    const sinY = Math.sin(cameraState.rotationY)

    cameraState.matrix = [
      cosY * cameraState.scale, 
      sinX * sinY * cameraState.scale, 
      0, 
      0,
      0, 
      cosX * cameraState.scale * 0.4, 
      0, 
      -0.002,
      -sinY * cameraState.scale, 
      sinX * cosY * cameraState.scale, 
      1, 
      0,
      cameraState.translateX, 
      cameraState.translateY, 
      0, 
      1
    ]

    updateTransform()

    cameraState.lastX = x
    cameraState.lastY = y
  }

  function handleEnd() {
    cameraState.isDragging = false
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault()
    
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1
    cameraState.scale = Math.max(0.5, Math.min(3, cameraState.scale * scaleFactor))
    
    // Update matrix with new scale
    const cosX = Math.cos(cameraState.rotationX)
    const sinX = Math.sin(cameraState.rotationX)
    const cosY = Math.cos(cameraState.rotationY)
    const sinY = Math.sin(cameraState.rotationY)

    cameraState.matrix = [
      cosY * cameraState.scale, 
      sinX * sinY * cameraState.scale, 
      0, 
      0,
      0, 
      cosX * cameraState.scale * 0.4, 
      0, 
      -0.002,
      -sinY * cameraState.scale, 
      sinX * cosY * cameraState.scale, 
      1, 
      0,
      cameraState.translateX, 
      cameraState.translateY, 
      0, 
      1
    ]

    updateTransform()
  }

  // Mouse events
  svg.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY))
  svg.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY))
  svg.addEventListener('mouseup', handleEnd)
  svg.addEventListener('mouseleave', handleEnd)
  svg.addEventListener('wheel', handleWheel)

  // Touch events
  svg.addEventListener('touchstart', (e) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  })

  svg.addEventListener('touchmove', (e) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  })

  svg.addEventListener('touchend', (e) => {
    e.preventDefault()
    handleEnd()
  })

  // Initialize transform
  updateTransform()
}

// Create legend for terrain types
function createLegend(container: HTMLElement) {
  const legend = document.createElement('div')
  legend.style.position = 'fixed'
  legend.style.top = '20px'
  legend.style.left = '20px'
  legend.style.background = 'rgba(0, 0, 0, 0.8)'
  legend.style.color = 'white'
  legend.style.padding = '15px'
  legend.style.borderRadius = '8px'
  legend.style.fontSize = '14px'
  legend.style.zIndex = '1000'
  legend.style.maxWidth = '200px'

  const title = document.createElement('div')
  title.textContent = 'Terrain Types'
  title.style.fontWeight = 'bold'
  title.style.marginBottom = '10px'
  title.style.borderBottom = '1px solid rgba(255, 255, 255, 0.3)'
  title.style.paddingBottom = '5px'
  legend.appendChild(title)

  Object.values(TERRAIN_TYPES).forEach(terrain => {
    const item = document.createElement('div')
    item.style.display = 'flex'
    item.style.alignItems = 'center'
    item.style.marginBottom = '5px'
    
    const colorBox = document.createElement('div')
    colorBox.style.width = '20px'
    colorBox.style.height = '20px'
    colorBox.style.backgroundColor = terrain.color
    colorBox.style.marginRight = '10px'
    colorBox.style.borderRadius = '3px'
    colorBox.style.border = '1px solid rgba(255, 255, 255, 0.3)'
    
    const label = document.createElement('span')
    label.textContent = `${terrain.emoji} ${terrain.name}`
    
    item.appendChild(colorBox)
    item.appendChild(label)
    legend.appendChild(item)
  })

  container.appendChild(legend)
}

// Handle window resize
window.addEventListener('resize', () => {
  const svg = document.querySelector('.hex-grid') as SVGElement
  if (svg) {
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
  }
})

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init)