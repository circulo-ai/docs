import { createServerFeature } from '@payloadcms/richtext-lexical'

export const ElementClipboardFeature = createServerFeature({
  feature: {
    ClientFeature: './features/elementClipboard/client#ElementClipboardFeatureClient',
  },
  key: 'elementClipboard',
})
