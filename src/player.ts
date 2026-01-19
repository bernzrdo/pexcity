import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { camera, orbit, onRender, scene, isLocked } from './core'
import charSrc from '@/assets/models/characters/character-male-e.glb'

const SPEED = 2
const SPRINT_SPEED = 4
const GRAVITY = 15
const JUMP = 6
const DAMPING = 10
const ANIM_TRANSITION = .3

const KEYMAP = {

    forward: ['KeyW'],
    back: ['KeyS'],
    left: ['KeyA'],
    right: ['KeyD'],
    
    jump: ['Space'],
    sprint: ['ShiftLeft', 'ControlLeft']

}

const ANIMATIONS = ['idle', 'walk', 'sprint', 'jump', 'fall'] as const

const input: Record<string, true> = {}
addEventListener('keydown', e=>{ input[e.code] = true })
addEventListener('keyup', e=>{ delete input[e.code] })

function state(action: keyof typeof KEYMAP): 0 | 1 {
    if(isLocked()) return 0
    return KEYMAP[action].some(key=>input[key]) ? 1 : 0
}

const mesh = new THREE.Object3D()
scene.add(mesh)

const velocity = new THREE.Vector3()
let onGround = false

type Animation = typeof ANIMATIONS[number]

let anim: {
    mixer: THREE.AnimationMixer
    actions: Record<Animation, THREE.AnimationAction>
    currentAction: Animation
}

function setAction(name: Animation){
    if(!anim || anim.currentAction == name) return

    const next = anim.actions[name]
    next.reset().play()
    console.log(anim.actions, anim.currentAction)
    anim.actions[anim.currentAction].crossFadeTo(next, ANIM_TRANSITION, false)

    anim.currentAction = name

}

;(async ()=>{

    const { animations, scene: model } = await new GLTFLoader().loadAsync(charSrc)

    model.scale.setScalar(1)
    mesh.add(model)
    
    const mixer = new THREE.AnimationMixer(model)
    const actions: Partial<typeof anim['actions']> = {}
    for(let name of ANIMATIONS)
        actions[name] = mixer.clipAction(animations.find(a=>a.name == name)!)
    anim = { mixer, actions } as typeof anim

    anim.actions.idle.play()
    anim.currentAction = 'idle'
    
    // console.log(animations.map(a=>a.name).join('\n'))

})()

onRender(delta=>{

    // input direction
    const inputDir = new THREE.Vector3(
        state('right') - state('left'),
        0,
        state('forward') - state('back')
    )

    const speed = state('sprint') ? SPRINT_SPEED : SPEED

    if(inputDir.lengthSq() > 0){
        inputDir.normalize()

        const camDir = new THREE.Vector3()
        camera.getWorldDirection(camDir)
        camDir.y = 0
        camDir.normalize()

        const right = new THREE.Vector3()
            .crossVectors(camDir, camera.up)
            .normalize()

        const moveDir = new THREE.Vector3()
            .addScaledVector(camDir, inputDir.z)
            .addScaledVector(right, inputDir.x)
            .normalize()

        // rotate
        const targetQuat = new THREE.Quaternion()
        targetQuat.setFromUnitVectors(
            new THREE.Vector3(0,0,1),
            moveDir.clone().normalize()
        )
        mesh.quaternion.slerp(targetQuat, delta * DAMPING)

        velocity.x += (moveDir.x * speed - velocity.x) * delta * DAMPING
        velocity.z += (moveDir.z * speed - velocity.z) * delta * DAMPING

        if(onGround) setAction(state('sprint') ? 'sprint' : 'walk')

    }else{
        velocity.x -= velocity.x * delta * DAMPING
        velocity.z -= velocity.z * delta * DAMPING
        if(onGround) setAction('idle')
    }

    // gravity
    if(!onGround)
        velocity.y -= GRAVITY * delta

    // jump
    if(state('jump') && onGround){
        velocity.y = JUMP
        onGround = false
    }

    if(!onGround) setAction(velocity.y > 0 ? 'jump' : 'fall')

    mesh.position.addScaledVector(velocity, delta)

    // animation
    if(anim) anim.mixer.update(delta)

    // fake ground
    if(mesh.position.y < 0){
        mesh.position.y = 0
        velocity.y = 0
        onGround = true
    }

    // orbit
    orbit.position.x = mesh.position.x
    orbit.position.y = mesh.position.y + 1
    orbit.position.z = mesh.position.z

})