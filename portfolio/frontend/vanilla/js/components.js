import { state, esc, initials } from './core.js';

export function icon(name, size = 16) {
  const paths = {
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    arrowUp: '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
    back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
    external: '<path d="M15 3h6v6"/><path d="m10 14 11-11"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    github: '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 6v-3.9a3.4 3.4 0 0 0-.9-2.7c3-.3 6.2-1.5 6.2-6.7a5.2 5.2 0 0 0-1.4-3.6 4.8 4.8 0 0 0-.1-3.6s-1.2-.4-3.9 1.4a13.5 13.5 0 0 0-7.1 0C5.1 1.1 3.9 1.5 3.9 1.5a4.8 4.8 0 0 0-.1 3.6 5.2 5.2 0 0 0-1.4 3.6c0 5.2 3.2 6.4 6.2 6.7a3.4 3.4 0 0 0-.9 2.7V22"/>',
    package: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v9l9 5 9-5V8"/><path d="M12 13v9"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v12h14V8"/><path d="M10 12h4"/>',
    restore: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8"/>',
    dashboard: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="m18 6-12 12M6 6l12 12"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3.1a2 2 0 0 1-.6 1.7L7.7 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 1.7-.6l3.1.5a2 2 0 0 1 1.7 2Z"/>',
    pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>',
    building: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 21V9h6v12M8 7h.01M16 7h.01"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
    inbox: '<path d="M4 4h16l2 11h-6l-2 3h-4l-2-3H2L4 4Z"/><path d="M2 15h6l2 3h4l2-3h6"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/>',
  };
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
}

export function badge(label, variant = 'neutral') {
  return `<span class="badge badge-${variant}">${label}</span>`;
}

export function imagePlaceholder(label, variant = '') {
  return `<div class="image-placeholder ${variant}" role="img" aria-label="Image placeholder for ${esc(label)}"><span>${icon('image', 28)}</span><small>Image placeholder</small></div>`;
}

export function productCard(product) {
  const imageUrl = product.coverImageUrl || product.demoCoverPreview;
  return `<a class="card-hover product-card" href="/products/${encodeURIComponent(product.slug)}">
    <div class="product-card-image">${imageUrl ? `<img src="${esc(imageUrl)}" alt="${esc(product.title)}" loading="lazy">` : imagePlaceholder(product.title, 'product-placeholder')}</div>
    <div class="product-card-copy">
      <div class="badge-row">${badge(esc(product.category))}${product.featured ? badge(`${icon('star', 12)} Featured`, 'accent') : ''}</div>
      <h3>${esc(product.title)}</h3>
      <p class="line-clamp-2">${esc(product.summary)}</p>
      <span class="learn-more">Learn more ${icon('arrow', 14)}</span>
    </div>
  </a>`;
}

export function wordmark(name = '[Startup Name]', light = false) {
  return `<a class="wordmark${light ? ' wordmark-light' : ''}" href="/">
    <span class="wordmark-mark">${esc(initials(name))}</span>
    <span>${esc(name)}</span>
  </a>`;
}

export function publicHeader(path, name) {
  const links = [['Home', '/'], ['Products', '/products'], ['About', '/about'], ['Contact', '/contact']];
  return `<header class="public-header${window.scrollY > 8 ? ' is-scrolled' : ''}">
    <div class="container header-inner">
      ${wordmark(name)}
      <nav class="desktop-nav">${links.map(([label, href]) => `<a class="${path === href || (href !== '/' && path.startsWith(href)) ? 'active' : ''}" href="${href}">${label}</a>`).join('')}</nav>
      <a class="btn-primary header-contact" href="/contact">Contact ${icon('arrow', 16)}</a>
      <button class="icon-button mobile-nav-toggle" data-action="toggle-nav" aria-label="Toggle navigation" aria-expanded="${state.mobileNav}">${icon(state.mobileNav ? 'close' : 'menu', 20)}</button>
    </div>
    ${state.mobileNav ? `<nav class="mobile-nav">${links.map(([label, href]) => `<a href="${href}">${label}</a>`).join('')}<a class="btn-primary" href="/contact">Contact ${icon('arrow', 16)}</a></nav>` : ''}
  </header>`;
}

export function publicFooter(name, startup, contact) {
  return `<footer class="public-footer">
    <div class="container footer-main">
      <div class="footer-brand">${wordmark(name)}<p>${esc(startup?.tagline || 'We build developer-first tools that make data feel human.')}</p></div>
      <div><h4>Explore</h4><ul><li><a href="/products">Products</a></li><li><a href="/about">About</a></li><li><a href="/contact">Contact</a></li><li><a href="/admin">Admin</a></li></ul></div>
      <div><h4>Contact</h4><ul class="footer-contact">${contact?.email ? `<li>${icon('mail', 16)}<a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></li>` : ''}</ul></div>
    </div>
    <div class="container footer-bottom"><span>© ${new Date().getFullYear()} ${esc(name)}. All rights reserved.</span><a href="/admin">Admin sign-in ${icon('arrowUp', 14)}</a></div>
  </footer>`;
}

export function publicLayout(content, path, startup, contact) {
  const name = startup?.name || '[Startup Name]';
  return `<div class="site-shell">${publicHeader(path, name)}<main class="site-main">${content}</main>${publicFooter(name, startup, contact)}</div>`;
}

export function loadingState(message = 'Loading…') {
  return `<div class="state-message"><span class="spinner"></span><span>${esc(message)}</span></div>`;
}

export function errorState(message = 'Something went wrong.', action = 'Retry') {
  return `<div class="state-card"><span class="state-icon danger">${icon('alert', 24)}</span><h3>Unable to load this page</h3><p>${esc(message)}</p><button class="btn-secondary" data-action="retry">${esc(action)}</button></div>`;
}

export function emptyState(title, description, glyph = 'package') {
  return `<div class="state-card"><span class="state-icon">${icon(glyph, 32)}</span><h3>${esc(title)}</h3><p>${esc(description)}</p></div>`;
}

export function field(label, control, name, hint = '') {
  return `<div class="field"><label class="label" for="${esc(name)}">${esc(label)}</label>${control}${hint ? `<small class="field-hint">${esc(hint)}</small>` : ''}<small class="field-error" data-error-for="${esc(name)}"></small></div>`;
}

