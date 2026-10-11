// Set apiBaseUrl in config.js for the environment where this front end is hosted.
const API_BASE_URL = String(window.COMS_CONFIG?.apiBaseUrl ?? "http://localhost:8080").trim();
const MENU_API_URL = API_BASE_URL;
const SALES_STORAGE_KEY = "coms.sales.orders.v1";

function readLocalOrders() {
  try {
    const saved = JSON.parse(localStorage.getItem(SALES_STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.error("Could not read saved COMS orders:", error);
    return [];
  }
}

function getCreatedAt(order) {
  return order.createdAt || order.orderedAt || order.orderDate || order.date || order.timestamp || new Date().toISOString();
}

function getOrderAmount(order) {
  return Number(order.total ?? order.totalAmount ?? order.orderAmount ?? order.amount ?? 0) || 0;
}

function normalizeOrder(order) {
  const orderId = order.orderNumber ?? order.orderNo ?? order.id ?? order.orderId ?? "—";
  const orderNumber = String(orderId).startsWith("#")
    ? String(orderId)
    : `#ORD-${String(orderId).replace(/^ORD-/, "")}`;
  const sourceItems = Array.isArray(order.items) ? order.items : Array.isArray(order.orderItems) ? order.orderItems : [];

  return {
    ...order,
    orderNumber,
    tableNumber: order.tableNumber ?? order.table ?? order.customerId ?? order.customerName ?? "—",
    createdAt: getCreatedAt(order),
    total: getOrderAmount(order),
    items: sourceItems.map((item) => ({
      name: item.name ?? item.dishName ?? item.menuItemName ?? "Menu item",
      quantity: Number(item.quantity ?? item.qty ?? 1) || 1,
      unitPrice: Number(item.unitPrice ?? item.price ?? 0) || 0,
      lineTotal: Number(item.lineTotal ?? item.subtotal ?? 0) || 0,
    })),
  };
}

function getNextLocalOrderNumber(orders) {
  const largestNumber = orders.reduce((largest, order) => {
    const match = String(order.orderNumber ?? order.orderNo ?? order.id ?? "").match(/(\d+)$/);
    return match ? Math.max(largest, Number(match[1])) : largest;
  }, 1000);
  return largestNumber + 1;
}

async function parseResponse(response) {
  if (!response.ok) throw new Error(`Server returned ${response.status}`);
  return response.json().catch(() => ({}));
}

async function getMenuItems() {
  const response = await fetch(`${MENU_API_URL.replace(/\/$/, "")}/api/menu`, {
    headers: { Accept: "application/json" },
  });
  const result = await parseResponse(response);
  const items = Array.isArray(result) ? result : result?.items ?? result?.menuItems ?? [];

  return items.map((item) => ({
    id: item.id ?? item.menuItemId,
    name: item.name ?? item.itemName,
    category: item.category ?? "Other",
    price: Number(item.price ?? 0),
    description: item.description ?? "",
  }));
}

async function createOrder(payload) {
  if (API_BASE_URL.trim()) {
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await parseResponse(response);
    const fallbackNumber = Date.now();
    return normalizeOrder({
      ...payload,
      ...result,
      id: result.id ?? result.orderId ?? fallbackNumber,
      orderNumber: result.orderNumber ?? result.orderNo,
      createdAt: result.createdAt ?? result.orderDate ?? new Date().toISOString(),
      total: result.total ?? result.totalAmount ?? payload.total,
    });
  }

  const existingOrders = readLocalOrders();
  const sequence = getNextLocalOrderNumber(existingOrders);
  const savedOrder = normalizeOrder({
    ...payload,
    id: sequence,
    orderNumber: `#ORD-${sequence}`,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify([savedOrder, ...existingOrders]));
  return savedOrder;
}

async function getSalesOrders() {
  if (!API_BASE_URL.trim()) return readLocalOrders().map(normalizeOrder);

  const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/api/sales/orders`, {
    headers: { Accept: "application/json" },
  });
  const result = await parseResponse(response);
  const orders = Array.isArray(result) ? result : result?.orders ?? result?.content ?? [];
  return orders.map(normalizeOrder);
}

function calculateMetrics(orders, now = new Date()) {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  const mondayOffset = (todayStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - mondayOffset);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const totals = { today: 0, week: 0, month: 0, year: 0 };

  orders.forEach((rawOrder) => {
    const order = normalizeOrder(rawOrder);
    const createdAt = new Date(order.createdAt);
    if (Number.isNaN(createdAt.getTime()) || createdAt > now) return;
    const amount = getOrderAmount(order);
    if (createdAt >= todayStart) totals.today += amount;
    if (createdAt >= weekStart) totals.week += amount;
    if (createdAt >= monthStart) totals.month += amount;
    if (createdAt >= yearStart) totals.year += amount;
  });

  return totals;
}

async function getSalesMetrics(orders = []) {
  if (!API_BASE_URL.trim()) return calculateMetrics(orders);
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/api/sales/metrics`, {
    headers: { Accept: "application/json" },
  });
  return parseResponse(response);
}

window.COMSData = Object.freeze({
  salesStorageKey: SALES_STORAGE_KEY,
  menuApiUrl: MENU_API_URL,
  apiBaseUrl: API_BASE_URL,
  getMenuItems,
  createOrder,
  getSalesOrders,
  getSalesMetrics,
  calculateMetrics,
  normalizeOrder,
});
