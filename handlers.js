// Mutation Handlers

// Order Status
async function updateOrderStatus(orderId, newStatus) {
  try {
    await API.put(`orders/${orderId}`, { order_status: newStatus });
    await loadAll();
    renderOrders();
  } catch (err) { alert(err.message); }
}

// Category
async function saveCategory() {
  const nameEl = document.getElementById('cat-name');
  const descEl = document.getElementById('cat-desc');
  const name = nameEl.value.trim();
  const desc = descEl.value.trim();
  if (!name) { alert('Please enter a category name.'); return; }

  try {
    await API.post('categories', { category_name: name, description: desc });
    nameEl.value = ''; descEl.value = '';
    await loadAll();
    initDashboard();
  } catch (err) { alert(err.message); }
}

// Food Item
async function saveFoodItem() {
  const nameEl = document.getElementById('fi-name');
  const unitEl = document.getElementById('fi-unit');
  const catEl = document.getElementById('fi-category');
  const name = nameEl.value.trim();
  const unit = unitEl.value.trim();
  const categoryId = parseInt(catEl.value);
  const isPerishable = document.getElementById('fi-perishable').value === 'true';
  if (!name || !unit) { alert('Please enter a name and unit.'); return; }
  if (isNaN(categoryId)) { alert('Please add a category first.'); return; }

  try {
    const newItem = await API.post('food-items', {
      category_id: categoryId,
      item_name: name,
      unit_of_measure: unit,
      is_perishable: isPerishable ? 1 : 0
    });
    await API.post('nutrition', {
      food_item_id: newItem.food_item_id,
      calories: parseFloat(document.getElementById('fi-cal').value) || 0,
      protein_g: parseFloat(document.getElementById('fi-pro').value) || 0,
      carbs_g: parseFloat(document.getElementById('fi-carb').value) || 0,
      fat_g: parseFloat(document.getElementById('fi-fat').value) || 0,
      sodium_mg: parseFloat(document.getElementById('fi-sodium').value) || 0
    });

    nameEl.value = ''; unitEl.value = '';
    document.getElementById('fi-cal').value = '0';
    document.getElementById('fi-pro').value = '0';
    document.getElementById('fi-carb').value = '0';
    document.getElementById('fi-fat').value = '0';
    document.getElementById('fi-sodium').value = '0';
    document.getElementById('fi-perishable').value = 'true';

    await loadAll();
    initDashboard();
  } catch (err) { alert(err.message); }
}

// Menu Item
async function toggleMenuAvailability(menuItemId) {
  const menuItem = db.menu_item.find(m => m.menu_item_id === menuItemId);
  if (!menuItem) return;
  try {
    await API.put(`menu-items/${menuItemId}`, { is_available: menuItem.is_available ? 0 : 1 });
    await loadAll();
    renderMenu();
    populateDropdowns();
  } catch (err) { alert(err.message); }
}

async function saveMenuItem() {
  const nameEl = document.getElementById('menu-name');
  const priceEl = document.getElementById('menu-price');
  const name = nameEl.value.trim();
  const price = parseFloat(priceEl.value);
  const isAvailable = document.getElementById('menu-available').value === 'true';
  if (!name || isNaN(price)) { alert('Please enter a name and a valid price.'); return; }

  try {
    await API.post('menu-items', {
      item_name: name,
      selling_price: price,
      is_available: isAvailable ? 1 : 0
    });
    nameEl.value = ''; priceEl.value = '';
    document.getElementById('menu-available').value = 'true';
    await loadAll();
    initDashboard();
  } catch (err) { alert(err.message); }
}

// Recipe
async function saveRecipe() {
  const menuItemId = parseInt(document.getElementById('rec-menu-id').value);
  if (isNaN(menuItemId)) { alert('Please add a menu item first.'); return; }
  const rows = document.querySelectorAll('#ingredients-container .ingredient-row');
  let added = 0;
  try {
    for (const row of rows) {
      const foodItemId = parseInt(row.querySelector('.ing-select').value);
      const qty = parseFloat(row.querySelector('.ing-qty').value);
      if (!isNaN(foodItemId) && !isNaN(qty) && qty > 0) {
        await API.post('recipes', {
          menu_item_id: menuItemId,
          food_item_id: foodItemId,
          quantity_required: qty
        });
        added++;
      }
    }
    if (added === 0) { alert('Please add at least one ingredient with a quantity.'); return; }
    await loadAll();
    initDashboard();
  } catch (err) { alert(err.message); }
}

// Staff
async function saveStaff() {
  const fnameEl = document.getElementById('st-fname');
  const lnameEl = document.getElementById('st-lname');
  const fname = fnameEl.value.trim();
  const lname = lnameEl.value.trim();
  const role = document.getElementById('st-role').value;
  if (!fname || !lname) { alert('Please enter a first and last name.'); return; }

  try {
    await API.post('staff', { first_name: fname, last_name: lname, role });
    fnameEl.value = ''; lnameEl.value = '';
    document.getElementById('st-role').value = 'Waiter';
    await loadAll();
    initDashboard();
  } catch (err) { alert(err.message); }
}

// Batch
async function addBatch() {
  const itemId = parseInt(document.getElementById('inv-item-id').value);
  const qty = parseFloat(document.getElementById('inv-qty').value);
  const expiry = document.getElementById('inv-exp').value;
  if (!qty || !expiry) { alert("Please enter quantity and expiration date."); return; }

  try {
    await API.post('batches', {
      food_item_id: itemId,
      quantity_received: qty,
      quantity_remaining: qty,
      received_date: new Date().toISOString().slice(0, 10),
      expiration_date: expiry
    });
    document.getElementById('inv-qty').value = '';
    document.getElementById('inv-exp').value = '';
    await loadAll();
    initDashboard();
  } catch (err) { alert(err.message); }
}

// Order
async function placeOrder() {
  const menuItemId = parseInt(document.getElementById('order-item-id').value);
  const qty = parseInt(document.getElementById('order-qty').value);
  const staffId = parseInt(document.getElementById('order-staff-id').value);
  if (!menuItemId || !staffId || !qty) { alert('Please fill in all order fields.'); return; }

  try {
    await API.post('place-order', { staff_id: staffId, menu_item_id: menuItemId, quantity: qty });
    await loadAll();
    initDashboard();
  } catch (err) { alert(err.message); }
}