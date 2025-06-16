import { defineHex, Grid, rectangle, spiral, ring } from '../src'

// Define terrain types with colors and emojis
const TERRAIN_TYPES = {
  CASTLE: { color: '#8B4513', emoji: '🛖', name: 'Castle' },
  FIELDS: { color: '#FFD700', emoji: '🌾', name: 'Fields' },
  FOREST: { color: '#2D5016', emoji: '🌲', name: 'Forest' },
  NORTH_FOREST: { color: '#1B4332', emoji: '🌲', name: 'North Forest' },
  COAST: { color: '#4682B4', emoji: '🏖️', name: 'Coast' },
  DEEP_BLUE: { color: '#191970', emoji: '🌊', name: 'Deep Blue' },
  STEPPO: { color: '#8B7355', emoji: '🌿', name: 'Steppo' }
} as const

// Extract terrain constants
const { CASTLE, FIELDS, FOREST, NORTH_FOREST, COAST, DEEP_BLUE, STEPPO } = TERRAIN_TYPES

// Define hex class with custom properties
class CustomHex extends defineHex({ dimensions: 30, origin: 'topLeft' }) {
  radialDistance!: number
  ringPosition!: number
  visibility: 'undiscovered' | 'discovered' | 'visible' = 'undiscovered'
  terrain!: keyof typeof TERRAIN_TYPES
}

// Define vertical hex class for dungeon view
class VerticalHex extends defineHex({ dimensions: 25, origin: 'topLeft' }) {
  radialDistance!: number
  ringPosition!: number
  visibility: 'undiscovered' | 'discovered' | 'visible' = 'undiscovered'
  terrain!: keyof typeof TERRAIN_TYPES
  level!: number
}

// Game state
let currentView: string = 'castle'
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
  setupEventListeners()
  switchView('castle')
}

// Set up event listeners
function setupEventListeners() {
  // Navigation buttons
  document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement
      const view = target.dataset.view
      if (view) {
        switchView(view)
      }
    })
  })

  // Toggle buttons
  const coordinatesToggle = document.getElementById('coordinates-toggle')
  const visibilityToggle = document.getElementById('visibility-toggle')

  coordinatesToggle?.addEventListener('click', () => {
    showCoordinates = !showCoordinates
    if (currentView === 'castle') {
      renderGrid(currentView)
    }
  })

  visibilityToggle?.addEventListener('click', () => {
    showVisibility = !showVisibility
    if (currentView === 'castle') {
      renderGrid(currentView)
    }
  })

  // Menu functionality
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

  // Menu item clicks
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
}

// Switch between different views
function switchView(view: string) {
  currentView = view
  
  // Update active states
  document.querySelectorAll('[data-view]').forEach(button => {
    button.classList.toggle('active', button.getAttribute('data-view') === view)
  })
  
  // Update body data attribute for CSS
  document.body.setAttribute('data-view', view)
  
  // Render the appropriate content
  switch (view) {
    case 'castle':
      renderGrid('castle')
      break
    case 'dungeon':
      renderGrid('dungeon')
      break
    case 'hero':
      renderHeroView()
      break
    case 'library':
      renderLibraryView()
      break
    default:
      renderGrid('castle')
  }
}

// Create castle grid (radial/spiral pattern)
function createCastleGrid(): Grid<CustomHex> {
  const hexes: CustomHex[] = []
  
  // Create center hex (castle)
  const centerHex = new CustomHex([0, 0])
  centerHex.radialDistance = 0
  centerHex.ringPosition = 0
  centerHex.terrain = 'CASTLE'
  centerHex.visibility = 'visible'
  hexes.push(centerHex)
  
  // Create rings around the center
  for (let radius = 1; radius <= 5; radius++) {
    const ringHexes = new Grid(CustomHex, ring({ center: [0, 0], radius })).toArray()
    
    ringHexes.forEach((hex, index) => {
      const customHex = new CustomHex([hex.q, hex.r])
      customHex.radialDistance = radius
      customHex.ringPosition = index + 1
      customHex.terrain = getTerrainType(radius, index + 1)
      customHex.visibility = radius <= 2 ? 'visible' : 'undiscovered'
      hexes.push(customHex)
    })
  }
  
  return new Grid(CustomHex, hexes)
}

// Create dungeon grid (vertical levels)
function createDungeonGrid(): Grid<VerticalHex> {
  const hexes: VerticalHex[] = []
  
  // Create multiple levels
  for (let level = 0; level < 5; level++) {
    for (let radius = 0; radius <= 3; radius++) {
      if (radius === 0) {
        // Center hex for each level
        const centerHex = new VerticalHex([0, level * 8])
        centerHex.radialDistance = 0
        centerHex.ringPosition = 0
        centerHex.level = level
        centerHex.terrain = level === 0 ? 'CASTLE' : 'FOREST'
        centerHex.visibility = 'visible'
        hexes.push(centerHex)
      } else {
        // Ring hexes for each level
        const ringHexes = new Grid(VerticalHex, ring({ center: [0, level * 8], radius })).toArray()
        
        ringHexes.forEach((hex, index) => {
          const customHex = new VerticalHex([hex.q, hex.r])
          customHex.radialDistance = radius
          customHex.ringPosition = index + 1
          customHex.level = level
          customHex.terrain = getDungeonTerrainType(level, radius, index + 1)
          customHex.visibility = radius <= 1 ? 'visible' : 'undiscovered'
          hexes.push(customHex)
        })
      }
    }
  }
  
  return new Grid(VerticalHex, hexes)
}

// Get terrain type based on ring and position
function getTerrainType(ring: number, ringPosition: number): keyof typeof TERRAIN_TYPES {
  switch (ring) {
    case 0: return 'CASTLE'      // Ring 0 - Castle (center)
    case 1:
      // Ring 1 specific assignments
      if ([1, 2, 3].includes(ringPosition)) {
        return 'FOREST'  // 1/1, 1/2, 1/3 - forest
      } else if ([4, 5, 6].includes(ringPosition)) {
        return 'NORTH_FOREST'  // 1/4, 1/5, 1/6 - north forest
      } else {
        return 'FOREST'  // Default for other positions in ring 1
      }
    case 2:
      // Ring 2 specific assignments
      if ([1, 2, 3, 4].includes(ringPosition)) {
        return 'FOREST'  // 2/1, 2/2, 2/3, 2/4 - forest
      } else if ([5, 6].includes(ringPosition)) {
        return 'STEPPO'  // 2/5, 2/6 - steppo
      } else if ([7, 8, 9, 12].includes(ringPosition)) {
        return 'FOREST'  // 2/7, 2/8, 2/9, 2/12 - forest
      } else if ([10, 11].includes(ringPosition)) {
        return 'NORTH_FOREST'  // 2/10, 2/11 - north forest
      } else {
        return 'FOREST'  // Default for other positions in ring 2
      }
    case 3: return 'NORTH_FOREST'  // Ring 3 - North Forest (darker)
    case 4: return 'COAST'         // Ring 4 - Coast
    case 5: return 'DEEP_BLUE'     // Ring 5 - Deep Blue (outer ring)
    default: return 'FIELDS'
  }
}

// Get dungeon terrain type
function getDungeonTerrainType(level: number, ring: number, ringPosition: number): keyof typeof TERRAIN_TYPES {
  if (ring === 0) return level === 0 ? 'CASTLE' : 'FOREST'
  
  // Vary terrain by level and position
  const terrainOptions: (keyof typeof TERRAIN_TYPES)[] = ['FOREST', 'NORTH_FOREST', 'STEPPO']
  const index = (level + ring + ringPosition) % terrainOptions.length
  return terrainOptions[index]
}

// Check if hex should be hidden based on distance
function shouldHideHex(distance: number): boolean {
  return distance > 5
}

// Render hero view
function renderHeroView() {
  const container = document.getElementById('container')
  if (!container) return

  container.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: white;
      text-align: center;
      padding: 20px;
    ">
      <div style="font-size: 4rem; margin-bottom: 20px;">🦊</div>
      <h1 style="font-size: 2.5rem; margin-bottom: 20px; color: #FFD700;">Hero Profile</h1>
      <div style="
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 30px;
        max-width: 600px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      ">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; text-align: left;">
          <div>
            <h3 style="color: #FFD700; margin-bottom: 10px;">⚔️ Combat Stats</h3>
            <p>Attack: 85</p>
            <p>Defense: 72</p>
            <p>Speed: 90</p>
            <p>Magic: 68</p>
          </div>
          <div>
            <h3 style="color: #FFD700; margin-bottom: 10px;">🎒 Inventory</h3>
            <p>Gold: 1,250</p>
            <p>Potions: 15</p>
            <p>Weapons: 3</p>
            <p>Artifacts: 7</p>
          </div>
          <div>
            <h3 style="color: #FFD700; margin-bottom: 10px;">🏆 Achievements</h3>
            <p>Level: 25</p>
            <p>Experience: 15,750</p>
            <p>Quests: 42</p>
            <p>Victories: 128</p>
          </div>
          <div>
            <h3 style="color: #FFD700; margin-bottom: 10px;">🌟 Skills</h3>
            <p>Swordsmanship: Master</p>
            <p>Archery: Expert</p>
            <p>Magic: Adept</p>
            <p>Stealth: Expert</p>
          </div>
        </div>
      </div>
    </div>
  `
}

// Render library view
function renderLibraryView() {
  const container = document.getElementById('container')
  if (!container) return

  container.innerHTML = `
    <div class="library-container">
      <div class="library-header">
        <h1 class="library-title">📚 Knowledge Library</h1>
        <p class="library-subtitle">Discover the secrets of the realm</p>
      </div>
      
      <div class="library-categories">
        <div class="category-section">
          <h2 class="category-title">🏰 Realm</h2>
          <div class="category-buttons">
            <button class="library-button">
              <span class="library-button-icon">🪐</span>
              <span class="library-button-text">About</span>
            </button>
            <button class="library-button">
              <span class="library-button-icon">⛳</span>
              <span class="library-button-text">Lands</span>
            </button>
            <button class="library-button">
              <span class="library-button-icon">🏨</span>
              <span class="library-button-text">Buildings</span>
            </button>
          </div>
        </div>

        <div class="category-section">
          <h2 class="category-title">⚔️ Combat</h2>
          <div class="category-buttons">
            <button class="library-button">
              <span class="library-button-icon">🧸</span>
              <span class="library-button-text">Monsters</span>
            </button>
            <button class="library-button">
              <span class="library-button-icon">❤️‍🔥</span>
              <span class="library-button-text">Hearts</span>
            </button>
            <button class="library-button">
              <span class="library-button-icon">🫀</span>
              <span class="library-button-text">Loot</span>
            </button>
          </div>
        </div>

        <div class="category-section">
          <h2 class="category-title">🛠️ Crafting</h2>
          <div class="category-buttons">
            <button class="library-button">
              <span class="library-button-icon">🛠</span>
              <span class="library-button-text">Craft</span>
            </button>
            <button class="library-button">
              <span class="library-button-icon">🌳</span>
              <span class="library-button-text">Flora</span>
            </button>
            <button class="library-button">
              <span class="library-button-icon">🌺</span>
              <span class="library-button-text">Ingredients</span>
            </button>
            <button class="library-button">
              <span class="library-button-icon">🐇</span>
              <span class="library-button-text">Animals</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
}

function renderGrid(view: string) {
  const container = document.getElementById('container')
  if (!container) return

  // Create appropriate grid based on view
  if (view === 'castle') {
    mainGrid = createCastleGrid()
  } else if (view === 'dungeon') {
    mainGrid = createDungeonGrid()
  } else {
    return
  }

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

  // Apply 3D transformation for castle view
  if (view === 'castle') {
    svg.style.transformStyle = 'preserve-3d'
    svg.style.transform = `matrix3d(${cameraState.matrix.join(',')})`
  } else {
    svg.style.transform = 'none'
  }

  // Create legend for castle view
  if (view === 'castle') {
    createLegend(container)
  }

  // Render hexes
  let index = 0
  for (const hex of mainGrid) {
    const customHex = hex as CustomHex | VerticalHex
    
    // Skip hidden hexes for castle view
    if (view === 'castle' && shouldHideHex(customHex.radialDistance)) {
      index++
      continue
    }

    // Create hex group
    const hexGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    hexGroup.setAttribute('transform', `translate(${hex.x + xOffset}, ${hex.y + yOffset})`)

    // Get terrain info
    const terrain = TERRAIN_TYPES[customHex.terrain]

    // Create hex polygon
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    const points = hex.corners.map(corner => `${corner.x - hex.x},${corner.y - hex.y}`).join(' ')
    polygon.setAttribute('points', points)
    
    // Apply terrain color
    polygon.setAttribute('fill', terrain.color)
    polygon.setAttribute('stroke', 'rgba(255, 255, 255, 0.5)')
    polygon.setAttribute('stroke-width', '1')

    // Apply visibility effects
    if (showVisibility) {
      polygon.classList.add(`visibility-${customHex.visibility}`)
    }

    hexGroup.appendChild(polygon)

    // Add terrain emoji
    const terrainText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    terrainText.setAttribute('x', '0')
    terrainText.setAttribute('y', '-5')
    terrainText.setAttribute('text-anchor', 'middle')
    terrainText.setAttribute('dominant-baseline', 'middle')
    terrainText.setAttribute('font-size', '16')
    terrainText.classList.add('terrain-text')
    terrainText.textContent = terrain.emoji
    hexGroup.appendChild(terrainText)

    // Add coordinates if enabled
    if (showCoordinates) {
      const coordText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      coordText.setAttribute('x', '0')
      coordText.setAttribute('y', '8')
      coordText.setAttribute('text-anchor', 'middle')
      coordText.setAttribute('dominant-baseline', 'middle')
      coordText.setAttribute('font-size', '8')
      coordText.setAttribute('fill', 'white')
      coordText.textContent = `${customHex.radialDistance}/${customHex.ringPosition}`
      hexGroup.appendChild(coordText)
    }

    mainGridGroup.appendChild(hexGroup)
    index++
  }

  container.appendChild(svg)

  setupInteractions(svg, mainGridGroup, gridWidth, gridHeight)
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

  const title = document.createElement('h3')
  title.textContent = '🗺️ Terrain Legend'
  title.style.margin = '0 0 10px 0'
  title.style.color = '#FFD700'
  legend.appendChild(title)

  Object.entries(TERRAIN_TYPES).forEach(([key, terrain]) => {
    const item = document.createElement('div')
    item.style.display = 'flex'
    item.style.alignItems = 'center'
    item.style.marginBottom = '5px'
    
    const colorBox = document.createElement('span')
    colorBox.style.display = 'inline-block'
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

// Set up 3D interactions for castle view
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
      0, 
      0,
      0, 
      cosX * cameraState.scale * 0.4, 
      0, 
      -0.002,
      sinY * cameraState.scale, 
      -cosY * sinX * cameraState.scale, 
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

  function handleWheel(event: WheelEvent) {
    event.preventDefault()
    
    const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1
    cameraState.scale = Math.max(0.5, Math.min(3, cameraState.scale * scaleFactor))
    
    // Update matrix with new scale
    const cosX = Math.cos(cameraState.rotationX)
    const sinX = Math.sin(cameraState.rotationX)
    const cosY = Math.cos(cameraState.rotationY)
    const sinY = Math.sin(cameraState.rotationY)

    cameraState.matrix = [
      cosY * cameraState.scale, 
      sinY * sinX * cameraState.scale, 
      0, 
      0,
      0, 
      cosX * cameraState.scale * 0.4, 
      0, 
      -0.002,
      sinY * cameraState.scale, 
      -cosY * sinX * cameraState.scale, 
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

  // Handle window resize
  window.addEventListener('resize', () => {
    const newGridWidth = mainGrid.pixelWidth
    const newGridHeight = mainGrid.pixelHeight
    
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
  })
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init)