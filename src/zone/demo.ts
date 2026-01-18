import * as THREE from 'three'
import { scene } from '@/core'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import skyboxSrc from '@/assets/skyboxes/blue_sky_sunshine.png'
import buildingSrc from '@/assets/models/city/commercial/building-a.glb'
import characterSrc from '@/assets/models/characters/character-female-a.glb'

const modelLoader = new GLTFLoader()
const textureLoader = new THREE.TextureLoader()

export async function load(){

    const building = await modelLoader.loadAsync(buildingSrc)
    const character = await modelLoader.loadAsync(characterSrc)
    const skybox = await textureLoader.loadAsync(skyboxSrc)

    skybox.mapping = THREE.EquirectangularReflectionMapping
    scene.background = skybox
    
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2)
    scene.add(hemiLight)

    const model = building.scene
    model.scale.set(10, 10, 10)
    model.position.set(0, 0, 10)
    scene.add(model)

    const char = character.scene
    char.scale.set(3, 3, 3)
    char.position.set(0, 0, 0)
    scene.add(char)

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