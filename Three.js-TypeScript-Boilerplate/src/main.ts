import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 1.5

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

new OrbitControls(camera, renderer.domElement)

const geometry = new THREE.BoxGeometry()
const materials = [
  new THREE.MeshBasicMaterial({ color: 0xff0000 }), // đỏ
  new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // xanh lá
  new THREE.MeshBasicMaterial({ color: 0x0000ff }), // xanh dương
  new THREE.MeshBasicMaterial({ color: 0xffff00 }), // vàng
  new THREE.MeshBasicMaterial({ color: 0xff00ff }), // hồng
  new THREE.MeshBasicMaterial({ color: 0x00ffff })  // cyan
]

const cube = new THREE.Mesh(geometry, materials)
scene.add(cube)

function animate() {
  requestAnimationFrame(animate)

  //cube.rotation.x += 0.01
  //cube.rotation.y += 0.01

  renderer.render(scene, camera)
}

animate()