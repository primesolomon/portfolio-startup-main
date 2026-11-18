ALTER TABLE products MODIFY category VARCHAR(100) NULL;

UPDATE products
SET category = 'General'
WHERE category IS NULL
   OR category NOT IN (
     'Analytics',
     'Project Management',
     'Security',
     'Developer Tools',
     'Media',
     'General'
   );

ALTER TABLE products MODIFY category ENUM(
  'Analytics',
  'Project Management',
  'Security',
  'Developer Tools',
  'Media',
  'General'
) NOT NULL;

UPDATE founders
SET role_title = 'Founder'
WHERE role_title IS NULL OR TRIM(role_title) = '';

ALTER TABLE founders MODIFY role_title VARCHAR(150) NOT NULL;
