import { readEnv } from '@repo/env'
import Link from 'next/link'

type FeatureCard = {
  description: string
  title: string
}

const docsSiteUrl = readEnv('DOCS_SITE_URL')

const featureCards: FeatureCard[] = [
  {
    title: 'Model content',
    description: 'Define services, versions, pages, and redirects from a single source of truth.',
  },
  {
    title: 'Publish confidently',
    description: 'Manage drafts and publishing status so updates roll out when your team is ready.',
  },
  {
    title: 'Power the docs site',
    description:
      'The docs app reads from this CMS, so changes here become the foundation for docs navigation and search.',
  },
]

export default function HomePage() {
  return (
    <div className="cms-landing">
      <header className="cms-landing__hero">
        <p className="cms-landing__eyebrow">Docs Landing CMS</p>
        <h1>Manage documentation content in one place.</h1>
        <p className="cms-landing__description">
          Create and maintain versioned documentation pages, navigation, and redirects that power
          your docs experience.
        </p>
        <div className="cms-landing__actions">
          <Link className="cms-button cms-button--primary" href="/admin">
            Open admin
          </Link>
          {docsSiteUrl && (
            <Link
              className="cms-button cms-button--secondary"
              href={docsSiteUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Open docs app
            </Link>
          )}
        </div>
      </header>

      <section aria-labelledby="cms-features-heading" className="cms-landing__section">
        <h2 id="cms-features-heading">What this CMS handles</h2>
        <div className="cms-landing__grid">
          {featureCards.map((card) => (
            <article className="cms-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
