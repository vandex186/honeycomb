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

// Global state
let currentView = 'castle'
let showCoordinates = false
let showVisibility = false
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
  setupMenuSystem()
  setupViewControls()
  renderGrid(currentView)
}

// Setup navigation between views
function setupNavigation() {
  const navButtons = document.querySelectorAll('[data-view]')
  
  navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault()
      const view = (e.target as HTMLElement).getAttribute('data-view')
      if (view) {
        switchView(view)
      }
    })
  })
}

// Setup menu system
function setupMenuSystem() {
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
    
    // Close menu when clicking outside
    menuOverlay.addEventListener('click', (e) => {
      if (e.target === menuOverlay) {
        menuOverlay.classList.remove('active')
        burgerMenu.classList.remove('active')
      }
    })
    
    // Handle menu item clicks
    const menuItems = menuOverlay.querySelectorAll('[data-view]')
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
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

// Setup view control buttons
function setupViewControls() {
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
  
  // Update active states
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.classList.remove('active')
  })
  
  document.querySelectorAll(`[data-view="${view}"]`).forEach(btn => {
    btn.classList.add('active')
  })
  
  // Update body data attribute for CSS
  document.body.setAttribute('data-view', view)
  
  renderGrid(view)
}

// Create hex grid based on view type
function createHexGrid(view: string): Grid<CustomHex | VerticalHex> {
  switch (view) {
    case 'castle':
      return createCastleGrid()
    case 'dungeon':
      return createDungeonGrid()
    case 'hero':
      return createHeroGrid()
    case 'library':
      return createLibraryGrid()
    default:
      return createCastleGrid()
  }
}

// Create castle view grid (radial with terrain)
function createCastleGrid(): Grid<CustomHex> {
  const grid = new Grid(CustomHex, spiral({ radius: 5 }))
  
  grid.forEach(hex => {
    const distance = Math.max(Math.abs(hex.q), Math.abs(hex.r), Math.abs(hex.s))
    hex.radialDistance = distance
    
    // Calculate ring position (1-based index around the ring)
    if (distance === 0) {
      hex.ringPosition = 0
    } else {
      hex.ringPosition = calculateRingPosition(hex, distance)
    }
    
    // Assign terrain based on ring
    hex.terrain = getTerrainType(hex.radialDistance, hex.ringPosition)
  })
  
  return grid
}

// Calculate position within a ring (1-based)
function calculateRingPosition(hex: CustomHex, ring: number): number {
  if (ring === 0) return 0
  
  // Get all hexes in the same ring
  const ringHexes: Array<{hex: CustomHex, angle: number}> = []
  
  // For this specific hex, calculate its angle
  const angle = Math.atan2(hex.r, hex.q)
  const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle
  
  // Generate all hexes in this ring to find the position
  const ringGrid = new Grid(CustomHex, ring({ center: [0, 0], radius: ring }))
  
  ringGrid.forEach(ringHex => {
    const ringAngle = Math.atan2(ringHex.r, ringHex.q)
    const normalizedRingAngle = ringAngle < 0 ? ringAngle + 2 * Math.PI : ringAngle
    ringHexes.push({ hex: ringHex, angle: normalizedRingAngle })
  })
  
  // Sort by angle
  ringHexes.sort((a, b) => a.angle - b.angle)
  
  // Find position of current hex
  const position = ringHexes.findIndex(item => 
    item.hex.q === hex.q && item.hex.r === hex.r
  )
  
  return position + 1 // 1-based indexing
}

// Get terrain type based on ring and position
function getTerrainType(ring: number, ringPosition: number) {
  switch (ring) {
    case 0: return FIELDS          // Ring 0 - Castle (center)
    case 1: return FIELDS          // Ring 1 - Fields
    case 2: 
      // Ring 2 specific assignments
      if ([1, 2, 3, 4].includes(ringPosition)) {
        return FOREST  // 2/1, 2/2, 2/3, 2/4 - forest
      } else if ([5, 6].includes(ringPosition)) {
        return STEPPO  // 2/5, 2/6 - steppo
      } else if ([7, 8, 9, 12].includes(ringPosition)) {
        return FOREST  // 2/7, 2/8, 2/9, 2/12 - forest
      } else if ([10, 11].includes(ringPosition)) {
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

// Create dungeon view grid (vertical layout)
function createDungeonGrid(): Grid<VerticalHex> {
  const grid = new Grid(VerticalHex, rectangle({ width: 8, height: 12 }))
  
  grid.forEach((hex, index) => {
    hex.radialDistance = Math.floor(index / 8)
    hex.ringPosition = (index % 8) + 1
    hex.terrain = FIELDS
    
    // Add some variety to dungeon terrain
    if (Math.random() > 0.7) {
      hex.terrain = FOREST
    }
  })
  
  return grid
}

// Create hero view grid
function createHeroGrid(): Grid<CustomHex> {
  const grid = new Grid(CustomHex, rectangle({ width: 6, height: 6 }))
  
  grid.forEach((hex, index) => {
    hex.radialDistance = Math.floor(index / 6)
    hex.ringPosition = (index % 6) + 1
    hex.terrain = FIELDS
  })
  
  return grid
}

// Create library view grid
function createLibraryGrid(): Grid<CustomHex> {
  const grid = new Grid(CustomHex, rectangle({ width: 4, height: 4 }))
  
  grid.forEach((hex, index) => {
    hex.radialDistance = Math.floor(index / 4)
    hex.ringPosition = (index % 4) + 1
    hex.terrain = FIELDS
  })
  
  return grid
}

// Check if hex should be hidden based on distance
function shouldHideHex(distance: number): boolean {
  return currentView === 'castle' && distance > 5
}

function renderGrid(view: string) {
  const container = document.getElementById('container')
  if (!container) return

  // Clear container
  container.innerHTML = ''

  // Create main grid
  mainGrid = createHexGrid(view)

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
    polygon.setAttribute('fill', customHex.terrain.color)
    polygon.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)')
    polygon.setAttribute('stroke-width', '1')
    
    // Apply visibility effects if enabled
    if (showVisibility) {
      polygon.classList.add(`visibility-${customHex.visibility}`)
    }
    
    hexGroup.appendChild(polygon)

    // Add coordinate text if enabled
    if (showCoordinates) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('x', hex.x.toString())
      text.setAttribute('y', hex.y.toString())
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('dominant-baseline', 'central')
      text.setAttribute('fill', 'white')
      text.setAttribute('font-size', '10')
      text.setAttribute('font-weight', 'bold')
      text.textContent = `${customHex.radialDistance}/${customHex.ringPosition}`
      hexGroup.appendChild(text)
    }

    // Add terrain emoji for castle view
    if (view === 'castle') {
      const terrainText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      terrainText.setAttribute('x', hex.x.toString())
      terrainText.setAttribute('y', (hex.y + (showCoordinates ? 8 : 0)).toString())
      terrainText.setAttribute('text-anchor', 'middle')
      terrainText.setAttribute('dominant-baseline', 'central')
      terrainText.setAttribute('font-size', '16')
      terrainText.classList.add('terrain-text')
      
      // Special handling for center hex (castle)
      if (customHex.radialDistance === 0) {
        terrainText.textContent = '🏰'
        terrainText.setAttribute('font-size', '20')
      } else {
        terrainText.textContent = customHex.terrain.emoji
      }
      
      hexGroup.appendChild(terrainText)
    }

    mainGridGroup.appendChild(hexGroup)
    index++
  }

  container.appendChild(svg)

  // Apply 3D transformation for castle view
  if (view === 'castle') {
    svg.style.transformStyle = 'preserve-3d'
    svg.style.transform = `matrix3d(${cameraState.matrix.join(',')})`
  }

  setupInteractions(svg, mainGridGroup, gridWidth, gridHeight)
}

// Setup mouse/touch interactions
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
      sinY * sinX * cameraState.scale,
      sinY * cosX * cameraState.scale,
      0,
      0,
      cosX * cameraState.scale * 0.4,
      -sinX * cameraState.scale * 0.4,
      -0.002,
      -sinY * cameraState.scale,
      cosY * sinX * cameraState.scale,
      cosY * cosX * cameraState.scale,
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

  document.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY)
    }
  })

  document.addEventListener('touchend', handleEnd)

  // Wheel zoom
  svg.addEventListener('wheel', (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    cameraState.scale = Math.max(0.5, Math.min(3, cameraState.scale * delta))
    
    // Update matrix with new scale
    const cosX = Math.cos(cameraState.rotationX)
    const sinX = Math.sin(cameraState.rotationX)
    const cosY = Math.cos(cameraState.rotationY)
    const sinY = Math.sin(cameraState.rotationY)

    cameraState.matrix = [
      cosY * cameraState.scale,
      sinY * sinX * cameraState.scale,
      sinY * cosX * cameraState.scale,
      0,
      0,
      cosX * cameraState.scale * 0.4,
      -sinX * cameraState.scale * 0.4,
      -0.002,
      -sinY * cameraState.scale,
      cosY * sinX * cameraState.scale,
      cosY * cosX * cameraState.scale,
      0,
      cameraState.translateX,
      cameraState.translateY,
      0,
      1
    ]

    updateTransform()
  })

  // Handle window resize
  window.addEventListener('resize', () => {
    const newGridWidth = mainGrid.pixelWidth
    const newGridHeight = mainGrid.pixelHeight
    const newXOffset = (window.innerWidth - newGridWidth) / 2
    const newYOffset = (window.innerHeight - newGridHeight) / 2
    
    gridGroup.setAttribute('transform', `translate(${newXOffset}, ${newYOffset})`)
    
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
  })
}

// Create terrain legend
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
    colorBox.style.marginRight = '8px'
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init)