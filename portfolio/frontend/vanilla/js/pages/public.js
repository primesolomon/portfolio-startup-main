import { state, esc, formatDate } from '../core.js';
import { icon, badge, productCard, imagePlaceholder, emptyState, field } from '../components.js';

export function homePage(data) {
  const { products, founders, startup, about } = data;
  return `<section class="hero">
    <div class="container hero-inner"><div class="hero-copy animate-up">
      <div class="founder-pill"><span></span>A founder-led studio</div>
      <h1 class="text-balance">${esc(startup?.tagline || 'We build tools that make data feel human.')}</h1>
      <p>${esc(startup?.description || 'We are a small, founder-led studio building developer-first products.')}</p>
      <div class="hero-actions"><a class="btn-primary" href="/products">Explore products ${icon('arrow', 16)}</a><a class="btn-secondary" href="/about">Meet the founders</a></div>
    </div></div><div class="hero-orb"></div>
  </section>
  <section class="container section featured-section">
    <div class="section-heading"><div><p class="eyebrow">Featured work</p><h2>Products we are proud of</h2></div><a class="text-link desktop-only" href="/products">View all ${icon('arrow', 16)}</a></div>
    ${products.length ? `<div class="product-grid">${products.slice(0, 3).map(productCard).join('')}</div>` : `<p class="muted center section-empty">No featured products yet.</p>`}
    <a class="btn-secondary full-width mobile-only" href="/products">View all products ${icon('arrow', 16)}</a>
  </section>
  <section class="story-preview"><div class="container story-grid">
    <div><p class="eyebrow">Our story</p><h2>${esc(about?.heading || 'About us')}</h2><p class="story-excerpt">${esc(about?.body?.split('\n\n')[0] || 'We started this studio after years of building internal tools at larger companies and watching teams struggle with clunky, over-engineered software.')}</p><a class="text-link" href="/about">Read our full story ${icon('arrow', 16)}</a></div>
    <div class="founder-preview">${founders.slice(0, 3).map((founder) => `<div class="founder-chip"><div class="avatar">${founder.imageUrl ? `<img src="${esc(founder.imageUrl)}" alt="${esc(founder.name)}" loading="lazy">` : `<span class="avatar-placeholder">${icon('users', 18)}</span>`}</div><div><strong>${esc(founder.name)}</strong><span>${esc(founder.role)}</span></div></div>`).join('')}</div>
  </div></section>
  <section class="container section cta-section"><div class="cta-card"><h2>Want to see what we can build together?</h2><p>We are always open to conversations about partnerships, custom integrations, or just a chat about good software.</p><a class="btn-brand" href="/contact">Get in touch ${icon('arrowUp', 16)}</a></div></section>`;
}

export function productsPage(products) {
  const categories = ['All', ...new Set(products.map((product) => product.category).sort())];
  const filtered = state.category === 'All' ? products : products.filter((p) => p.category === state.category);
  return `<section class="page-heading"><div class="container"><p class="eyebrow">Products &amp; Projects</p><h1>Everything we build</h1><p>Browse our products and open-source projects. Each one started with a simple question: would we want to use this ourselves?</p></div></section>
  <section class="container section products-list">
    ${products.length ? `<div class="category-pills">${categories.map((category) => `<button class="category-pill${state.category === category ? ' selected' : ''}" data-action="category" data-category="${esc(category)}">${esc(category)}</button>`).join('')}</div>${filtered.length ? `<div class="product-grid">${filtered.map(productCard).join('')}</div>` : emptyState(`No products in ${state.category}`, 'Try a different category.')}` : emptyState('No products published yet', 'Check back soon — we are working on new things all the time.')}
  </section>`;
}

export function productDetailPage(product) {
  if (!product) return `<div class="container section"><div class="state-card"><span class="state-icon danger">${icon('alert', 24)}</span><h3>Product not found</h3><p>This product may have been removed or is not publicly available.</p><button class="btn-secondary" data-action="back-products">Back to products</button></div></div>`;
  const imageUrl = product.coverImageUrl || product.demoCoverPreview;
  return `<div class="container back-link-wrap"><a class="back-link" href="/products">${icon('back', 16)} Back to products</a></div>
  <article class="container product-detail">
    <div class="detail-intro"><div class="badge-row">${badge(esc(product.category), 'brand')}${product.featured ? badge(`${icon('star', 12)} Featured`, 'accent') : ''}</div><h1 class="text-balance">${esc(product.title)}</h1><p>${esc(product.summary)}</p></div>
    <div class="detail-cover">${imageUrl ? `<img src="${esc(imageUrl)}" alt="${esc(product.title)}">` : imagePlaceholder(product.title, 'detail-placeholder')}</div>
    <div class="detail-grid"><div class="detail-overview"><h2>Overview</h2><p>${esc(product.description || product.summary)}</p></div>
      <aside class="detail-sidebar"><div class="card detail-card"><h3>Links</h3><div class="link-stack">${product.projectUrl ? `<a href="${esc(product.projectUrl)}" target="_blank" rel="noopener noreferrer">${icon('external', 16)} Visit project</a>` : ''}${product.repositoryUrl ? `<a href="${esc(product.repositoryUrl)}" target="_blank" rel="noopener noreferrer">${icon('github', 16)} View repository</a>` : ''}${!product.projectUrl && !product.repositoryUrl ? '<p class="muted small">No external links for this product.</p>' : ''}</div></div>
      <div class="card detail-card"><h3>Details</h3><dl><div><dt>Category</dt><dd>${esc(product.category)}</dd></div><div><dt>Updated</dt><dd>${formatDate(product.updatedAt)}</dd></div></dl></div><a class="btn-secondary full-width" href="/contact">Ask about this product</a></aside></div>
  </article>`;
}

export function aboutPage(data) {
  const { founders, about, startup } = data;
  const story = (about?.body || '').split('\n\n');
  return `<section class="page-heading"><div class="container"><p class="eyebrow">About us</p><h1 class="text-balance">${esc(about?.heading || startup?.name || '[Startup Name]')}</h1><p>${esc(startup?.description || 'We build developer-first tools that make data feel human.')}</p></div></section>
  <section class="container section about-story"><div class="prose"><h2>${esc(about?.heading || 'Our story')}</h2><div class="story-paragraphs">${story.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('')}</div></div>
  </section>
  <section class="founders-section"><div class="container section"><h2>The founders</h2><p class="muted">The people behind the products.</p>
    ${founders.length ? `<div class="founder-grid">${founders.map((founder) => `<article class="card founder-card"><div class="founder-portrait">${founder.imageUrl ? `<img src="${esc(founder.imageUrl)}" alt="${esc(founder.name)}" loading="lazy">` : imagePlaceholder(founder.name, 'founder-placeholder')}</div><div class="founder-info"><h3>${esc(founder.name)}</h3><p class="founder-role">${esc(founder.role)}</p>${founder.biography ? `<p class="founder-bio">${esc(founder.biography)}</p>` : ''}</div></article>`).join('')}</div>` : '<p class="muted section-empty">No founder profiles yet.</p>'}
  </div></section>`;
}

export function contactPage(contact) {
  const sent = state.contactStatus === 'success';
  return `<section class="page-heading"><div class="container"><p class="eyebrow">Contact</p><h1>${esc(contact?.heading || "Let's talk")}</h1><p>${esc(contact?.body || 'Have a question, partnership idea, or just want to say hello? We read every message.')}</p></div></section>
  <section class="container section contact-layout">
    <div><h2 class="contact-subtitle">Reach us directly</h2><ul class="contact-list">${contact?.email ? `<li><a href="mailto:${esc(contact.email)}"><span>${icon('mail', 20)}</span><span><small>Email</small><strong>${esc(contact.email)}</strong></span></a></li>` : ''}${contact?.phone ? `<li><div><span>${icon('phone', 20)}</span><span><small>Phone</small><strong>${esc(contact.phone)}</strong></span></div></li>` : ''}</ul></div>
    <div class="card contact-form-card">${sent ? `<div class="success-panel"><span class="state-icon success">${icon('check', 26)}</span><h3>Message sent</h3><p>Thank you for reaching out. We will get back to you as soon as we can.</p><button class="btn-secondary" data-action="another-message">Send another message</button></div>` : `<form id="contact-form" novalidate><div class="form-stack">
      ${field('Name', `<input class="input" id="name" name="name" autocomplete="name" maxlength="120" placeholder="Jane Doe" value="${esc(state.contactDraft.name || '')}" required>`, 'name')}
      ${field('Email', `<input class="input" id="email" name="email" type="email" autocomplete="email" maxlength="254" placeholder="jane@example.com" value="${esc(state.contactDraft.email || '')}" required>`, 'email')}
      ${field('Message', `<textarea class="input" id="message" name="message" rows="5" maxlength="5000" placeholder="Tell us what you are working on…" required>${esc(state.contactDraft.message || '')}</textarea>`, 'message')}
    </div>${state.contactStatus === 'error' ? `<div class="alert-box">${icon('alert', 16)} ${esc(state.contactError || 'Your message could not be sent. Please try again.')}</div>` : ''}<button class="btn-primary contact-submit" type="submit" ${state.contactStatus === 'sending' ? 'disabled' : ''}>${state.contactStatus === 'sending' ? '<span class="spinner spinner-small"></span> Sending…' : `${icon('send', 16)} Send message`}</button></form>`}</div>
  </section>`;
}

