require('dotenv').config();
const express = require('express');
const mysql   = require('mysql2/promise');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 8000;

const db = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'food_expiry_nutrition_db',
  port:     Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const wrap = fn => (req, res) => fn(req, res).catch(err => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.get('/api/health', wrap(async (_req, res) => {
  const [[row]] = await db.query('SELECT 1 AS ok');
  res.json({ db: row.ok === 1 });
}));

app.get('/api/bootstrap', wrap(async (_req, res) => {
  const [
    [categories],
    [foods],
    [users],
    [batches],
    [dietGoals],
    [nutritionGoals],
    [consumption]
  ] = await Promise.all([
    db.query('SELECT category_id AS id, category_name AS name, color FROM Category ORDER BY category_id'),
    db.query(`SELECT fi.food_id, fi.food_name AS name, fi.brand,
                     fi.serving_size, fi.unit,
                     c.category_id, c.category_name AS category, c.color AS category_color,
                     n.calories, n.protein, n.carbohydrates AS carbs,
                     n.fat, n.fiber, n.sugar, n.sodium
              FROM Food_Item fi
              LEFT JOIN Category  c ON c.category_id = fi.category_id
              LEFT JOIN Nutrition n ON n.food_id     = fi.food_id
              ORDER BY fi.food_id`),
    db.query(`SELECT user_id, name, email, phone, date_of_birth, gender, height, weight
              FROM User ORDER BY user_id`),
    db.query(`SELECT batch_id, food_id, user_id, purchase_date, quantity, unit,
                     manufacturing_date, expiry_date, storage_location, status
              FROM Food_Batch ORDER BY batch_id`),
    db.query(`SELECT goal_id, user_id, goal_type, target_value, unit, start_date, end_date
              FROM Diet_Goal ORDER BY goal_id`),
    db.query(`SELECT nutrition_goal_id, user_id, nutrient_name, daily_target, unit
              FROM Nutrition_Goal ORDER BY nutrition_goal_id`),
    db.query(`SELECT c.consumption_id, c.user_id, c.batch_id, c.quantity_consumed,
                     c.consumption_date, c.meal_type,
                     fb.food_id, fi.food_name
              FROM Consumption c
              JOIN Food_Batch fb ON fb.batch_id = c.batch_id
              JOIN Food_Item  fi ON fi.food_id  = fb.food_id
              ORDER BY c.consumption_date, c.consumption_id`)
  ]);

  const ngByUser = {};
  nutritionGoals.forEach(g => {
    ngByUser[g.user_id] = ngByUser[g.user_id] || {};
    ngByUser[g.user_id][g.nutrient_name.toLowerCase()] = Number(g.daily_target);
  });

  const dietGoalsByUser = {};
  dietGoals.forEach(g => {
    dietGoalsByUser[g.user_id] = dietGoalsByUser[g.user_id] || [];
    dietGoalsByUser[g.user_id].push({
      goal_id: g.goal_id,
      type: g.goal_type,
      targetValue: Number(g.target_value),
      unit: g.unit,
      start_date: g.start_date,
      end_date: g.end_date
    });
  });

  const usersOut = users.map(u => ({
    user_id: u.user_id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    date_of_birth: u.date_of_birth,
    age: u.date_of_birth ? Math.floor((Date.now() - new Date(u.date_of_birth)) / (365.25 * 86400000)) : null,
    gender: u.gender,
    height: Number(u.height),
    weight: Number(u.weight),
    dietGoals: dietGoalsByUser[u.user_id] || [],
    nutritionGoals: Object.assign(
      { calories: 2000, protein: 75, carbs: 230, fat: 65, fiber: 28, sugar: 40, sodium: 2000 },
      ngByUser[u.user_id] || {}
    )
  }));

  res.json({
    categories,
    foods: foods.map(f => ({
      food_id: f.food_id,
      name: f.name,
      brand: f.brand,
      category_id: f.category_id,
      category: f.category,
      category_color: f.category_color,
      serving_size: Number(f.serving_size),
      unit: f.unit,
      nutrition: {
        calories: Number(f.calories),
        protein:  Number(f.protein),
        carbs:    Number(f.carbs),
        fat:      Number(f.fat),
        fiber:    Number(f.fiber),
        sugar:    Number(f.sugar),
        sodium:   Number(f.sodium)
      }
    })),
    users: usersOut,
    batches: batches.map(b => ({
      batch_id: b.batch_id,
      food_id: b.food_id,
      user_id: b.user_id,
      purchase_date: b.purchase_date,
      quantity: Number(b.quantity),
      unit: b.unit,
      manufacturing_date: b.manufacturing_date,
      expiry_date: b.expiry_date,
      storage_location: b.storage_location,
      status: b.status
    })),
    consumption: consumption.map(c => ({
      consumption_id: c.consumption_id,
      user_id: c.user_id,
      batch_id: c.batch_id,
      food_id: c.food_id,
      foodName: c.food_name,
      quantity_consumed: Number(c.quantity_consumed),
      consumption_date: c.consumption_date,
      meal_type: c.meal_type
    }))
  });
}));

app.post('/api/foods', wrap(async (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: 'name is required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    let categoryId = b.category_id || null;
    let categoryColor = '#8fa19f';
    if (!categoryId && b.category_name) {
      const [rows] = await conn.query('SELECT category_id, color FROM Category WHERE category_name = ?', [b.category_name]);
      if (rows.length) { categoryId = rows[0].category_id; categoryColor = rows[0].color; }
      else {
        categoryColor = b.category_color || '#8fa19f';
        const [ins] = await conn.query(
          'INSERT INTO Category (category_name, description, color) VALUES (?, ?, ?)',
          [b.category_name, 'User-added category', categoryColor]
        );
        categoryId = ins.insertId;
      }
    } else if (categoryId) {
      const [rows] = await conn.query('SELECT color FROM Category WHERE category_id = ?', [categoryId]);
      if (rows.length) categoryColor = rows[0].color;
    }

    const [foodIns] = await conn.query(
      `INSERT INTO Food_Item (food_name, category_id, brand, serving_size, unit)
       VALUES (?, ?, ?, ?, ?)`,
      [b.name, categoryId, b.brand || null,
       Number(b.serving_size) || null, b.unit || null]
    );
    const foodId = foodIns.insertId;

    const n = b.nutrition || {};
    await conn.query(
      `INSERT INTO Nutrition (food_id, calories, protein, carbohydrates, fat, fiber, sugar, sodium)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [foodId, n.calories||0, n.protein||0, n.carbs||0, n.fat||0, n.fiber||0, n.sugar||0, n.sodium||0]
    );

    let batchId = null;
    if (b.user_id && b.shelf_life_days != null) {
      const daysAgo = Number(b.purchased_days_ago) || 0;
      const shelf   = Number(b.shelf_life_days) || 0;
      const [batchIns] = await conn.query(
        `INSERT INTO Food_Batch
          (food_id, user_id, purchase_date, quantity, unit,
           manufacturing_date, expiry_date, storage_location, status)
         VALUES (?, ?, DATE_SUB(CURDATE(), INTERVAL ? DAY),
                 ?, ?, NULL,
                 DATE_ADD(DATE_SUB(CURDATE(), INTERVAL ? DAY), INTERVAL ? DAY),
                 ?, 'Fresh')`,
        [foodId, b.user_id, daysAgo,
         Number(b.quantity) || 1, b.unit || null,
         daysAgo, shelf, b.storage_location || 'Pantry']
      );
      batchId = batchIns.insertId;
    }

    await conn.commit();
    res.json({ food_id: foodId, batch_id: batchId, category_id: categoryId, color: categoryColor });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

app.post('/api/users', wrap(async (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: 'name is required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const email = b.email || `${b.name.toLowerCase().replace(/\s+/g,'.')}.${Date.now()}@pantryboard.local`;
    const dob = b.date_of_birth ||
      (b.age ? new Date(Date.now() - b.age * 365.25 * 86400000).toISOString().slice(0,10) : null);

    const [userIns] = await conn.query(
      `INSERT INTO User (name, email, password, phone, date_of_birth, gender, height, weight)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.name, email, 'hash_default', b.phone || null, dob,
       b.gender || 'Other', Number(b.height) || null, Number(b.weight) || null]
    );
    const userId = userIns.insertId;

    if (b.goal_type) {
      const durationDays = Number(b.goal_duration_days) || 60;
      await conn.query(
        `INSERT INTO Diet_Goal (user_id, goal_type, target_value, unit, start_date, end_date)
         VALUES (?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? DAY))`,
        [userId, b.goal_type, Number(b.goal_target) || 0, b.goal_unit || 'kg', durationDays]
      );
    }

    const ng = b.nutritionGoals || {};
    const unitFor = k => k === 'calories' ? 'kcal' : (k === 'sodium' ? 'mg' : 'g');
    for (const [k, v] of Object.entries(ng)) {
      const nutrientName = k.charAt(0).toUpperCase() + k.slice(1);
      await conn.query(
        `INSERT INTO Nutrition_Goal (user_id, nutrient_name, daily_target, unit)
         VALUES (?, ?, ?, ?)`,
        [userId, nutrientName, Number(v) || 0, unitFor(k)]
      );
    }

    await conn.commit();
    res.json({ user_id: userId });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

app.post('/api/consumption', wrap(async (req, res) => {
  const { user_id, food_id, meal_type, quantity } = req.body || {};
  if (!user_id || !food_id) return res.status(400).json({ error: 'user_id and food_id required' });

  const [rows] = await db.query(
    `SELECT batch_id FROM Food_Batch
     WHERE food_id = ?
     ORDER BY (user_id = ?) DESC, expiry_date DESC
     LIMIT 1`,
    [food_id, user_id]
  );
  if (!rows.length) return res.status(400).json({ error: 'No batch exists for this food' });

  const batchId = rows[0].batch_id;
  const [ins] = await db.query(
    `INSERT INTO Consumption (user_id, batch_id, quantity_consumed, consumption_date, meal_type)
     VALUES (?, ?, ?, CURDATE(), ?)`,
    [user_id, batchId, Number(quantity) || 1, meal_type || 'Snack']
  );
  res.json({ consumption_id: ins.insertId, batch_id: batchId });
}));

app.delete('/api/consumption/:id', wrap(async (req, res) => {
  await db.query('DELETE FROM Consumption WHERE consumption_id = ?', [req.params.id]);
  res.json({ ok: true });
}));

app.post('/api/advance-day', wrap(async (_req, res) => {
  await db.query(`
    UPDATE Food_Batch
    SET status = CASE
      WHEN expiry_date < CURDATE()                            THEN 'Expired'
      WHEN expiry_date < DATE_ADD(CURDATE(), INTERVAL 4 DAY)  THEN 'Near Expiry'
      ELSE 'Fresh'
    END
    WHERE status <> 'Consumed'
  `);
  const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM Food_Batch');
  res.json({ ok: true, batches: n });
}));

app.listen(PORT, () => {
  console.log(`PantryBoard running at http://localhost:${PORT}`);
});