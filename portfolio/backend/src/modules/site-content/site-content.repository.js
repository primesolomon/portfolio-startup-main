const pool = require('../../config/database');
const HttpError = require('../../utils/http-error');

const sectionColumns = {
  startup: {
    name: 'startup_name',
    tagline: 'tagline',
    description: 'startup_description',
  },
  about: {
    heading: 'about_heading',
    body: 'about_body',
  },
  contact: {
    heading: 'contact_heading',
    body: 'contact_body',
    email: 'public_email',
    phone: 'public_phone',
  },
};

function mapContent(row, founders) {
  return {
    startup: {
      name: row.startup_name || '',
      tagline: row.tagline || '',
      description: row.startup_description || '',
    },
    founders: founders.map((founder) => ({
      id: Number(founder.id),
      name: founder.name,
      role: founder.role_title,
      biography: founder.biography,
      imageUrl: founder.image_url,
      displayOrder: Number(founder.display_order),
    })),
    about: {
      heading: row.about_heading || '',
      body: row.about_body || '',
    },
    contact: {
      heading: row.contact_heading || '',
      body: row.contact_body || '',
      email: row.public_email,
      phone: row.public_phone,
    },
  };
}

async function selectContent(connection = pool) {
  const [rows] = await connection.execute(
    'SELECT * FROM site_content WHERE id = 1 LIMIT 1'
  );
  if (!rows[0]) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'Site content has not been initialized.');
  }
  const [founders] = await connection.execute(
    'SELECT * FROM founders ORDER BY display_order ASC, id ASC'
  );
  return mapContent(rows[0], founders);
}

async function get() {
  return selectContent();
}

async function save(patch) {
  const connection = await pool.getConnection();
  let transactionStarted = false;
  try {
    await connection.beginTransaction();
    transactionStarted = true;
    const sections = Object.entries(sectionColumns);
    for (const [section, columns] of sections) {
      const values = patch[section];
      if (!values) continue;
      const entries = Object.entries(values);
      if (!entries.length) continue;
      const assignments = entries.map(([field]) => `${columns[field]} = ?`);
      const params = entries.map(([, value]) => value);
      params.push(1);
      await connection.execute(
        `UPDATE site_content SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params
      );
    }

    if (patch.founders) {
      const [existingRows] = await connection.execute(
        'SELECT id FROM founders ORDER BY id ASC FOR UPDATE'
      );
      const existingIds = existingRows.map((founder) => Number(founder.id)).sort((a, b) => a - b);
      const submittedIds = patch.founders.map((founder) => founder.id).sort((a, b) => a - b);
      if (
        new Set(submittedIds).size !== submittedIds.length
        || existingIds.length !== submittedIds.length
        || existingIds.some((id, index) => id !== submittedIds[index])
      ) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'The founders array must contain every existing founder exactly once.'
        );
      }

      for (const founder of patch.founders) {
        await connection.execute(
          `UPDATE founders
           SET name = ?, role_title = ?, biography = ?, image_url = ?, display_order = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            founder.name,
            founder.role,
            founder.biography,
            founder.imageUrl,
            founder.displayOrder,
            founder.id,
          ]
        );
      }
    }

    const content = await selectContent(connection);
    await connection.commit();
    transactionStarted = false;
    return content;
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { get, save };
