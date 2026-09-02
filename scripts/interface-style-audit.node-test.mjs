import test from 'node:test'
import assert from 'node:assert/strict'

import { auditCssTypography } from './interface-style-audit.mjs'

test('accepts semantic typography tokens', () => {
  assert.deepEqual(auditCssTypography('.title { font-size: var(--font-size-page-title); }'), [])
})

test('rejects arbitrary font sizes', () => {
  assert.deepEqual(
    auditCssTypography('.caption { font-size: .82rem; }'),
    ['font-size must use a semantic token: .82rem'],
  )
})

test('ignores font-size declarations inside animation keyframes', () => {
  const css = '@keyframes pulse { from { font-size: .82rem; } to { font-size: 1rem; } }'

  assert.deepEqual(auditCssTypography(css), [])
})
