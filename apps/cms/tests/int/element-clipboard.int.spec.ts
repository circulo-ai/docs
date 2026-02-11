import { describe, expect, it } from 'vitest'

import {
  cloneSerializedNodeWithFreshIds,
  getElementClipboardShortcut,
} from '../../src/features/elementClipboard/shared'

describe('element clipboard helpers', () => {
  it('clones lexical nodes and refreshes nested ids', () => {
    const original = {
      type: 'block',
      version: 1,
      id: 'root-id',
      fields: {
        id: 'fields-id',
      },
      children: [
        {
          type: 'text',
          version: 1,
          id: 'child-id',
        },
        {
          type: 'paragraph',
          version: 1,
          children: [
            {
              type: 'text',
              version: 1,
              fields: {
                id: 'deep-fields-id',
              },
            },
          ],
        },
      ],
    }

    const generatedIDs = ['new-fields-id', 'new-root-id', 'new-child-id', 'new-deep-fields-id']
    const createId = () => {
      const nextId = generatedIDs.shift()
      if (!nextId) {
        throw new Error('No more test IDs left')
      }

      return nextId
    }

    const cloned = cloneSerializedNodeWithFreshIds(original, createId)

    expect(cloned).not.toBe(original)
    expect(cloned.id).toBe('new-root-id')
    expect(cloned.fields?.id).toBe('new-fields-id')
    expect(cloned.children?.[0]?.id).toBe('new-child-id')
    expect(cloned.children?.[1]?.children?.[0]?.fields?.id).toBe('new-deep-fields-id')

    expect(original.id).toBe('root-id')
    expect(original.fields.id).toBe('fields-id')
    expect(original.children[0].id).toBe('child-id')
    expect(original.children[1].children![0].fields!.id).toBe('deep-fields-id')
  })

  it('detects the copy shortcut', () => {
    expect(
      getElementClipboardShortcut({
        altKey: false,
        ctrlKey: true,
        key: 'c',
        metaKey: false,
        shiftKey: true,
      }),
    ).toBe('copy')
  })

  it('detects the paste shortcut', () => {
    expect(
      getElementClipboardShortcut({
        altKey: false,
        ctrlKey: false,
        key: 'V',
        metaKey: true,
        shiftKey: true,
      }),
    ).toBe('paste')
  })

  it('ignores shortcuts without modifier + shift combo', () => {
    expect(
      getElementClipboardShortcut({
        altKey: false,
        ctrlKey: true,
        key: 'c',
        metaKey: false,
        shiftKey: false,
      }),
    ).toBeNull()

    expect(
      getElementClipboardShortcut({
        altKey: true,
        ctrlKey: true,
        key: 'v',
        metaKey: false,
        shiftKey: true,
      }),
    ).toBeNull()
  })
})
