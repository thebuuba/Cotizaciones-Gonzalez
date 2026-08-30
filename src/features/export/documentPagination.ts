export interface PaginationMeasurements<T> {
  firstPageCapacity: number
  continuationPageCapacity: number
  closingHeight: number
  rowHeight: (item: T) => number
}

export interface DocumentPage<T> {
  items: T[]
  isFirst: boolean
  includesClosing: boolean
  pageNumber: number
}

export function paginateDocument<T>(source: readonly T[], measurements: PaginationMeasurements<T>): DocumentPage<T>[] {
  if (!source.length) return [{ items: [], isFirst: true, includesClosing: true, pageNumber: 1 }]
  const pages: DocumentPage<T>[] = []
  let index = 0

  while (index < source.length) {
    const isFirst = pages.length === 0
    const capacity = isFirst ? measurements.firstPageCapacity : measurements.continuationPageCapacity
    const remaining = source.slice(index)
    const remainingHeight = remaining.reduce((sum, item) => sum + measurements.rowHeight(item), 0)
    if (remainingHeight + measurements.closingHeight <= capacity) {
      pages.push({ items: [...remaining], isFirst, includesClosing: true, pageNumber: pages.length + 1 })
      break
    }

    const items: T[] = []
    let used = 0
    while (index < source.length) {
      const height = measurements.rowHeight(source[index]!)
      if (items.length && used + height > capacity) break
      items.push(source[index]!)
      used += height
      index += 1
    }

    if (index === source.length && used + measurements.closingHeight > capacity) {
      const last = items.pop()
      if (last) index -= 1
    }
    if (!items.length) {
      items.push(source[index]!)
      index += 1
    }
    pages.push({ items, isFirst, includesClosing: false, pageNumber: pages.length + 1 })
  }

  return pages
}
