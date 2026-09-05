import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

// jsdom does not implement pointer capture; model it for swipe interactions.
const capturedPointers = new WeakMap<Element, Set<number>>()
Element.prototype.setPointerCapture = function (id: number) {
  const pointers = capturedPointers.get(this) ?? new Set<number>()
  pointers.add(id)
  capturedPointers.set(this, pointers)
}
Element.prototype.hasPointerCapture = function (id: number) { return capturedPointers.get(this)?.has(id) ?? false }
Element.prototype.releasePointerCapture = function (id: number) { capturedPointers.get(this)?.delete(id) }
