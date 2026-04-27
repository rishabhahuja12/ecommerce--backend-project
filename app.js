// ===== CONFIG =====
const BASE = "http://localhost:8080";

// ===== STATE =====
let userId   = null;
let userName = "";
let userPass = "";
let isAdmin  = false;
let cart     = [];      // [{ productId, name, price, quantity }]
let products = [];      // latest from server
let cartModalProductId = null;
let autoRefreshTimer   = null;

// ===== STATUS BAR =====
function setStatus(msg) {
  document.getElementById("status").textContent = msg;
}

// ===== SHOW / HIDE =====
function show(id) { document.getElementById(id).classList.remove("hidden"); }
function hide(id) { document.getElementById(id).classList.add("hidden");    }

// ===================================================================
// AUTH TABS
// ===================================================================
function showAuthTab(tab) {
  ["Register", "Login", "Admin"].forEach(t => {
    hide("tab" + t);
    document.getElementById("tb" + t).classList.remove("active");
  });
  show("tab" + tab);
  document.getElementById("tb" + tab).classList.add("active");
}

// ===================================================================
// REGISTER — POST /users/register  (TC-U1, TC-U2, TC-U5)
// ===================================================================
async function registerUser() {
  const name  = val("regName");
  const email = val("regEmail");
  const pass  = val("regPassword");

  if (!name || !email || !pass) { setStatus("All fields are required (TC-U2)."); return; }

  setStatus("Registering…");
  try {
    const res  = await post("/users/register", { name, email, password: pass });
    const text = await res.text();

    if (!res.ok) { setStatus("Error: " + text); return; }

    const user = JSON.parse(text);
    setStatus("Registered! User ID: " + user.id + ". Now login.");
    clearFields("regName", "regEmail", "regPassword");
    showAuthTab("Login");
    document.getElementById("tbLogin").classList.add("active");
    document.getElementById("tbRegister").classList.remove("active");
  } catch (e) {
    setStatus("Network error: " + e.message);
  }
}

// ===================================================================
// LOGIN — GET /users/login?email=  (TC-U1, TC-U3)
// ===================================================================
async function loginUser() {
  const email = val("loginEmail");
  const pass  = val("loginPassword");
  if (!email || !pass) { setStatus("Email and password required."); return; }

  setStatus("Logging in…");
  try {
    const res  = await fetch(BASE + "/users/login?email=" + encodeURIComponent(email));
    const text = await res.text();

    if (!res.ok || !text || text === "null") {
      setStatus("User not found. Please register first.");
      return;
    }

    const user = JSON.parse(text);
    if (user.password !== pass) { setStatus("Wrong password."); return; }

    userId   = user.id;
    userName = user.name;
    userPass = user.password;
    isAdmin  = false;
    enterUserView();
  } catch (e) {
    setStatus("Network error: " + e.message);
  }
}

// ===================================================================
// ADMIN LOGIN
// ===================================================================
function adminLogin() {
  if (val("adminPassword") === "admin123") {
    isAdmin  = true;
    userId   = null;
    userName = "Admin";
    enterAdminView();
  } else {
    setStatus("Invalid admin password.");
  }
}

// ===================================================================
// ENTER VIEWS
// ===================================================================
function enterUserView() {
  hide("authView");
  show("userView");
  hide("adminView");
  show("headerInfo");
  document.getElementById("headerUser").textContent = `${userName} (ID: ${userId})`;
  setStatus("Logged in as " + userName);
  cart = [];
  renderCartBadge();
  loadProducts();
  loadOrders();
  startAutoRefresh();
}

function enterAdminView() {
  hide("authView");
  hide("userView");
  show("adminView");
  show("headerInfo");
  document.getElementById("headerUser").textContent = "Admin";
  setStatus("Logged in as Admin");
  loadProducts();
  startAutoRefresh();
}

// ===================================================================
// LOGOUT
// ===================================================================
function logout() {
  stopAutoRefresh();
  userId = null; userName = ""; userPass = ""; isAdmin = false;
  cart = []; products = [];
  show("authView");
  hide("userView");
  hide("adminView");
  hide("headerInfo");
  setStatus("Logged out.");
}

// ===================================================================
// USER TABS
// ===================================================================
function showUserTab(tab) {
  ["Products","Cart","Orders"].forEach(t => {
    hide("userTab" + t);
    document.getElementById("uv" + t).classList.remove("active");
  });
  show("userTab" + tab);
  document.getElementById("uv" + tab).classList.add("active");
}

// ===================================================================
// ADMIN TABS
// ===================================================================
function showAdminTab(tab) {
  ["Products","Add","Stock","Orders","Users"].forEach(t => {
    hide("adminTab" + t);
    document.getElementById("av" + t).classList.remove("active");
  });
  show("adminTab" + tab);
  document.getElementById("av" + tab).classList.add("active");
}

// ===================================================================
// AUTO REFRESH
// ===================================================================
function startAutoRefresh() {
  stopAutoRefresh();
  autoRefreshTimer = setInterval(() => {
    loadProducts();
    if (userId) loadOrders();
  }, 3000);
}

function stopAutoRefresh() {
  if (autoRefreshTimer) { clearInterval(autoRefreshTimer); autoRefreshTimer = null; }
}

function manualRefresh() {
  loadProducts();
  if (userId) loadOrders();
  setStatus("Refreshed.");
}

// ===================================================================
// LOAD PRODUCTS — GET /products  (TC-P3)
// ===================================================================
async function loadProducts() {
  try {
    const res = await fetch(BASE + "/products");
    if (!res.ok) throw new Error(await res.text());
    products = await res.json();
    renderProductTable();
    renderAdminProductTable();
  } catch (e) {
    setStatus("Error loading products: " + e.message);
  }
}

// ===== USER PRODUCT TABLE =====
function renderProductTable() {
  const tbody = document.getElementById("productTbody");
  if (!tbody) return;

  if (!products.length) {
    tbody.innerHTML = `<tr class="no-data"><td colspan="6">No products available.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const cartQty   = (cart.find(c => c.productId === p.id) || {}).quantity || 0;
    const available = p.stock - cartQty;
    let action;

    if (p.stock === 0) {
      action = `<span class="tag tag-out">Out of Stock</span>`;
    } else if (available <= 0) {
      action = `<span style="color:#aaa">All in cart</span>`;
    } else {
      action = `<button class="btn-primary" onclick="openQtyDialog(${p.id})">Add to Cart (${available} left)</button>`;
    }

    const stockClass = p.stock === 0 ? "stock-zero" : p.stock < 5 ? "stock-low" : "stock-ok";

    return `<tr>
      <td>${p.id}</td>
      <td><strong>${esc(p.name)}</strong></td>
      <td>${esc(p.description || "—")}</td>
      <td>₹${num(p.price)}</td>
      <td class="${stockClass}">${p.stock}</td>
      <td>${action}</td>
    </tr>`;
  }).join("");
}

// ===== ADMIN PRODUCT TABLE =====
function renderAdminProductTable() {
  const tbody = document.getElementById("adminProductTbody");
  if (!tbody) return;

  if (!products.length) {
    tbody.innerHTML = `<tr class="no-data"><td colspan="6">No products. Add one.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const stockClass = p.stock === 0 ? "stock-zero" : p.stock < 5 ? "stock-low" : "stock-ok";
    return `<tr>
      <td>${p.id}</td>
      <td><strong>${esc(p.name)}</strong></td>
      <td>${esc(p.description || "—")}</td>
      <td>₹${num(p.price)}</td>
      <td class="${stockClass}">${p.stock}</td>
      <td>
        <button class="btn-warning" onclick="editProduct(${p.id})">Edit</button>
        <button class="btn-danger"  onclick="deleteProduct(${p.id})">Delete</button>
      </td>
    </tr>`;
  }).join("");
}

// ===================================================================
// ADD PRODUCT — POST /products  (TC-P1, TC-P2)
// ===================================================================
async function addProduct() {
  const name  = val("pName");
  const desc  = val("pDesc");
  const price = Number(document.getElementById("pPrice").value);
  const stock = Number(document.getElementById("pStock").value);

  if (!name)      { setStatus("Product name required."); return; }
  if (price <= 0) { setStatus("Price must be > 0. (TC-P2 rejects ≤ 0)"); return; }
  if (stock < 0)  { setStatus("Stock cannot be negative. (TC-P7)"); return; }

  setStatus("Adding product…");
  try {
    const res = await post("/products", { name, description: desc, price, stock });
    const text = await res.text();
    if (!res.ok) { setStatus("Error: " + text); return; }
    const p = JSON.parse(text);
    setStatus(`Product "${p.name}" added (ID: ${p.id}).`);
    clearAddForm();
    loadProducts();
    showAdminTab("Products");
  } catch (e) {
    setStatus("Network error: " + e.message);
  }
}

function clearAddForm() {
  clearFields("pName", "pDesc", "pPrice", "pStock");
}

// ===================================================================
// EDIT PRODUCT — PUT /products/{id}
// ===================================================================
function editProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  document.getElementById("editProductId").textContent = p.id;
  document.getElementById("editName").value  = p.name;
  document.getElementById("editDesc").value  = p.description || "";
  document.getElementById("editPrice").value = p.price;
  document.getElementById("editStock").value = p.stock;
  show("editPanel");

  // Scroll to it
  document.getElementById("editPanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function saveProduct() {
  const id    = Number(document.getElementById("editProductId").textContent);
  const name  = val("editName");
  const desc  = val("editDesc");
  const price = Number(document.getElementById("editPrice").value);
  const stock = Number(document.getElementById("editStock").value);

  if (!name)      { setStatus("Name required."); return; }
  if (price <= 0) { setStatus("Price must be > 0."); return; }
  if (stock < 0)  { setStatus("Stock cannot be negative."); return; }

  setStatus("Updating product…");
  try {
    const res = await fetch(BASE + "/products/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc, price, stock })
    });
    const text = await res.text();
    if (!res.ok) { setStatus("Error: " + text); return; }
    setStatus(`Product #${id} updated.`);
    cancelEdit();
    loadProducts();
  } catch (e) {
    setStatus("Network error: " + e.message);
  }
}

function cancelEdit() {
  hide("editPanel");
}

// ===================================================================
// DELETE PRODUCT — DELETE /products/{id}
// ===================================================================
async function deleteProduct(id) {
  if (!confirm(`Delete product #${id}?`)) return;
  try {
    const res = await fetch(BASE + "/products/" + id, { method: "DELETE" });
    setStatus(`Product #${id} deleted.`);
    loadProducts();
  } catch (e) {
    setStatus("Network error: " + e.message);
  }
}

// ===================================================================
// STOCK TOOLS
// ===================================================================

// Reduce Stock — PUT /products/reduce/{id}?quantity=x  (TC-P5, TC-P6)
async function reduceStock() {
  const id  = document.getElementById("reduceId").value;
  const qty = document.getElementById("reduceQty").value;
  if (!id || !qty) { setStatus("Fill product ID and quantity."); return; }

  setStatus("Reducing stock…");
  try {
    const res  = await fetch(`${BASE}/products/reduce/${id}?quantity=${qty}`, { method: "PUT" });
    const text = await res.text();
    if (!res.ok) { setStatus("Error (TC-P6): " + text); return; }
    setStatus(`Stock reduced by ${qty} for product #${id}.`);
    loadProducts();
  } catch (e) {
    setStatus("Network error: " + e.message);
  }
}

// Set Stock — PUT /products/updateStock/{id}?stock=x  (TC-P7)
async function setStock() {
  const id  = document.getElementById("setStockId").value;
  const val_ = document.getElementById("setStockVal").value;
  if (!id || val_ === "") { setStatus("Fill product ID and stock value."); return; }

  setStatus("Setting stock…");
  try {
    const res  = await fetch(`${BASE}/products/updateStock/${id}?stock=${val_}`, { method: "PUT" });
    const text = await res.text();
    if (!res.ok) { setStatus("Server rejected (TC-P7 negative stock): " + text); return; }
    setStatus(`Stock for product #${id} set to ${val_}.`);
    loadProducts();
  } catch (e) {
    setStatus("Network error: " + e.message);
  }
}

// ===================================================================
// CART
// ===================================================================
function openQtyDialog(productId) {
  const p = products.find(x => x.id === productId);
  if (!p) return;
  const cartQty   = (cart.find(c => c.productId === productId) || {}).quantity || 0;
  const available = p.stock - cartQty;

  cartModalProductId = productId;
  document.getElementById("qtyDialogTitle").textContent = "Add to Cart: " + p.name;
  document.getElementById("qtyDialogAvail").textContent = available;
  document.getElementById("qtyInput").value = 1;
  document.getElementById("qtyInput").max   = available;
  hide("qtyDialogError");
  show("qtyDialog");
}

function closeQtyDialog() {
  hide("qtyDialog");
  cartModalProductId = null;
}

function confirmAddToCart() {
  const p = products.find(x => x.id === cartModalProductId);
  if (!p) return;

  const cartQty   = (cart.find(c => c.productId === cartModalProductId) || {}).quantity || 0;
  const available = p.stock - cartQty;
  const qty       = Number(document.getElementById("qtyInput").value);
  const errEl     = document.getElementById("qtyDialogError");

  if (!qty || qty <= 0)   { errEl.textContent = "Quantity must be > 0"; show("qtyDialogError"); return; }
  if (qty > 100)          { errEl.textContent = "Max 100 per item";     show("qtyDialogError"); return; }
  if (qty > available)    { errEl.textContent = `Only ${available} available`; show("qtyDialogError"); return; }

  const existing = cart.find(c => c.productId === cartModalProductId);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({ productId: cartModalProductId, name: p.name, price: p.price, quantity: qty });
  }

  setStatus(`Added ${qty}× ${p.name} to cart.`);
  closeQtyDialog();
  renderProductTable();
  renderCartTable();
  renderCartBadge();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderProductTable();
  renderCartTable();
  renderCartBadge();
}

function clearCart() {
  cart = [];
  renderProductTable();
  renderCartTable();
  renderCartBadge();
  setStatus("Cart cleared.");
}

function renderCartBadge() {
  const total = cart.reduce((s, c) => s + c.quantity, 0);
  const badge = document.getElementById("cartBadge");
  badge.textContent = total > 0 ? total : "";
}

function renderCartTable() {
  const tbody   = document.getElementById("cartTbody");
  const summary = document.getElementById("cartSummary");
  const empty   = document.getElementById("cartEmpty");

  if (!cart.length) {
    tbody.innerHTML = "";
    hide("cartSummary");
    show("cartEmpty");
    return;
  }

  hide("cartEmpty");
  show("cartSummary");

  let total = 0;
  tbody.innerHTML = cart.map((c, i) => {
    const sub = c.price * c.quantity;
    total += sub;
    return `<tr>
      <td><strong>${esc(c.name)}</strong> <small>(ID: ${c.productId})</small></td>
      <td>₹${num(c.price)}</td>
      <td>
        <button onclick="changeQty(${i}, -1)">−</button>
        ${c.quantity}
        <button onclick="changeQty(${i}, 1)">+</button>
      </td>
      <td>₹${num(sub)}</td>
      <td><button class="btn-danger" onclick="removeFromCart(${i})">✕</button></td>
    </tr>`;
  }).join("");

  document.getElementById("cartTotal").textContent = "₹" + num(total);
}

function changeQty(index, delta) {
  const item = cart[index];
  if (!item) return;
  const prod  = products.find(p => p.id === item.productId);
  const newQty = item.quantity + delta;
  if (newQty <= 0) { removeFromCart(index); return; }
  if (prod && newQty > prod.stock) { setStatus("Not enough stock."); return; }
  item.quantity = newQty;
  renderCartTable();
  renderCartBadge();
  renderProductTable();
}

// ===================================================================
// PLACE ORDER — POST /orders  (TC-O1 through TC-O8 & TC-O11, TC-O12)
// ===================================================================
async function placeOrder() {
  if (!userId)        { setStatus("Please login first."); return; }
  if (!cart.length)   { setStatus("Cart is empty. (TC-O2)"); return; }

  // TC-O11: ensure all items have productId
  for (const item of cart) {
    if (!item.productId) { setStatus("Item missing productId. (TC-O11)"); return; }
    if (item.quantity <= 0) { setStatus("Quantity must be > 0. (TC-O5)"); return; }
  }

  // Price is NOT sent — backend fetches it (TC-O8)
  const items = cart.map(c => ({ productId: c.productId, quantity: c.quantity }));

  setStatus("Placing order…");
  document.getElementById("placeOrderBtn").disabled = true;

  try {
    const res  = await post("/orders", { userId, items });
    const text = await res.text();

    if (!res.ok) { setStatus("Order failed: " + text); return; }

    const order = JSON.parse(text);
    setStatus(`Order #${order.id} placed! Total: ₹${order.totalAmount}`);
    cart = [];
    renderCartTable();
    renderCartBadge();
    loadProducts();
    loadOrders();
    showUserTab("Orders");
  } catch (e) {
    setStatus("Network error: " + e.message);
  } finally {
    document.getElementById("placeOrderBtn").disabled = false;
  }
}

// ===================================================================
// LOAD ORDERS — GET /orders/user/{userId}  (TC-O10)
// ===================================================================
async function loadOrders() {
  if (!userId) return;
  try {
    const res = await fetch(BASE + "/orders/user/" + userId);
    if (!res.ok) throw new Error(await res.text());
    const orders = await res.json();
    renderOrders(orders);
  } catch (e) {
    setStatus("Error loading orders: " + e.message);
  }
}

function renderOrders(orders) {
  const tbody = document.getElementById("orderTbody");
  if (!tbody) return;

  if (!orders || !orders.length) {
    tbody.innerHTML = `<tr class="no-data"><td colspan="4">No orders yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = [...orders].reverse().map(o => {
    const items = (o.items || []).map(i => {
      const p = products.find(x => x.id === i.productId);
      return `${p ? esc(p.name) : "Product #" + i.productId} ×${i.quantity} @ ₹${i.price}`;
    }).join("; ") || "—";

    return `<tr>
      <td>#${o.id}</td>
      <td style="font-size:12px">${items}</td>
      <td>₹${num(o.totalAmount)}</td>
      <td><span class="tag tag-placed">${o.status}</span></td>
    </tr>`;
  }).join("");
}

// ===================================================================
// USER LOOKUP
// ===================================================================

// User view lookup (TC-U3, TC-U4)
async function lookupUser() {
  const id  = document.getElementById("lookupId").value;
  if (!id) { setStatus("Enter a User ID."); return; }
  const div = document.getElementById("lookupResult");
  show(div.id); div.textContent = "Fetching…";

  try {
    const res  = await fetch(BASE + "/users/" + id);
    const text = await res.text();
    if (!res.ok || !text || text === "null") {
      div.innerHTML = `<span class="error">TC-U4: User #${id} not found (${res.status}).</span>`;
      return;
    }
    const u = JSON.parse(text);
    div.innerHTML = userCard(u);
  } catch (e) {
    div.innerHTML = `<span class="error">Error: ${e.message}</span>`;
  }
}

// Admin user lookup
async function adminLookupUser() {
  const id  = document.getElementById("adminLookupId").value;
  if (!id) { setStatus("Enter a User ID."); return; }
  const div = document.getElementById("adminLookupResult");
  show(div.id); div.textContent = "Fetching…";

  try {
    const res  = await fetch(BASE + "/users/" + id);
    const text = await res.text();
    if (!res.ok || !text || text === "null") {
      div.innerHTML = `<span class="error">TC-U4: User #${id} not found (${res.status}).</span>`;
      return;
    }
    const u = JSON.parse(text);
    div.innerHTML = userCard(u);
  } catch (e) {
    div.innerHTML = `<span class="error">Error: ${e.message}</span>`;
  }
}

function userCard(u) {
  return `<table>
    <tr><th>ID</th><td>#${u.id}</td></tr>
    <tr><th>Name</th><td>${esc(u.name)}</td></tr>
    <tr><th>Email</th><td>${esc(u.email)}</td></tr>
  </table>`;
}

// ===================================================================
// ORDER LOOKUP (Admin)
// ===================================================================

// GET /orders/{id}  (TC-O9)
async function fetchOrderById() {
  const id  = document.getElementById("orderById").value;
  if (!id) { setStatus("Enter an Order ID."); return; }
  const div = document.getElementById("orderByIdResult");
  show(div.id); div.textContent = "Fetching…";

  try {
    const res  = await fetch(BASE + "/orders/" + id);
    const text = await res.text();
    if (!res.ok) { div.innerHTML = `<span class="error">TC-O9: ${text}</span>`; return; }
    const o = JSON.parse(text);
    const items = (o.items || []).map(i =>
      `Product #${i.productId} ×${i.quantity} @ ₹${i.price}`
    ).join("<br/>");
    div.innerHTML = `<table>
      <tr><th>Order ID</th><td>#${o.id}</td></tr>
      <tr><th>User ID</th><td>${o.userId}</td></tr>
      <tr><th>Total</th><td>₹${num(o.totalAmount)}</td></tr>
      <tr><th>Status</th><td><span class="tag tag-placed">${o.status}</span></td></tr>
      <tr><th>Items</th><td style="font-size:12px">${items || "—"}</td></tr>
    </table>`;
  } catch (e) {
    div.innerHTML = `<span class="error">Error: ${e.message}</span>`;
  }
}

// GET /orders/user/{userId}  (TC-O10)
async function fetchOrdersByUser() {
  const uid = document.getElementById("orderByUser").value;
  if (!uid) { setStatus("Enter a User ID."); return; }
  const div = document.getElementById("orderByUserResult");
  show(div.id); div.textContent = "Fetching…";

  try {
    const res    = await fetch(BASE + "/orders/user/" + uid);
    const text   = await res.text();
    if (!res.ok) { div.innerHTML = `<span class="error">${text}</span>`; return; }
    const orders = JSON.parse(text);
    if (!orders.length) { div.textContent = `No orders for user #${uid}.`; return; }
    div.innerHTML = `<table>
      <thead><tr><th>Order ID</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>${orders.map(o => `
        <tr>
          <td>#${o.id}</td>
          <td style="font-size:12px">${(o.items||[]).map(i=>`#${i.productId}×${i.quantity}`).join(", ")||"—"}</td>
          <td>₹${num(o.totalAmount)}</td>
          <td><span class="tag tag-placed">${o.status}</span></td>
        </tr>`).join("")}
      </tbody>
    </table>`;
  } catch (e) {
    div.innerHTML = `<span class="error">Error: ${e.message}</span>`;
  }
}

// ===================================================================
// UTILITIES
// ===================================================================
function val(id) { return document.getElementById(id).value.trim(); }
function clearFields(...ids) { ids.forEach(id => { document.getElementById(id).value = ""; }); }
function esc(s) {
  return String(s || "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function num(n) { return Number(n).toLocaleString("en-IN"); }

async function post(path, body) {
  return fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const activeTab = document.querySelector(".auth-panel.active");
    // Login shortcut
    if (!document.getElementById("tabLogin").classList.contains("hidden")) {
      if (document.activeElement.id === "loginPassword") loginUser();
    }
    if (!document.getElementById("tabRegister").classList.contains("hidden")) {
      if (document.activeElement.id === "regPassword") registerUser();
    }
  }
  if (e.key === "Escape") {
    closeQtyDialog();
  }
});

// Close qty dialog by clicking overlay background
document.getElementById("qtyDialog").addEventListener("click", function(e) {
  if (e.target === this) closeQtyDialog();
});
