const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).refine(
    (password) => Buffer.byteLength(password, 'utf8') <= 72,
    'Password must be 72 bytes or fewer.'
  ),
}).strict();

module.exports = { loginSchema };
