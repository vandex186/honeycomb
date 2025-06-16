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
let currentView = 'dungeon'
let showCoordinates = false
let showVisibility = false
let currentLibraryContent: string | null = null

// New Castle terrain type
const CASTLE = {
  type: 'Castle',
  passable: false,
  opaque: true,
}

// Avatar content data for different views
const avatarData = {
  dungeon: {
    title: 'Dungeon Explorer',
    stats: ['Level: 12', 'HP: 85/100', 'Gold: 1,250']
  },
  hero: {
    title: 'Hero Profile',
    stats: ['Strength: 18', 'Agility: 15', 'Magic: 12']
  },
  castle: {
    title: 'Castle Lord',
    stats: ['Territory: 5', 'Army: 250', 'Resources: 850']
  },
  library: {
    title: 'Scholar',
    stats: ['Books: 47', 'Spells: 23', 'Research: 89%']
  }
}

// Library content data
const libraryContent = {
  castle: {
    icon: '🏰',
    title: 'Castle Management',
    content: 'Learn about castle construction, defense strategies, and managing your stronghold. Includes blueprints for towers, walls, and fortifications.'
  },
  buildings: {
    icon: '🏢',
    title: 'Buildings & Structures',
    content: 'Comprehensive guide to all building types: residential, commercial, military, and special structures. Each building type has unique benefits and requirements.'
  },
  upgrades: {
    icon: '🪚',
    title: 'Upgrades & Improvements',
    content: 'Enhancement systems for buildings, weapons, and equipment. Learn about upgrade paths, resource requirements, and efficiency improvements.'
  },
  dungeons: {
    icon: '⛩',
    title: 'Dungeon Exploration',
    content: 'Complete guide to dungeon types, monster encounters, treasure locations, and survival strategies. Includes maps of known dungeons.'
  },
  clouds: {
    icon: '☁️',
    title: 'Weather & Climate',
    content: 'Understanding weather patterns, seasonal changes, and their effects on gameplay. Weather can affect travel, combat, and resource gathering.'
  },
  citizens: {
    icon: '👨‍⚕️',
    title: 'Citizens & NPCs',
    content: 'Information about different citizen types, their roles, needs, and how to manage population happiness and productivity.'
  },
  turns: {
    icon: '⏳',
    title: 'Turn Management',
    content: 'Strategic guide to turn-based gameplay, action points, time management, and optimizing your moves for maximum efficiency.'
  },
  lands: {
    icon: '⛳',
    title: 'Lands & Territories',
    content: 'Exploration of different land types, territorial control, expansion strategies, and managing multiple regions effectively.'
  },
  animals: {
    icon: '🐑',
    title: 'Animals & Livestock',
    content: 'Guide to animal husbandry, wildlife management, breeding programs, and the benefits of different animal types.'
  },
  flora: {
    icon: '🌳',
    title: 'Flora & Vegetation',
    content: 'Botanical knowledge including medicinal plants, rare herbs, magical flora, and their uses in crafting and alchemy.'
  },
  food: {
    icon: '🍎',
    title: 'Food & Nutrition',
    content: 'Food production, preservation techniques, nutritional benefits, and special recipes that provide gameplay bonuses.'
  },
  resources: {
    icon: '💎',
    title: 'Resources & Materials',
    content: 'Complete catalog of all resources: common materials, rare gems, magical components, and their applications in crafting.'
  },
  structures: {
    icon: '🏠',
    title: 'Structures & Architecture',
    content: 'Architectural principles, structural engineering, and design patterns for creating efficient and beautiful constructions.'
  },
  objects: {
    icon: '🗿',
    title: 'Objects & Artifacts',
    content: 'Catalog of special objects, ancient artifacts, magical items, and their historical significance and powers.'
  },
  budget: {
    icon: '💰',
    title: 'Budget & Economics',
    content: 'Financial management, trade systems, taxation, resource allocation, and economic strategies for prosperity.'
  },
  hero: {
    icon: '🐵',
    title: 'Hero Development',
    content: 'Character progression, skill trees, attribute development, and strategies for creating powerful hero builds.'
  },
  level: {
    icon: '🏆',
    title: 'Level & Experience',
    content: 'Experience systems, leveling mechanics, milestone rewards, and progression optimization strategies.'
  },
  weapon: {
    icon: '🗡',
    title: 'Weapons & Combat',
    content: 'Weapon types, combat mechanics, fighting techniques, and weapon enhancement systems for maximum effectiveness.'
  },
  gestures: {
    icon: '✌️',
    title: 'Gestures & Commands',
    content: 'Control schemes, gesture commands, hotkeys, and interface optimization for efficient gameplay.'
  },
  magic: {
    icon: '🔥',
    title: 'Magic & Spells',
    content: 'Magical systems, spell casting, mana management, elemental magic, and advanced magical techniques.'
  },
  aspects: {
    icon: '✨',
    title: 'Aspects & Elements',
    content: 'Elemental aspects, their interactions, strengths and weaknesses, and how to harness elemental powers effectively.'
  },
  fraction: {
    icon: '🦋',
    title: 'Fractions & Guilds',
    content: 'Political factions, guild systems, alliance mechanics, and diplomatic strategies for faction management.'
  },
  backpack: {
    icon: '🎒',
    title: 'Inventory & Storage',
    content: 'Inventory management, storage solutions, item organization, and capacity optimization techniques.'
  },
  items: {
    icon: '🏹',
    title: 'Items & Equipment',
    content: 'Complete item database, equipment stats, set bonuses, and optimal equipment combinations for different playstyles.'
  },
  masks: {
    icon: '🎭',
    title: 'Masks & Disguises',
    content: 'Disguise systems, stealth mechanics, social infiltration, and the art of deception in diplomatic missions.'
  },
  hearts: {
    icon: '❤️‍🔥',
    title: 'Hearts & Relationships',
    content: 'Relationship systems, romance options, friendship mechanics, and social interaction strategies.'
  },
  fight: {
    icon: '⚔️',
    title: 'Combat & Tactics',
    content: 'Advanced combat strategies, tactical formations, battle planning, and victory conditions for different combat scenarios.'
  },
  creatures: {
    icon: '🐙',
    title: 'Creatures & Monsters',
    content: 'Bestiary of all creatures, their behaviors, weaknesses, and strategies for combat or taming.'
  },
  loot: {
    icon: '🫀',
    title: 'Loot & Rewards',
    content: 'Loot systems, treasure hunting, reward mechanics, and strategies for maximizing valuable discoveries.'
  },
  ingredients: {
    icon: '🌸',
    title: 'Ingredients & Components',
    content: 'Crafting ingredients, their sources, properties, and optimal harvesting techniques for maximum yield.'
  },
  coins: {
    icon: '🪙',
    title: 'Currency & Trade',
    content: 'Economic systems, currency types, trade routes, market dynamics, and wealth accumulation strategies.'
  },
  timer: {
    icon: '⏱️',
    title: 'Time & Scheduling',
    content: 'Time management systems, scheduling mechanics, deadline management, and temporal strategy optimization.'
  },
  mechanics: {
    icon: '⚙️',
    title: 'Game Mechanics',
    content: 'Core gameplay systems, rule explanations, mechanical interactions, and advanced technique guides.'
  },
  knowledge: {
    icon: '📚',
    title: 'Knowledge & Lore',
    content: 'Historical records, world lore, ancient knowledge, and scholarly research on various topics.'
  },
  genetics: {
    icon: '🧬',
    title: 'Genetics & Breeding',
    content: 'Genetic systems, breeding mechanics, trait inheritance, and optimization of genetic combinations.'
  },
  craft: {
    icon: '🛠',
    title: 'Crafting & Creation',
    content: 'Crafting systems, recipe databases, material combinations, and advanced crafting techniques.'
  },
  alchemy: {
    icon: '⚗',
    title: 'Alchemy & Potions',
    content: 'Alchemical processes, potion brewing, magical transmutation, and advanced alchemical theories.'
  },
  calligraphy: {
    icon: '📜',
    title: 'Calligraphy & Scripts',
    content: 'Ancient scripts, magical writing, enchanted scrolls, and the art of magical calligraphy.'
  },
  mining: {
    icon: '⛏️',
    title: 'Mining & Extraction',
    content: 'Mining techniques, ore identification, extraction methods, and geological survey strategies.'
  },
  culinary: {
    icon: '🍽️',
    title: 'Culinary Arts',
    content: 'Cooking techniques, recipe development, food enhancement, and the magical properties of cuisine.'
  },
  cultivating: {
    icon: '🪴',
    title: 'Cultivation & Farming',
    content: 'Agricultural techniques, crop rotation, soil management, and magical plant cultivation methods.'
  },
  trading: {
    icon: '⚖️',
    title: 'Trading & Commerce',
    content: 'Trade negotiations, market analysis, commercial strategies, and building successful trading empires.'
  },
  map: {
    icon: '🗺️',
    title: 'Maps & Navigation',
    content: 'Cartography, navigation techniques, map reading, and exploration strategies for unknown territories.'
  },
  anchors: {
    icon: '⚓',
    title: 'Anchors & Waypoints',
    content: 'Navigation anchors, waypoint systems, fast travel mechanics, and strategic positioning guides.'
  },
  space: {
    icon: '🚀',
    title: 'Space Pirates',
    content: 'Advanced exploration, space travel mechanics, pirate encounters, and interstellar adventure strategies.'
  }
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

function updateAvatarContent(view: string) {
  // Avatar is now just a circle, no additional content needed
}

function updateNavButtonStates(activeView: string) {
  // Update navigation tab buttons
  document.querySelectorAll('.nav-tab-button').forEach(btn => {
    btn.classList.remove('active')
    if ((btn as HTMLElement).dataset.view === activeView) {
      btn.classList.add('active')
    }
  })
}

function showLibraryContent(contentKey: string) {
  const container = document.getElementById('container')
  if (!container) return

  const content = libraryContent[contentKey as keyof typeof libraryContent]
  if (!content) return

  currentLibraryContent = contentKey
  
  container.innerHTML = `
    <div class="content-page">
      <div class="content-header">
        <div class="content-title">
          <span style="font-size: 3rem;">${content.icon}</span>
          <span>${content.title}</span>
        </div>
        <button class="back-button" onclick="showLibraryMain()">← Back to Library</button>
      </div>
      <div class="content-body">
        <p>${content.content}</p>
      </div>
    </div>
  `
}

function showLibraryMain() {
  currentLibraryContent = null
  const container = document.getElementById('container')
  if (!container) return

  container.innerHTML = `
    <div class="library-container">
      <div class="library-header">
        <h1 class="library-title">Library of Knowledge</h1>
        <p class="library-subtitle">Explore the vast collection of wisdom and information</p>
      </div>
      
      <div class="library-categories">
        <div class="category-section">
          <h2 class="category-title">🏰 Castle & Lands</h2>
          <div class="category-buttons">
            <button class="library-button" onclick="showLibraryContent('castle')">
              <div class="library-button-icon">🏰</div>
              <div class="library-button-text">Castle</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('buildings')">
              <div class="library-button-icon">🏢</div>
              <div class="library-button-text">Buildings</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('upgrades')">
              <div class="library-button-icon">🪚</div>
              <div class="library-button-text">Upgrades</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('dungeons')">
              <div class="library-button-icon">⛩</div>
              <div class="library-button-text">Dungeons</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('clouds')">
              <div class="library-button-icon">☁️</div>
              <div class="library-button-text">Clouds</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('citizens')">
              <div class="library-button-icon">👨‍⚕️</div>
              <div class="library-button-text">Citizens</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('turns')">
              <div class="library-button-icon">⏳</div>
              <div class="library-button-text">Turns</div>
            </button>
          </div>
        </div>

        <div class="category-section">
          <h2 class="category-title">🌍 World & Resources</h2>
          <div class="category-buttons">
            <button class="library-button" onclick="showLibraryContent('lands')">
              <div class="library-button-icon">⛳</div>
              <div class="library-button-text">Lands</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('animals')">
              <div class="library-button-icon">🐑</div>
              <div class="library-button-text">Animals</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('flora')">
              <div class="library-button-icon">🌳</div>
              <div class="library-button-text">Flora</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('food')">
              <div class="library-button-icon">🍎</div>
              <div class="library-button-text">Food</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('resources')">
              <div class="library-button-icon">💎</div>
              <div class="library-button-text">Resources</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('structures')">
              <div class="library-button-icon">🏠</div>
              <div class="library-button-text">Structures</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('objects')">
              <div class="library-button-icon">🗿</div>
              <div class="library-button-text">Objects</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('budget')">
              <div class="library-button-icon">💰</div>
              <div class="library-button-text">Budget</div>
            </button>
          </div>
        </div>

        <div class="category-section">
          <h2 class="category-title">🦊 Hero & Character</h2>
          <div class="category-buttons">
            <button class="library-button" onclick="showLibraryContent('hero')">
              <div class="library-button-icon">🐵</div>
              <div class="library-button-text">Hero</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('level')">
              <div class="library-button-icon">🏆</div>
              <div class="library-button-text">Level</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('weapon')">
              <div class="library-button-icon">🗡</div>
              <div class="library-button-text">Weapon</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('gestures')">
              <div class="library-button-icon">✌️</div>
              <div class="library-button-text">Gestures</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('magic')">
              <div class="library-button-icon">🔥</div>
              <div class="library-button-text">Magic</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('aspects')">
              <div class="library-button-icon">✨</div>
              <div class="library-button-text">Aspects</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('fraction')">
              <div class="library-button-icon">🦋</div>
              <div class="library-button-text">Fraction</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('backpack')">
              <div class="library-button-icon">🎒</div>
              <div class="library-button-text">Backpack</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('items')">
              <div class="library-button-icon">🏹</div>
              <div class="library-button-text">Items</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('masks')">
              <div class="library-button-icon">🎭</div>
              <div class="library-button-text">Masks</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('hearts')">
              <div class="library-button-icon">❤️‍🔥</div>
              <div class="library-button-text">Hearts</div>
            </button>
          </div>
        </div>

        <div class="category-section">
          <h2 class="category-title">⚔️ Combat & Adventure</h2>
          <div class="category-buttons">
            <button class="library-button" onclick="showLibraryContent('fight')">
              <div class="library-button-icon">⚔️</div>
              <div class="library-button-text">Fight</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('creatures')">
              <div class="library-button-icon">🐙</div>
              <div class="library-button-text">Creatures</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('loot')">
              <div class="library-button-icon">🫀</div>
              <div class="library-button-text">Loot</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('ingredients')">
              <div class="library-button-icon">🌸</div>
              <div class="library-button-text">Ingredients</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('coins')">
              <div class="library-button-icon">🪙</div>
              <div class="library-button-text">Coins</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('timer')">
              <div class="library-button-icon">⏱️</div>
              <div class="library-button-text">Timer</div>
            </button>
          </div>
        </div>

        <div class="category-section">
          <h2 class="category-title">🔬 Crafting & Knowledge</h2>
          <div class="category-buttons">
            <button class="library-button" onclick="showLibraryContent('mechanics')">
              <div class="library-button-icon">⚙️</div>
              <div class="library-button-text">Mechanics</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('knowledge')">
              <div class="library-button-icon">📚</div>
              <div class="library-button-text">Knowledge</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('genetics')">
              <div class="library-button-icon">🧬</div>
              <div class="library-button-text">Genetics</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('craft')">
              <div class="library-button-icon">🛠</div>
              <div class="library-button-text">Craft</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('alchemy')">
              <div class="library-button-icon">⚗</div>
              <div class="library-button-text">Alchemy</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('calligraphy')">
              <div class="library-button-icon">📜</div>
              <div class="library-button-text">Calligraphy</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('mining')">
              <div class="library-button-icon">⛏️</div>
              <div class="library-button-text">Mining</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('culinary')">
              <div class="library-button-icon">🍽️</div>
              <div class="library-button-text">Culinary</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('cultivating')">
              <div class="library-button-icon">🪴</div>
              <div class="library-button-text">Cultivating</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('trading')">
              <div class="library-button-icon">⚖️</div>
              <div class="library-button-text">Trading</div>
            </button>
          </div>
        </div>

        <div class="category-section">
          <h2 class="category-title">🗺️ Exploration & Navigation</h2>
          <div class="category-buttons">
            <button class="library-button" onclick="showLibraryContent('map')">
              <div class="library-button-icon">🗺️</div>
              <div class="library-button-text">Map</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('anchors')">
              <div class="library-button-icon">⚓</div>
              <div class="library-button-text">Anchors</div>
            </button>
            <button class="library-button" onclick="showLibraryContent('space')">
              <div class="library-button-icon">🚀</div>
              <div class="library-button-text">Space Pirates</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
}

// Make functions globally available
;(window as any).showLibraryContent = showLibraryContent
;(window as any).showLibraryMain = showLibraryMain

function initializeGrid(view: string) {
  document.body.setAttribute('data-view', view)
  updateAvatarContent(view)
  updateNavButtonStates(view)
  
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
    case 'castle': // This is now the chart view (renamed)
      gridOptions = {
        orientation: Orientation.POINTY,
        width: 11,  // Increased to accommodate 5 rings
        height: 11  // Increased to accommodate 5 rings
      }
      break
    case 'library':
      showLibraryMain()
      return
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
  
  // Calculate radial distances and initialize visibility for castle view (formerly chart)
  if (view === 'castle') {
    // Castle is now at the center of the 11x11 grid
    const castleIndex = Math.floor((gridOptions.width * gridOptions.height) / 2) // Center hex
    let index = 0
    for (const hex of mainGrid) {
      const customHex = hex as CustomHex | VerticalHex
      customHex.radialDistance = calculateRadialDistance(index, castleIndex, gridOptions.width)
      
      // Set visibility based on ring distance
      if (customHex.radialDistance === 5) {
        customHex.visibility = 'undiscovered'  // Ring 5 - Dark (undiscovered) #000 80%
      } else if (customHex.radialDistance === 2 || customHex.radialDistance === 3 || customHex.radialDistance === 4) {
        customHex.visibility = 'discovered'    // Rings 2-3-4 - transparency 100% (discovered)
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
  // For castle view (formerly chart), use ring-based terrain assignment
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

// Check if hex should show button effects (now includes ring 5)
function shouldShowButtonEffects(radialDistance?: number): boolean {
  return radialDistance !== undefined && radialDistance <= 5
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

  // Fog of war overlay group (separate layer above main grid)
  const fogOverlayGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  fogOverlayGroup.setAttribute('transform', `translate(${xOffset}, ${yOffset})`)
  fogOverlayGroup.setAttribute('id', 'fog-overlay')
  fogOverlayGroup.style.pointerEvents = 'none' // Allow clicks to pass through
  // Add backdrop blur class to fog overlay
  fogOverlayGroup.classList.add('backdropblur')
  svg.appendChild(fogOverlayGroup)

  // Render main grid
  let index = 0
  for (const hex of mainGrid) {
    const customHex = hex as CustomHex | VerticalHex
    
    // Skip rendering hexes with radial distance 6 or 7 in castle view
    if (view === 'castle' && shouldHideHex(customHex.radialDistance)) {
      index++
      continue
    }
    
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    const points = hex.corners.map(({ x, y }) => `${x},${y}`).join(' ')
    
    polygon.setAttribute('points', points)
    
    // Add terrain background color for castle view
    if (view === 'castle') {
      const terrainType = getTerrainType(index, customHex.radialDistance)
      const terrainColor = getTerrainColor(terrainType)
      polygon.style.fill = terrainColor
    } else {
      polygon.style.fill = 'rgba(255, 255, 255, 0.1)'
    }
    
    polygon.style.stroke = 'rgba(255, 255, 255, 0.5)'
    polygon.style.strokeWidth = '1'
    
    // Apply blur effect to undiscovered hexes
    if (view === 'castle' && customHex.visibility === 'undiscovered') {
      group.classList.add('hex-undiscovered')
    }
    
    group.appendChild(polygon)
    
    // Add number text (centered vertically) with 20% transparency
    const numberText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    
    // Use radial distance for castle view, regular index for others
    if (view === 'castle' && customHex.radialDistance !== undefined) {
      numberText.textContent = `${customHex.radialDistance}`
      numberText.style.fill = 'rgba(255, 255, 0, 0.8)'  // Yellow with 20% transparency
      numberText.style.fontWeight = 'bold'
    } else {
      numberText.textContent = `${index}`
      numberText.style.fill = 'rgba(255, 255, 255, 0.8)'  // White with 20% transparency
    }
    
    numberText.setAttribute('x', hex.x.toString())
    numberText.setAttribute('y', hex.y.toString()) // Centered vertically
    numberText.setAttribute('text-anchor', 'middle')
    numberText.setAttribute('dominant-baseline', 'central')
    numberText.style.fontSize = '0.8rem' // Smaller font size
    numberText.style.userSelect = 'none'
    numberText.style.pointerEvents = 'none'
    
    group.appendChild(numberText)
    
    // Add terrain emoji if coordinates are enabled and in castle view
    if (view === 'castle' && showCoordinates && shouldShowButtonEffects(customHex.radialDistance)) {
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

  // Render fog of war overlay (separate from main grid)
  if (view === 'castle' && showVisibility) {
    let overlayIndex = 0
    for (const hex of mainGrid) {
      const customHex = hex as CustomHex | VerticalHex
      
      // Skip rendering hexes with radial distance 6 or 7 in castle view
      if (shouldHideHex(customHex.radialDistance)) {
        overlayIndex++
        continue
      }
      
      // Only render fog overlay for hexes that should show button effects
      if (shouldShowButtonEffects(customHex.radialDistance)) {
        const fogGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
        const points = hex.corners.map(({ x, y }) => `${x},${y}`).join(' ')
        
        overlay.setAttribute('points', points)
        
        if (customHex.visibility === 'undiscovered') {
          // Ring 5 - Dark (undiscovered) with stroke styling
          overlay.style.fill = '#000000eb'
          overlay.style.stroke = '#00000094'
          overlay.style.strokeWidth = '29px'
        } else if (customHex.visibility === 'discovered') {
          // Rings 2-3-4 - transparency 100% (discovered) - completely transparent
          overlay.style.fill = 'rgba(0, 0, 0, 0)'
          overlay.style.stroke = 'none'
        } else if (customHex.visibility === 'visible') {
          // Other rings - visible (light overlay)
          overlay.style.fill = 'rgba(255, 255, 255, 0.2)'
          overlay.style.stroke = 'none'
        }
        
        fogGroup.appendChild(overlay)
        fogOverlayGroup.appendChild(fogGroup)
      }
      
      overlayIndex++
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
    const fogOverlayGroup = document.getElementById('fog-overlay')
    
    if (mainGridGroup) {
      mainGridGroup.setAttribute('transform', `translate(${newXOffset}, ${newYOffset})`)
    }
    
    if (fogOverlayGroup) {
      fogOverlayGroup.setAttribute('transform', `translate(${newXOffset}, ${newYOffset})`)
    }
    
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
  })
}

// Setup button functionality
document.addEventListener('DOMContentLoaded', () => {
  const coordinatesToggle = document.getElementById('coordinates-toggle') as HTMLButtonElement
  const visibilityToggle = document.getElementById('visibility-toggle') as HTMLButtonElement
  const burgerMenu = document.getElementById('burger-menu') as HTMLButtonElement
  const menuOverlay = document.getElementById('menu-overlay') as HTMLDivElement
  const closeMenu = document.getElementById('close-menu') as HTMLButtonElement
  
  // Burger menu functionality
  if (burgerMenu && menuOverlay && closeMenu) {
    const openMenu = () => {
      menuOverlay.classList.add('active')
      burgerMenu.classList.add('active')
      document.body.style.overflow = 'hidden'
    }
    
    const closeMenuFunc = () => {
      menuOverlay.classList.remove('active')
      burgerMenu.classList.remove('active')
      document.body.style.overflow = ''
    }
    
    burgerMenu.addEventListener('click', openMenu)
    burgerMenu.addEventListener('touchend', (e) => {
      e.preventDefault()
      openMenu()
    })
    
    closeMenu.addEventListener('click', closeMenuFunc)
    closeMenu.addEventListener('touchend', (e) => {
      e.preventDefault()
      closeMenuFunc()
    })
    
    // Close menu when clicking overlay background
    menuOverlay.addEventListener('click', (e) => {
      if (e.target === menuOverlay) {
        closeMenuFunc()
      }
    })
    
    // Handle menu item clicks
    const menuItems = menuOverlay.querySelectorAll('.menu-item[data-view]')
    menuItems.forEach(item => {
      const handleMenuClick = (e: Event) => {
        e.preventDefault()
        const view = (item as HTMLElement).dataset.view
        if (view) {
          currentView = view
          // Reset states when switching views
          showCoordinates = false
          showVisibility = false
          currentLibraryContent = null
          // Reset button states
          if (coordinatesToggle) coordinatesToggle.style.background = 'transparent'
          if (visibilityToggle) visibilityToggle.style.background = 'transparent'
          initializeGrid(view)
          closeMenuFunc()
        }
      }
      
      item.addEventListener('click', handleMenuClick)
      item.addEventListener('touchend', handleMenuClick)
    })
  }
  
  if (coordinatesToggle) {
    coordinatesToggle.addEventListener('click', () => {
      showCoordinates = !showCoordinates
      coordinatesToggle.style.background = showCoordinates ? 'rgba(255, 255, 255, 0.3)' : 'transparent'
      // Re-render the grid to show/hide terrain emojis
      if (currentView === 'castle') {
        renderGrid(currentView)
      }
    })
  }

  if (visibilityToggle) {
    visibilityToggle.addEventListener('click', () => {
      showVisibility = !showVisibility
      visibilityToggle.style.background = showVisibility ? 'rgba(255, 255, 255, 0.3)' : 'transparent'
      // Re-render the grid to show/hide visibility overlays
      if (currentView === 'castle') {
        renderGrid(currentView)
      }
    })
  }
})

// Setup navigation for all buttons (nav-button, nav-circle, and nav-tab-button)
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  
  // Handle nav-button, nav-circle, and nav-tab-button clicks
  if (target.classList.contains('nav-button') || target.classList.contains('nav-circle') || target.classList.contains('nav-tab-button')) {
    e.preventDefault()
    const view = target.dataset.view
    if (view) {
      // Update active state for nav-buttons only
      if (target.classList.contains('nav-button')) {
        document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'))
        target.classList.add('active')
      }
      
      currentView = view
      // Reset states when switching views
      showCoordinates = false
      showVisibility = false
      currentLibraryContent = null
      // Reset button states
      const coordinatesToggle = document.getElementById('coordinates-toggle') as HTMLButtonElement
      const visibilityToggle = document.getElementById('visibility-toggle') as HTMLButtonElement
      if (coordinatesToggle) coordinatesToggle.style.background = 'transparent'
      if (visibilityToggle) visibilityToggle.style.background = 'transparent'
      initializeGrid(view)
    }
  }
})

// Setup touch events for mobile
document.addEventListener('touchend', (e) => {
  const target = e.target as HTMLElement
  
  if (target.classList.contains('nav-button') || target.classList.contains('nav-circle') || target.classList.contains('nav-tab-button')) {
    e.preventDefault()
    const view = target.dataset.view
    if (view) {
      // Update active state for nav-buttons only
      if (target.classList.contains('nav-button')) {
        document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'))
        target.classList.add('active')
      }
      
      currentView = view
      // Reset states when switching views
      showCoordinates = false
      showVisibility = false
      currentLibraryContent = null
      // Reset button states
      const coordinatesToggle = document.getElementById('coordinates-toggle') as HTMLButtonElement
      const visibilityToggle = document.getElementById('visibility-toggle') as HTMLButtonElement
      if (coordinatesToggle) coordinatesToggle.style.background = 'transparent'
      if (visibilityToggle) visibilityToggle.style.background = 'transparent'
      initializeGrid(view)
    }
  }
})

initializeGrid('dungeon')