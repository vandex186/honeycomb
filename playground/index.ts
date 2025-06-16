import { SVG } from '@svgdotjs/svg.js'
import { defineHex, Grid, rectangle, HexCoordinates, Hex } from '../src'

// Define terrain types with colors and emojis
const TERRAIN_TYPES = {
  CASTLE: { color: '#8B4513', emoji: '🏰', name: 'Castle' },
  FIELDS: { color: '#FFD700', emoji: '🌾', name: 'Fields' },
  NORTH_FOREST: { color: '#1B4D3E', emoji: '🌲', name: 'North Forest' },
  FOREST: { color: '#2D5016', emoji: '🌲', name: 'Forest' },
  COAST: { color: '#4A90E2', emoji: '🏖️', name: 'Coast' },
  DEEP_BLUE: { color: '#1E3A8A', emoji: '🌊', name: 'Deep' },
  STEPPO: { color: '#8B7355', emoji: '🌿', name: 'Steppo' }
} as const

type TerrainType = keyof typeof TERRAIN_TYPES

// Custom hex class with additional properties
class CustomHex extends defineHex({ dimensions: 30, origin: 'topLeft' }) {
  radialDistance!: number
  ringPosition!: number
  visibility: 'undiscovered' | 'discovered' | 'visible' = 'undiscovered'
  terrain!: TerrainType
}

// Vertical hex class for dungeon view
class VerticalHex extends defineHex({ dimensions: 30, origin: 'topLeft' }) {
  radialDistance!: number
  ringPosition!: number
  visibility: 'undiscovered' | 'discovered' | 'visible' = 'undiscovered'
  terrain!: TerrainType
  level!: number
}

// Global variables
let mainGrid: Grid<CustomHex>
let currentView = 'castle'
let showCoordinates = false
let showVisibility = false

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

// FaceOnCamera effect variables
let mouseX = 0
let mouseY = 0
let windowCenterX = 0
let windowCenterY = 0

// Initialize face tracking
function initializeFaceTracking() {
  windowCenterX = window.innerWidth / 2
  windowCenterY = window.innerHeight / 2
  
  // Track mouse movement for face effect
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX
    mouseY = e.clientY
    updateFaceOnCameraEffect()
  })
  
  // Update window center on resize
  window.addEventListener('resize', () => {
    windowCenterX = window.innerWidth / 2
    windowCenterY = window.innerHeight / 2
  })
}

// Calculate face-on-camera transformation
function calculateFaceTransform(hexX: number, hexY: number) {
  // Calculate relative position from mouse to hex
  const deltaX = mouseX - hexX
  const deltaY = mouseY - hexY
  
  // Calculate distance from center
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  
  // Maximum tilt angle (in degrees)
  const maxTilt = 15
  
  // Calculate tilt based on distance and direction
  const tiltX = (deltaY / distance) * maxTilt * Math.min(distance / 200, 1)
  const tiltY = -(deltaX / distance) * maxTilt * Math.min(distance / 200, 1)
  
  // Ensure we don't get NaN values
  const safeTiltX = isNaN(tiltX) ? 0 : tiltX
  const safeTiltY = isNaN(tiltY) ? 0 : tiltY
  
  return {
    rotateX: safeTiltX,
    rotateY: safeTiltY,
    scale: 1 + Math.min(distance / 1000, 0.1) // Slight scale effect
  }
}

// Update all hex icons with face-on-camera effect
function updateFaceOnCameraEffect() {
  const hexIcons = document.querySelectorAll('.hex-face-icon')
  
  hexIcons.forEach((icon) => {
    const hexElement = icon.closest('.hex-group')
    if (!hexElement) return
    
    // Get hex position
    const rect = hexElement.getBoundingClientRect()
    const hexCenterX = rect.left + rect.width / 2
    const hexCenterY = rect.top + rect.height / 2
    
    // Calculate face transform
    const transform = calculateFaceTransform(hexCenterX, hexCenterY)
    
    // Apply transform with smooth transition
    const iconElement = icon as HTMLElement
    iconElement.style.transform = `
      perspective(1000px) 
      rotateX(${transform.rotateX}deg) 
      rotateY(${transform.rotateY}deg) 
      scale(${transform.scale})
    `
  })
}

// Get terrain type based on radial distance and ring position
function getTerrainType(radialDistance: number, ringPosition: number): TerrainType {
  switch (radialDistance) {
    case 0:
      return 'CASTLE'
    case 1:
      return 'FIELDS'
    case 2:
      // Ring 2 assignments
      if ([1, 2, 3, 4].includes(ringPosition)) {
        return 'FOREST' // 2/1, 2/2, 2/3, 2/4 - forest
      } else if ([5, 6].includes(ringPosition)) {
        return 'STEPPO' // 2/5, 2/6 - steppo
      } else if ([7, 8, 9, 12].includes(ringPosition)) {
        return 'FOREST' // 2/7, 2/8, 2/9, 2/12 - forest
      } else if ([10, 11].includes(ringPosition)) {
        return 'NORTH_FOREST' // 2/10, 2/11 - north forest
      } else {
        return 'FOREST' // Default for ring 2
      }
    case 3:
      // Ring 3 specific assignments
      if ([1, 2].includes(ringPosition)) {
        return 'COAST' // 3/1, 3/2 - coast
      } else if ([3, 4, 5, 6].includes(ringPosition)) {
        return 'STEPPO' // 3/3, 3/4, 3/5, 3/6 - steppo
      } else if ([7, 8].includes(ringPosition)) {
        return 'FIELDS' // 3/7, 3/8 - field
      } else if ([9, 10, 11, 12].includes(ringPosition)) {
        return 'FOREST' // 3/9, 3/10, 3/11, 3/12 - forest
      } else {
        return 'NORTH_FOREST' // Default for other positions in ring 3
      }
    case 4:
      return 'COAST'
    case 5:
      return 'DEEP_BLUE'
    default:
      return 'DEEP_BLUE'
  }
}

// Calculate radial distance from center
function calculateRadialDistance(q: number, r: number): number {
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r))
}

// Calculate ring position (1-based, clockwise from north)
function calculateRingPosition(q: number, r: number, radialDistance: number): number {
  if (radialDistance === 0) return 0
  
  const s = -q - r
  
  // Determine which edge of the ring this hex is on
  if (q === radialDistance) {
    // Right edge (SE to E to NE)
    return r + radialDistance + 1
  } else if (r === radialDistance) {
    // Bottom edge (S to SW)
    return radialDistance - q + radialDistance * 2 + 1
  } else if (s === radialDistance) {
    // Left edge (W to NW)
    return radialDistance - r + radialDistance * 4 + 1
  } else if (q === -radialDistance) {
    // Left edge (NW to N)
    return radialDistance - r + radialDistance * 4 + 1
  } else if (r === -radialDistance) {
    // Top edge (N to NE)
    return q + radialDistance + 1
  } else if (s === -radialDistance) {
    // Right edge (NE to E)
    return r + radialDistance + 1
  }
  
  return 1 // Fallback
}

// Create hex grid
function createHexGrid(): Grid<CustomHex> {
  const grid = new Grid(CustomHex, rectangle({ width: 11, height: 11, start: [-5, -5] }))
  
  // Set properties for each hex
  grid.forEach((hex) => {
    hex.radialDistance = calculateRadialDistance(hex.q, hex.r)
    hex.ringPosition = calculateRingPosition(hex.q, hex.r, hex.radialDistance)
    hex.terrain = getTerrainType(hex.radialDistance, hex.ringPosition)
    hex.visibility = hex.radialDistance <= 3 ? 'visible' : 'undiscovered'
  })
  
  return grid
}

// Create vertical hex grid for dungeon view
function createVerticalHexGrid(): Grid<VerticalHex> {
  const grid = new Grid(VerticalHex, rectangle({ width: 7, height: 15, start: [-3, -7] }))
  
  grid.forEach((hex) => {
    hex.radialDistance = Math.abs(hex.r)
    hex.ringPosition = hex.q + 4
    hex.level = -hex.r
    hex.terrain = hex.level === 0 ? 'CASTLE' : 
                  hex.level < 3 ? 'FIELDS' : 
                  hex.level < 6 ? 'FOREST' : 'DEEP_BLUE'
    hex.visibility = hex.level <= 2 ? 'visible' : 'undiscovered'
  })
  
  return grid
}

// Check if hex should be hidden based on view and distance
function shouldHideHex(radialDistance: number): boolean {
  if (currentView === 'castle') {
    return radialDistance > 5
  }
  return false
}

// Create terrain legend
function createTerrainLegend() {
  const existingLegend = document.querySelector('.terrain-legend')
  if (existingLegend) {
    existingLegend.remove()
  }

  const legend = document.createElement('div')
  legend.className = 'terrain-legend'
  legend.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 15px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 1000;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  `

  const title = document.createElement('div')
  title.textContent = '🗺️ Terrain Types'
  title.style.cssText = `
    font-weight: bold;
    margin-bottom: 10px;
    color: #FFD700;
    font-size: 16px;
  `
  legend.appendChild(title)

  Object.entries(TERRAIN_TYPES).forEach(([key, terrain]) => {
    const item = document.createElement('div')
    item.style.cssText = `
      display: flex;
      align-items: center;
      margin: 5px 0;
      gap: 8px;
    `
    
    const colorBox = document.createElement('div')
    colorBox.style.cssText = `
      width: 16px;
      height: 16px;
      background-color: ${terrain.color};
      border-radius: 3px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    `
    
    const emoji = document.createElement('span')
    emoji.textContent = terrain.emoji
    emoji.style.fontSize = '16px'
    
    const name = document.createElement('span')
    name.textContent = terrain.name
    name.style.color = 'white'
    
    item.appendChild(colorBox)
    item.appendChild(emoji)
    item.appendChild(name)
    legend.appendChild(item)
  })

  document.body.appendChild(legend)
}

function renderGrid(view: string) {
  const container = document.getElementById('container')
  if (!container) return

  // Clear container
  container.innerHTML = ''

  // Create terrain legend for castle view
  if (view === 'castle') {
    createTerrainLegend()
  } else {
    const existingLegend = document.querySelector('.terrain-legend')
    if (existingLegend) {
      existingLegend.remove()
    }
  }

  // Create or use appropriate grid
  if (view === 'dungeon') {
    const verticalGrid = createVerticalHexGrid()
    renderVerticalGrid(verticalGrid, container)
  } else {
    if (!mainGrid) {
      mainGrid = createHexGrid()
    }
    renderHexGrid(mainGrid, container, view)
  }
}

function renderVerticalGrid(grid: Grid<VerticalHex>, container: HTMLElement) {
  const svg = SVG().addTo(container).size('100%', '100%').addClass('hex-grid')
  
  const gridWidth = grid.pixelWidth
  const gridHeight = grid.pixelHeight
  const xOffset = (window.innerWidth - gridWidth) / 2
  const yOffset = (window.innerHeight - gridHeight) / 2
  
  const mainGridGroup = svg.group().translate(xOffset, yOffset)
  
  grid.forEach((hex) => {
    const terrain = TERRAIN_TYPES[hex.terrain]
    const hexGroup = mainGridGroup.group().addClass('hex-group')
    
    // Create hex polygon
    const polygon = hexGroup
      .polygon(hex.corners.map(({ x, y }) => `${x},${y}`).join(' '))
      .fill(terrain.color)
      .stroke({ width: 1, color: '#333' })
      .addClass(`visibility-${hex.visibility}`)
    
    // Add terrain emoji with face-on-camera effect
    const text = hexGroup
      .text(terrain.emoji)
      .font({ size: 20, anchor: 'middle', 'dominant-baseline': 'central' })
      .move(hex.x - 10, hex.y - 10)
      .addClass('hex-face-icon terrain-text')
      .css({
        'transition': 'transform 0.1s ease-out',
        'transform-style': 'preserve-3d'
      })
    
    // Add level number
    if (showCoordinates) {
      hexGroup
        .text(`L${hex.level}`)
        .font({ size: 10, anchor: 'middle', fill: '#fff' })
        .move(hex.x - 8, hex.y + 8)
        .addClass('cell-number')
    }
  })
  
  setupInteractions(svg, mainGridGroup, gridWidth, gridHeight)
}

function renderHexGrid(grid: Grid<CustomHex>, container: HTMLElement, view: string) {
  const svg = SVG().addTo(container).size('100%', '100%').addClass('hex-grid')
  
  const gridWidth = grid.pixelWidth
  const gridHeight = grid.pixelHeight
  const xOffset = (window.innerWidth - gridWidth) / 2
  const yOffset = (window.innerHeight - gridHeight) / 2
  
  const mainGridGroup = svg.group().translate(xOffset, yOffset)
  
  let index = 0
  grid.forEach((hex) => {
    // Skip hexes that should be hidden
    if (shouldHideHex(hex.radialDistance)) {
      index++
      return
    }
    
    const terrain = TERRAIN_TYPES[hex.terrain]
    const hexGroup = mainGridGroup.group().addClass('hex-group')
    
    // Create hex polygon
    const polygon = hexGroup
      .polygon(hex.corners.map(({ x, y }) => `${x},${y}`).join(' '))
      .fill(terrain.color)
      .stroke({ width: 1, color: '#333' })
      .addClass(`visibility-${hex.visibility}`)
    
    // Add terrain emoji with face-on-camera effect
    const text = hexGroup
      .text(terrain.emoji)
      .font({ size: 20, anchor: 'middle', 'dominant-baseline': 'central' })
      .move(hex.x - 10, hex.y - 10)
      .addClass('hex-face-icon terrain-text')
      .css({
        'transition': 'transform 0.1s ease-out',
        'transform-style': 'preserve-3d'
      })
    
    // Add coordinates or ring/position info
    if (showCoordinates) {
      const coordText = hex.radialDistance === 0 ? '0/0' : `${hex.radialDistance}/${hex.ringPosition}`
      hexGroup
        .text(coordText)
        .font({ size: 8, anchor: 'middle', fill: '#fff' })
        .move(hex.x - 12, hex.y + 8)
        .addClass('cell-number')
    }
    
    index++
  })

  setupInteractions(svg, mainGridGroup, gridWidth, gridHeight)
}

function setupInteractions(svg: any, mainGridGroup: any, gridWidth: number, gridHeight: number) {
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

    if (currentView === 'castle') {
      // 3D rotation for castle view
      cameraState.rotationY += deltaX * 0.01
      cameraState.rotationX -= deltaY * 0.01
      
      // Limit rotation
      cameraState.rotationX = Math.max(-Math.PI/3, Math.min(Math.PI/6, cameraState.rotationX))
      
      // Update 3D matrix
      const cosX = Math.cos(cameraState.rotationX)
      const sinX = Math.sin(cameraState.rotationX)
      const cosY = Math.cos(cameraState.rotationY)
      const sinY = Math.sin(cameraState.rotationY)
      
      cameraState.matrix = [
        cosY, sinY * sinX, sinY * cosX, 0,
        0, cosX, -sinX, 0,
        -sinY, cosY * sinX, cosY * cosX, 0,
        cameraState.translateX, cameraState.translateY, 0, 1
      ]
    } else {
      // 2D pan for other views
      cameraState.translateX += deltaX
      cameraState.translateY += deltaY
      cameraState.matrix[12] = cameraState.translateX
      cameraState.matrix[13] = cameraState.translateY
    }

    updateTransform()
    cameraState.lastX = x
    cameraState.lastY = y
  }

  function handleEnd() {
    cameraState.isDragging = false
  }

  // Mouse events
  svg.node.addEventListener('mousedown', (e: MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientX, e.clientY)
  })

  document.addEventListener('mousemove', (e: MouseEvent) => {
    handleMove(e.clientX, e.clientY)
  })

  document.addEventListener('mouseup', handleEnd)

  // Touch events
  svg.node.addEventListener('touchstart', (e: TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY)
    }
  })

  document.addEventListener('touchmove', (e: TouchEvent) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY)
    }
  })

  document.addEventListener('touchend', handleEnd)

  // Zoom with mouse wheel
  svg.node.addEventListener('wheel', (e: WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    cameraState.scale *= zoomFactor
    
    // Apply zoom to matrix
    for (let i = 0; i < 12; i++) {
      if (i % 4 !== 3) { // Don't scale translation components
        cameraState.matrix[i] *= (e.deltaY > 0 ? 0.9 : 1.1)
      }
    }
    
    updateTransform()
  })

  // Handle window resize
  window.addEventListener('resize', () => {
    const newGridWidth = mainGrid?.pixelWidth || gridWidth
    const newGridHeight = mainGrid?.pixelHeight || gridHeight
    const newXOffset = (window.innerWidth - newGridWidth) / 2
    const newYOffset = (window.innerHeight - newGridHeight) / 2
    
    mainGridGroup.translate(newXOffset, newYOffset)
    
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
  })
}

// Navigation and UI setup
function setupNavigation() {
  // Handle navigation buttons
  document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement
      const view = target.dataset.view
      if (view) {
        switchView(view)
      }
    })
  })

  // Handle burger menu
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

  // Handle menu items
  document.querySelectorAll('.menu-item[data-view]').forEach(item => {
    item.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement
      const view = target.dataset.view
      if (view) {
        switchView(view)
        menuOverlay?.classList.remove('active')
        burgerMenu?.classList.remove('active')
      }
    })
  })

  // Handle toggle buttons
  const coordinatesToggle = document.getElementById('coordinates-toggle')
  const visibilityToggle = document.getElementById('visibility-toggle')

  coordinatesToggle?.addEventListener('click', () => {
    showCoordinates = !showCoordinates
    renderGrid(currentView)
  })

  visibilityToggle?.addEventListener('click', () => {
    showVisibility = !showVisibility
    document.querySelectorAll('.hex-grid polygon').forEach(polygon => {
      polygon.classList.toggle('visibility-overlay', showVisibility)
    })
  })
}

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
  
  // Reset camera
  cameraState.matrix = [1, 0, 0, 0, 0, 0.4, 0, -0.002, 0, 0, 1, 0, 0, 0, 0, 1]
  cameraState.rotationX = 0
  cameraState.rotationY = 0
  cameraState.scale = 1
  cameraState.translateX = 0
  cameraState.translateY = 0
  
  renderGrid(view)
}

function showLibraryContent() {
  const container = document.getElementById('container')
  if (!container) return

  container.innerHTML = `
    <div class="library-container">
      <div class="library-header">
        <h1 class="library-title">📚 Game Library</h1>
        <p class="library-subtitle">Explore the world of GoldenGoose</p>
      </div>
      
      <div class="library-categories">
        <div class="category-section">
          <h2 class="category-title">🎮 Game Elements</h2>
          <div class="category-buttons">
            <button class="library-button" onclick="showContentPage('🪐', 'About', 'Learn about the mystical world of GoldenGoose and its ancient hexagonal realms.')">
              <div class="library-button-icon">🪐</div>
              <div class="library-button-text">About</div>
            </button>
            <button class="library-button" onclick="showContentPage('🧸', 'Monsters', 'Discover the creatures that roam the hexagonal lands.')">
              <div class="library-button-icon">🧸</div>
              <div class="library-button-text">Monsters</div>
            </button>
            <button class="library-button" onclick="showContentPage('❤️‍🔥', 'Hearts', 'Understanding the life force that powers your adventures.')">
              <div class="library-button-icon">❤️‍🔥</div>
              <div class="library-button-text">Hearts</div>
            </button>
            <button class="library-button" onclick="showContentPage('🛠', 'Craft', 'Master the art of creating powerful items and tools.')">
              <div class="library-button-icon">🛠</div>
              <div class="library-button-text">Craft</div>
            </button>
          </div>
        </div>
        
        <div class="category-section">
          <h2 class="category-title">🌍 World & Environment</h2>
          <div class="category-buttons">
            <button class="library-button" onclick="showContentPage('🌳', 'Flora', 'Explore the diverse plant life across different terrains.')">
              <div class="library-button-icon">🌳</div>
              <div class="library-button-text">Flora</div>
            </button>
            <button class="library-button" onclick="showContentPage('🌺', 'Ingredients', 'Gather magical components for crafting and alchemy.')">
              <div class="library-button-icon">🌺</div>
              <div class="library-button-text">Ingredients</div>
            </button>
            <button class="library-button" onclick="showContentPage('🫀', 'Loot', 'Discover treasures hidden throughout the realm.')">
              <div class="library-button-icon">🫀</div>
              <div class="library-button-text">Loot</div>
            </button>
            <button class="library-button" onclick="showContentPage('⛳', 'Lands', 'Navigate through diverse terrains and biomes.')">
              <div class="library-button-icon">⛳</div>
              <div class="library-button-text">Lands</div>
            </button>
          </div>
        </div>
        
        <div class="category-section">
          <h2 class="category-title">🏗️ Structures & Life</h2>
          <div class="category-buttons">
            <button class="library-button" onclick="showContentPage('🏨', 'Buildings', 'Construct and upgrade various structures.')">
              <div class="library-button-icon">🏨</div>
              <div class="library-button-text">Buildings</div>
            </button>
            <button class="library-button" onclick="showContentPage('🐇', 'Animals', 'Meet the wildlife that inhabits each terrain type.')">
              <div class="library-button-icon">🐇</div>
              <div class="library-button-text">Animals</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
}

// Global function for content pages
;(window as any).showContentPage = function(icon: string, title: string, description: string) {
  const container = document.getElementById('container')
  if (!container) return

  container.innerHTML = `
    <div class="content-page">
      <div class="content-header">
        <div class="content-title">
          <span style="font-size: 2rem; margin-right: 10px;">${icon}</span>
          ${title}
        </div>
        <button class="back-button" onclick="showLibraryContent()">← Back to Library</button>
      </div>
      <div class="content-body">
        <p>${description}</p>
        <p>This section is under development. More detailed information about ${title.toLowerCase()} will be available soon!</p>
      </div>
    </div>
  `
}

// Global function to show library content
;(window as any).showLibraryContent = showLibraryContent

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initializeFaceTracking()
  setupNavigation()
  switchView('castle') // Start with castle view
})