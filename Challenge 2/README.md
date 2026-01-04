# 3D Home Design Application

An interactive 3D web application that allows you to design and customize your living room in real-time. Place furniture, adjust lighting, and transform objects to create your perfect space.

## Demo Video
[![Demo Video](https://img.youtube.com/vi/46breGrXbaI/0.jpg)](https://www.youtube.com/watch?v=46breGrXbaI)


## 🚀 Setup and Run Instructions

### Prerequisites
- A modern web browser with JavaScript enabled (Chrome, Firefox, Edge, Safari)
- A local web server (required for loading assets)

### Running the Application

#### Option 1: Using Python (Recommended)
```bash
python -m http.server 8000
```

Then open your browser and navigate to:
```
http://localhost:8000/homepage.html
```

#### Option 2: Using VS Code Live Server
1. Install the "Live Server" extension in VS Code
2. Right-click on `homepage.html`
3. Select "Open with Live Server"

### Important Notes
- **Do not open the HTML files directly** (file:// protocol) as this will cause CORS errors when loading assets
- Always use a local web server to run the application
- The application uses localStorage to save your scene state, so your designs persist between sessions

## ✨ Features

### Room Size Selection
- **Small Room**: 4m × 4m - Perfect for cozy spaces
- **Medium Room**: 6m × 6m - Standard living room size (default)
- **Large Room**: 8m × 8m - Spacious area for design

### Furniture Management
- **Add Furniture**: Browse categories and click to place furniture items
- **Transform Objects**: Move, rotate, and scale furniture with intuitive controls
- **Replace Furniture**: Swap selected furniture with different items while maintaining position
- **Color Customization**: Change the color of furniture materials
- **Delete Objects**: Remove unwanted furniture from your scene

### Lighting System
- **Add Lights**: Place point lights anywhere in the scene
- **Adjust Intensity**: Control light brightness (0.0 to 2.0)
- **Color Control**: Customize light color with a color picker
- **Visual Indicators**: Lights are represented by wireframe spheres

### Scene Management
- **Auto-Save**: Scene state is automatically saved to localStorage
- **Reset Room**: Clear all furniture and lights, returning to initial state
- **Persistent State**: Your design is saved and restored when you reload the page

### Visual Features
- **HDR Environment**: Realistic lighting with Pisa HDR environment map
- **Shadows**: Real-time shadow casting and receiving
- **Smooth Controls**: Orbit controls for intuitive camera navigation
- **Selection Highlighting**: Visual feedback when objects are selected

## 🎮 Controls and Interaction Guide

### Mouse Controls
- **Left Click**: Select/deselect objects
- **Left Click + Drag**: Transform selected object (when in transform mode)
- **Right Click + Drag**: Rotate camera (Orbit Controls)
- **Middle Mouse Wheel**: Zoom in/out
- **Middle Mouse + Drag**: Pan camera

### Keyboard Shortcuts
- **Q**: Switch to Translate (Move) mode
- **W**: Switch to Rotate mode
- **E**: Switch to Scale mode
- **Delete**: Delete selected object
- **L**: Add a new light at default position

### UI Controls

#### Transform Mode Buttons (Top Right)
- **Translate Icon**: Move objects along X, Y, Z axes
- **Rotate Icon**: Rotate objects around axes
- **Scale Icon**: Scale objects uniformly or per-axis

#### Main Action Buttons (Right Side)
- **Add Light**: Place a new point light in the scene
- **Delete**: Remove the currently selected object
- **Replace**: Replace selected furniture with a different item
- **Reset**: Clear all furniture and lights, restore initial scene
- **Room Size**: Change the room dimensions (resets scene)
- **Back to Home**: Return to room size selection page

#### Furniture Palette (Left Side)
- Click on category cards to browse available furniture
- Click on furniture items in the menu to place them
- Close button (X) to close the furniture menu

#### Property Panels
- **Light Adjustments**: Appears when a light is selected
  - Intensity slider (0.0 - 2.0)
  - Color picker
- **Furniture Adjustments**: Appears when furniture is selected
  - Color picker for material customization

### Transform Controls
When an object is selected, you'll see colored gizmos:
- **Red Arrow/Arc/Ring**: X-axis control
- **Green Arrow/Arc/Ring**: Y-axis control
- **Blue Arrow/Arc/Ring**: Z-axis control
- **Yellow Center**: Move/rotate/scale on all axes

**Snapping**:
- Translation: Snaps to 0.05 units
- Rotation: Snaps to 15-degree increments
- Scale: Snaps to 0.1 units

## 📚 Libraries and Assets Used

### JavaScript Libraries

#### Three.js (v0.153.0)
- **Core Library**: 3D rendering engine
  - Source: `https://unpkg.com/three@0.153.0/build/three.module.js`
- **OrbitControls**: Camera orbit controls for navigation
  - Source: `https://unpkg.com/three@0.153.0/examples/jsm/controls/OrbitControls.js`
- **GLTFLoader**: Load GLB/GLTF 3D models
  - Source: `https://unpkg.com/three@0.153.0/examples/jsm/loaders/GLTFLoader`
- **DRACOLoader**: Decompress DRACO-compressed models
  - Source: `https://unpkg.com/three@0.153.0/examples/jsm/loaders/DRACOLoader.js`
  - Decoder: `https://www.gstatic.com/draco/versioned/decoders/1.5.6/`
- **RGBELoader**: Load HDR environment maps
  - Source: `https://unpkg.com/three@0.153.0/examples/jsm/loaders/RGBELoader.js`
- **TransformControls**: Interactive object transformation gizmos
  - Source: `https://unpkg.com/three@0.153.0/examples/jsm/controls/TransformControls.js`

### Assets

#### 3D Models (`assets/models/furniture/`)
- `armchair02.glb` - Armchair model
- `armchair03.glb` - Armchair model variant
- `chair01.glb` - Chair model
- `floorpiece.glb` - Floor tile model
- `table03.glb` - Table model
- `table04.glb` - Table model variant
- `tv_stand02.glb` - TV stand model
- `tv_stand03.glb` - TV stand model variant
- `wallpiece.glb` - Wall panel model

#### Textures/Images (`assets/images/furniture/`)
- `armchair01.jpg` - Armchair preview image
- `armchair02.jpg` - Armchair preview image
- `armchair03.jpg` - Armchair preview image
- `chair01.jpg` - Chair preview image
- `floorpiece.jpg` - Floor preview image
- `table03.jpg` - Table preview image
- `table04.jpg` - Table preview image
- `tv_stand02.jpg` - TV stand preview image
- `tv_stand03.jpg` - TV stand preview image
- `wallpiece.jpg` - Wall preview image

#### Environment Maps (`assets/bg/`)
- `pisa.hdr` - HDR environment map for realistic lighting and reflections

#### UI Icons (`assets/ui/`)
- `addlight.svg` - Add light button icon
- `close-btn.svg` - Close menu button icon
- `delete.svg` - Delete button icon
- `rotate.svg` - Rotate mode icon
- `scale.svg` - Scale mode icon
- `translate.svg` - Translate mode icon

### Configuration Files

#### `js/params.json`
Contains furniture catalog and category definitions:
- Object definitions (name, path, ID)
- Category organization
- Furniture-to-category mappings

#### Scene Files (`js/`)
- `scene-small.json` - Initial scene layout for small room (4m × 4m)
- `scene-medium.json` - Initial scene layout for medium room (6m × 6m)
- `scene-large.json` - Initial scene layout for large room (8m × 8m)

Each scene file defines:
- Initial furniture placement (position, rotation, scale)
- Default lighting setup

## 🏗️ Project Structure

```
Challenge 2/
├── index.html              # Main application page
├── homepage.html           # Room size selection page
├── style.css              # Application styles
├── README.md              # This file
├── assets/
│   ├── bg/
│   │   └── pisa.hdr      # HDR environment map
│   ├── images/
│   │   └── furniture/    # Furniture preview images
│   ├── models/
│   │   └── furniture/    # 3D model files (.glb)
│   └── ui/               # UI icon SVGs
└── js/
    ├── main.js           # Main application logic
    ├── params.json       # Furniture catalog configuration
    ├── scene-small.json  # Small room initial layout
    ├── scene-medium.json # Medium room initial layout
    └── scene-large.json  # Large room initial layout
```

## 💡 Tips and Best Practices

1. **Start with Room Size**: Choose your room size first, as changing it will reset your design
2. **Use Transform Modes**: Switch between translate, rotate, and scale modes for precise control
3. **Save Your Work**: The app auto-saves to localStorage, but be aware that changing room size clears your design
4. **Lighting Tips**: 
   - Use multiple lights for better illumination
   - Adjust intensity based on your needs (0.5-1.5 is usually good)
   - Experiment with different light colors for ambiance
5. **Furniture Placement**: 
   - Use snapping for aligned placement
   - Rotate furniture to find the best orientation
   - Scale furniture to fit your space proportions

## 🔧 Technical Details

- **Rendering**: WebGL via Three.js
- **Shadow System**: PCF Soft Shadow Maps
- **Model Format**: GLB (binary GLTF) with optional DRACO compression
- **Storage**: localStorage for scene state persistence
- **Coordinate System**: Right-handed Y-up coordinate system
- **Camera**: Perspective camera with 60° FOV


**Enjoy designing your perfect living room!** 🏠✨

