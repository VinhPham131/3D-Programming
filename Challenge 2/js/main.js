import * as THREE from "three";
import { OrbitControls } from "https://unpkg.com/three@0.153.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://unpkg.com/three@0.153.0/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "https://unpkg.com/three@0.153.0/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "https://unpkg.com/three@0.153.0/examples/jsm/loaders/RGBELoader.js";
import { TransformControls } from "https://unpkg.com/three@0.153.0/examples/jsm/controls/TransformControls.js";

let clickableObjects = []
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let renderer, scene, container, camera, controls, textureLoader, jsonData, sceneData, openedMenu = -1, initializeData;
let selectedBox, selectedBoxHelper;
let transformControls;
let selectedObject = null;
let intersectedObject = null;
let canSelect = true;
let currentTransformMode = 0;
let isDown = false;
let isDragging = false;
let originalSceneData = null;
let furnitureObjects = [];

const transformModes = ["translate", "rotate", "scale"];

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();

function onPointerMove( event ) {
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

//displays the light UI if any is selected
function displayLightUI(){
  if (!selectedObject) return;
  selectedObject.traverse((element)=>{
    if (element.isLight)
    {
      const control = selectedObject.getObjectByName('control')

      const LightUI = document.getElementById("light-adjustments-container")
      LightUI.style.display = "flex"

      const intensityNode = document.getElementById("light-intensity-input")
      intensityNode.value = element.intensity
      
      const newColor = "#" + element.color.getHexString(THREE.SRGBColorSpace)
      const colorNode = document.getElementById("light-color-input")
      
      colorNode.value = newColor

      const intensityText = document.getElementById("light-intensity-text")
      const colorText = document.getElementById("light-color-text")

      intensityText.innerHTML = `Intensity: ${element.intensity}`
      colorText.innerHTML = `color: ${newColor}`

      function changeIntensity(event,element){
        element.intensity = event.target.value
        intensityText.innerHTML = `Intensity: ${event.target.value}`
      } 

      intensityNode.oninput = (event) => changeIntensity(event,element)

      function changeColor(event,element){
        element.color = new THREE.Color(event.target.value)
        colorText.innerHTML = `Color: ${event.target.value}`
        control.material.color = new THREE.Color(event.target.value)
      } 
      colorNode.oninput = (event) => changeColor(event,element)
    }
  })
}

//hides light UI
function hideLightUI(){
  const LightUI = document.getElementById("light-adjustments-container")
  LightUI.style.display = "none"
}

//displays the furniture customization UI if furniture is selected
function displayFurnitureUI(){
  if (!selectedObject) return;
  
  let isFurniture = false;
  selectedObject.traverse((element)=>{
    if (element.isLight) {
      isFurniture = false;
      return;
    }
    if (element.isMesh && element !== selectedObject) {
      isFurniture = true;
    }
  });
  
  if (!isFurniture) return;
  
  const FurnitureUI = document.getElementById("furniture-adjustments-container")
  FurnitureUI.style.display = "flex"
  
  let currentColor = "#ffffff";
  selectedObject.traverse((element)=>{
    if (element.isMesh && element.material) {
      if (element.material.color) {
        currentColor = "#" + element.material.color.getHexString();
      }
    }
  });
  
  const colorNode = document.getElementById("furniture-color-input")
  colorNode.value = currentColor
  
  const colorText = document.getElementById("furniture-color-text")
  colorText.innerHTML = `Color: ${currentColor}`
  
  // Change color handler
  colorNode.oninput = (event) => {
    const newColor = new THREE.Color(event.target.value)
    selectedObject.traverse((element)=>{
      if (element.isMesh && element.material) {
        if (Array.isArray(element.material)) {
          element.material.forEach(mat => {
            if (mat.color) mat.color.copy(newColor)
          })
        } else {
          if (element.material.color) element.material.color.copy(newColor)
        }
      }
    })
    colorText.innerHTML = `Color: ${event.target.value}`
    saveSceneState()
  }
}

//hides furniture UI
function hideFurnitureUI(){
  const FurnitureUI = document.getElementById("furniture-adjustments-container")
  FurnitureUI.style.display = "none"
}

//handle mouse click on objects and outside of it
//for selection and de-selection
function mouseClickOnObject(event){

  if (isDragging) return;

  //click on object. Only if it is selectable
  if (!canSelect) return;
  if (event.button != 0) return;
  if (event.target.localName != "canvas") return;

  if (intersectedObject) {
    if (selectedObject) {
      transformControls.detach();
    }
      

    transformControls.attach(intersectedObject)
    selectedObject = intersectedObject

    selectedBox.setFromObject(selectedObject, true);

    //hides the light UI and only displays it again if a light is selected
    hideLightUI()
    hideFurnitureUI()
    displayLightUI()
    displayFurnitureUI()
  }
  //unselect object
  else
  {
    transformControls.detach(selectedObject)
    selectedObject = null
    selectedBox.setFromCenterAndSize(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
    hideLightUI()
    hideFurnitureUI()
  }
}

//deletes the selected object
function deleteSelectedObject() {
  if (!selectedObject) return;

  const clickableIndex = clickableObjects.indexOf(selectedObject);
  if (clickableIndex !== -1) {
    clickableObjects.splice(clickableIndex, 1);
  }

  const furnitureIndex = furnitureObjects.indexOf(selectedObject);
  if (furnitureIndex !== -1) {
    furnitureObjects.splice(furnitureIndex, 1);
  }

  transformControls.detach();
  scene.remove(selectedObject);

  selectedObject = null;
  selectedBox.setFromCenterAndSize(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0)
  );

  hideLightUI();
  hideFurnitureUI();

  saveSceneState();
}


//handles all key events
function handleKeys(event){
  switch (event.key.toLowerCase()) {
    case 'q':
      changeTransformMode(0)
      break;
    case 'w':
      changeTransformMode(1)
      break;
    case 'e':
      changeTransformMode(2)
      break;
    case 'delete':
      deleteSelectedObject()
      break;
    case 'l':
      addLight(new THREE.Vector3(0,1,0))
      break;
    default:
      break;
  }
}

//initializes the UI transform buttons
function initTransformModes(){
  const transformModeElements = document.getElementById('mode-buttons-container')
  const tranformModeChildren = transformModeElements.getElementsByClassName('mode-btn')

  tranformModeChildren[0].classList.add('control-selected')

  for (let i = 0; i < tranformModeChildren.length; i++) {
    tranformModeChildren[i].onclick = () =>{
      changeTransformMode(i)
      transformControls.attach(selectedObject.object)
    }
  }
}

//closes object menu
function closeMenu(){
  if (openedMenu == -1) return;
  const menu = document.getElementById('menu-container')
  menu.style.display = "none"

  const categoryPalette = document.getElementById('category-palette')
  const categoryChildren = categoryPalette.childNodes

  categoryChildren[openedMenu].classList.remove('selected-category')
  openedMenu = -1;
}

//opens object menu
function openMenu(category){
  const categoryPalette = document.getElementById('category-palette')
  const categoryChildren = categoryPalette.childNodes

  if (openedMenu != -1)
    categoryChildren[openedMenu].classList.remove('selected-category')
  openedMenu = category.id
  categoryChildren[openedMenu].classList.add('selected-category')

  const menu = document.getElementById('menu-container')
  menu.style.display = "flex"

  const header = document.getElementById('menu-header')

  const title = document.getElementById('menu-title')
  title.innerText = category.name

  const closeBtn = document.getElementById('menu-close-btn')
  closeBtn.onclick = () => closeMenu()

  const contents = document.getElementById('menu-contents')
  contents.innerHTML = ""

  //filter objects based on the category
  jsonData.objects.filter((element)=>{
    return category.objects.includes(element.id)
  })
  //creates an object UI for each of them
  .map((element)=>{
    const newObject = document.createElement('article')
    const newObjectTitle = document.createElement('p')
    const newObjectImage = document.createElement('img')

    newObject.classList.add("object-container")
    newObject.onclick = () => {
      if (window.replacingFurniture && window.furnitureToReplace) {
        replaceSelectedFurniture(element)
        window.replacingFurniture = false
        window.furnitureToReplace = null
        closeMenu()
      } else {
        addObject(element)
      }
    }

    newObjectTitle.innerText = element.name
    newObjectTitle.classList.add("object-title")

    newObjectImage.src = `./assets/images/furniture/${element.path}.jpg`
    newObjectImage.classList.add("object-image")

    newObject.appendChild(newObjectTitle)
    newObject.appendChild(newObjectImage)
    
    //appends a new object to the menu
    contents.appendChild(newObject)
  })
}

//Querys the object and initializes the categoty UI
function createUI(){
  const categories = document.getElementById('category-palette');

  // load the categories from JSON and populates the UI
  jsonData.categories.map((el, id)=>{
    const category = document.createElement('div');
    category.classList.add('category')
    category.onclick = () => openMenu(el, id);

    const text = document.createElement('h3');
    text.classList.add('category-text')
    text.innerHTML = el.name

    const node = document.createElement('img');
    node.classList.add('category-img');
    node.src = el.thumb;

    categories.appendChild(category)
    
    category.appendChild(text);
    category.appendChild(node);
  })
  categories.style.display = "flex";
}

//adds an object into a position
function addObject(object, 
                   position = new THREE.Vector3(0,0,0), 
                   rotation = new THREE.Vector3(0,0,0), 
                   scale = new THREE.Vector3(1,1,1),
                   select = true,
                   objectData = null
                   ){
  const modelPath = `./assets/models/furniture/${object.path}.glb`

  loader.load(modelPath, (gltf)=>{
    const model = gltf.scene;
    selectedObject = model

    model.traverse(function(object){
      if (object.isMesh)
      {
        object.castShadow = true
        object.receiveShadow = true
      }
    })

    //all objects belong to a group so we can transform it as a whole
    const group = new THREE.Group()
    group.position.copy(position)

    group.rotation.setFromVector3(rotation)
    group.scale.copy(scale)

    group.add(model)
    group.name = 'group'
    
    // Store object data for replacement/saving
    group.userData.objectId = object.id
    group.userData.objectData = objectData || object

    clickableObjects.push(group)
    furnitureObjects.push(group)
    scene.add( group );
    selectedBox.setFromObject(group, true);

    if (transformControls && select)
    {
      transformControls.attach(group)
      selectedObject = group
      displayFurnitureUI()
    }
    
    saveSceneState()
  })

  //closes the menu if it is open
    closeMenu()
}

//replaces selected furniture with a new type
function replaceSelectedFurniture(newObject){
  if (!selectedObject || !selectedObject.userData.objectId) return;
  
  const position = selectedObject.position.clone()
  const euler = new THREE.Euler().setFromQuaternion(selectedObject.quaternion)
  const rotation = new THREE.Vector3(euler.x, euler.y, euler.z)
  const scale = selectedObject.scale.clone()
  
  // Remove old object
  const index = clickableObjects.indexOf(selectedObject)
  if (index != -1) {
    clickableObjects.splice(index, 1)
  }
  const furnitureIndex = furnitureObjects.indexOf(selectedObject)
  if (furnitureIndex != -1) {
    furnitureObjects.splice(furnitureIndex, 1)
  }
  transformControls.detach()
  scene.remove(selectedObject)
  
  // Add new object at same position
  addObject(newObject, position, rotation, scale, true)
}

//resets the room layout to initial state for current room size only
function resetRoomLayout(){
  // Clear all furniture objects
  furnitureObjects.forEach(obj => {
    const index = clickableObjects.indexOf(obj)
    if (index != -1) {
      clickableObjects.splice(index, 1)
    }
    scene.remove(obj)
  })
  furnitureObjects = []
  
  // Clear all lights (except default)
  clickableObjects.forEach(obj => {
    let isLight = false
    obj.traverse((element) => {
      if (element.isLight) isLight = true
    })
    if (isLight) {
      const index = clickableObjects.indexOf(obj)
      if (index != -1) {
        clickableObjects.splice(index, 1)
      }
      scene.remove(obj)
    }
  })
  
  transformControls.detach()
  selectedObject = null
  selectedBox.setFromCenterAndSize(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
  hideLightUI()
  hideFurnitureUI()
  
  // Reload initial scene
  if (originalSceneData) {
    sceneData = JSON.parse(JSON.stringify(originalSceneData))
    initializeObjects()
  }
  
  // Only remove the current room size's saved state
  const roomSize = localStorage.getItem('selectedRoomSize') || 'medium';
  localStorage.removeItem(`sceneState-${roomSize}`)
}

//changes room size and reloads scene
function changeRoomSize(newRoomSize){
  const currentRoomSize = localStorage.getItem('selectedRoomSize') || 'medium';
  if (newRoomSize === currentRoomSize) {
    hideRoomSizeMenu();
    return;
  }
  
  // Save current state before switching
  saveSceneState();
  
  // Switch to new room size
  localStorage.setItem('selectedRoomSize', newRoomSize);
  window.location.reload();
}

//saves current scene state to localStorage for the current room size
function saveSceneState(){
  const state = {
    objects: [],
    lights: []
  }
  
  furnitureObjects.forEach(obj => {
    state.objects.push({
      id: obj.userData.objectId,
      position: [obj.position.x, obj.position.y, obj.position.z],
      rotation: [
        obj.rotation.x * 180 / Math.PI,
        obj.rotation.y * 180 / Math.PI,
        obj.rotation.z * 180 / Math.PI
      ],
      scale: [obj.scale.x, obj.scale.y, obj.scale.z]
    })
  })
  
  clickableObjects.forEach(obj => {
    let isLight = false
    let lightData = null
    obj.traverse((element) => {
      if (element.isLight) {
        isLight = true
        lightData = {
          position: [obj.position.x, obj.position.y, obj.position.z],
          intensity: element.intensity,
          color: "#" + element.color.getHexString()
        }
      }
    })
    if (isLight && lightData) {
      state.lights.push(lightData)
    }
  })
  
  const roomSize = localStorage.getItem('selectedRoomSize') || 'medium';
  // Save state with room-size-specific key
  localStorage.setItem(`sceneState-${roomSize}`, JSON.stringify(state))
}

//loads scene state from localStorage for the current room size
function loadSceneState(){
  const roomSize = localStorage.getItem('selectedRoomSize') || 'medium';
  const savedState = localStorage.getItem(`sceneState-${roomSize}`)
  if (!savedState) return false
  
  try {
    const state = JSON.parse(savedState)
    sceneData = []
    
    state.objects.forEach(obj => {
      sceneData.push({
        type: "object",
        id: obj.id,
        position: obj.position,
        rotation: obj.rotation,
        scale: obj.scale
      })
    })
    
    state.lights.forEach(light => {
      sceneData.push({
        type: "light",
        position: light.position,
        intensity: light.intensity,
        color: light.color
      })
    })
    
    return true
  } catch (e) {
    console.error("Error loading scene state:", e)
    return false
  }
}

//adds a light into a position
function addLight(position = new THREE.Vector3(0,1,0), intensity= 1, color = "#ffffff", select = true){
    //group to control the light
    const lightControlGroup = new THREE.Group()
    lightControlGroup.position.copy(position);
  
    //mesh to represent the light. Will be a simple wireframe
    const lightControlGeometry = new THREE.SphereGeometry(0.15,2,2);
    const lightControlMaterial = new THREE.MeshBasicMaterial({wireframe: true, color: new THREE.Color(color), wireframeLinewidth: 5});
    const light01ControlMesh = new THREE.Mesh(lightControlGeometry, lightControlMaterial);
    light01ControlMesh.name = "control"
    
    //the point light itself. It will be accessed to control its intensity
    const light01 = new THREE.PointLight(color, intensity, 500, 50);
    light01.castShadow = true;
    light01.shadow.bias = -0.0001

    light01.name = "light"
    
    //adds the mesh and the light
    lightControlGroup.add(light01);
    lightControlGroup.add(light01ControlMesh)

    lightControlGroup.name = 'group'
    clickableObjects.push(lightControlGroup)

    scene.add( lightControlGroup );

    //selects last clicked light
    if (transformControls && select)
    {
      transformControls.attach(lightControlGroup)
      selectedObject = lightControlGroup
      displayLightUI()
    }
    
    saveSceneState()
}

//Initialize the UI buttons
function initButtons(){
  const addLightBtn = document.getElementById('add-light-btn')
  const deleteObjectBtn = document.getElementById('delete-obj-btn')
  const resetRoomBtn = document.getElementById('reset-room-btn')
  const replaceFurnitureBtn = document.getElementById('replace-furniture-btn')
  const changeRoomSizeBtn = document.getElementById('change-room-size-btn')
  const backHomeBtn = document.getElementById('back-home-btn')

  addLightBtn.onclick = () =>{
    addLight()
  }

  deleteObjectBtn.onclick = () =>{
   deleteSelectedObject();
  }
  
  if (resetRoomBtn) {
    resetRoomBtn.onclick = () => {
      if (confirm("Are you sure you want to reset the room layout? This will remove all furniture and lights.")) {
        resetRoomLayout()
      }
    }
  }
  
  if (replaceFurnitureBtn) {
    replaceFurnitureBtn.onclick = () => {
      if (!selectedObject || !selectedObject.userData.objectId) {
        alert("Please select a furniture item first")
        return
      }
      // Open menu to select replacement
      const categoryPalette = document.getElementById('category-palette')
      const categories = categoryPalette.childNodes
      if (categories.length > 0) {
        const category = jsonData.categories[0]
        openMenu(category, 0)
        // Set a flag to indicate we're replacing
        window.replacingFurniture = true
        window.furnitureToReplace = selectedObject
      }
    }
  }
  
  if (changeRoomSizeBtn) {
    changeRoomSizeBtn.onclick = () => {
      showRoomSizeMenu();
    }
  }
  
  if (backHomeBtn) {
    backHomeBtn.onclick = () => {
      backToHome();
    }
  }
}

//shows the room size selection menu
function showRoomSizeMenu(){
  const menu = document.getElementById('room-size-menu-container');
  if (!menu) return;
  
  menu.style.display = "flex";
  
  // Highlight current room size
  const currentRoomSize = localStorage.getItem('selectedRoomSize') || 'medium';
  const options = menu.querySelectorAll('.room-size-option');
  options.forEach(option => {
    option.classList.remove('selected-room-size');
    if (option.getAttribute('data-size') === currentRoomSize) {
      option.classList.add('selected-room-size');
    }
  });
  
  // Close button handler
  const closeBtn = document.getElementById('room-size-menu-close-btn');
  if (closeBtn) {
    closeBtn.onclick = () => hideRoomSizeMenu();
  }
  
  // Option click handlers
  options.forEach(option => {
    option.onclick = () => {
      const newSize = option.getAttribute('data-size');
      if (newSize !== currentRoomSize) {
        changeRoomSize(newSize);
      } else {
        hideRoomSizeMenu();
      }
    };
  });
}

//hides the room size selection menu
function hideRoomSizeMenu(){
  const menu = document.getElementById('room-size-menu-container');
  if (menu) {
    menu.style.display = "none";
  }
}

//handles transform modes: move, rotate and scale
function changeTransformMode(modeID){
  const transformModeElements = document.getElementById('mode-buttons-container')
  const tranformModeChildren = transformModeElements.getElementsByClassName('mode-btn')

  tranformModeChildren[currentTransformMode].classList.remove('control-selected')

  currentTransformMode = modeID
  transformControls.setMode(transformModes[currentTransformMode])
  tranformModeChildren[currentTransformMode].classList.add('control-selected')
}

//initializes a default scene loaded from the JSON in the line 470
async function initializeObjects() {

  await sceneData.map(async el => {
    
    if (el.type == "object")
    {
      const object = jsonData.objects.filter((object)=>{
        return object.id == el.id
      })

      const position = new THREE.Vector3(el.position[0], el.position[1], el.position[2])
      const rotation = new THREE.Vector3(el.rotation[0]* Math.PI / 180.0, el.rotation[1]* Math.PI / 180.0, el.rotation[2]* Math.PI / 180.0)
      const scale = new THREE.Vector3(el.scale[0], el.scale[1], el.scale[2])

      addObject(object[0], position, rotation, scale, false, object[0])
    }
    else if (el.type == "light") {
      const position = new THREE.Vector3(el.position[0], el.position[1], el.position[2])
      addLight(position, el.intensity, el.color, false)
    }
    
  });
    
  await Delay(100);

  transformControls.detach()
  selectedObject = null
  selectedBox.setFromCenterAndSize(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));

}

window.addEventListener('mouseup', mouseClickOnObject)

window.addEventListener('mousemove', onPointerMove );

window.addEventListener('keydown', handleKeys );

window.addEventListener("load", function () {
  start();
});

async function start() {

  initTransformModes()
  initButtons()

  textureLoader = new THREE.TextureLoader()
  renderer = new THREE.WebGLRenderer({ antialias: true });
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xe7e7e7 );

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container = document.querySelector("#threejsContainer");
  container.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1000 );
  camera.position.set(4, 3, 3);

  //setup of helper that appears over selected objects
  selectedBox = new THREE.Box3();
  selectedBox.setFromCenterAndSize(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
  selectedBoxHelper = new THREE.Box3Helper(selectedBox, 0xffff00);
  scene.add(selectedBoxHelper);

  const backgroundTexture = new RGBELoader().load(
    "./assets/bg/pisa.hdr",
    function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      scene.background = texture;
      scene.backgroundBlurriness = 0.1;
    },
  );

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI / 2;
  controls.target.set(0, 0.5, 0)


  dracoLoader.setDecoderPath( "https://www.gstatic.com/draco/versioned/decoders/1.5.6/" );
  loader.setDRACOLoader(dracoLoader);

  //setting tranform controls
  transformControls = new TransformControls(camera,  renderer.domElement);
  transformControls.addEventListener( 'dragging-changed', function ( event ) {
    controls.enabled = ! event.value;
    canSelect = !event.value;
    if (!event.value) {
      // Save state when dragging ends
      saveSceneState();
    }
  });
  transformControls.addEventListener( 'change', function () {
    // Update selection box when object is transformed
    if (selectedObject) {
      selectedBox.setFromObject(selectedObject, true);
    }
  });

  transformControls.setTranslationSnap( 0.05 );
  transformControls.setRotationSnap( THREE.MathUtils.degToRad( 15 ) );
  transformControls.setScaleSnap( 0.1 );

  scene.add(transformControls)
  
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  
  // Add directional light (main light source)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  scene.add(directionalLight);

  // load main json file with all the app parameters and data
  fetch("./js/params.json")
    .then(res => res.json())
    .then(data => {
        jsonData = data;

        // once the params JSON is fully loaded, let's create the UI
        createUI();

        // Determine which scene file to load based on room size
        const roomSize = localStorage.getItem('selectedRoomSize') || 'medium';
        const sceneFile = `./js/scene-${roomSize}.json`;
        
        fetch(sceneFile)
          .then(res => {
            if (!res.ok) {
              // Fallback to medium if file doesn't exist
              return fetch("./js/scene-medium.json");
            }
            return res;
          })
          .then(res => res.json())
          .then(data => {
              originalSceneData = JSON.parse(JSON.stringify(data));
              
              // Try to load saved state for current room size
              if (loadSceneState()) {
                initializeObjects()
              } else {
                sceneData = data;
                initializeObjects()
              }
              animate();
        })

  })
  

  function animate() {
    controls.update();
    raycaster.setFromCamera( pointer, camera );
    const intersects = raycaster.intersectObjects(clickableObjects);

    if (intersects.length)
      {
        let childObject = intersects[0].object
        
        if (childObject)
        {
          while (childObject?.parent?.name != 'group') {
            childObject = childObject.parent
          }
  
          if (childObject.parent)
            childObject = childObject.parent
          intersectedObject = childObject
        }

      }
    else {
      intersectedObject = null;
    }
      
    if (selectedObject) selectedBox.setFromObject(selectedObject, true);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
}

window.addEventListener("resize", onWindowResize);


//prevent the user from selecting objects when dragging the camera/orbitControls
document.onmousedown = function() {
  isDown = true;
};

document.onmouseup = function() {
  isDown = false;
};

document.onmousemove = function() {
  if (!isDown) {
    isDragging = false;
    return;
  };
  isDragging = true;
};


const Delay = (milliseconds) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
};

function backToHome(){
  window.location.href = 'homepage.html';
}