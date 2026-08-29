import { registerSW } from 'virtual:pwa-register'

export type PwaRegistration = ReturnType<typeof registerSW>

export function registerPwa(): PwaRegistration {
  return registerSW({ immediate: true })
}
