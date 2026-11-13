const { z } = require('zod');
const { text, httpUrl } = require('../../utils/validation');

const categories = [
  'Analytics',
  'Project Management',
  'Security',
  'Developer Tools',
  'Media',
  'General',
];

const productFields = {
  title: text({ min: 3, max: 200 }),
  slug: z.string().trim().min(1).max(220).regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use lowercase letters, digits, and single hyphens.'
  ),
  summary: text({ min: 1, max: 500 }),
  description: text({ min: 1, max: 10000 }),
  category: z.enum(categories),
  coverImageUrl: httpUrl({ nullable: true }).optional(),
  projectUrl: httpUrl({ nullable: true }).optional(),
  repositoryUrl: httpUrl({ nullable: true }).optional(),
  featured: z.boolean().optional().default(false),
};

const createProductSchema = z.object(productFields).strict();
const updateProductSchema = z.object(productFields).partial().strict();
const statusSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']),
}).strict();
const listQuerySchema = z.object({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  category: z.enum(categories).optional(),
  featured: z.enum(['true', 'false']).optional(),
}).strict();

module.exports = {
  categories,
  createProductSchema,
  updateProductSchema,
  statusSchema,
  listQuerySchema,
};
