import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { camera, orbit, onRender, scene } from './core'
import { isKey, onKey } from './input'
import charSrc from '@/assets/models/characters/character-male-e.glb'
import carSrc from '@/assets/models/cars/sedan.glb'

const SPEED = 3
const SPRINT_SPEED = 5
const GRAVITY = 15
const JUMP = 6
const DAMPING = 10
const ANIM_TRANSITION = .3

const ANIMATIONS = ['idle', 'walk', 'sprint', 'jump', 'fall'] as const

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

function setAnimation(name: Animation){
    if(!anim || anim.currentAction == name) return

    const next = anim.actions[name]
    next.reset().play()
    anim.actions[anim.currentAction].crossFadeTo(next, ANIM_TRANSITION, false)

    anim.currentAction = name

}

const gltfLoader = new GLTFLoader()

// load character model
;(async ()=>{

    const { animations, scene: model } = await gltfLoader.loadAsync(charSrc)

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

let isCar = false
onKey('car', ()=>{
    isCar = !isCar
    console.log(isCar ? 'you are car' : 'you are not car')
    carModel.scale.setScalar(isCar ? .7 : 0)
    characterModel?.scale.setScalar(isCar ? 0 : 1)
})

onRender(delta=>{

    // input direction
    const inputDir = new THREE.Vector3(
        +isKey('right') - +isKey('left'),
        0,
        +isKey('forward') - +isKey('back')
    )

    const speed = isKey('sprint') ? SPRINT_SPEED : SPEED

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

        if(onGround) setAnimation(isKey('sprint') ? 'sprint' : 'walk')

    }else{
        velocity.x -= velocity.x * delta * DAMPING
        velocity.z -= velocity.z * delta * DAMPING
        if(onGround) setAnimation('idle')
    }

    // gravity
    if(!onGround)
        velocity.y -= GRAVITY * delta

    // jump
    if(isKey('jump') && onGround){
        velocity.y = JUMP
        onGround = false
    }

    if(!onGround) setAnimation(velocity.y > 0 ? 'jump' : 'fall')

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