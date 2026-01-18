import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'

export const renderer = new THREE.WebGLRenderer()
document.body.appendChild(renderer.domElement)

export const scene = new THREE.Scene()
export const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, .1, 1000)

// Controls
const controls = new PointerLockControls(camera, document.body)
document.addEventListener('click', ()=>controls.lock())
scene.add(controls.object)

// Update
const renderCallbacks: ((delta: number) => any)[] = []
export function onRender(callback: (delta: number) => any){
    renderCallbacks.push(callback)
}

const clock = new THREE.Clock()

function animate() {
    if(!scene || !camera) return

    const delta = clock.getDelta()
    
    for(let callback of renderCallbacks)
        callback(delta)

    renderer.render(scene, camera)
}
renderer.setAnimationLoop(animate)

// Resize 
function resize(){
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(innerWidth, innerHeight)
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
}
addEventListener('resize', resize)
resize()
