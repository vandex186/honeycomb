import { defineHex, Grid, rectangle, spiral, ring, Direction } from '../src'

// Define terrain types with colors and emojis
const TERRAIN_TYPES = {
  FIELDS: { color: '#FFD700', emoji: '🌾', name: 'Fields' },           // fl
  NORTH_FOREST: { color: '#1B4332', emoji: '🌲', name: 'North Forest' }, // nfr
  FOREST: { color: '#2D5016', emoji: '🌲', name: 'Forest' },          // fr
  COAST: { color: '#4A90E2', emoji: '🏖️', name: 'Coast' },           // cs
  DEEP_BLUE: { color: '#1E3A8A', emoji: '🌊', name: 'Deep Blue' },    // db
  STEPPO: { color: '#8B7355', emoji: '🌿', name: 'Steppo' }           // st
}

// Terrain constants for easier reference
const { FIELDS, NORTH_FOREST, FOREST, COAST, DEEP_BLUE, STEPPO } = TERRAIN_TYPES

// Define hex class with custom properties
const CustomHex = defineHex({
  dimensions: 30,
  orientation: 'POINTY' as any,
  origin: 'topLeft' as any
})

// Extended hex class with additional properties
class VerticalHex extends CustomHex {
  radialDistance: number = 0
  ringPosition: number = 0
  visibility: 'undiscovered' | 'discovered' | 'visible' = 'undiscovered'
  terrain: typeof TERRAIN_TYPES[keyof typeof TERRAIN_TYPES] = FIELDS

  constructor(coordinates?: any) {
    super(coordinates)
  }
}

// Create main grid
const mainGrid = new Grid(VerticalHex, spiral({ radius: 5 }))

// Calculate radial distance and ring position for each hex
mainGrid.forEach((hex) => {
  const distance = Math.max(Math.abs(hex.q), Math.abs(hex.r), Math.abs(hex.s))
  hex.radialDistance = distance
  
  if (distance === 0) {
    hex.ringPosition = 0
  } else {
    // Calculate position in ring based on spiral traversal
    const ringHexes = Array.from(new Grid(VerticalHex, ring({ center: [0, 0], radius: distance })))
    const hexIndex = ringHexes.findIndex(ringHex => ringHex.q === hex.q && ringHex.r === hex.r)
    hex.ringPosition = hexIndex + 1
  }
  
  // Assign terrain based on ring and position
  hex.terrain = getTerrainType(hex.radialDistance, hex.ringPosition)
})

// Get terrain type based on ring and position
function getTerrainType(ring: number, ringPosition: number) {
  switch (ring) {
    case 0: 
      return FIELDS // Castle center
      
    case 1:
      // Ring 1 assignments
      if ([1, 2, 3].includes(ringPosition)) {
        return FOREST  // 1/1=fr, 1/2=fr, 1/3=fr
      } else if ([4, 5, 6].includes(ringPosition)) {
        return NORTH_FOREST  // 1/4=nfr, 1/5=nfr, 1/6=nfr
      } else {
        return FOREST  // Default
      }
      
    case 2:
      // Ring 2 assignments
      if ([1, 2, 3, 4].includes(ringPosition)) {
        return FOREST  // 2/1=fr, 2/2=fr, 2/3=fr, 2/4=fr
      } else if ([5, 6].includes(ringPosition)) {
        return STEPPO  // 2/5=st, 2/6=st
      } else if ([7, 12].includes(ringPosition)) {
        return FOREST  // 2/7=fr, 2/12=fr
      } else if ([8, 9, 10, 11].includes(ringPosition)) {
        return NORTH_FOREST  // 2/8=nfr, 2/9=nfr, 2/10=nfr, 2/11=nfr
      } else {
        return FOREST  // Default
      }
      
    case 3:
      // Ring 3 assignments
      if ([1, 2].includes(ringPosition)) {
        return COAST  // 3/1=cs, 3/2=cs
      } else if ([3, 7, 8].includes(ringPosition)) {
        return FIELDS  // 3/3=fl, 3/7=fl, 3/8=fl
      } else if ([4, 5, 6, 9, 14, 15].includes(ringPosition)) {
        return STEPPO  // 3/4=st, 3/5=st, 3/6=st, 3/9=st, 3/14=st, 3/15=st
      } else if ([10, 18].includes(ringPosition)) {
        return FOREST  // 3/10=fr, 3/18=fr
      } else if ([11, 12, 13, 16, 17].includes(ringPosition)) {
        return NORTH_FOREST  // 3/11=nfr, 3/12=nfr, 3/13=nfr, 3/16=nfr, 3/17=nfr
      } else {
        return FIELDS  // Default
      }
      
    case 4: 
      return COAST  // Ring 4 - Coast
      
    case 5: 
      return DEEP_BLUE  // Ring 5 - Deep Blue (outer ring)
      
    default: 
      return FIELDS
  }
}

// Current view state
let currentView = 'castle'

// Visibility system
const VISIBILITY_RADIUS = 2

function updateVisibility() {
  mainGrid.forEach((hex) => {
    const distance = Math.max(Math.abs(hex.q), Math.abs(hex.r), Math.abs(hex.s))
    
    if (distance <= VISIBILITY_RADIUS) {
      hex.visibility = 'visible'
    } else if (distance <= VISIBILITY_RADIUS + 1) {
      hex.visibility = 'discovered'
    } else {
      hex.visibility = 'undiscovered'
    }
  })
}

// Initialize visibility
updateVisibility()

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

// Visibility toggle states
let showCoordinates = true
let showVisibilityGrid = false

function shouldHideHex(radialDistance: number): boolean {
  if (currentView !== 'castle') return false
  return radialDistance > 5
}

function renderGrid(view: string) {
  const container = document.getElementById('container')
  if (!container) return

  container.innerHTML = ''
  currentView = view

  if (view === 'library') {
    renderLibraryView(container)
    return
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.classList.add('hex-grid')
  
  const gridWidth = mainGrid.pixelWidth
  const gridHeight = mainGrid.pixelHeight
  
  svg.setAttribute('width', window.innerWidth.toString())
  svg.setAttribute('height', window.innerHeight.toString())
  svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
  
  const xOffset = (window.innerWidth - gridWidth) / 2
  const yOffset = (window.innerHeight - gridHeight) / 2
  
  const mainGridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  mainGridGroup.setAttribute('transform', `translate(${xOffset}, ${yOffset})`)
  
  // Create legend for castle view
  if (view === 'castle') {
    createLegend(svg)
  }
  
  let index = 0
  for (const hex of mainGrid) {
    const customHex = hex as VerticalHex
    
    if (shouldHideHex(customHex.radialDistance)) {
      index++
      continue
    }
    
    const hexGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    
    // Create hex polygon
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    const points = hex.corners.map(corner => `${corner.x},${corner.y}`).join(' ')
    polygon.setAttribute('points', points)
    
    // Apply terrain-based styling
    const terrain = customHex.terrain
    polygon.setAttribute('fill', terrain.color)
    polygon.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)')
    polygon.setAttribute('stroke-width', '1')
    
    // Apply visibility effects
    if (showVisibilityGrid) {
      switch (customHex.visibility) {
        case 'undiscovered':
          polygon.classList.add('visibility-undiscovered')
          break
        case 'discovered':
          polygon.classList.add('visibility-discovered')
          break
        case 'visible':
          polygon.classList.add('visibility-visible')
          break
      }
    }
    
    hexGroup.appendChild(polygon)
    
    // Add terrain emoji
    const terrainText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    terrainText.setAttribute('x', hex.x.toString())
    terrainText.setAttribute('y', (hex.y - 8).toString())
    terrainText.setAttribute('text-anchor', 'middle')
    terrainText.setAttribute('dominant-baseline', 'middle')
    terrainText.setAttribute('font-size', '16')
    terrainText.classList.add('terrain-text')
    terrainText.textContent = terrain.emoji
    hexGroup.appendChild(terrainText)
    
    // Add coordinates text (if enabled)
    if (showCoordinates) {
      const coordText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      coordText.setAttribute('x', hex.x.toString())
      coordText.setAttribute('y', (hex.y + 8).toString())
      coordText.setAttribute('text-anchor', 'middle')
      coordText.setAttribute('dominant-baseline', 'middle')
      coordText.setAttribute('font-size', '10')
      coordText.setAttribute('fill', 'white')
      
      if (customHex.radialDistance === 0) {
        coordText.textContent = '🏰'
        coordText.setAttribute('font-size', '20')
      } else {
        coordText.textContent = `${customHex.radialDistance}/${customHex.ringPosition}`
      }
      
      hexGroup.appendChild(coordText)
    }
    
    mainGridGroup.appendChild(hexGroup)
    index++
  }
  
  svg.appendChild(mainGridGroup)
  container.appendChild(svg)

  setupInteractions(svg, mainGridGroup, gridWidth, gridHeight)
}

function setupInteractions(svg: SVGElement, gridGroup: SVGElement, gridWidth: number, gridHeight: number) {
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

    cameraState.rotationY += deltaX * 0.01
    cameraState.rotationX += deltaY * 0.01

    cameraState.rotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 6, cameraState.rotationX))

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
  }, { passive: false })

  document.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY)
    }
  }, { passive: false })

  document.addEventListener('touchend', handleEnd)

  // Wheel zoom
  svg.addEventListener('wheel', (e) => {
    e.preventDefault()
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    cameraState.scale *= zoomFactor
    cameraState.scale = Math.max(0.5, Math.min(3, cameraState.scale))

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

  updateTransform()

  window.addEventListener('resize', () => {
    const newWidth = window.innerWidth
    const newHeight = window.innerHeight
    
    svg.setAttribute('width', newWidth.toString())
    svg.setAttribute('height', newHeight.toString())
    
    const xOffset = (newWidth - gridWidth) / 2
    const yOffset = (newHeight - gridHeight) / 2
    gridGroup.setAttribute('transform', `translate(${xOffset}, ${yOffset})`)
    
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
  })
}

function createLegend(svg: SVGElement) {
  const legend = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  legend.setAttribute('transform', 'translate(20, 120)')
  
  const legendItems = [
    { terrain: FIELDS, label: 'Fields' },
    { terrain: NORTH_FOREST, label: 'North Forest' },
    { terrain: FOREST, label: 'Forest' },
    { terrain: COAST, label: 'Coast' },
    { terrain: DEEP_BLUE, label: 'Deep' },
    { terrain: STEPPO, label: 'Steppo' }
  ]
  
  legendItems.forEach((item, index) => {
    const y = index * 30
    
    // Legend color box
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('x', '0')
    rect.setAttribute('y', y.toString())
    rect.setAttribute('width', '20')
    rect.setAttribute('height', '20')
    rect.setAttribute('fill', item.terrain.color)
    rect.setAttribute('stroke', 'white')
    rect.setAttribute('stroke-width', '1')
    legend.appendChild(rect)
    
    // Legend emoji
    const emoji = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    emoji.setAttribute('x', '10')
    emoji.setAttribute('y', (y + 15).toString())
    emoji.setAttribute('text-anchor', 'middle')
    emoji.setAttribute('font-size', '12')
    emoji.textContent = item.terrain.emoji
    legend.appendChild(emoji)
    
    // Legend text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    text.setAttribute('x', '30')
    text.setAttribute('y', (y + 15).toString())
    text.setAttribute('fill', 'white')
    text.setAttribute('font-size', '14')
    text.setAttribute('font-weight', 'bold')
    text.textContent = item.label
    legend.appendChild(text)
  })
  
  svg.appendChild(legend)
}

function renderLibraryView(container: HTMLElement) {
  const libraryHTML = `
    <div class="library-container">
      <div class="library-header">
        <h1 class="library-title">📚 Knowledge Library</h1>
        <p class="library-subtitle">Explore the vast knowledge of the realm</p>
      </div>
      
      <div class="library-categories">
        <div class="category-section">
          <h2 class="category-title">🎮 Game Systems</h2>
          <div class="category-buttons">
            <button class="library-button" onclick="showContent('play')">
              <div class="library-button-icon">🎮</div>
              <div class="library-button-text">Play</div>
            </button>
            <button class="library-button" onclick="showContent('earn')">
              <div class="library-button-icon">🪙</div>
              <div class="library-button-text">Earn</div>
            </button>
            <button class="library-button" onclick="showContent('trade')">
              <div class="library-button-icon">💸</div>
              <div class="library-button-text">Trade</div>
            </button>
            <button class="library-button" onclick="showContent('wallet')">
              <div class="library-button-icon">👛</div>
              <div class="library-button-text">Connect Wallet</div>
            </button>
          </div>
        </div>
        
        <div class="category-section">
          <h2 class="category-title">🌍 World & Lore</h2>
          <div class="category-buttons">
            <button class="library-button" onclick="showContent('about')">
              <div class="library-button-icon">🪐</div>
              <div class="library-button-text">About</div>
            </button>
            <button class="library-button" onclick="showContent('monsters')">
              <div class="library-button-icon">🧸</div>
              <div class="library-button-text">Monsters</div>
            </button>
            <button class="library-button" onclick="showContent('hearts')">
              <div class="library-button-icon">❤️‍🔥</div>
              <div class="library-button-text">Hearts</div>
            </button>
            <button class="library-button" onclick="showContent('craft')">
              <div class="library-button-icon">🛠</div>
              <div class="library-button-text">Craft</div>
            </button>
            <button class="library-button" onclick="showContent('flora')">
              <div class="library-button-icon">🌳</div>
              <div class="library-button-text">Flora</div>
            </button>
            <button class="library-button" onclick="showContent('ingredients')">
              <div class="library-button-icon">🌺</div>
              <div class="library-button-text">Ingredients</div>
            </button>
          </div>
        </div>
        
        <div class="category-section">
          <h2 class="category-title">🗺️ Exploration</h2>
          <div class="category-buttons">
            <button class="library-button" onclick="showContent('loot')">
              <div class="library-button-icon">🫀</div>
              <div class="library-button-text">Loot</div>
            </button>
            <button class="library-button" onclick="showContent('lands')">
              <div class="library-button-icon">⛳</div>
              <div class="library-button-text">Lands</div>
            </button>
            <button class="library-button" onclick="showContent('buildings')">
              <div class="library-button-icon">🏨</div>
              <div class="library-button-text">Buildings</div>
            </button>
            <button class="library-button" onclick="showContent('animals')">
              <div class="library-button-icon">🐇</div>
              <div class="library-button-text">Animals</div>
            </button>
          </div>
        </div>
        
        <div class="category-section">
          <h2 class="category-title">⚙️ Settings</h2>
          <div class="category-buttons">
            <button class="library-button" onclick="showContent('invite')">
              <div class="library-button-icon">👾</div>
              <div class="library-button-text">Invite Friends</div>
            </button>
            <button class="library-button" onclick="showContent('settings')">
              <div class="library-button-icon">⚙️</div>
              <div class="library-button-text">Settings</div>
            </button>
            <button class="library-button" onclick="showContent('exit')">
              <div class="library-button-icon">❌</div>
              <div class="library-button-text">Exit</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
  
  container.innerHTML = libraryHTML
}

// Global function for library content
;(window as any).showContent = function(contentType: string) {
  const container = document.getElementById('container')
  if (!container) return
  
  const contentMap: Record<string, { title: string; icon: string; content: string }> = {
    play: {
      title: 'Play',
      icon: '🎮',
      content: 'Welcome to the game! Here you can start your adventure, explore the hexagonal world, and engage in strategic gameplay. Use the navigation to move between different areas and discover new territories.'
    },
    earn: {
      title: 'Earn',
      icon: '🪙',
      content: 'Earn rewards through various activities: completing quests, exploring new territories, trading resources, and participating in community events. Your progress is tracked and rewarded with valuable tokens.'
    },
    trade: {
      title: 'Trade',
      icon: '💸',
      content: 'The trading system allows you to exchange resources, items, and tokens with other players. Access the marketplace to buy, sell, and auction your valuable discoveries.'
    },
    wallet: {
      title: 'Connect Wallet',
      icon: '👛',
      content: 'Connect your crypto wallet to securely store and manage your digital assets. Supported wallets include MetaMask, WalletConnect, and other popular Web3 wallets.'
    },
    about: {
      title: 'About',
      icon: '🪐',
      content: 'GoldenGoose is a strategic hexagonal grid game that combines exploration, resource management, and community interaction. Built on blockchain technology for true ownership of digital assets.'
    },
    monsters: {
      title: 'Monsters',
      icon: '🧸',
      content: 'Encounter various creatures throughout your journey. Each monster has unique abilities, weaknesses, and rewards. Study their patterns and develop strategies to overcome challenges.'
    },
    hearts: {
      title: 'Hearts',
      icon: '❤️‍🔥',
      content: 'Hearts represent your life force and energy. Manage them wisely during exploration and combat. Hearts can be restored through rest, items, or special locations.'
    },
    craft: {
      title: 'Craft',
      icon: '🛠',
      content: 'Combine resources and materials to create powerful items, tools, and equipment. Discover recipes through exploration and experimentation. Master crafting to gain advantages.'
    },
    flora: {
      title: 'Flora',
      icon: '🌳',
      content: 'The world is rich with diverse plant life. Each terrain type hosts unique flora that can be harvested for crafting, healing, or trading. Learn to identify valuable species.'
    },
    ingredients: {
      title: 'Ingredients',
      icon: '🌺',
      content: 'Gather ingredients from the environment to create potions, food, and magical items. Different terrains yield different ingredients with varying rarity and properties.'
    },
    loot: {
      title: 'Loot',
      icon: '🫀',
      content: 'Discover treasure chests, rare items, and valuable resources hidden throughout the world. Loot quality varies by location and exploration depth.'
    },
    lands: {
      title: 'Lands',
      icon: '⛳',
      content: 'Explore diverse terrains: forests, steppes, coasts, and deep waters. Each land type offers unique resources, challenges, and opportunities for discovery.'
    },
    buildings: {
      title: 'Buildings',
      icon: '🏨',
      content: 'Construct and upgrade buildings to enhance your capabilities. Buildings provide storage, crafting facilities, defensive structures, and community gathering spaces.'
    },
    animals: {
      title: 'Animals',
      icon: '🐇',
      content: 'Wildlife inhabits different terrains, each with unique behaviors and interactions. Some animals can be tamed, others provide resources, and some pose challenges.'
    },
    invite: {
      title: 'Invite Friends',
      icon: '👾',
      content: 'Invite friends to join your adventure! Share referral codes, form alliances, and explore together. Collaborative gameplay unlocks special rewards and experiences.'
    },
    settings: {
      title: 'Settings',
      icon: '⚙️',
      content: 'Customize your game experience: adjust graphics quality, sound settings, control preferences, and notification options. Personalize your interface and gameplay.'
    },
    exit: {
      title: 'Exit',
      icon: '❌',
      content: 'Thank you for playing! Your progress is automatically saved. You can return anytime to continue your adventure. Safe travels, explorer!'
    }
  }
  
  const content = contentMap[contentType]
  if (!content) return
  
  const contentHTML = `
    <div class="content-page">
      <div class="content-header">
        <div class="content-title">
          <span>${content.icon}</span>
          <span>${content.title}</span>
        </div>
        <button class="back-button" onclick="renderGrid('library')">← Back to Library</button>
      </div>
      <div class="content-body">
        <p>${content.content}</p>
      </div>
    </div>
  `
  
  container.innerHTML = contentHTML
}

// Navigation and menu functionality
document.addEventListener('DOMContentLoaded', () => {
  // Set initial view
  document.body.setAttribute('data-view', 'castle')
  renderGrid('castle')
  
  // Navigation buttons
  document.querySelectorAll('.nav-tab-button, .menu-item[data-view], .control-button[data-view]').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation()
      const target = e.currentTarget as HTMLElement
      const view = target.getAttribute('data-view')
      
      if (view) {
        // Update active states
        document.querySelectorAll('.nav-tab-button').forEach(btn => btn.classList.remove('active'))
        document.querySelectorAll('.nav-tab-button[data-view="' + view + '"]').forEach(btn => btn.classList.add('active'))
        
        // Update body data-view
        document.body.setAttribute('data-view', view)
        
        // Close menu if open
        closeMenu()
        
        // Render the appropriate view
        renderGrid(view)
      }
    })
  })
  
  // Toggle buttons
  const coordinatesToggle = document.getElementById('coordinates-toggle')
  const visibilityToggle = document.getElementById('visibility-toggle')
  
  coordinatesToggle?.addEventListener('click', () => {
    showCoordinates = !showCoordinates
    renderGrid(currentView)
  })
  
  visibilityToggle?.addEventListener('click', () => {
    showVisibilityGrid = !showVisibilityGrid
    renderGrid(currentView)
  })
  
  // Menu functionality
  const burgerMenu = document.getElementById('burger-menu')
  const menuOverlay = document.getElementById('menu-overlay')
  const closeMenuBtn = document.getElementById('close-menu')
  
  function openMenu() {
    menuOverlay?.classList.add('active')
    burgerMenu?.classList.add('active')
  }
  
  function closeMenu() {
    menuOverlay?.classList.remove('active')
    burgerMenu?.classList.remove('active')
  }
  
  burgerMenu?.addEventListener('click', (e) => {
    e.stopPropagation()
    if (menuOverlay?.classList.contains('active')) {
      closeMenu()
    } else {
      openMenu()
    }
  })
  
  closeMenuBtn?.addEventListener('click', closeMenu)
  
  menuOverlay?.addEventListener('click', (e) => {
    if (e.target === menuOverlay) {
      closeMenu()
    }
  })
  
  // Prevent menu close when clicking inside menu popup
  document.querySelector('.menu-popup')?.addEventListener('click', (e) => {
    e.stopPropagation()
  })
})