import { beforeEach, describe, expect, it, vi } from 'vitest'
import YAML from 'yaml'
import type { GameEntity } from '../entities/entity'

// No need to mock node:fs, inject mocks directly

import { flushDirtyEntities } from '../gameworld/flush-dirty-entities'

const TEST_FILE = '/tmp/test-entities.yaml'

const baseEntity = (
  id: string,
  overrides: Partial<GameEntity> = {}
): GameEntity => ({
  id,
  type: 'item',
  name: `Entity ${id}`,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides
})

describe('flushDirtyEntities', () => {
  let readFileSync: ReturnType<typeof vi.fn>
  let writeFileSync: ReturnType<typeof vi.fn>

  beforeEach(() => {
    readFileSync = vi.fn(() => '')
    writeFileSync = vi.fn()
  })

  it('does nothing if dirtyEntities is empty', () => {
    flushDirtyEntities(TEST_FILE, [], { readFileSync, writeFileSync })
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  it('updates existing entities in file', () => {
    const fileEntities = [baseEntity('1'), baseEntity('2')]
    const dirty = [baseEntity('2', { name: 'Updated 2' })]
    readFileSync.mockReturnValue(YAML.stringify(fileEntities))
    flushDirtyEntities(TEST_FILE, dirty, { readFileSync, writeFileSync })
    expect(writeFileSync).toHaveBeenCalled()
    const call = writeFileSync.mock.calls[0]
    if (!call || call.length < 2)
      throw new Error('writeFileSync was not called with expected arguments')
    const [, data] = call as unknown as [any, string, ...any[]]
    const written = YAML.parse(data)
    expect(written.find((e: GameEntity) => e.id === '2').name).toBe('Updated 2')
    expect(written.length).toBe(2)
  })

  it('adds new entities not in file', () => {
    const fileEntities = [baseEntity('1')]
    const dirty = [baseEntity('2')]
    readFileSync.mockReturnValue(YAML.stringify(fileEntities))
    flushDirtyEntities(TEST_FILE, dirty, { readFileSync, writeFileSync })
    expect(writeFileSync).toHaveBeenCalled()
    const call = writeFileSync.mock.calls[0]
    if (!call || call.length < 2)
      throw new Error('writeFileSync was not called with expected arguments')
    const [, data] = call as unknown as [any, string, ...any[]]
    const written = YAML.parse(data)
    expect(written.length).toBe(2)
    expect(written.some((e: GameEntity) => e.id === '2')).toBe(true)
  })

  it('handles empty file gracefully', () => {
    readFileSync.mockReturnValue('')
    const dirty = [baseEntity('1')]
    flushDirtyEntities(TEST_FILE, dirty, { readFileSync, writeFileSync })
    expect(writeFileSync).toHaveBeenCalled()
    const call = writeFileSync.mock.calls[0]
    if (!call || call.length < 2)
      throw new Error('writeFileSync was not called with expected arguments')
    const [, data] = call as unknown as [any, string, ...any[]]
    const written = YAML.parse(data)
    expect(written.length).toBe(1)
    expect(written[0].id).toBe('1')
  })
})
