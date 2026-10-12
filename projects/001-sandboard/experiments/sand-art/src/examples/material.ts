import { ArtSolver } from '../solver'
import { createComposition } from '../composition'
import { allocateHand, HAND_CAPACITY } from '../hand'
import { naturalFlowAt } from '../airborne'
import { FIXED_STEP, GRID_WIDTH, GRID_HEIGHT, MAX_STEPS, type ArtContact } from '../model'
import { examplePaths, pathContact } from './score'
import type { HandExample } from './catalog'
import type { SavedArt } from '../storage'

// Reproduce small tool studies with the unchanged original studio solver.
// The original two presets still use their original composition function.
export async function makeExampleArt(device: GPUDevice, example: HandExample): Promise<SavedArt> {
  const solver = new ArtSolver(device, example.mode)
  try {
    await solver.initialize()
    const base = createComposition(example.mode, example.preset ?? 'blank')
    if (example.id === 'scrape' || example.id === 'palm') for (let i = 0; i < base.length; i += 4) base[i] = .42
    solver.loadState(base)
    let remaining = HAND_CAPACITY, encoder = device.createCommandEncoder(), slot = 0, steps = 0
    const submit = async () => { if (slot) { device.queue.submit([encoder.finish()]); await device.queue.onSubmittedWorkDone(); encoder = device.createCommandEncoder(); slot = 0 } }
    const step = async (contact?: ArtContact) => {
      let contacts = contact ? [contact] : []
      if (contact?.pour) {
        if (remaining < .001) remaining = HAND_CAPACITY
        contact.pour.flow = naturalFlowAt(solver.airborne.elapsedTime, contact.pour.style, contact.to.x, contact.to.y)
        const allocation = allocateHand(contacts, remaining, FIXED_STEP); contacts = allocation.contacts; remaining = allocation.remaining
      }
      solver.encodeStep(encoder, { dt: FIXED_STEP, contacts, preserve: true, wetness: 0, wind: 0, windAngle: .2 }, slot++)
      steps++
      if (slot === MAX_STEPS) { device.queue.submit([encoder.finish()]); encoder = device.createCommandEncoder(); slot = 0 }
      if (steps % 48 === 0) await device.queue.onSubmittedWorkDone()
    }
    for (const path of examplePaths(example)) for (let tick = 0; tick < path.ticks; tick++) await step(pathContact(path, tick, example))
    // Only falling sand needs settling time. Presets must retain their exact
    // original composition, and other tool studies are captured at release.
    if (example.id === 'pour') for (let tick = 0; tick < 180; tick++) await step()
    await submit()
    const state = await solver.readState()
    return { version: 1, width: GRID_WIDTH, height: GRID_HEIGHT, mode: example.mode, state: state.buffer as ArrayBuffer,
      referenceState: base.buffer as ArrayBuffer, title: example.title, savedAt: new Date().toISOString(),
      settings: { tool: example.tool, radius: example.radius, strength: example.strength, light: 'noon', wetness: 0, wind: 0,
        flow: false, palmAngle: Math.PI / 2, palmAspect: .45, pourStyle: 'scatter', pourHeight: .55, pourSpread: .5 } }
  } finally { solver.destroy() }
}
