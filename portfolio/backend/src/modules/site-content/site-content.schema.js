const { z } = require('zod');
const { text, httpUrl } = require('../../utils/validation');

const startupSchema = z.object({
  name: text({ max: 200 }),
  tagline: text({ max: 500 }),
  description: text({ max: 10000 }),
}).partial().strict();

const aboutSchema = z.object({
  heading: text({ max: 200 }),
  body: text({ max: 10000 }),
}).partial().strict();

const contactSchema = z.object({
  heading: text({ max: 200 }),
  body: text({ max: 5000 }),
  email: z.union([
    z.string().trim().email().max(254),
    z.null(),
  ]).optional(),
  phone: z.union([
    text({ max: 50 }),
    z.null(),
  ]).optional(),
}).strict();

const founderSchema = z.object({
  id: z.number().int().positive(),
  name: text({ min: 1, max: 150 }),
  role: text({ min: 1, max: 150 }),
  biography: z.union([text({ max: 5000 }), z.null()]),
  imageUrl: httpUrl({ nullable: true }),
  displayOrder: z.number().int().min(0),
}).strict();

const siteContentPatchSchema = z.object({
  startup: startupSchema.optional(),
  about: aboutSchema.optional(),
  contact: contactSchema.optional(),
  founders: z.array(founderSchema).min(1).optional(),
}).strict().refine(
  (value) => Object.keys(value).length > 0,
  'At least one site-content section is required.'
);

module.exports = { siteContentPatchSchema };
