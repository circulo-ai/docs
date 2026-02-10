import type { SerializedLexicalNode } from '@payloadcms/richtext-lexical/lexical'

export type ElementClipboardAction = 'copy' | 'paste'

export type SerializedUnknownLexicalNode = SerializedLexicalNode & {
  children?: SerializedUnknownLexicalNode[]
  fields?: {
    id?: string
    [key: string]: unknown
  }
  id?: string
  type: string
  [key: string]: unknown
}

type ShortcutEvent = Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'key' | 'metaKey' | 'shiftKey'>

const createObjectID = (): string => {
  const bytes = new Uint8Array(12)

  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const refreshNodeIDs = (
  node: SerializedUnknownLexicalNode,
  createId: () => string = createObjectID,
): void => {
  if (node.fields && typeof node.fields === 'object' && 'id' in node.fields) {
    node.fields.id = createId()
  }

  if ('id' in node) {
    node.id = createId()
  }

  if (!Array.isArray(node.children)) {
    return
  }

  for (const child of node.children) {
    refreshNodeIDs(child, createId)
  }
}

export const cloneSerializedNodeWithFreshIds = (
  node: SerializedUnknownLexicalNode,
  createId: () => string = createObjectID,
): SerializedUnknownLexicalNode => {
  const clonedNode = JSON.parse(JSON.stringify(node)) as SerializedUnknownLexicalNode
  refreshNodeIDs(clonedNode, createId)

  return clonedNode
}

export const getElementClipboardShortcut = (
  event: ShortcutEvent,
): ElementClipboardAction | null => {
  const hasModifier = event.metaKey || event.ctrlKey

  if (!hasModifier || !event.shiftKey || event.altKey) {
    return null
  }

  const key = event.key.toLowerCase()

  if (key === 'c') {
    return 'copy'
  }

  if (key === 'v') {
    return 'paste'
  }

  return null
}
