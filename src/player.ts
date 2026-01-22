import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { physicsWorld, slipperyMat, cannonDebugger } from './physics'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { camera, orbit, onRender, scene } from './core'
import { isKey, onKey } from './input'
import charSrc from '@/assets/models/characters/character-male-e.glb'
import carSrc from '@/assets/models/cars/sedan.glb'

const SPEED = 3
const SPRINT_SPEED = 5
const JUMP = 12
const DAMPING = 10
const ANIM_TRANSITION = .3

const HEIGHT = 0.6

const ANIMATIONS = ['idle', 'walk', 'sprint', 'jump', 'fall'] as const

const mesh = new THREE.Object3D()
scene.add(mesh)
const playerBody = new CANNON.Body({
    type: CANNON.Body.DYNAMIC,
    shape: new CANNON.Box(new CANNON.Vec3(0.2, HEIGHT/2, 0.2)),
    position: new CANNON.Vec3(0, 2, 0),
    fixedRotation: true,
    material: slipperyMat,
    mass: 5,
    linearDamping: 0.3,
})
physicsWorld.addBody(playerBody)

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

        // rotate mesh
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

    if(!onGround) setAnimation(playerBody.velocity.y > 0 ? 'jump' : 'fall')  

    playerBody.velocity = new CANNON.Vec3(velocity.x, playerBody.velocity.y, velocity.z)

    // jump
    if(isKey('jump') && onGround){
        playerBody.applyImpulse(new CANNON.Vec3(0, JUMP, 0))
    }

    // animation
    if(anim) anim.mixer.update(delta)

    // orbit
    orbit.position.x = playerBody.position.x
    orbit.position.y = playerBody.position.y + 1
    orbit.position.z = playerBody.position.z

    mesh.position.set(
        playerBody.position.x,
        playerBody.position.y - HEIGHT/2,
        playerBody.position.z
    );

})

physicsWorld.addEventListener("postStep", () => {
    onGround = false

    for (let i = 0; i < physicsWorld.contacts.length; i++) {
        const contact = physicsWorld.contacts[i];

        const isPlayerA = contact.bi === playerBody;
        const isPlayerB = contact.bj === playerBody;

        if (!isPlayerA && !isPlayerB) continue;

        const normal = contact.ni.clone();
        if (isPlayerA) normal.negate(normal);

        if (normal.y > 0.5) {
            onGround = true;
            break;
        }
    }
})