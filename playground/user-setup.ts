export interface UserSetupData {
  playerName: string
  characterClass: string
  startingView: string
  gridSize: 'small' | 'medium' | 'large'
  difficulty: 'easy' | 'normal' | 'hard'
  theme: 'classic' | 'modern' | 'dark'
}

export interface SetupOptions {
  onComplete: (data: UserSetupData) => void
  onCancel?: () => void
}

export class UserSetup {
  private modal: HTMLDivElement | null = null
  private form: HTMLFormElement | null = null

  constructor(private options: SetupOptions) {}

  show(): void {
    this.createModal()
    this.showModal()
  }

  private createModal(): void {
    // Create modal container
    this.modal = document.createElement('div')
    this.modal.className = 'setup-modal'
    this.modal.innerHTML = `
      <div class="setup-modal-content">
        <div class="setup-header">
          <h2>🏰 Welcome to Honeycomb Grid Adventure</h2>
          <p>Let's set up your adventure before we begin!</p>
        </div>
        
        <form id="setup-form" class="setup-form">
          <div class="form-group">
            <label for="player-name">👤 Your Name:</label>
            <input 
              type="text" 
              id="player-name" 
              name="playerName" 
              placeholder="Enter your name"
              required
              maxlength="20"
            >
          </div>

          <div class="form-group">
            <label for="character-class">⚔️ Character Class:</label>
            <select id="character-class" name="characterClass" required>
              <option value="">Choose your class</option>
              <option value="warrior">🛡️ Warrior - Strong and resilient</option>
              <option value="mage">🔮 Mage - Powerful magic user</option>
              <option value="rogue">🗡️ Rogue - Stealthy and agile</option>
              <option value="paladin">⚜️ Paladin - Holy warrior</option>
              <option value="ranger">🏹 Ranger - Skilled archer</option>
            </select>
          </div>

          <div class="form-group">
            <label for="starting-view">🗺️ Starting Location:</label>
            <select id="starting-view" name="startingView" required>
              <option value="">Choose starting area</option>
              <option value="dungeon">⛩️ Dungeon - Dark and mysterious</option>
              <option value="castle">🏰 Castle - Your stronghold</option>
              <option value="library">📚 Library - Knowledge and magic</option>
            </select>
          </div>

          <div class="form-group">
            <label for="grid-size">📐 Grid Size:</label>
            <select id="grid-size" name="gridSize" required>
              <option value="">Choose grid size</option>
              <option value="small">Small - 5x5 (Beginner friendly)</option>
              <option value="medium">Medium - 7x7 (Balanced)</option>
              <option value="large">Large - 11x11 (Advanced)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="difficulty">🎯 Difficulty:</label>
            <select id="difficulty" name="difficulty" required>
              <option value="">Choose difficulty</option>
              <option value="easy">Easy - More resources, fewer enemies</option>
              <option value="normal">Normal - Balanced challenge</option>
              <option value="hard">Hard - Scarce resources, tough enemies</option>
            </select>
          </div>

          <div class="form-group">
            <label for="theme">🎨 Visual Theme:</label>
            <select id="theme" name="theme" required>
              <option value="">Choose theme</option>
              <option value="classic">Classic - Traditional fantasy</option>
              <option value="modern">Modern - Clean and sleek</option>
              <option value="dark">Dark - Gothic and mysterious</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="button" id="setup-cancel" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">🚀 Start Adventure!</button>
          </div>
        </form>
      </div>
    `

    // Add styles
    this.addStyles()

    // Add event listeners
    this.form = this.modal.querySelector('#setup-form') as HTMLFormElement
    const cancelBtn = this.modal.querySelector('#setup-cancel') as HTMLButtonElement

    this.form.addEventListener('submit', (e) => this.handleSubmit(e))
    cancelBtn.addEventListener('click', () => this.handleCancel())

    document.body.appendChild(this.modal)
  }

  private addStyles(): void {
    const style = document.createElement('style')
    style.textContent = `
      .setup-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
      }

      .setup-modal-content {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        border: 2px solid #4a90e2;
        border-radius: 15px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        animation: modalSlideIn 0.3s ease-out;
      }

      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translateY(-50px) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .setup-header {
        text-align: center;
        margin-bottom: 2rem;
        color: #ffffff;
      }

      .setup-header h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.8rem;
        background: linear-gradient(45deg, #4a90e2, #7b68ee);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .setup-header p {
        margin: 0;
        color: #b0b0b0;
        font-size: 1rem;
      }

      .setup-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-group label {
        color: #ffffff;
        font-weight: 600;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .form-group input,
      .form-group select {
        padding: 0.75rem;
        border: 2px solid #2a2a4a;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        font-size: 1rem;
        transition: all 0.3s ease;
      }

      .form-group input:focus,
      .form-group select:focus {
        outline: none;
        border-color: #4a90e2;
        box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
        background: rgba(255, 255, 255, 0.15);
      }

      .form-group input::placeholder {
        color: #888;
      }

      .form-group select option {
        background: #1a1a2e;
        color: #ffffff;
      }

      .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 1rem;
      }

      .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .btn-primary {
        background: linear-gradient(45deg, #4a90e2, #7b68ee);
        color: white;
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(74, 144, 226, 0.4);
      }

      .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        border: 2px solid rgba(255, 255, 255, 0.2);
      }

      .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
      }

      @media (max-width: 600px) {
        .setup-modal-content {
          padding: 1.5rem;
          margin: 1rem;
        }
        
        .form-actions {
          flex-direction: column;
        }
        
        .btn {
          width: 100%;
        }
      }
    `
    document.head.appendChild(style)
  }

  private handleSubmit(e: Event): void {
    e.preventDefault()
    console.log('🔧 [DEBUG] User setup form submitted')
    
    if (!this.form) {
      console.error('❌ [DEBUG] Form element not found!')
      return
    }

    const formData = new FormData(this.form)
    const data: UserSetupData = {
      playerName: formData.get('playerName') as string,
      characterClass: formData.get('characterClass') as string,
      startingView: formData.get('startingView') as string,
      gridSize: formData.get('gridSize') as 'small' | 'medium' | 'large',
      difficulty: formData.get('difficulty') as 'easy' | 'normal' | 'hard',
      theme: formData.get('theme') as 'classic' | 'modern' | 'dark'
    }

    console.log('🔧 [DEBUG] Form data collected:', data)
    console.log('🔧 [DEBUG] Validating form data...')
    
    // Validate required fields
    if (!data.playerName || !data.characterClass || !data.startingView || !data.gridSize || !data.difficulty || !data.theme) {
      console.error('❌ [DEBUG] Missing required form fields:', {
        playerName: !!data.playerName,
        characterClass: !!data.characterClass,
        startingView: !!data.startingView,
        gridSize: !!data.gridSize,
        difficulty: !!data.difficulty,
        theme: !!data.theme
      })
      return
    }

    console.log('🔧 [DEBUG] Form validation passed, hiding modal and calling onComplete')
    this.hideModal()
    this.options.onComplete(data)
  }

  private handleCancel(): void {
    this.hideModal()
    if (this.options.onCancel) {
      this.options.onCancel()
    }
  }

  private showModal(): void {
    if (this.modal) {
      this.modal.style.display = 'flex'
      // Focus first input
      const firstInput = this.modal.querySelector('input') as HTMLInputElement
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100)
      }
    }
  }

  private hideModal(): void {
    if (this.modal) {
      this.modal.style.display = 'none'
      document.body.removeChild(this.modal)
      this.modal = null
      this.form = null
    }
  }
} 