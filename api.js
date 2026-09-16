// Replaces the in-memory `db` object

const API = {
  async get(path) {
    const r = await fetch(`/api/${path}`);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(`/api/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Request failed');
    return data;
  },
  async put(path, body) {
    const r = await fetch(`/api/${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Request failed');
    return data;
  }
};

// Local cache — mirrors DB rows for fast rendering.
// Refreshed via loadAll() on login and after every mutation.
let db = {
  category: [], food_item: [], nutrition: [], food_batch: [],
  menu_item: [], recipe: [], staff: [], customer_order: []
};

let orderIdCounter = 1;
let ingredientRowCounter = 0;
let currentUser = null;

async function loadAll() {
  const [categories, foodItems, nutrition, batches, menuItems, recipes, staff, orders] = await Promise.all([
    API.get('categories'),
    API.get('food-items'),
    API.get('nutrition'),
    API.get('batches'),
    API.get('menu-items'),
    API.get('recipes'),
    API.get('staff'),
    API.get('orders')
  ]);
  db.category       = categories;
  db.food_item      = foodItems;
  db.nutrition      = nutrition;
  db.food_batch     = batches;
  db.menu_item      = menuItems;
  db.recipe         = recipes;
  db.staff          = staff;
  db.customer_order = orders;
  if (orders.length) {
    orderIdCounter = Math.max(...orders.map(o => o.order_id)) + 1;
  }
}