const { z } = require('zod');
const { text } = require('../../utils/validation');

const contactMessageSchema = z.object({
  name: text({ min: 1, max: 120 }),
  email: z.string().trim().email().max(254),
  message: text({ min: 10, max: 5000 }),
}).strict();

module.exports = { contactMessageSchema };
