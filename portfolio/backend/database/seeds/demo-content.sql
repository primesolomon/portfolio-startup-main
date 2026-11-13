UPDATE site_content
SET startup_name = '[Startup Name]',
    tagline = 'We build tools that make data feel human.',
    startup_description = 'We are a small, founder-led studio building developer-first products. We believe great software should be fast, reliable, and genuinely pleasant to use.',
    about_heading = 'About us',
    about_body = 'We started [Startup Name] after years of building internal tools at larger companies and watching teams struggle with clunky, over-engineered software. We knew there was a better way — tools that respect your time, your attention, and your intelligence.\n\nToday we are a small team obsessed with craft. Every product we ship starts with a simple question: would we want to use this ourselves? If the answer is no, we go back to the drawing board.',
    contact_heading = 'Contact',
    contact_body = 'Have a question, partnership idea, or just want to say hello? We read every message.',
    public_email = 'hello@example.com',
    public_phone = '+1 (555) 012-3456'
WHERE id = 1 AND startup_name IS NULL;

INSERT INTO founders (name, role_title, biography, display_order)
SELECT seed.name, seed.role_title, seed.biography, seed.display_order
FROM (
  SELECT '[Founder Name]' AS name, 'Co-Founder & CEO' AS role_title,
         'A product leader with a decade of experience building developer tools and analytics platforms. Passionate about making complex data feel simple.' AS biography,
         1 AS display_order
  UNION ALL
  SELECT '[Founder Name]', 'Co-Founder & CTO',
         'Systems engineer and open-source maintainer. Believes great infrastructure should be invisible — fast, reliable, and boring in the best way.',
         2
  UNION ALL
  SELECT '[Founder Name]', 'Head of Design',
         'Designer turned developer who bridges the gap between pixels and production code. Obsessed with typography and making tools that feel human.',
         3
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM founders);
