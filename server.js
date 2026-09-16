require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MySQL pool 
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306', 10),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'restaurant_inventory_db',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
  dateStrings: true
});

// GENERIC CRUD ROUTES
function tableRoutes(name, table, idCol) {
  app.get(`/api/${name}`, async (req, res) => {
    try {
      const [rows] = await pool.query(`SELECT * FROM ${table}`);
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post(`/api/${name}`, async (req, res) => {
    try {
      const cols = Object.keys(req.body);
      const placeholders = cols.map(() => '?').join(', ');
      const values = cols.map(c => req.body[c]);
      const [result] = await pool.query(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
        values
      );
      res.json({ [idCol]: result.insertId, ...req.body });
    } catch (e) { res.status(400).json({ error: e.message }); }
  });

  app.put(`/api/${name}/:id`, async (req, res) => {
    try {
      const cols = Object.keys(req.body);
      const setters = cols.map(c => `${c} = ?`).join(', ');
      const values = cols.map(c => req.body[c]);
      await pool.query(`UPDATE ${table} SET ${setters} WHERE ${idCol} = ?`, [...values, req.params.id]);
      res.json({ ok: true });
    } catch (e) { res.status(400).json({ error: e.message }); }
  });

  app.delete(`/api/${name}/:id`, async (req, res) => {
    try {
      await pool.query(`DELETE FROM ${table} WHERE ${idCol} = ?`, [req.params.id]);
      res.json({ ok: true });
    } catch (e) { res.status(400).json({ error: e.message }); }
  });
}

tableRoutes('categories', 'Category',   'category_id');
tableRoutes('food-items', 'Food_Item',  'food_item_id');
tableRoutes('nutrition',  'Nutrition',  'food_item_id');
tableRoutes('batches',    'Food_Batch', 'batch_id');
tableRoutes('menu-items', 'Menu_Item',  'menu_item_id');
tableRoutes('staff',      'Staff',      'staff_id');
tableRoutes('orders',     '`Order`',    'order_id');

// RECIPES (no single-PK; custom routes)
app.get('/api/recipes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Recipe');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// AUTH
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'No account with that email.' });
    const user = rows[0];
    const expectedHash = Buffer.from('resto:' + password).toString('base64');
    if (user.password_hash !== expectedHash) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }
    res.json({
      user_id:  user.user_id,
      name:     user.name,
      email:    user.email,
      staff_id: user.staff_id
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
      return res.status(400).json({ error: 'Email must be a valid @gmail.com address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const [existing] = await pool.query('SELECT 1 FROM Users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    const hash = Buffer.from('resto:' + password).toString('base64');
    const [result] = await pool.query(
      'INSERT INTO Users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, hash]
    );
    res.json({ user_id: result.insertId, name, email });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// PLACE ORDER (transactional: verify → deduct → insert)
app.post('/api/place-order', async (req, res) => {
  const { staff_id, menu_item_id, quantity } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [menuRows] = await conn.query(
      'SELECT * FROM Menu_Item WHERE menu_item_id = ?', [menu_item_id]
    );
    if (!menuRows.length) throw new Error('Menu item not found.');
    const menu = menuRows[0];

    const [ingredients] = await conn.query(
      'SELECT * FROM Recipe WHERE menu_item_id = ?', [menu_item_id]
    );

    // Verify availability
    for (const ing of ingredients) {
      const needed = ing.quantity_required * quantity;
      const [batches] = await conn.query(
        'SELECT * FROM Food_Batch WHERE food_item_id = ? ORDER BY expiration_date ASC',
        [ing.food_item_id]
      );
      const available = batches.reduce((s, b) => s + Number(b.quantity_remaining), 0);
      if (available < needed) {
        const [itemRows] = await conn.query(
          'SELECT item_name FROM Food_Item WHERE food_item_id = ?', [ing.food_item_id]
        );
        throw new Error(`Not enough inventory: ${itemRows[0]?.item_name || 'ingredient'}`);
      }
    }

    // Deduct (FIFO — earliest expiration first)
    for (const ing of ingredients) {
      let remaining = ing.quantity_required * quantity;
      const [batches] = await conn.query(
        'SELECT * FROM Food_Batch WHERE food_item_id = ? AND quantity_remaining > 0 ORDER BY expiration_date ASC',
        [ing.food_item_id]
      );
      for (const b of batches) {
        if (remaining <= 0) break;
        const take = Math.min(Number(b.quantity_remaining), remaining);
        await conn.query(
          'UPDATE Food_Batch SET quantity_remaining = quantity_remaining - ? WHERE batch_id = ?',
          [take, b.batch_id]
        );
        remaining -= take;
      }
    }

    // Insert order
    const total = menu.selling_price * quantity;
    const [result] = await conn.query(
      'INSERT INTO `Order` (staff_id, menu_item_id, order_timestamp, quantity, total_price, order_status) VALUES (?, ?, NOW(), ?, ?, ?)',
      [staff_id, menu_item_id, quantity, total, 'Pending']
    );

    await conn.commit();
    res.json({ order_id: result.insertId, total_price: total });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// START
const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
  console.log(`Restaurant Inventory server running at http://localhost:${PORT}`);
});