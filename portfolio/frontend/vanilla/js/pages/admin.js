import { state, esc, appHref, initials, formatDate } from '../core.js';
import { icon, badge, wordmark, loadingState, emptyState } from '../components.js';

export function inputField(label, name, value = '', options = {}) {
  const type = options.type || 'text';
  const placeholder = options.placeholder ? ` placeholder="${esc(options.placeholder)}"` : '';
  const hint = options.hint ? `<small class="field-hint">${esc(options.hint)}</small>` : '';
  const cls = `input${options.error ? ' input-error' : ''}`;
  const control = options.textarea
    ? `<textarea class="${cls}" id="${esc(name)}" name="${esc(name)}" rows="${options.rows || 4}"${placeholder}${options.maxLength ? ` maxlength="${options.maxLength}"` : ''}${options.required ? ' required' : ''}>${esc(value)}</textarea>`
    : `<input class="${cls}" id="${esc(name)}" name="${esc(name)}" type="${type}" value="${esc(value)}"${placeholder}${options.maxLength ? ` maxlength="${options.maxLength}"` : ''}${options.required ? ' required' : ''}>`;
  return `<div class="field"><label class="label" for="${esc(name)}">${esc(label)}</label>${control}${hint}<small class="field-error" data-error-for="${esc(name)}">${esc(options.error || '')}</small></div>`;
}

export function selectField(label, name, value, options) {
  return `<div class="field"><label class="label" for="${esc(name)}">${esc(label)}</label><select class="input" id="${esc(name)}" name="${esc(name)}">${options.map((option) => `<option value="${esc(option)}"${value === option ? ' selected' : ''}>${esc(option)}</option>`).join('')}</select></div>`;
}

export function formErrors(errors) {
  return Object.entries(errors).map(([name, message]) => `<small class="field-error" data-error-for="${esc(name)}">${esc(message)}</small>`).join('');
}

export function validateProduct(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = 'Title is required';
  else if (form.title.trim().length < 3) errors.title = 'Title must be at least 3 characters';
  else if (form.title.trim().length > 200) errors.title = 'Title must be 200 characters or fewer';
  if (!form.slug.trim()) errors.slug = 'Slug is required';
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) errors.slug = 'Use lowercase letters, numbers, and single hyphens';
  else if (form.slug.trim().length > 220) errors.slug = 'Slug must be 220 characters or fewer';
  if (!form.summary.trim()) errors.summary = 'Summary is required';
  else if (form.summary.trim().length > 500) errors.summary = 'Summary must be 500 characters or fewer';
  if (!form.description.trim()) errors.description = 'Description is required';
  if (!form.category.trim()) errors.category = 'Category is required';
  else if (form.category.trim().length > 100) errors.category = 'Category must be 100 characters or fewer';
  for (const key of ['projectUrl', 'repositoryUrl']) {
    if (!form[key]) continue;
    try {
      const url = new URL(form[key]);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported URL protocol');
    } catch {
      errors[key] = 'Must be a valid URL starting with http:// or https://';
    }
    if (form[key].length > 2048) errors[key] = 'URL must be 2048 characters or fewer';
  }
  return errors;
}

export function statusBadge(status) {
  const map = { published: ['success', 'Published'], draft: ['warning', 'Draft'], archived: ['neutral', 'Archived'] };
  const [variant, label] = map[status] || map.draft;
  return badge(label, variant);
}

export function loginPage() {
  return `<div class="login-layout"><aside class="login-brand"><a class="wordmark wordmark-light" href="/"><span class="wordmark-mark">${initials()}</span><span>[Startup Name]</span></a><div><h1>The calm, clear way to manage your portfolio.</h1><p>Sign in to publish products, update your story, and keep your public site fresh.</p></div><small>© ${new Date().getFullYear()} [Startup Name]. Admin access only.</small><div class="login-orb"></div></aside>
  <main class="login-main"><div class="login-box"><a class="wordmark login-mobile-brand" href="/"><span class="wordmark-mark">S</span><span>[Startup Name]</span></a><h2 id="login-title">Sign in to your account</h2><p id="login-description">Enter your email and password below.</p>
    <form id="login-form" class="form-stack" novalidate>
      <div class="field"><label class="label" for="email">Email</label><input class="input" id="email" name="email" type="email" autocomplete="email" placeholder="admin@example.com"><small class="field-error" data-error-for="email"></small></div>
      <div class="field"><label class="label" for="password">Password</label><input class="input" id="password" name="password" type="password" autocomplete="current-password" placeholder="••••••••"><small class="field-error" data-error-for="password"></small></div>
      <div id="auth-error"></div><button class="btn-primary full-width" type="submit"><span data-login-submit>Sign in</span>${icon('arrow', 16)}</button>
    </form>
      <div class="login-note">${icon('lock', 14)}<span>Sign in with an account provisioned by the site administrator.</span></div>
  </div></main></div>`;
}

export function adminNav(path, name, user) {
  const links = [['Overview', '/admin', 'dashboard', path === '/admin'], ['Products', '/admin/products', 'package', path.startsWith('/admin/products')], ['Site Content', '/admin/content', 'file', path === '/admin/content']];
  return `<div class="admin-brand">${wordmark(name)}<span>CMS Admin</span></div><nav class="admin-nav">${links.map(([label, href, glyph, active]) => `<a class="${active ? 'active' : ''}" href="${href}">${icon(glyph, 18)}${label}</a>`).join('')}</nav><div class="admin-nav-bottom"><a href="${appHref('/')}" target="_blank" rel="noopener noreferrer">${icon('external', 18)}View public site</a><small>${esc(user?.email || '')}</small><button data-action="signout">${icon('logout', 18)}Sign out</button></div>`;
}

export function adminLayout(content, path, startup) {
  const name = startup?.name || '[Startup Name]';
  const nav = adminNav(path, name, state.session?.user);
  return `<div class="admin-shell"><aside class="admin-sidebar">${nav}</aside><header class="admin-mobile-header"><a href="/admin">${esc(name)} <small>CMS</small></a><button class="icon-button" data-action="open-admin-menu" aria-label="Open navigation">${icon('menu', 20)}</button></header>
    ${state.mobileAdmin ? `<div class="admin-mobile-overlay" data-action="close-admin-menu"><aside class="admin-drawer" data-drawer>${nav}<button class="drawer-close" data-action="close-admin-menu" aria-label="Close navigation">${icon('close', 20)}</button></aside></div>` : ''}
    <main class="admin-main"><div class="admin-content">${content}</div></main></div>`;
}

export function adminDashboard(data) {
  const { products, founders, startup } = data;
  const counts = [
    ['Published', products.filter((p) => p.status === 'published').length, 'trend', 'success'],
    ['Drafts', products.filter((p) => p.status === 'draft').length, 'clock', 'warning'],
    ['Archived', products.filter((p) => p.status === 'archived').length, 'package', 'neutral'],
    ['Featured', products.filter((p) => p.featured).length, 'trend', 'brand'],
  ];
  return `<div class="admin-page-heading"><h1>Overview</h1><p>Welcome back. Here is what is happening with ${esc(startup?.name || 'your site')}.</p></div>
    <div class="stats-grid">${counts.map(([label, value, glyph, color]) => `<div class="card stat-card"><span class="stat-icon ${color}">${icon(glyph, 18)}</span><strong>${value}</strong><small>${label}</small></div>`).join('')}</div>
    <div class="dashboard-grid"><section class="card dashboard-card wide"><div class="card-heading"><h2>Recent products</h2><a class="text-link" href="/admin/products">Manage all ${icon('arrow', 14)}</a></div>
      ${products.length ? `<ul class="recent-products">${products.slice(0, 5).map((p) => `<li><a href="/admin/products/${encodeURIComponent(p.id)}"><strong>${esc(p.title)}</strong><small>${esc(p.category)} · ${formatDate(p.updatedAt, { month: 'short', day: 'numeric' })}</small></a>${statusBadge(p.status)}</li>`).join('')}</ul>` : '<p class="muted empty-copy">No products yet.</p>'}<a class="btn-secondary dashboard-create" href="/admin/products/new">Create new product</a></section>
      <div class="dashboard-aside"><section class="card dashboard-card"><div class="card-heading"><h2>${icon('file', 18)} Quick links</h2></div><div class="quick-links"><a href="/admin/content">Edit site content</a><a href="/admin/products/new">Add a product</a><p><strong>${founders.length}</strong> founder profiles</p></div></section></div></div>`;
}

export function adminProductsPage(products) {
  const filtered = products.filter((product) => {
    const matchesStatus = state.adminFilter === 'all' || product.status === state.adminFilter;
    const query = state.adminSearch.trim().toLowerCase();
    return matchesStatus && (!query || String(product.title || '').toLowerCase().includes(query) || String(product.category || '').toLowerCase().includes(query));
  });
  const tabs = [['all', 'All'], ['published', 'Published'], ['draft', 'Drafts'], ['archived', 'Archived']];
  return `<div class="admin-page-heading row-heading"><div><h1>Products</h1><p>Create, edit, and manage your portfolio items.</p></div><a class="btn-primary" href="/admin/products/new">${icon('plus', 16)} New product</a></div>
    <div class="products-toolbar"><div class="admin-tabs">${tabs.map(([key, label]) => `<button class="${state.adminFilter === key ? 'selected' : ''}" data-action="filter-products" data-filter="${key}">${label}</button>`).join('')}</div>
    <label class="search-wrap">${icon('search', 16)}<input type="search" data-action="search-products" placeholder="Search products…" value="${esc(state.adminSearch)}"></label></div>
    <section class="card admin-table-card">${filtered.length ? `<div class="table-scroll"><table class="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Status</th><th>Featured</th><th>Updated</th><th class="right">Actions</th></tr></thead><tbody>${filtered.map((p) => `<tr><td><a href="/admin/products/${encodeURIComponent(p.id)}">${esc(p.title)}</a><small>${esc(p.summary)}</small></td><td>${esc(p.category)}</td><td>${statusBadge(p.status)}</td><td>${p.featured ? icon('star', 17) : ''}</td><td>${formatDate(p.updatedAt)}</td><td class="table-actions">${p.status === 'draft' ? `<button data-action="set-status" data-id="${esc(p.id)}" data-status="published">Publish</button>` : ''}${p.status === 'published' ? `<button data-action="set-status" data-id="${esc(p.id)}" data-status="draft">Unpublish</button>` : ''}${p.status !== 'archived' ? `<button data-action="set-status" data-id="${esc(p.id)}" data-status="archived" aria-label="Archive">${icon('archive', 14)}</button>` : `<button data-action="set-status" data-id="${esc(p.id)}" data-status="draft">Restore</button>`}</td></tr>`).join('')}</tbody></table></div>
    <ul class="mobile-product-list">${filtered.map((p) => `<li><div><a href="/admin/products/${encodeURIComponent(p.id)}"><strong>${esc(p.title)}</strong><small>${esc(p.category)} · ${formatDate(p.updatedAt, { month: 'short', day: 'numeric' })}</small></a>${statusBadge(p.status)}</div><div class="mobile-product-actions">${p.status === 'draft' ? `<button data-action="set-status" data-id="${esc(p.id)}" data-status="published">Publish</button>` : ''}${p.status === 'published' ? `<button data-action="set-status" data-id="${esc(p.id)}" data-status="draft">Unpublish</button>` : ''}${p.status !== 'archived' ? `<button data-action="set-status" data-id="${esc(p.id)}" data-status="archived">Archive</button>` : `<button data-action="set-status" data-id="${esc(p.id)}" data-status="draft">Restore</button>`}</div></li>`).join('')}</ul>` : emptyState(state.adminFilter === 'all' ? 'No products yet' : `No ${state.adminFilter} products`, state.adminFilter === 'all' ? 'Create your first product to get started.' : 'Try a different filter or create a new product.')}
    </section>`;
}

export function productEditPage(product, id) {
  const isNew = !id || id === 'new';
  const p = product || { title: '', slug: '', summary: '', description: '', category: 'General', projectUrl: '', repositoryUrl: '', coverImageUrl: '', featured: false, status: 'draft' };
  const coverPreview = p.demoCoverPreview || p.coverImageUrl;
  const categories = ['Analytics', 'Project Management', 'Security', 'Developer Tools', 'Media', 'General'];
  return `<form id="product-form" data-id="${isNew ? '' : esc(id)}" data-image="${esc(p.demoCoverPreview || '')}" data-cover-image-url="${esc(p.coverImageUrl || '')}" class="admin-form-page">
    <div class="admin-page-heading"><a class="back-link" href="/admin/products">${icon('back', 16)} Back to products</a><h1>${isNew ? 'New product' : 'Edit product'}</h1>${!isNew ? `<div class="badge-row">${statusBadge(p.status)}${p.featured ? badge(`${icon('star', 12)} Featured`, 'accent') : ''}</div>` : ''}</div>
    <div id="product-feedback"></div>
    <div class="edit-grid"><div class="edit-main">
      <section class="card edit-card">${inputField('Title', 'title', p.title, { placeholder: '[Product Name]', maxLength: 200 })}${inputField('Slug', 'slug', p.slug || '', { placeholder: 'product-name', hint: 'Used in the public product URL.', maxLength: 220 })}${inputField('Summary', 'summary', p.summary, { placeholder: 'Real-time analytics dashboards for teams that want clarity.', hint: 'A short one-liner for product cards (max 500 characters).', maxLength: 500 })}${inputField('Full description', 'description', p.description || '', { textarea: true, rows: 8, placeholder: 'Describe the product in detail. What problem does it solve? Who is it for?', maxLength: 10000 })}${selectField('Category', 'category', p.category, categories)}</section>
      <section class="card edit-card"><h3>Links</h3>${inputField('Project link', 'projectUrl', p.projectUrl || '', { placeholder: 'https://example.com/product' })}${inputField('Repository link', 'repositoryUrl', p.repositoryUrl || '', { placeholder: 'https://github.com/example/repo' })}</section>
      <section class="card edit-card"><h3>Cover image</h3><p class="edit-hint">JPEG, PNG, or WebP up to 4 MiB. New images upload when you save.</p><div id="image-preview">${coverPreview ? `<div class="preview-image"><img src="${esc(coverPreview)}" alt="Cover preview"><button type="button" class="remove-image" data-action="remove-image" aria-label="Remove image">${icon('close', 16)}</button></div><button class="btn-secondary btn-sm" type="button" data-action="choose-image">${icon('image', 14)} Replace image</button>` : `<button class="upload-zone" type="button" data-action="choose-image">${icon('upload', 24)}<strong>Click to upload an image</strong><small>or drag and drop</small></button>`}</div><input id="cover-image-file" type="file" accept="image/jpeg,image/png,image/webp" hidden><div id="image-error"></div></section>
    </div><aside class="edit-aside"><section class="card edit-card"><h3>Settings</h3><label class="check-label"><input type="checkbox" name="featured" ${p.featured ? 'checked' : ''}><span><strong>${icon('star', 14)} Featured product</strong><small>Show this product on the home page.</small></span></label></section>
      <section class="card edit-card"><h3>Actions</h3><button class="btn-secondary full-width" type="button" data-action="save-product" data-status="draft">${icon('save', 16)} Save draft</button><button class="btn-brand full-width" type="button" data-action="save-product" data-status="published">${icon('send', 16)} Publish</button>${!isNew && p.status !== 'archived' ? `<button class="btn-ghost full-width" type="button" data-action="save-product" data-status="archived">${icon('archive', 16)} Archive</button>` : ''}${!isNew && p.status === 'archived' ? `<button class="btn-ghost full-width" type="button" data-action="save-product" data-status="draft">${icon('restore', 16)} Restore to draft</button>` : ''}<small id="save-progress" class="muted center"></small></section></aside></div>
  </form>`;
}

export function contentPage(content, founders) {
  const tabs = [['startup', 'Startup Info', 'building'], ['about', 'About Page', 'file'], ['contact', 'Contact Info', 'mail'], ['founders', 'Founders', 'users']];
  let form = '';
  if (state.contentTab === 'startup' && content.startup) {
    const item = content.startup;
    form = `<form class="card content-form" id="site-content-form" data-section="startup">${inputField('Startup name', 'name', item.name || '', { maxLength: 200 })}${inputField('Tagline', 'tagline', item.tagline || '', { hint: 'The headline on your home page.', maxLength: 500 })}${inputField('Description', 'description', item.description || '', { textarea: true, rows: 4, maxLength: 10000 })}<div class="save-feedback" id="content-feedback"></div><button class="btn-primary" type="submit">${icon('save', 16)} Save changes</button></form>`;
  } else if (state.contentTab === 'about' && content.about) {
    const item = content.about;
    form = `<form class="card content-form" id="site-content-form" data-section="about">${inputField('Heading', 'heading', item.heading || '', { maxLength: 200 })}${inputField('Body', 'body', item.body || '', { textarea: true, rows: 8, hint: 'Separate paragraphs with a blank line.', maxLength: 10000 })}<div class="save-feedback" id="content-feedback"></div><button class="btn-primary" type="submit">${icon('save', 16)} Save changes</button></form>`;
  } else if (state.contentTab === 'contact' && content.contact) {
    const item = content.contact;
    form = `<form class="card content-form" id="site-content-form" data-section="contact">${inputField('Heading', 'heading', item.heading || '', { maxLength: 200 })}${inputField('Body', 'body', item.body || '', { textarea: true, rows: 3, maxLength: 5000 })}${inputField('Email', 'email', item.email || '', { type: 'email', maxLength: 254 })}${inputField('Phone', 'phone', item.phone || '', { maxLength: 50 })}<div class="save-feedback" id="content-feedback"></div><button class="btn-primary" type="submit">${icon('save', 16)} Save changes</button></form>`;
  } else if (state.contentTab === 'founders') {
    form = founders.length ? `<div class="founder-edit-list">${founders.map((f) => `<form class="card founder-edit-card" data-founder-id="${esc(f.id)}"><div class="founder-edit-heading"><div class="avatar">${f.imageUrl ? `<img src="${esc(f.imageUrl)}" alt="">` : `<span class="avatar-placeholder">${icon('users', 18)}</span>`}</div><div><strong>${esc(f.name)}</strong><small>${esc(f.role)}</small></div></div><div class="form-row">${inputField('Name', 'name', f.name, { maxLength: 150, required: true })}${inputField('Role', 'role', f.role, { maxLength: 150, required: true })}</div>${inputField('Biography', 'biography', f.biography || '', { textarea: true, rows: 4, maxLength: 5000 })}${inputField('Portrait image URL', 'imageUrl', f.imageUrl || '', { maxLength: 2048 })}<div class="save-feedback" id="founder-feedback-${esc(f.id)}"></div><button class="btn-primary" type="submit">${icon('save', 16)} Save profile</button></form>`).join('')}</div>` : emptyState('No founder profiles', 'Add founder profiles through the backend to manage them here.', 'users');
  } else {
    form = loadingState();
  }
  return `<div class="admin-page-heading"><h1>Site Content</h1><p>Edit your public site content. Changes are published immediately.</p></div>
  <div class="admin-tabs content-tabs">${tabs.map(([key, label, glyph]) => `<button class="${state.contentTab === key ? 'selected' : ''}" data-action="content-tab" data-tab="${key}">${icon(glyph, 16)}<span>${label}</span></button>`).join('')}</div>${form}`;
}

