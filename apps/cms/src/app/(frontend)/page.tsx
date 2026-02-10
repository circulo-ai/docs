type FeatureCard = {
  description: string
  title: string
}

type QuickLink = {
  href: string
  isExternal?: boolean
  label: string
}

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

const quickLinks: QuickLink[] = [
  { label: 'Open admin panel', href: '/admin' },
  { label: 'GraphQL endpoint', href: '/api/graphql' },
  { label: 'REST API', href: '/api', isExternal: false },
  { label: 'Docs app (local)', href: 'http://localhost:3001/docs', isExternal: true },
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
          <a className="cms-button cms-button--primary" href="/admin">
            Open admin
          </a>
          <a
            className="cms-button cms-button--secondary"
            href="http://localhost:3001/docs"
            rel="noopener noreferrer"
            target="_blank"
          >
            Open docs app
          </a>
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

      <section
        aria-labelledby="cms-links-heading"
        className="cms-landing__section cms-landing__section--compact"
      >
        <h2 id="cms-links-heading">Quick links</h2>
        <ul className="cms-landing__links">
          {quickLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                rel={link.isExternal ? 'noopener noreferrer' : undefined}
                target={link.isExternal ? '_blank' : undefined}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
