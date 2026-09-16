// Navigation
function switchTab(tabName, el) {
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
}

// Ingredient Row
function addIngredientRow() {
  const container = document.getElementById('ingredients-container');
  if (!container) return;
  const rowId = `ing-row-${ingredientRowCounter++}`;
  const options = db.food_item.map(f => `<option value="${f.food_item_id}">${f.item_name} (${f.unit_of_measure})</option>`).join('');
  const row = document.createElement('div');
  row.className = 'ingredient-row';
  row.id = rowId;
  row.innerHTML = `
    <div class="form-group"><label>Ingredient</label><select class="ing-select">${options}</select></div>
    <div class="form-group"><label>Quantity Required</label><input type="number" step="0.01" class="ing-qty"></div>
    <div class="form-group"><label>Unit</label><input type="text" class="ing-unit" disabled style="opacity:0.6;" value=""></div>
    <button type="button" class="remove-ing-btn" title="Remove">×</button>`;
  const select = row.querySelector('.ing-select');
  const unitInput = row.querySelector('.ing-unit');
  const updateUnit = () => {
    const foodItem = db.food_item.find(f => f.food_item_id === parseInt(select.value));
    unitInput.value = foodItem ? foodItem.unit_of_measure : '';
  };
  select.addEventListener('change', updateUnit);
  updateUnit();
  row.querySelector('.remove-ing-btn').addEventListener('click', () => {
    if (container.children.length > 1) row.remove();
  });
  container.appendChild(row);
}

// Dashboard Initialization
function initDashboard() {
  renderDashboardStats();
  renderDashboardAlerts();
  renderCatalog();
  renderInventory();
  renderMenu();
  renderOrders();
  renderStaff();
  populateDropdowns();
  resetRecipeForm();
}

function renderDashboardStats() {
  document.getElementById('stat-categories').textContent = db.category.length;
  document.getElementById('stat-food-items').textContent = db.food_item.length;
  document.getElementById('stat-batches').textContent = db.food_batch.length;
  document.getElementById('stat-menu').textContent = db.menu_item.length;
  document.getElementById('stat-recipes').textContent = db.recipe.length;
  document.getElementById('stat-staff').textContent = db.staff.length;
  document.getElementById('stat-orders').textContent = db.customer_order.length;
}

function renderDashboardAlerts() {
  const tbody = document.getElementById('dashboard-alerts-body');
  const today = new Date();
  const alerts = db.food_batch.filter(batch => {
    const expDate = new Date(batch.expiration_date);
    const daysUntilExpiry = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    const remainingPct = batch.quantity_received > 0
      ? (batch.quantity_remaining / batch.quantity_received) * 100
      : 0;
    return daysUntilExpiry <= 3 || remainingPct <= 30;
  });

  if (alerts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-faint);">All stock is fresh and well-stocked.</td></tr>`;
    return;
  }

  tbody.innerHTML = alerts.map(batch => {
    const foodItem = db.food_item.find(f => f.food_item_id === batch.food_item_id);
    const expDate = new Date(batch.expiration_date);
    const daysUntilExpiry = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    const remainingPct = batch.quantity_received > 0
      ? Math.round((batch.quantity_remaining / batch.quantity_received) * 100)
      : 0;

    let statusHtml = `<span class="status-badge status-warn">Low Stock (${remainingPct}%)</span>`;
    if (daysUntilExpiry <= 0) statusHtml = `<span class="status-badge status-expired">EXPIRED</span>`;
    else if (daysUntilExpiry <= 14) statusHtml = `<span class="status-badge status-warn">Expiring Soon</span>`;

    return `<tr><td>#${batch.batch_id}</td><td>${foodItem ? foodItem.item_name : 'Unknown'}</td>
      <td>${batch.quantity_remaining} ${foodItem ? foodItem.unit_of_measure : ''}</td>
      <td>${batch.expiration_date}</td><td>${statusHtml}</td></tr>`;
  }).join('');
}

function renderCatalog() {
  document.getElementById('category-table-body').innerHTML = db.category.map(c => `
    <tr><td>#${c.category_id}</td><td>${c.category_name}</td><td><small>${c.description || '—'}</small></td></tr>`).join('');

  document.getElementById('food-item-table-body').innerHTML = db.food_item.map(f => {
    const cat = db.category.find(c => c.category_id === f.category_id);
    const nut = db.nutrition.find(n => n.food_item_id === f.food_item_id) || {};
    return `<tr><td>#${f.food_item_id}</td><td><strong>${f.item_name}</strong></td>
      <td>${cat ? cat.category_name : 'N/A'}</td>
      <td>${f.unit_of_measure}</td>
      <td>${f.is_perishable ? '<span style="color:var(--warn);">Yes</span>' : 'No'}</td>
      <td>${nut.calories || 0}</td><td>${nut.protein_g || 0}</td><td>${nut.carbs_g || 0}</td>
      <td>${nut.fat_g || 0}</td><td>${nut.sodium_mg || 0}</td></tr>`;
  }).join('');
}

function renderInventory() {
  const tbody = document.getElementById('inventory-table-body');
  const today = new Date();
  tbody.innerHTML = db.food_batch.map(batch => {
    const foodItem = db.food_item.find(f => f.food_item_id === batch.food_item_id);
    const unit = foodItem ? foodItem.unit_of_measure : '';
    const expDate = new Date(batch.expiration_date);
    const daysUntilExpiry = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    let statusHtml = `<span class="status-badge status-fresh">Good</span>`;
    if (daysUntilExpiry <= 0) statusHtml = `<span class="status-badge status-expired">EXPIRED</span>`;
    else if (daysUntilExpiry <= 14) statusHtml = `<span class="status-badge status-warn">Expiring Soon</span>`;
    return `<tr><td>#${batch.batch_id}</td><td>${foodItem ? foodItem.item_name : 'Unknown'}</td>
      <td>${batch.quantity_received} ${unit}</td><td>${batch.quantity_remaining} ${unit}</td>
      <td>${batch.received_date}</td><td>${batch.expiration_date}</td><td>${statusHtml}</td></tr>`;
  }).join('');
}

function renderMenu() {
  document.getElementById('menu-item-table-body').innerHTML = db.menu_item.map(menu => `
    <tr><td>#${menu.menu_item_id}</td><td><strong>${menu.item_name}</strong></td>
      <td>$${Number(menu.selling_price).toFixed(2)}</td>
      <td>
        <button type="button" class="btn ${menu.is_available ? 'btn-primary' : 'btn-ghost'}" 
                style="padding:5px 12px; font-size:11.5px;"
                onclick="toggleMenuAvailability(${menu.menu_item_id})">
          ${menu.is_available ? 'Available' : 'Unavailable'}
        </button>
      </td></tr>
  `).join('');

  document.getElementById('recipe-table-body').innerHTML = db.recipe.map(r => {
    const menu = db.menu_item.find(m => m.menu_item_id === r.menu_item_id);
    const food = db.food_item.find(f => f.food_item_id === r.food_item_id);
    return `<tr><td>${menu ? menu.item_name : 'N/A'}</td><td>${food ? food.item_name : 'N/A'}</td>
      <td>${r.quantity_required}</td><td>${food ? food.unit_of_measure : ''}</td></tr>`;
  }).join('');
}

function renderOrders() {
  const tbody = document.getElementById('orders-table-body');
  const sortedOrders = [...db.customer_order].sort((a, b) => b.order_id - a.order_id);
  if (sortedOrders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-faint);">No orders placed yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = sortedOrders.map(order => {
    const menuItem = db.menu_item.find(m => m.menu_item_id === order.menu_item_id);
    const staff = db.staff.find(s => s.staff_id === order.staff_id);

    let statusClass = 'status-pending';
    if (order.order_status === 'Served') statusClass = 'status-info';
    else if (order.order_status === 'Cooking') statusClass = 'status-cooking';
    else if (order.order_status === 'Cancelled') statusClass = 'status-cancelled';

    const statusBadge = `<span class="status-badge ${statusClass}">${order.order_status}</span>`;
    const statusDropdown = `
      <select class="status-select" onchange="updateOrderStatus(${order.order_id}, this.value)">
        <option value="Pending"   ${order.order_status === 'Pending'   ? 'selected' : ''}>Pending</option>
        <option value="Cooking"   ${order.order_status === 'Cooking'   ? 'selected' : ''}>Cooking</option>
        <option value="Served"    ${order.order_status === 'Served'    ? 'selected' : ''}>Served</option>
        <option value="Cancelled" ${order.order_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
      </select>`;

    return `<tr><td>#${order.order_id}</td><td>${menuItem ? menuItem.item_name : 'Unknown'}</td>
      <td>${order.quantity}</td><td>$${Number(order.total_price).toFixed(2)}</td>
      <td>${staff ? staff.first_name + ' ' + staff.last_name : 'N/A'}</td>
      <td><small>${order.order_timestamp}</small></td>
      <td>${statusBadge}</td><td>${statusDropdown}</td></tr>`;
  }).join('');
}

function renderStaff() {
  document.getElementById('staff-table-body').innerHTML = db.staff.map(s => `
    <tr><td>#${s.staff_id}</td><td>${s.first_name}</td><td>${s.last_name}</td>
      <td>${s.role}</td></tr>`).join('');
}

function populateDropdowns() {
  const invSel = document.getElementById('inv-item-id');
  if (invSel) invSel.innerHTML = db.food_item.map(i => `<option value="${i.food_item_id}">${i.item_name} (${i.unit_of_measure})</option>`).join('');
  const orderSel = document.getElementById('order-item-id');
  if (orderSel) orderSel.innerHTML = db.menu_item.filter(m => m.is_available).map(i => `<option value="${i.menu_item_id}">${i.item_name} - $${Number(i.selling_price).toFixed(2)}</option>`).join('');
  const staffSel = document.getElementById('order-staff-id');
  if (staffSel) staffSel.innerHTML = db.staff
  .filter(s => s.role === 'Waiter')
  .map(s => `<option value="${s.staff_id}">${s.first_name} ${s.last_name}</option>`)
  .join('');
  const catSel = document.getElementById('fi-category');
  if (catSel) catSel.innerHTML = db.category.map(c => `<option value="${c.category_id}">${c.category_name}</option>`).join('');
  const recSel = document.getElementById('rec-menu-id');
  if (recSel) recSel.innerHTML = db.menu_item.map(m => `<option value="${m.menu_item_id}">${m.item_name}</option>`).join('');
}

function resetRecipeForm() {
  const container = document.getElementById('ingredients-container');
  if (!container) return;
  container.innerHTML = '';
  ingredientRowCounter = 0;
  addIngredientRow();
}