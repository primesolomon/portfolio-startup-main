import { apiRequest } from '../api.js';

function queryString(values) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  }
  const encoded = query.toString();
  return encoded ? `?${encoded}` : '';
}

export async function getSiteContent() {
  return apiRequest('/site-content');
}

export async function getProducts({
  publicOnly = false,
  featuredOnly = false,
  status = null,
} = {}) {
  const path = publicOnly ? '/products' : '/admin/products';
  const filters = publicOnly
    ? { featured: featuredOnly ? 'true' : undefined }
    : { status };
  return apiRequest(`${path}${queryString(filters)}`, {
    authenticated: !publicOnly,
  });
}

export async function getProductById(id) {
  try {
    return await apiRequest(`/admin/products/${encodeURIComponent(id)}`, {
      authenticated: true,
    });
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

export async function getPublishedProduct(slug) {
  try {
    return await apiRequest(`/products/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

export async function loginAdmin(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: credentials,
  });
}

export async function createProduct(product) {
  return apiRequest('/admin/products', {
    method: 'POST',
    body: product,
    authenticated: true,
  });
}

export async function updateProduct(id, updates) {
  return apiRequest(`/admin/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: updates,
    authenticated: true,
  });
}

export async function setProductStatus(id, status) {
  return apiRequest(`/admin/products/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { status },
    authenticated: true,
  });
}

export async function saveSiteContent(updates) {
  return apiRequest('/admin/site-content', {
    method: 'PATCH',
    body: updates,
    authenticated: true,
  });
}

export async function updateFounder(id, updates) {
  const content = await getSiteContent();
  const founderId = Number(id);
  const founders = content.founders.map((founder) =>
    founder.id === founderId ? { ...founder, ...updates, id: founderId } : founder
  );
  if (!founders.some((founder) => founder.id === founderId)) {
    throw new Error('Founder not found.');
  }
  const result = await saveSiteContent({ founders });
  return result.founders.find((founder) => founder.id === founderId);
}

export async function uploadProductCover(file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest('/admin/uploads/product-cover', {
    method: 'POST',
    body: formData,
    authenticated: true,
  });
}

export async function submitContactMessage(message) {
  return apiRequest('/contact-messages', {
    method: 'POST',
    body: message,
  });
}
