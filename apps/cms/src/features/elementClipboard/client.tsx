'use client'

import type {
  BaseSelection,
  LexicalEditor,
  LexicalNode,
} from '@payloadcms/richtext-lexical/lexical'
import type { PluginComponent, SlashMenuGroup, ToolbarGroup } from '@payloadcms/richtext-lexical'
import type React from 'react'

import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext'
import {
  $createNodeSelection,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRangeSelection,
  $parseSerializedNode,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  createCommand,
  KEY_DOWN_COMMAND,
} from '@payloadcms/richtext-lexical/lexical'
import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { useEffect } from 'react'

import {
  cloneSerializedNodeWithFreshIds,
  getElementClipboardShortcut,
  type SerializedUnknownLexicalNode,
} from './shared'

const COPY_SELECTED_ELEMENT_COMMAND = createCommand('COPY_SELECTED_ELEMENT_COMMAND')
const PASTE_SELECTED_ELEMENT_COMMAND = createCommand('PASTE_SELECTED_ELEMENT_COMMAND')
const DUPLICATE_SELECTED_ELEMENT_COMMAND = createCommand('DUPLICATE_SELECTED_ELEMENT_COMMAND')

let copiedElement: SerializedUnknownLexicalNode | null = null

const ELEMENT_NODE_TYPES = new Set(['block', 'inlineBlock'])

const findElementNode = (node: LexicalNode | null): LexicalNode | null => {
  let currentNode = node

  while (currentNode) {
    if (ELEMENT_NODE_TYPES.has(currentNode.getType())) {
      return currentNode
    }

    currentNode = currentNode.getParent()
  }

  return null
}

const findSiblingElementNode = (
  startNode: LexicalNode | null,
  direction: 'next' | 'previous',
): LexicalNode | null => {
  let currentNode = startNode

  while (currentNode) {
    const elementNode = findElementNode(currentNode)
    if (elementNode) {
      return elementNode
    }

    currentNode =
      direction === 'previous' ? currentNode.getPreviousSibling() : currentNode.getNextSibling()
  }

  return null
}

const getSelectedNodeFromSelection = (selection: BaseSelection | null): LexicalNode | null => {
  if (!selection) {
    return null
  }

  if ($isNodeSelection(selection)) {
    const selectedNodes = selection.getNodes()
    if (selectedNodes.length === 0) {
      return null
    }

    return findElementNode(selectedNodes[0] ?? null)
  }

  const selectedNodes = selection.getNodes()
  for (const selectedNode of selectedNodes) {
    const elementNode = findElementNode(selectedNode)
    if (elementNode) {
      return elementNode
    }
  }

  return null
}

const getTargetElementNodeFromSelection = (selection: BaseSelection | null): LexicalNode | null => {
  const selectedNode = getSelectedNodeFromSelection(selection)
  if (selectedNode) {
    return selectedNode
  }

  if (!selection || !$isRangeSelection(selection)) {
    return null
  }

  const anchorNode = selection.anchor.getNode()
  const topLevelNode = anchorNode.getTopLevelElement()
  if (!topLevelNode) {
    return null
  }

  return (
    findSiblingElementNode(topLevelNode.getPreviousSibling(), 'previous') ??
    findSiblingElementNode(topLevelNode.getNextSibling(), 'next')
  )
}

const getSerializedSelectedNode = (
  selection: BaseSelection | null,
): SerializedUnknownLexicalNode | null => {
  const selectedNode = getTargetElementNodeFromSelection(selection)

  if (!selectedNode || typeof selectedNode.exportJSON !== 'function') {
    return null
  }

  return selectedNode.exportJSON() as SerializedUnknownLexicalNode
}

const storeSelectedElement = (editor: LexicalEditor): boolean => {
  let didCopy = false

  editor.getEditorState().read(() => {
    const selection = $getSelection()
    const serializedNode = getSerializedSelectedNode(selection)

    if (!serializedNode) {
      return
    }

    copiedElement = cloneSerializedNodeWithFreshIds(serializedNode)
    didCopy = true
  })

  return didCopy
}

const pasteStoredElement = (editor: LexicalEditor): boolean => {
  const storedElement = copiedElement
  if (!storedElement) {
    return false
  }

  editor.update(() => {
    const nextNode = $parseSerializedNode(cloneSerializedNodeWithFreshIds(storedElement))
    const selection = $getSelection()
    const selectedNode = getSelectedNodeFromSelection(selection)

    if (selectedNode) {
      selectedNode.insertAfter(nextNode)

      const nodeSelection = $createNodeSelection()
      nodeSelection.add(nextNode.getKey())
      $setSelection(nodeSelection)
      return
    }

    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode()
      const topLevelNode = anchorNode.getTopLevelElement()
      const nextNodeType = nextNode.getType()
      const shouldInsertAsBlock = nextNodeType === 'block'

      if (topLevelNode && shouldInsertAsBlock) {
        const shouldReplaceTopLevelParagraph =
          topLevelNode.getType() === 'paragraph' &&
          topLevelNode.getTextContent().trim().length === 0

        if (shouldReplaceTopLevelParagraph) {
          topLevelNode.replace(nextNode)
        } else {
          topLevelNode.insertAfter(nextNode)
        }

        const nodeSelection = $createNodeSelection()
        nodeSelection.add(nextNode.getKey())
        $setSelection(nodeSelection)
        return
      }
    }

    $insertNodes([nextNode])
  })

  return true
}

const duplicateSelectedElement = (editor: LexicalEditor): boolean => {
  const didCopy = storeSelectedElement(editor)
  if (!didCopy) {
    return false
  }

  return pasteStoredElement(editor)
}

const CopyElementIcon: React.FC = () => (
  <svg aria-hidden="true" className="icon" fill="none" height="20" viewBox="0 0 20 20" width="20">
    <path
      d="M7 7V4.5C7 4.22386 7.22386 4 7.5 4H14.5C14.7761 4 15 4.22386 15 4.5V11.5C15 11.7761 14.7761 12 14.5 12H12"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <rect height="8" rx="0.5" stroke="currentColor" strokeWidth="1.5" width="8" x="5" y="8" />
  </svg>
)

const PasteElementIcon: React.FC = () => (
  <svg aria-hidden="true" className="icon" fill="none" height="20" viewBox="0 0 20 20" width="20">
    <path
      d="M7.5 4H12.5V6H14.5C14.7761 6 15 6.22386 15 6.5V15.5C15 15.7761 14.7761 16 14.5 16H5.5C5.22386 16 5 15.7761 5 15.5V6.5C5 6.22386 5.22386 6 5.5 6H7.5V4Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M8 10H12" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 12.5H12" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const DuplicateElementIcon: React.FC = () => (
  <svg aria-hidden="true" className="icon" fill="none" height="20" viewBox="0 0 20 20" width="20">
    <path d="M11 4H14.5C14.7761 4 15 4.22386 15 4.5V8" stroke="currentColor" strokeWidth="1.5" />
    <rect height="8" rx="0.5" stroke="currentColor" strokeWidth="1.5" width="8" x="5" y="8" />
    <path d="M11 13H15" stroke="currentColor" strokeWidth="1.5" />
    <path d="M13 11L15 13L13 15" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const ElementClipboardPlugin: PluginComponent = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const removeCopyCommand = editor.registerCommand(
      COPY_SELECTED_ELEMENT_COMMAND,
      () => storeSelectedElement(editor),
      COMMAND_PRIORITY_LOW,
    )

    const removePasteCommand = editor.registerCommand(
      PASTE_SELECTED_ELEMENT_COMMAND,
      () => pasteStoredElement(editor),
      COMMAND_PRIORITY_LOW,
    )

    const removeDuplicateCommand = editor.registerCommand(
      DUPLICATE_SELECTED_ELEMENT_COMMAND,
      () => duplicateSelectedElement(editor),
      COMMAND_PRIORITY_LOW,
    )

    const removeKeydownCommand = editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        const shortcutAction = getElementClipboardShortcut(event)

        if (!shortcutAction) {
          return false
        }

        if (shortcutAction === 'copy') {
          const handled = editor.dispatchCommand(COPY_SELECTED_ELEMENT_COMMAND, undefined)
          if (handled) {
            event.preventDefault()
            event.stopPropagation()
          }

          return handled
        }

        if (shortcutAction === 'duplicate') {
          const handled = editor.dispatchCommand(DUPLICATE_SELECTED_ELEMENT_COMMAND, undefined)
          if (handled) {
            event.preventDefault()
            event.stopPropagation()
          }

          return handled
        }

        const handled = editor.dispatchCommand(PASTE_SELECTED_ELEMENT_COMMAND, undefined)
        if (handled) {
          event.preventDefault()
          event.stopPropagation()
        }

        return handled
      },
      COMMAND_PRIORITY_LOW,
    )

    return () => {
      removeCopyCommand()
      removePasteCommand()
      removeDuplicateCommand()
      removeKeydownCommand()
    }
  }, [editor])

  return null
}

const toolbarGroups: ToolbarGroup[] = [
  {
    items: [
      {
        ChildComponent: CopyElementIcon,
        isEnabled: ({ selection }) => Boolean(getSelectedNodeFromSelection(selection)),
        key: 'copyElement',
        label: 'Copy element',
        onSelect: ({ editor }) => {
          editor.dispatchCommand(COPY_SELECTED_ELEMENT_COMMAND, undefined)
        },
        order: 1,
      },
      {
        ChildComponent: DuplicateElementIcon,
        isEnabled: ({ selection }) => Boolean(getSelectedNodeFromSelection(selection)),
        key: 'duplicateElement',
        label: 'Duplicate element',
        onSelect: ({ editor }) => {
          editor.dispatchCommand(DUPLICATE_SELECTED_ELEMENT_COMMAND, undefined)
        },
        order: 3,
      },
      {
        ChildComponent: PasteElementIcon,
        isEnabled: () => Boolean(copiedElement),
        key: 'pasteElement',
        label: 'Paste element',
        onSelect: ({ editor }) => {
          editor.dispatchCommand(PASTE_SELECTED_ELEMENT_COMMAND, undefined)
        },
        order: 2,
      },
    ],
    key: 'elementClipboard',
    order: 85,
    type: 'buttons',
  },
]

const slashMenuGroups: SlashMenuGroup[] = [
  {
    items: [
      {
        Icon: CopyElementIcon,
        key: 'copyElement',
        keywords: ['clipboard', 'copy', 'duplicate', 'element'],
        label: 'Copy selected element',
        onSelect: ({ editor }) => {
          editor.dispatchCommand(COPY_SELECTED_ELEMENT_COMMAND, undefined)
        },
      },
      {
        Icon: DuplicateElementIcon,
        key: 'duplicateElement',
        keywords: ['clipboard', 'duplicate', 'element'],
        label: 'Duplicate selected element',
        onSelect: ({ editor }) => {
          editor.dispatchCommand(DUPLICATE_SELECTED_ELEMENT_COMMAND, undefined)
        },
      },
      {
        Icon: PasteElementIcon,
        key: 'pasteElement',
        keywords: ['clipboard', 'insert', 'paste'],
        label: 'Paste copied element',
        onSelect: ({ editor }) => {
          editor.dispatchCommand(PASTE_SELECTED_ELEMENT_COMMAND, undefined)
        },
      },
    ],
    key: 'elementClipboard',
    label: 'Clipboard',
  },
]

export const ElementClipboardFeatureClient = createClientFeature({
  plugins: [
    {
      Component: ElementClipboardPlugin,
      position: 'normal',
    },
  ],
  slashMenu: {
    groups: slashMenuGroups,
  },
  toolbarFixed: {
    groups: toolbarGroups,
  },
})
