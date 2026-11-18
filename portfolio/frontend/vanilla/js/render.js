import { app, state, appHref, currentPath } from './core.js';
import { publicFooter, publicLayout, errorState } from './components.js';
import { homePage, productsPage, productDetailPage, aboutPage, contactPage } from './pages/public.js';
import { loginPage, adminLayout, adminDashboard, adminProductsPage, productEditPage, contentPage } from './pages/admin.js';
import { getSiteContent, getProducts, getProductById, getPublishedProduct } from './services/data.js';

export async function renderPublic(path, version) {
  const siteContent = await getSiteContent();
  const { startup, contact } = siteContent;
  if (version !== state.routeVersion) return;
  let content = '';
  if (path === '/') {
    const products = await getProducts({ publicOnly: true, featuredOnly: true });
    content = homePage({ products, founders: siteContent.founders, startup, about: siteContent.about });
  } else if (path === '/products') {
    const products = await getProducts({ publicOnly: true });
    content = productsPage(products);
  } else if (path.startsWith('/products/')) {
    const slug = decodeURIComponent(path.slice('/products/'.length));
    content = productDetailPage(await getPublishedProduct(slug));
  } else if (path === '/about') {
    content = aboutPage({ founders: siteContent.founders, about: siteContent.about, startup });
  } else if (path === '/contact') {
    content = contactPage(contact);
  } else {
    history.replaceState({}, '', appHref('/'));
    return render();
  }
  if (version !== state.routeVersion) return;
  document.title = `${startup?.name || '[Startup Name]'} — Portfolio & Products`;
  app.innerHTML = publicLayout(content, path, startup, contact);
}

export async function renderAdmin(path, version) {
  const siteContent = await getSiteContent();
  const { startup } = siteContent;
  if (version !== state.routeVersion) return;
  let content = '';
  if (path === '/admin') {
    const products = await getProducts();
    content = adminDashboard({ products, founders: siteContent.founders, startup });
  } else if (path === '/admin/products') {
    content = adminProductsPage(await getProducts());
  } else if (path === '/admin/content') {
    content = contentPage(siteContent, siteContent.founders);
  } else if (path === '/admin/products/new' || /^\/admin\/products\/[^/]+$/.test(path)) {
    const id = path === '/admin/products/new' ? '' : decodeURIComponent(path.slice('/admin/products/'.length));
    const product = id ? await getProductById(id) : null;
    content = id && !product ? `<div class="empty-admin"><p class="muted">Product not found.</p><a class="btn-secondary" href="/admin/products">Back to products</a></div>` : productEditPage(product, id);
  } else {
    history.replaceState({}, '', appHref('/admin'));
    return render();
  }
  if (version !== state.routeVersion) return;
  document.title = `${startup?.name || '[Startup Name]'} — Admin`;
  app.innerHTML = adminLayout(content, path, startup);
}

export async function render() {
  const path = currentPath();
  const version = ++state.routeVersion;
  app.innerHTML = `<div class="page-loading"><span class="spinner"></span></div>`;
  try {
    if (path === '/admin/signin') {
      if (state.session) {
        history.replaceState({}, '', appHref('/admin'));
        return render();
      }
      app.innerHTML = loginPage();
      return;
    }
    if (path.startsWith('/admin')) {
      if (!state.session) {
        history.replaceState({}, '', appHref('/admin/signin'));
        return render();
      }
      await renderAdmin(path, version);
      return;
    }
    await renderPublic(path, version);
  } catch (error) {
    if (version !== state.routeVersion) return;
    if (path.startsWith('/admin') && !state.session) {
      history.replaceState({}, '', appHref('/admin/signin'));
      return render();
    }
    app.innerHTML = `<div class="site-shell">${errorState(error.message)}${publicFooter('[Startup Name]', null, null)}</div>`;
  }
}

export function navigate(path) {
  if (!path) return;
  if (currentPath() !== path) history.pushState({}, '', appHref(path));
  state.mobileNav = false;
  state.contactStatus = 'idle';
  state.contactError = '';
  state.contactDraft = {};
  state.mobileAdmin = false;
  window.scrollTo(0, 0);
  render();
}

