import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger';
import { onRender, scene } from './core'

const GRAVITY = 9.82
const DEBUG_ON = false

export const physicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, -GRAVITY, 0),
});

export const slipperyMat = new CANNON.Material();
const slipperyContact = new CANNON.ContactMaterial(slipperyMat,slipperyMat, {
    friction: 0,
    restitution: 0,
});
physicsWorld.addContactMaterial(slipperyContact);

const cannonDebugger = CannonDebugger(scene, physicsWorld, {
    color: 0xff8f00,
});

onRender(delta => {
    physicsWorld.step(delta);
    if (DEBUG_ON) cannonDebugger.update();
})

export function createBodyFromModel(model, position: THREE.Vector3 = new THREE.Vector3()) {
    const model_bounds = new THREE.Box3().setFromObject(model.scene)
    const coll_size = model_bounds.getSize(new THREE.Vector3())

    const modelBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Box(new CANNON.Vec3(coll_size.x/2, coll_size.y/2, coll_size.z/2)),
        material: slipperyMat,
    })
    modelBody.position.set(position.x, position.y+coll_size.y/2, position.z);
    return modelBody;
}