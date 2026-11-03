/** Path (relative to BASE_URL) of the rigged character model. null = sprite fallback. */
export const CHARACTER_MODEL: string | null = 'char/federico.glb'
/** Y rotation applied to the model so it faces +Z (toward the camera at the start). */
export const CHARACTER_ROTATION = 0
export const CHARACTER_HEIGHT = 1.8

/** Path of the dragon model. null = not shown. */
export const DRAGON_MODEL: string | null = 'char/dragon.glb'
/** World placement of the dragon in the home scene. */
export const DRAGON_POSITION: [number, number, number] = [0, 0, -3.6]
/** Height of the dragon (including its rock base) in world units. */
export const DRAGON_HEIGHT = 5
export const DRAGON_ROTATION = 0
/** Approximate world position of the dragon's head (camera focus of the opening shot). */
export const DRAGON_HEAD: [number, number, number] = [-0.7, 3.8, -2.3]
/** Local offset (relative to the dragon group) of the mouth, for the fire light and embers. */
export const DRAGON_MOUTH: [number, number, number] = [-0.7, 3.6, 1.6]

export const BG = '#060606'
export const RED = '#ff2b2b'
