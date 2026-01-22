import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { scene, onRender } from '@/core'
import { physicsWorld, slipperyMat, createBodyFromModel } from '@/physics'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import skyboxSrc from '@/assets/skyboxes/blue_sky_sunshine.png'
import buildingSrc from '@/assets/models/city/commercial/building-a.glb'

const modelLoader = new GLTFLoader()
const textureLoader = new THREE.TextureLoader()

export async function load(){

    const building = await modelLoader.loadAsync(buildingSrc)
    const skybox = await textureLoader.loadAsync(skyboxSrc)

    skybox.mapping = THREE.EquirectangularReflectionMapping
    scene.background = skybox
    
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2)
    scene.add(hemiLight)

    const model = building.scene
    model.scale.setScalar(4)
    model.position.set(0, 0, 5)
    scene.add(model)

    const floor = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ color: 0x888888 })
    const cube = new THREE.Mesh(floor, material)
    scene.add(cube)

    cube.scale.set(10, .5, 10)
    cube.position.set(0, -.25, 0)


    const sphereGeo = new THREE.SphereGeometry(1)
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x22a2ff, wireframe: true})
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMaterial)
    scene.add(sphereMesh)


    // Physics
    const buildingBody = createBodyFromModel(building, model.position)
    physicsWorld.addBody(buildingBody)

    const groundBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Plane(),
        material: slipperyMat,
    })
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    physicsWorld.addBody(groundBody);

    const sphereBody = new CANNON.Body({
        mass: 5,
        shape: new CANNON.Sphere(sphereGeo.parameters.radius),
    })
    physicsWorld.addBody(sphereBody);
    sphereBody.position.set(0, 10, 3);

    onRender((delta) => {
        sphereMesh.quaternion.copy(sphereBody.quaternion)
        sphereMesh.position.copy(sphereBody.position)
    })

}

export function unload(){

    scene.background = null
    scene.environment = null

}