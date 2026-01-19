import * as THREE from 'three'

export const renderer = new THREE.WebGLRenderer()
document.body.appendChild(renderer.domElement)

export const scene = new THREE.Scene()
export const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .1, 1000)

// Pointer Lock
document.addEventListener('click', ()=>renderer.domElement.requestPointerLock())
export function isLocked(){ return !document.pointerLockElement || !document.hasFocus() }

// Controls
export const orbit = new THREE.Object3D()
orbit.rotation.order = 'YXZ'
scene.add(orbit)

camera.position.z = 5
orbit.add(camera)

const scale = -.01

document.body.addEventListener('mousemove', function(e){
    if(isLocked()) return

    orbit.rotateY(e.movementX * scale)
    orbit.rotateX(e.movementY * scale)
    orbit.rotation.z = 0

})

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
