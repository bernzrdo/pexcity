import * as THREE from 'three'
import { scene } from '@/core'
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

}

export function unload(){

    scene.background = null
    scene.environment = null

}