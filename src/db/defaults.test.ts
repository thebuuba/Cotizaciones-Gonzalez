import { describe, expect, it } from 'vitest'

import { createDefaultBusinessProfile } from './defaults'

describe('createDefaultBusinessProfile', () => {
  it('preloads the exact fixed content from the reference sheet', () => {
    const profile = createDefaultBusinessProfile('business-1', '2026-08-30T12:00:00.000Z')

    expect(profile.businessName).toBe('Acabados Modernos Gonzalez')
    expect(profile.terms).toHaveLength(3)
    expect(profile.bankAccounts.map((account) => account.number)).toEqual([
      '9604220069', '57000502207', '11102010025465',
    ])
    expect(profile.managerName).toBe('Jefferson Gonzalez Del Rosario')
    expect(profile.whatsappPhone).toBe('849-379-7731')
  })
})
