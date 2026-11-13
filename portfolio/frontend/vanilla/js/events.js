import { app, state, esc, appHref, saveSession } from './core.js';
import { icon } from './components.js';
import { validateProduct, adminProductsPage } from './pages/admin.js';
import { createProduct, updateProduct, setProductStatus, saveSiteContent, updateFounder, submitContactMessage, uploadProductCover, loginAdmin, getProducts } from './services/data.js';
import { render, navigate } from './render.js';

function showFormErrors(form, errors) {
  for (const node of form.querySelectorAll('[data-error-for]')) {
    node.textContent = '';
    node.closest('.field')?.querySelector('.input')?.classList.remove('input-error');
  }
  for (const [name, message] of Object.entries(errors)) {
    const errorNode = form.querySelector(`[data-error-for="${CSS.escape(name)}"]`);
    if (errorNode) {
      errorNode.textContent = message;
      errorNode.closest('.field')?.querySelector('.input')?.classList.add('input-error');
    } else {
      const input = form.elements.namedItem(name);
      input?.classList.add('input-error');
      input?.insertAdjacentHTML('afterend', `<small class="field-error">${esc(message)}</small>`);
    }
  }
}

function valuesFromForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function setFeedback(target, message, type) {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (element) element.innerHTML = message ? `<div class="feedback ${type}">${icon(type === 'success' ? 'check' : 'alert', 16)}${esc(message)}</div>` : '';
}

async function saveProduct(button) {
  const form = document.querySelector('#product-form');
  if (!form) return;
  const data = valuesFromForm(form);
  data.featured = form.elements.namedItem('featured').checked;
  const errors = validateProduct(data);
  showFormErrors(form, errors);
  if (Object.keys(errors).length) {
    setFeedback('#product-feedback', 'Please fix the errors above before saving.', 'error');
    return;
  }
  const progress = document.querySelector('#save-progress');
  if (progress) progress.textContent = 'Saving your changes…';
  document.querySelectorAll('[data-action="save-product"]').forEach((item) => { item.disabled = true; });
  const body = {
    title: data.title.trim(),
    slug: data.slug.trim(),
    summary: data.summary.trim(),
    description: data.description.trim(),
    category: data.category.trim(),
    projectUrl: data.projectUrl.trim() || null,
    repositoryUrl: data.repositoryUrl.trim() || null,
    coverImageUrl: form.dataset.coverImageUrl || null,
    featured: Boolean(data.featured),
  };
  try {
    const fileInput = document.querySelector('#cover-image-file');
    const selectedFile = fileInput?.files?.[0];
    if (selectedFile) {
      if (progress) progress.textContent = 'Uploading image…';
      const upload = await uploadProductCover(selectedFile);
      body.coverImageUrl = upload.url;
      form.dataset.coverImageUrl = upload.url;
      form.dataset.image = '';
      fileInput.value = '';
    }

    const id = form.dataset.id;
    let result;
    if (id) {
      result = await updateProduct(id, body);
    } else {
      result = await createProduct(body);
      form.dataset.id = result.id;
      history.replaceState({}, '', appHref(`/admin/products/${encodeURIComponent(result.id)}`));
    }
    if (result.status !== button.dataset.status) {
      result = await setProductStatus(result.id, button.dataset.status);
    }
    setFeedback('#product-feedback', `Product saved as ${result.status}.`, 'success');
    setTimeout(() => render(), 500);
  } catch (error) {
    setFeedback('#product-feedback', error.message || 'Failed to save. Please try again.', 'error');
  } finally {
    document.querySelectorAll('[data-action="save-product"]').forEach((item) => { item.disabled = false; });
    if (progress) progress.textContent = '';
  }
}

async function submitLogin(form) {
  const data = valuesFromForm(form);
  const errors = {};
  const email = String(data.email || '').trim();
  const password = String(data.password || '');
  if (!email) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  else if (new TextEncoder().encode(password).length > 72) errors.password = 'Password must be 72 bytes or fewer';
  showFormErrors(form, errors);
  if (Object.keys(errors).length) return;
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  button.querySelector('[data-login-submit]').textContent = 'Signing in…';
  const feedback = document.querySelector('#auth-error');
  if (feedback) feedback.innerHTML = '';
  try {
    const result = await loginAdmin({ email, password });
    saveSession({
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresAt: Date.now() + result.expiresInSeconds * 1000,
      user: result.admin,
    });
    navigate('/admin');
  } catch (error) {
    if (feedback) feedback.innerHTML = `<div class="feedback error">${icon('alert', 16)}${esc(error.message)}</div>`;
  } finally {
    if (document.body.contains(button)) {
      button.disabled = false;
      button.querySelector('[data-login-submit]').textContent = 'Sign in';
    }
  }
}

async function submitContact(form) {
  const data = valuesFromForm(form);
  const errors = {};
  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();
  const message = String(data.message || '').trim();
  if (!name) errors.name = 'Please enter your name';
  else if (name.length > 120) errors.name = 'Name must be 120 characters or fewer';
  if (!email) errors.email = 'Please enter your email';
  else if (email.length > 254) errors.email = 'Email must be 254 characters or fewer';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address';
  if (!message) errors.message = 'Please enter a message';
  else if (message.length < 10) errors.message = 'Message must be at least 10 characters';
  else if (message.length > 5000) errors.message = 'Message must be 5000 characters or fewer';
  showFormErrors(form, errors);
  if (Object.keys(errors).length) return;
  state.contactDraft = {
    name,
    email,
    message,
  };
  state.contactStatus = 'sending';
  render();
  try {
    await submitContactMessage({
      name, email, message,
    });
    state.contactStatus = 'success';
  } catch (error) {
    state.contactStatus = 'error';
    state.contactError = error.message;
  }
  render();
}

async function submitSiteContent(form) {
  const section = form.dataset.section;
  const values = valuesFromForm(form);
  if (section === 'contact') {
    values.email = values.email.trim() || null;
    values.phone = values.phone.trim() || null;
  }
  setFeedback('#content-feedback', '', 'success');
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  submit.innerHTML = '<span class="spinner spinner-small"></span> Saving…';
  try {
    await saveSiteContent({ [section]: values });
    setFeedback('#content-feedback', `${section === 'startup' ? 'Startup info' : section === 'about' ? 'About page' : 'Contact info'} saved.`, 'success');
  } catch (error) {
    setFeedback('#content-feedback', error.message || 'Failed to save.', 'error');
  } finally {
    submit.disabled = false;
    submit.innerHTML = `${icon('save', 16)} Save changes`;
  }
}

async function submitFounder(form) {
  const id = form.dataset.founderId;
  const feedback = `#founder-feedback-${CSS.escape(id)}`;
  const submit = form.querySelector('[type="submit"]');
  const values = valuesFromForm(form);
  const errors = {};
  values.name = values.name.trim();
  values.role = values.role.trim();
  values.biography = values.biography.trim();
  values.imageUrl = values.imageUrl.trim();
  if (!values.name) errors.name = 'Name is required';
  else if (values.name.length > 150) errors.name = 'Name must be 150 characters or fewer';
  if (!values.role) errors.role = 'Role is required';
  else if (values.role.length > 150) errors.role = 'Role must be 150 characters or fewer';
  if (values.biography.length > 5000) errors.biography = 'Biography must be 5000 characters or fewer';
  if (values.imageUrl.length > 2048) errors.imageUrl = 'Image URL must be 2048 characters or fewer';
  if (values.imageUrl) {
    try {
      const url = new URL(values.imageUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported URL protocol');
    } catch {
      errors.imageUrl = 'Must be a valid HTTP(S) URL';
    }
  }
  showFormErrors(form, errors);
  if (Object.keys(errors).length) return;
  submit.disabled = true;
  try {
    values.biography = values.biography || null;
    values.imageUrl = values.imageUrl || null;
    await updateFounder(id, values);
    setFeedback(feedback, 'Founder profile saved.', 'success');
  } catch (error) {
    setFeedback(feedback, error.message || 'Failed to save. Please try again.', 'error');
  } finally {
    submit.disabled = false;
  }
}

document.addEventListener('click', async (event) => {
  const link = event.target.closest('a[href]');
  if (link && !event.defaultPrevented && link.target !== '_blank' && link.origin === window.location.origin) {
    event.preventDefault();
    navigate(link.pathname);
    return;
  }
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'toggle-nav') {
    state.mobileNav = !state.mobileNav;
    render();
  } else if (action === 'category') {
    state.category = button.dataset.category;
    render();
  } else if (action === 'retry') {
    render();
  } else if (action === 'back-products') {
    navigate('/products');
  } else if (action === 'another-message') {
    state.contactStatus = 'idle';
    state.contactError = '';
    state.contactDraft = {};
    render();
  } else if (action === 'filter-products') {
    state.adminFilter = button.dataset.filter;
    render();
  } else if (action === 'content-tab') {
    state.contentTab = button.dataset.tab;
    render();
  } else if (action === 'set-status') {
    button.disabled = true;
    try {
      await setProductStatus(button.dataset.id, button.dataset.status);
      render();
    } catch (error) {
      alert(`Could not update product: ${error.message}`);
      button.disabled = false;
    }
  } else if (action === 'save-product') {
    saveProduct(button);
  } else if (action === 'choose-image') {
    document.querySelector('#cover-image-file')?.click();
  } else if (action === 'remove-image') {
    const preview = document.querySelector('#image-preview');
    const form = document.querySelector('#product-form');
    if (form) {
      form.dataset.image = '';
      form.dataset.coverImageUrl = '';
    }
    if (preview) preview.innerHTML = `<button class="upload-zone" type="button" data-action="choose-image">${icon('upload', 24)}<strong>Click to upload an image</strong><small>or drag and drop</small></button>`;
    const file = document.querySelector('#cover-image-file');
    if (file) file.value = '';
  } else if (action === 'signout') {
    saveSession(null);
    navigate('/admin/signin');
  } else if (action === 'open-admin-menu') {
    state.mobileAdmin = true;
    render();
  } else if (action === 'close-admin-menu' && !event.target.closest('[data-drawer]')) {
    state.mobileAdmin = false;
    render();
  } else if (action === 'close-admin-menu') {
    state.mobileAdmin = false;
    render();
  }
});

document.addEventListener('input', (event) => {
  if (event.target.matches('[data-action="search-products"]')) {
    const input = event.target;
    const cursor = input.selectionStart;
    state.adminSearch = input.value;
    const content = app.querySelector('.admin-content');
    if (content) {
      const table = app.querySelector('.admin-table-card');
      // Re-render only the result list while preserving search focus.
      const searchState = state.adminSearch;
      renderAdminProductsInPlace(table);
      const next = app.querySelector('[data-action="search-products"]');
      next?.focus();
      next?.setSelectionRange(cursor, cursor);
      state.adminSearch = searchState;
    }
  }
});

function renderAdminProductsInPlace(oldCard) {
  if (!oldCard) return;
  getProducts().then((products) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = adminProductsPage(products);
    const nextCard = wrapper.querySelector('.admin-table-card');
    const toolbar = wrapper.querySelector('.products-toolbar');
    oldCard.replaceWith(nextCard);
    const currentToolbar = app.querySelector('.products-toolbar');
    if (currentToolbar && toolbar) currentToolbar.replaceWith(toolbar);
  }).catch((error) => {
    oldCard.innerHTML = `<div class="table-error">${esc(error.message)}</div>`;
  });
}

document.addEventListener('submit', (event) => {
  const form = event.target;
  if (form.id === 'login-form') {
    event.preventDefault();
    submitLogin(form);
  } else if (form.id === 'contact-form') {
    event.preventDefault();
    submitContact(form);
  } else if (form.id === 'product-form') {
    event.preventDefault();
  } else if (form.id === 'site-content-form') {
    event.preventDefault();
    submitSiteContent(form);
  } else if (form.matches('[data-founder-id]')) {
    event.preventDefault();
    submitFounder(form);
  }
});

document.addEventListener('change', (event) => {
  if (event.target.id !== 'cover-image-file') return;
  const file = event.target.files?.[0];
  const error = document.querySelector('#image-error');
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    error.innerHTML = '<small class="field-error">Please select a JPEG, PNG, or WebP image</small>';
    event.target.value = '';
    return;
  }
  if (file.size > 4 * 1024 * 1024) {
    error.innerHTML = '<small class="field-error">Image must be 4MB or smaller</small>';
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const form = document.querySelector('#product-form');
    if (form) {
      form.dataset.image = String(reader.result);
      form.dataset.coverImageUrl = '';
    }
    document.querySelector('#image-preview').innerHTML = `<div class="preview-image"><img src="${esc(reader.result)}" alt="Cover preview"><button type="button" class="remove-image" data-action="remove-image" aria-label="Remove image">${icon('close', 16)}</button></div><button class="btn-secondary btn-sm" type="button" data-action="choose-image">${icon('image', 14)} Replace image</button>`;
    error.innerHTML = '';
  };
  reader.onerror = () => { error.innerHTML = '<small class="field-error">Could not read the file. Please try again.</small>'; };
  reader.readAsDataURL(file);
});

window.addEventListener('popstate', () => {
  state.mobileNav = false;
  render();
});
window.addEventListener('api:unauthorized', () => {
  const path = window.location.hash.slice(1);
  if (path.startsWith('/admin') && path !== '/admin/signin') {
    navigate('/admin/signin');
  }
});
window.addEventListener('scroll', () => {
  document.querySelector('.public-header')?.classList.toggle('is-scrolled', window.scrollY > 8);
}, { passive: true });

