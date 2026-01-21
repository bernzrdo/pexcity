import { isLocked } from './core'

type Key = keyof typeof KEYMAP

const KEYMAP = {

    forward: ['KeyW'],
    back: ['KeyS'],
    left: ['KeyA'],
    right: ['KeyD'],
    
    jump: ['Space'],
    sprint: ['ShiftLeft'],

    car: ['KeyC']

}

function getKey(code: string){
    return (Object.entries(KEYMAP) as [Key, string[]][])
        .find(([_, codes])=>codes.includes(code))?.[0]
        ?? null
}

const input: Record<string, true> = {}
addEventListener('keydown', e=>{
    dispatch(e.code)
    input[e.code] = true
})
addEventListener('keyup', e=>{ delete input[e.code] })

export function isKey(key: Key){
    return !isLocked() && KEYMAP[key].some(key=>input[key])
}

const listeners: Partial<Record<Key, (() => any)[]>> = {}
export function onKey(key: Key, listener: () => any){
    if(listeners[key]) listeners[key].push(listener)
    else listeners[key] = [listener]
}

function dispatch(code: string){

    const key = getKey(code)
    
    if(
        // code isn't assigned to a key
        !key ||
        // the key is already pressed
        isKey(key) ||
        // the key doesn't have listeners
        !listeners[key]
    ) return

    for(const listener of listeners[key])
        listener()

}