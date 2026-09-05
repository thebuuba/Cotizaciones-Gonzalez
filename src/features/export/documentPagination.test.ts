import { describe, expect, it } from 'vitest'

import { paginateDocument } from './documentPagination'

const items = (count: number) => Array.from({ length: count }, (_, index) => ({ id: `item-${index + 1}` }))

describe('paginateDocument', () => {
  it('keeps three short materials and the complete closing block on one page', () => {
    const pages = paginateDocument(items(3), {
      firstPageCapacity: 700,
      continuationPageCapacity: 900,
      closingHeight: 300,
      rowHeight: () => 40,
    })

    expect(pages).toHaveLength(1)
    expect(pages[0]?.items.map((item) => item.id)).toEqual(['item-1', 'item-2', 'item-3'])
    expect(pages[0]?.includesClosing).toBe(true)
  })

  it('paginates many rows once, in order, and keeps closing only on the last page', () => {
    const source = items(30)
    const pages = paginateDocument(source, {
      firstPageCapacity: 700,
      continuationPageCapacity: 900,
      closingHeight: 300,
      rowHeight: () => 40,
    })

    expect(pages.length).toBeGreaterThan(1)
    expect(pages.flatMap((page) => page.items)).toEqual(source)
    expect(pages.filter((page) => page.includesClosing)).toHaveLength(1)
    expect(pages.at(-1)?.includesClosing).toBe(true)
    expect(pages.every((page) => page.items.length > 0)).toBe(true)
  })

  it('uses measured height so long descriptions consume more page space', () => {
    const source = items(18)
    const shortPages = paginateDocument(source, { firstPageCapacity: 700, continuationPageCapacity: 900, closingHeight: 300, rowHeight: () => 40 })
    const tallPages = paginateDocument(source, { firstPageCapacity: 700, continuationPageCapacity: 900, closingHeight: 300, rowHeight: () => 100 })

    expect(tallPages.length).toBeGreaterThan(shortPages.length)
  })
  it('moves the closing to a new page when a single row fills the first page', () => {
    const source = items(1)
    const pages = paginateDocument(source, { firstPageCapacity: 650, continuationPageCapacity: 900, closingHeight: 410, rowHeight: () => 250 })
    expect(pages.flatMap((page) => page.items)).toEqual(source)
    expect(pages.at(-1)?.includesClosing).toBe(true)
    expect(pages).toHaveLength(2)
  })

  it('preserves the closing even when the final row cannot share a continuation page', () => {
    const pages = paginateDocument(items(2), { firstPageCapacity: 650, continuationPageCapacity: 900, closingHeight: 410, rowHeight: () => 600 })
    expect(pages.flatMap((page) => page.items)).toHaveLength(2)
    expect(pages.filter((page) => page.includesClosing)).toHaveLength(1)
    expect(pages.at(-1)?.items).toHaveLength(0)
  })

})
