require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const rootDir = path.join(__dirname, '..');
  const schema = fs.readFileSync(path.join(rootDir, 'db', 'schema.sql'), 'utf8');
  const seed   = fs.readFileSync(path.join(rootDir, 'db', 'seed.sql'),   'utf8');

  let conn;
  try {
    conn = await mysql.createConnection({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '3306', 10),
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
      dateStrings: true
    });

    console.log('Applying schema...');
    await conn.query(schema);

    console.log('Applying seed data...');
    await conn.query(seed);

    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
})();