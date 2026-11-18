const app = document.querySelector('#app');
export { app };
const STORAGE_KEY = 'vanilla-demo-session';
const DATABASE_KEY = 'vanilla-demo-database';
const APP_BASE = new URL('../', import.meta.url).pathname.replace(/\/$/, '');
const now = new Date().toISOString();
const seedDatabase = {
  products: [
    { id: 1, title: '[Product Name] Analytics', slug: 'analytics', summary: 'Real-time analytics dashboards for teams that want clarity, not noise.', description: 'A modern analytics platform that turns raw event data into clear, actionable dashboards. Designed for product teams who need answers in seconds, not hours. Features include customizable widgets, real-time streaming, and shareable board links — all without a single line of SQL.', category: 'Analytics', projectUrl: 'https://example.com/analytics', repositoryUrl: 'https://github.com/example/analytics', featured: true, status: 'published', coverImageUrl: null, createdAt: now, updatedAt: now },
    { id: 2, title: '[Product Name] Flow', slug: 'flow', summary: 'A kanban-first project board that adapts to how your team actually works.', description: 'A flexible project management tool built around the kanban methodology. Drag cards across columns, set WIP limits, and track cycle time with built-in cumulative flow diagrams. Supports custom workflows, automated rules, and deep integrations with popular version control platforms.', category: 'Project Management', projectUrl: 'https://example.com/flow', repositoryUrl: 'https://github.com/example/flow', featured: true, status: 'published', coverImageUrl: null, createdAt: now, updatedAt: now },
    { id: 3, title: '[Product Name] Guard', slug: 'guard', summary: 'Lightweight security scanning that catches vulnerabilities before they ship.', description: 'A developer-first security scanner that integrates directly into your CI pipeline. Runs static analysis on every pull request, flags known CVEs in dependencies, and provides actionable remediation steps — not just a list of problems.', category: 'Security', projectUrl: 'https://example.com/guard', repositoryUrl: 'https://github.com/example/guard', featured: true, status: 'published', coverImageUrl: null, createdAt: now, updatedAt: now },
    { id: 4, title: '[Product Name] Lens', slug: 'lens', summary: 'Beautiful data-visualization components for React and Vue applications.', description: 'A library of production-ready chart components. Every chart is fully responsive, themeable, and accessible — with keyboard navigation and ARIA support baked in.', category: 'Developer Tools', projectUrl: 'https://example.com/lens', repositoryUrl: 'https://github.com/example/lens', featured: false, status: 'published', coverImageUrl: null, createdAt: now, updatedAt: now },
    { id: 5, title: '[Product Name] Code', slug: 'code', summary: 'An AI pair-programmer that understands your entire codebase.', description: 'A context-aware code assistant that indexes your repositories and provides intelligent completions, refactoring suggestions, and bug detection across files.', category: 'Developer Tools', projectUrl: null, repositoryUrl: null, featured: false, status: 'draft', coverImageUrl: null, createdAt: now, updatedAt: now },
    { id: 6, title: '[Product Name] Cut', slug: 'cut', summary: 'A browser-based video editor for fast, collaborative social content.', description: 'A non-linear video editor that runs entirely in the browser. Trim clips, add transitions, and export in 4K — no installs required.', category: 'Media', projectUrl: null, repositoryUrl: null, featured: false, status: 'archived', coverImageUrl: null, createdAt: now, updatedAt: now },
  ],
  founders: [
    { id: 1, name: '[Founder Name]', role: 'Co-Founder & CEO', biography: 'A product leader with a decade of experience building developer tools and analytics platforms. Passionate about making complex data feel simple.', imageUrl: null, displayOrder: 1 },
    { id: 2, name: '[Founder Name]', role: 'Co-Founder & CTO', biography: 'Systems engineer and open-source maintainer. Believes great infrastructure should be invisible — fast, reliable, and boring in the best way.', imageUrl: null, displayOrder: 2 },
    { id: 3, name: '[Founder Name]', role: 'Head of Design', biography: 'Designer turned developer who bridges the gap between pixels and production code. Obsessed with typography and making tools that feel human.', imageUrl: null, displayOrder: 3 },
  ],
  siteContent: {
    startup: { name: '[Startup Name]', tagline: 'We build tools that make data feel human.', description: 'We are a small, founder-led studio building developer-first products. We believe great software should be fast, reliable, and genuinely pleasant to use.' },
    about: { heading: 'About us', body: 'We started [Startup Name] after years of building internal tools at larger companies and watching teams struggle with clunky, over-engineered software. We knew there was a better way — tools that respect your time, your attention, and your intelligence.\n\nToday we are a small team obsessed with craft. Every product we ship starts with a simple question: would we want to use this ourselves? If the answer is no, we go back to the drawing board.' },
    contact: { heading: 'Contact', body: 'Have a question, partnership idea, or just want to say hello? We read every message.', email: 'hello@example.com', phone: '+1 (555) 012-3456' },
  },
};
export const state = {
  session: loadSession(),
  routeVersion: 0,
  mobileNav: false,
  mobileAdmin: false,
  category: 'All',
  adminFilter: 'all',
  adminSearch: '',
  contentTab: 'startup',
  contactStatus: 'idle',
  contactError: '',
  contactDraft: {},
};

function loadSession() {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (
      !session
      || typeof session.accessToken !== 'string'
      || !session.accessToken
      || (session.expiresAt && Date.now() >= session.expiresAt)
    ) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveSession(session) {
  state.session = session;
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEY);
}

export const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
export const appHref = (path) => `${APP_BASE}/index.html#${path}`;
export const currentPath = () => {
  const hashPath = window.location.hash.slice(1);
  if (hashPath.startsWith('/')) return hashPath.replace(/\/+$/, '') || '/';
  let path = window.location.pathname;
  if (APP_BASE && (path === APP_BASE || path === `${APP_BASE}/` || path === `${APP_BASE}/index.html`)) return '/';
  if (APP_BASE && path.startsWith(`${APP_BASE}/`)) path = path.slice(APP_BASE.length);
  return path.replace(/\/+$/, '') || '/';
};
export const formatDate = (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) =>
  value ? new Date(value).toLocaleDateString('en-US', options) : '';
export const initials = (name = '') => String(name).replace(/^\[|\]$/g, '').charAt(0).toUpperCase() || 'S';

export function readDatabase() {
  try {
    const stored = localStorage.getItem(DATABASE_KEY);
    if (stored) {
      const database = JSON.parse(stored);
      if (database.siteContent?.startup && Array.isArray(database.founders) && Array.isArray(database.products)) {
        let changed = false;
        for (const product of database.products) {
          if (typeof product.coverImageUrl === 'string' && product.coverImageUrl.startsWith('data:image/')) {
            product.demoCoverPreview = product.coverImageUrl;
            product.coverImageUrl = null;
            changed = true;
          }
        }
        if (changed) localStorage.setItem(DATABASE_KEY, JSON.stringify(database));
        return database;
      }

      const products = (database.products || []).map((product, index) => {
        const coverImage = product.coverImageUrl ?? product.cover_image ?? null;
        const isDemoImage = typeof coverImage === 'string' && coverImage.startsWith('data:image/');
        return {
          id: Number.isSafeInteger(Number(product.id)) ? Number(product.id) : index + 1,
          title: product.title || '',
          slug: product.slug || String(product.id || product.title || `product-${index + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          summary: product.summary || '',
          description: product.description || '',
          coverImageUrl: isDemoImage ? null : coverImage,
          demoCoverPreview: isDemoImage ? coverImage : product.demoCoverPreview || null,
          category: product.category || 'General',
          projectUrl: product.projectUrl ?? product.project_link ?? null,
          repositoryUrl: product.repositoryUrl ?? product.repo_link ?? null,
          featured: Boolean(product.featured),
          status: ['draft', 'published', 'archived'].includes(product.status) ? product.status : 'draft',
          createdAt: product.createdAt || product.created_at || now,
          updatedAt: product.updatedAt || product.updated_at || now,
        };
      });
      const founders = (database.founders || []).map((founder, index) => ({
        id: Number.isSafeInteger(Number(founder.id)) ? Number(founder.id) : index + 1,
        name: founder.name || '',
        role: founder.role || '',
        biography: founder.biography || founder.bio || '',
        imageUrl: founder.imageUrl ?? founder.portrait_image ?? null,
        displayOrder: Number(founder.displayOrder ?? founder.sort_order ?? index + 1),
      }));
      const oldSections = Array.isArray(database.site_content) ? database.site_content : [];
      const oldContent = (section) => oldSections.find((entry) => entry.section === section)?.data || {};
      const legacyStartup = oldContent('startup_info');
      const legacyAbout = oldContent('about');
      const legacyContact = oldContent('contact');
      const migrated = {
        products,
        founders,
        siteContent: database.siteContent || {
          startup: {
            name: legacyStartup.name || seedDatabase.siteContent.startup.name,
            tagline: legacyStartup.tagline || seedDatabase.siteContent.startup.tagline,
            description: legacyStartup.description || seedDatabase.siteContent.startup.description,
          },
          about: {
            heading: legacyAbout.heading || 'About us',
            body: legacyAbout.body || legacyAbout.story || seedDatabase.siteContent.about.body,
          },
          contact: {
            heading: legacyContact.heading || 'Contact',
            body: legacyContact.body || legacyContact.intro || seedDatabase.siteContent.contact.body,
            email: legacyContact.email || seedDatabase.siteContent.contact.email,
            phone: legacyContact.phone || null,
          },
        },
      };
      localStorage.setItem(DATABASE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    localStorage.setItem(DATABASE_KEY, JSON.stringify(seedDatabase));
    return JSON.parse(JSON.stringify(seedDatabase));
  } catch (error) {
    console.error('Could not access the local demo database:', error);
    return JSON.parse(JSON.stringify(seedDatabase));
  }
}

export function writeDatabase(database) {
  try {
    localStorage.setItem(DATABASE_KEY, JSON.stringify(database));
  } catch (error) {
    throw new Error(`Could not save local demo data: ${error.message}`);
  }
}

