# Challenge 1 – 3D Racing Prototype

A 3D racing game built with Three.js and Cannon.js physics engine. Race around the track and complete 3 laps as fast as you can!

## Setup Steps

### Prerequisites
- A modern web browser with ES6 module support (Chrome, Firefox, Edge, Safari)
- No build tools or package managers required - runs directly in the browser

### Installation
1. Open the project folder in your file system
2. Serve the files using a local web server (required for ES modules to work):
   - Install the "Live Server" extension
   - Right-click on `index.html` and select "Open with Live Server"

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

### Running the Game
- The game will load automatically in your browser
- Press **SPACE** on the welcome screen to start racing

## Controls

### Driving Controls
- **W** or **↑ (Up Arrow)** - Accelerate
- **S** or **↓ (Down Arrow)** - Brake/Reverse
- **A** or **← (Left Arrow)** - Steer Left
- **D** or **→ (Right Arrow)** - Steer Right

### Camera Controls
- **C** - Cycle through camera views:
  - 📷 Chase Cam (default) - Follows behind the car
  - 👁️ First Person - Inside the car view
  - ⬇️ Top Down - Bird's eye view
  - ↔️ Side View - Side perspective
  - 🔄 Orbit Cam - Rotating around the car

### Menu Controls
- **SPACE** - Start race (from welcome screen) / Restart (after completion)
- **ESC** - Return to main menu (during race)
- **Mouse Click** - Navigate menu buttons and modals

## Libraries and Assets

### JavaScript Libraries

#### Three.js (v0.164)
- **Source**: CDN (jsdelivr)
- **URL**: `https://cdn.jsdelivr.net/npm/three@0.164/build/three.module.js`
- **Purpose**: 3D rendering, scene management, camera controls, lighting, shadows
- **Features Used**:
  - WebGLRenderer for rendering
  - Scene, Camera, and Mesh objects
  - Materials (MeshStandardMaterial)
  - Geometries (BoxGeometry, CylinderGeometry)
  - Lighting (HemisphereLight, DirectionalLight)
  - Shadow mapping

#### Cannon-es (v0.20.0)
- **Source**: CDN (jsdelivr)
- **URL**: `https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js`
- **Purpose**: Physics simulation engine
- **Features Used**:
  - Physics world with gravity
  - RaycastVehicle for realistic car physics
  - Collision detection and response
  - Material properties (friction, restitution)
  - Body dynamics (static and dynamic bodies)

### Assets

#### Fonts
- **Space Grotesk** (Google Fonts)
  - Used for UI text and HUD elements
  - Imported via CSS: `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap`

#### 3D Models & Textures
- **None** - All 3D objects are procedurally generated using Three.js primitives:
  - Car: BoxGeometry for chassis and cabin, CylinderGeometry for wheels
  - Track: BoxGeometry for ground and walls
  - Checkpoints: BoxGeometry for start/finish line

#### Visual Assets
- **No external images or textures** - All materials use solid colors defined in code
- Colors are defined using hexadecimal values (e.g., `0xff3366` for car body, `0x1e2a44` for track)

## Game Features

- **Physics-based car simulation** with realistic handling
- **Multiple camera views** for different perspectives
- **Lap tracking system** (3 laps to complete)
- **Real-time HUD** displaying:
  - Speed (km/h)
  - Drift percentage
  - Current lap / Total laps
  - Race timer
  - Active camera mode
- **Menu system** with controls and settings
- **Responsive design** that adapts to window resizing

## Technical Details

- **Rendering**: WebGL via Three.js
- **Physics**: Real-time physics simulation at 60 FPS
- **Architecture**: ES6 modules with import maps
- **No build step required** - runs directly in modern browsers
- **Shadow mapping** enabled for enhanced visual depth
- **Antialiasing** enabled for smoother graphics

