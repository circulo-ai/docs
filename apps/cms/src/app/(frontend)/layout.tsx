import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Manage versioned docs content and publishing workflows from the CMS.',
  title: 'Docs Landing CMS',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
