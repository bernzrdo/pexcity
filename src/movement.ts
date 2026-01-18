import * as THREE from 'three'
import { camera, onRender } from './core'

const SPEED = 6
const GRAVITY = 20
const JUMP = 8
const DAMPING = 10  

const HEIGHT = 1.5

const KEYMAP = {
    forward: 'KeyW',
    back: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    jump: 'Space'
}

const player = {
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(),
    onGround: false
}

const input = Object.fromEntries(Object.keys(KEYMAP).map(k=>[k, false])) as Record<keyof typeof KEYMAP, boolean>

addEventListener('keydown', e=>{
    for(let [key, code] of Object.entries(KEYMAP) as [keyof typeof KEYMAP, string][])
        if(code == e.code) input[key] = true
})

addEventListener('keyup', e=>{
    for(let [key, code] of Object.entries(KEYMAP) as [keyof typeof KEYMAP, string][])
        if(code == e.code) input[key] = false
})

onRender(delta=>{

    // calculate direction
    const direction = new THREE.Vector3()
    
    direction.z = Number(input.back) - Number(input.forward)
    direction.x = Number(input.right) - Number(input.left)
    direction.normalize()
    
    direction.applyQuaternion(camera.quaternion)
    direction.y = 0
    direction.normalize()
    
    // set velocity
    player.velocity.x += (direction.x * SPEED - player.velocity.x) * delta * DAMPING
    player.velocity.z += (direction.z * SPEED - player.velocity.z) * delta * DAMPING
    
    // gravity
    if(!player.onGround)
        player.velocity.y -= GRAVITY * delta
    
    // jump
    if(input.jump && player.onGround){
        player.velocity.y = JUMP
        player.onGround = false
    }
    
    player.position.addScaledVector(player.velocity, delta)
    
    // fake ground for now
    if(player.position.y < .001){
        player.velocity.y = 0
        player.onGround = true
    }
    
    camera.position.x = player.position.x
    camera.position.y = player.position.y + HEIGHT
    camera.position.z = player.position.z

})