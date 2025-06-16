import { SVG } from '@svgdotjs/svg.js'
import { defineHex, Grid, rectangle, ring } from '../src'

// Define hex class with custom properties
class GameHex extends defineHex({ 
  dimensions: 30, 
  orientation: 'POINTY' as const,
  origin: 'topLeft' as const 
}) {
  terrain: string = 'unknown'
  ringNumber: number = 0
  ringPosition: number = 0
  visibility: 'undiscovered' | 'discovered' | 'visible' = 'undiscovered'
}

// Create the main grid
const mainGrid = new Grid(GameHex, rectangle({ width: 9, height: 9, start: [-4, -4] }))

// Terrain mapping based on ring/position
const terrainMap: Record<string, string> = {
  // Ring 0 (center)
  '0/1': 'castle',
  
  // Ring 1
  '1/1': 'field', '1/2': 'field', '1/3': 'field', '1/4': 'field', '1/5': 'field', '1/6': 'field',
  
  // Ring 2
  '2/1': 'forest', '2/2': 'forest', '2/3': 'forest', '2/4': 'forest',
  '2/5': 'steppe', '2/6': 'steppe',
  '2/7': 'forest', '2/8': 'forest', '2/9': 'forest', '2/12': 'forest',
  '2/10': 'north_forest', '2/11': 'north_forest',
  
  // Ring 3
  '3/1': 'coast', '3/2': 'coast',
  '3/3': 'steppe', '3/4': 'steppe', '3/5': 'steppe', '3/6': 'steppe',
  '3/7': 'field', '3/8': 'field',
  '3/9': 'forest', '3/10': 'forest', '3/11': 'forest', '3/12': 'forest'
}

// Assign ring numbers and terrain
mainGrid.forEach(hex => {
  const distance = Math.max(Math.abs(hex.q), Math.abs(hex.r), Math.abs(hex.s))
  hex.ringNumber = distance
  
  if (distance === 0) {
    hex.ringPosition = 1
    hex.terrain = 'castle'
    hex.visibility = 'visible'
  } else {
    // Calculate position in ring (simplified)
    const ringSize = distance * 6
    hex.ringPosition = Math.floor(Math.random() * ringSize) + 1
    const terrainKey = `${hex.ringNumber}/${hex.ringPosition}`
    hex.terrain = terrainMap[terrainKey] || 'unknown'
    hex.visibility = distance <= 2 ? 'visible' : 'undiscovered'
  }
})

// Terrain colors
const terrainColors: Record<string, string> = {
  castle: '#8B0000',
  field: '#FFD700',
  forest: '#228B22',
  steppe: '#DEB887',
  north_forest: '#006400',
  coast: '#4169E1',
  unknown: '#696969'
}

// Create SVG container
const container = document.getElementById('container')!
const svg = SVG().addTo(container).size('100%', '100%').addClass('hex-grid')

// Create main visual grid group
const mainGridGroup = svg.group().addClass('main-grid-group')

// Create interactive layer group
const interactiveLayerGroup = svg.group().addClass('interactive-layer-group')

// Render main visual hexes
mainGrid.forEach(hex => {
  const polygon = mainGridGroup
    .polygon(hex.corners.map(({ x, y }) => `${x},${y}`).join(' '))
    .fill(terrainColors[hex.terrain])
    .stroke({ width: 1, color: '#333' })
    .addClass(`hex-${hex.terrain}`)
    .addClass(`visibility-${hex.visibility}`)

  // Add ring/position text
  if (hex.ringNumber > 0) {
    mainGridGroup
      .text(`${hex.ringNumber}/${hex.ringPosition}`)
      .font({
        size: 8,
        anchor: 'middle',
        'dominant-baseline': 'central',
        fill: '#fff',
        weight: 'bold'
      })
      .move(hex.x - 15, hex.y - 4)
      .addClass('ring-text')
  }
})

// Create interactive layer with same transform
function createInteractiveLayer() {
  // Clear existing interactive elements
  interactiveLayerGroup.clear()
  
  // Get the current transform matrix from main grid
  const mainGridTransform = mainGridGroup.transform()
  
  // Apply the same transform to interactive layer
  interactiveLayerGroup.transform(mainGridTransform)
  
  mainGrid.forEach(hex => {
    // Create invisible clickable area for each hex
    const interactiveArea = interactiveLayerGroup
      .polygon(hex.corners.map(({ x, y }) => `${x},${y}`).join(' '))
      .fill('transparent')
      .stroke('none')
      .addClass('hex-interactive-area')
      .style('cursor: pointer')
      .data('hex-coords', `${hex.q},${hex.r}`)
    
    // Add click handler
    interactiveArea.click(() => {
      console.log(`Clicked hex at ${hex.q},${hex.r} - Ring ${hex.ringNumber}/${hex.ringPosition} - ${hex.terrain}`)
    })
    
    // Create text container for each hex
    const textContainer = interactiveLayerGroup
      .foreignObject(60, 30)
      .move(hex.x - 30, hex.y + 10) // Position at bottom of hex
      .addClass('central-hex-text')
    
    // Add HTML content to text container
    textContainer.add('xhtml', `
      <div style="
        width: 60px; 
        height: 30px; 
        display: flex; 
        align-items: flex-end; 
        justify-content: center;
        pointer-events: none;
      ">
        ${hex.terrain === 'castle' ? 
          '<span class="castle-icon-field" style="font-size: 24px; color: #FFD700; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8); font-weight: bold; line-height: 1; margin-bottom: 5px;">🏰</span>' : 
          ''
        }
      </div>
    `)
  })
}

// Initial creation of interactive layer
createInteractiveLayer()

// 3D Transform controls
let rotationX = -20
let rotationY = 0
let rotationZ = 0
let scale = 1
let translateX = 0
let translateY = 0

function updateTransform() {
  const transform = `
    perspective(1000px)
    rotateX(${rotationX}deg)
    rotateY(${rotationY}deg)
    rotateZ(${rotationZ}deg)
    scale(${scale})
    translate(${translateX}px, ${translateY}px)
  `
  
  // Apply transform to both main grid and interactive layer
  mainGridGroup.style('transform', transform)
  interactiveLayerGroup.style('transform', transform)
}

// Apply initial transform
updateTransform()

// Mouse controls for 3D rotation
let isDragging = false
let lastMouseX = 0
let lastMouseY = 0

svg.on('mousedown', (e: MouseEvent) => {
  isDragging = true
  lastMouseX = e.clientX
  lastMouseY = e.clientY
  e.preventDefault()
})

document.addEventListener('mousemove', (e: MouseEvent) => {
  if (!isDragging) return
  
  const deltaX = e.clientX - lastMouseX
  const deltaY = e.clientY - lastMouseY
  
  rotationY += deltaX * 0.5
  rotationX -= deltaY * 0.5
  
  // Clamp rotation
  rotationX = Math.max(-60, Math.min(60, rotationX))
  
  updateTransform()
  
  lastMouseX = e.clientX
  lastMouseY = e.clientY
})

document.addEventListener('mouseup', () => {
  isDragging = false
})

// Zoom controls
svg.on('wheel', (e: WheelEvent) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  scale = Math.max(0.3, Math.min(3, scale * delta))
  updateTransform()
})

// Touch controls for mobile
let lastTouchDistance = 0

svg.on('touchstart', (e: TouchEvent) => {
  if (e.touches.length === 2) {
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    lastTouchDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    )
  } else if (e.touches.length === 1) {
    isDragging = true
    lastMouseX = e.touches[0].clientX
    lastMouseY = e.touches[0].clientY
  }
  e.preventDefault()
})

svg.on('touchmove', (e: TouchEvent) => {
  if (e.touches.length === 2) {
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    const distance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    )
    
    if (lastTouchDistance > 0) {
      const delta = distance / lastTouchDistance
      scale = Math.max(0.3, Math.min(3, scale * delta))
      updateTransform()
    }
    
    lastTouchDistance = distance
  } else if (e.touches.length === 1 && isDragging) {
    const deltaX = e.touches[0].clientX - lastMouseX
    const deltaY = e.touches[0].clientY - lastMouseY
    
    rotationY += deltaX * 0.5
    rotationX -= deltaY * 0.5
    
    rotationX = Math.max(-60, Math.min(60, rotationX))
    
    updateTransform()
    
    lastMouseX = e.touches[0].clientX
    lastMouseY = e.touches[0].clientY
  }
  e.preventDefault()
})

svg.on('touchend', () => {
  isDragging = false
  lastTouchDistance = 0
})

// Visibility toggle
const visibilityToggle = document.getElementById('visibility-toggle')
let showVisibilityGrid = false

visibilityToggle?.addEventListener('click', () => {
  showVisibilityGrid = !showVisibilityGrid
  
  if (showVisibilityGrid) {
    mainGridGroup.addClass('show-visibility')
  } else {
    mainGridGroup.removeClass('show-visibility')
  }
})

// Coordinates toggle
const coordinatesToggle = document.getElementById('coordinates-toggle')
let showCoordinates = true

coordinatesToggle?.addEventListener('click', () => {
  showCoordinates = !showCoordinates
  
  const ringTexts = mainGridGroup.find('.ring-text')
  ringTexts.forEach((text: any) => {
    text.style('display', showCoordinates ? 'block' : 'none')
  })
})

// Navigation handling
const navButtons = document.querySelectorAll('[data-view]')
const currentView = 'castle'

navButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    const view = (e.target as HTMLElement).dataset.view
    if (view) {
      // Remove active class from all buttons
      navButtons.forEach(btn => btn.classList.remove('active'))
      // Add active class to clicked button
      button.classList.add('active')
      
      // Update body data attribute
      document.body.setAttribute('data-view', view)
      
      console.log(`Switched to ${view} view`)
    }
  })
})

// Set initial active state
document.querySelector(`[data-view="${currentView}"]`)?.classList.add('active')
document.body.setAttribute('data-view', currentView)

// Menu handling
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

// Menu item navigation
const menuItems = document.querySelectorAll('.menu-item[data-view]')
menuItems.forEach(item => {
  item.addEventListener('click', (e) => {
    const view = (e.currentTarget as HTMLElement).dataset.view
    if (view) {
      // Close menu
      menuOverlay?.classList.remove('active')
      burgerMenu?.classList.remove('active')
      
      // Update navigation
      navButtons.forEach(btn => btn.classList.remove('active'))
      document.querySelector(`[data-view="${view}"]`)?.classList.add('active')
      document.body.setAttribute('data-view', view)
      
      console.log(`Switched to ${view} view from menu`)
    }
  })
})