const salesMoney = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const salesElements = {
  clock: document.querySelector("#live-clock"),
  orderCount: document.querySelector("#order-count"),
  groups: document.querySelector("#sales-groups"),
  empty: document.querySelector("#sales-empty"),
  error: document.querySelector("#sales-error"),
  refresh: document.querySelector("#refresh-orders"),
  updated: document.querySelector("#last-updated"),
  monthCaption: document.querySelector("#month-caption"),
  yearCaption: document.querySelector("#year-caption"),
  metrics: {
    today: document.querySelector("#metric-today"),
    week: document.querySelector("#metric-week"),
    month: document.querySelector("#metric-month"),
    year: document.querySelector("#metric-year"),
  },
};

let isRefreshing = false;

function formatSalesMoney(value) {
  return salesMoney.format(Number(value) || 0);
}

function updateClock() {
  const now = new Date();
  salesElements.clock.textContent = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);
  salesElements.monthCaption.textContent = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  salesElements.yearCaption.textContent = `January – December ${now.getFullYear()}`;
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateTitle(date, today) {
  const dateKey = localDateKey(date);
  if (dateKey === localDateKey(today)) return `Today · ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (dateKey === localDateKey(yesterday)) return `Yesterday · ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
  return date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function makeCell(tagName, className, text) {
  const cell = document.createElement(tagName);
  if (className) cell.className = className;
  cell.textContent = text;
  return cell;
}

function createOrderTable(orders) {
  const wrapper = document.createElement("div");
  wrapper.className = "sales-table-wrap";
  const table = document.createElement("table");
  table.className = "sales-table";
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["TIME", "ORDER NUMBER", "TABLE / CUSTOMER ID", "DISHES / ITEMS ORDERED", "TOTAL AMOUNT"].forEach((heading) => {
    headerRow.append(makeCell("th", "", heading));
  });
  thead.append(headerRow);

  const tbody = document.createElement("tbody");
  orders.forEach((order) => {
    const row = document.createElement("tr");
    const createdAt = new Date(order.createdAt);
    const timeText = Number.isNaN(createdAt.getTime())
      ? "—"
      : createdAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    row.append(makeCell("td", "order-time", timeText));
    row.append(makeCell("td", "order-number", order.orderNumber));
    row.append(makeCell("td", "order-table", order.tableNumber));
    const itemsText = order.items.length
      ? order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")
      : "—";
    row.append(makeCell("td", "order-items", itemsText));
    row.append(makeCell("td", "order-total", formatSalesMoney(order.total)));
    tbody.append(row);
  });

  table.append(thead, tbody);
  wrapper.append(table);
  return wrapper;
}

function renderOrders(rawOrders) {
  const orders = rawOrders
    .map(window.COMSData.normalizeOrder)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const groups = new Map();

  orders.forEach((order) => {
    const date = new Date(order.createdAt);
    const key = Number.isNaN(date.getTime()) ? "unknown-date" : localDateKey(date);
    if (!groups.has(key)) groups.set(key, { date, orders: [] });
    groups.get(key).orders.push(order);
  });

  const today = new Date();
  const fragment = document.createDocumentFragment();
  groups.forEach(({ date, orders: dateOrders }, key) => {
    const group = document.createElement("section");
    group.className = "sales-date-group";
    const heading = document.createElement("div");
    heading.className = "sales-date-heading";
    const title = document.createElement("h3");
    title.textContent = key === "unknown-date" ? "Date unavailable" : getDateTitle(date, today);
    const dailyRevenue = dateOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const summary = document.createElement("span");
    summary.textContent = `${dateOrders.length} ${dateOrders.length === 1 ? "order" : "orders"} · ${formatSalesMoney(dailyRevenue)}`;
    heading.append(title, summary);
    group.append(heading, createOrderTable(dateOrders));
    fragment.append(group);
  });

  salesElements.groups.replaceChildren(fragment);
  salesElements.groups.hidden = orders.length === 0;
  salesElements.empty.hidden = orders.length > 0;
  salesElements.orderCount.textContent = `${orders.length} ${orders.length === 1 ? "order" : "orders"}`;
  return orders;
}

function renderMetrics(rawMetrics, orders) {
  rawMetrics = rawMetrics || {};
  const localMetrics = window.COMSData.calculateMetrics(orders);
  const metrics = {
    today: rawMetrics.today ?? rawMetrics.todaySales ?? rawMetrics.todayRevenue ?? rawMetrics.todayTotalSales ?? localMetrics.today,
    week: rawMetrics.week ?? rawMetrics.weekSales ?? rawMetrics.weekRevenue ?? rawMetrics.weekTotalSales ?? localMetrics.week,
    month: rawMetrics.month ?? rawMetrics.monthSales ?? rawMetrics.monthRevenue ?? rawMetrics.monthTotalSales ?? localMetrics.month,
    year: rawMetrics.year ?? rawMetrics.yearSales ?? rawMetrics.yearRevenue ?? rawMetrics.yearTotalSales ?? localMetrics.year,
  };

  Object.entries(metrics).forEach(([period, amount]) => {
    salesElements.metrics[period].textContent = formatSalesMoney(amount);
  });
}

async function refreshSales() {
  if (isRefreshing) return;
  isRefreshing = true;
  salesElements.refresh.disabled = true;
  salesElements.error.hidden = true;
  salesElements.error.textContent = "";

  try {
    const orders = renderOrders(await window.COMSData.getSalesOrders());
    let metrics;
    try {
      metrics = await window.COMSData.getSalesMetrics(orders);
    } catch (error) {
      console.warn("Sales metrics endpoint unavailable; calculating from orders:", error);
      metrics = window.COMSData.calculateMetrics(orders);
    }
    renderMetrics(metrics, orders);
    salesElements.updated.textContent = `Last updated ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`;
  } catch (error) {
    console.error("Could not load COMS sales:", error);
    salesElements.error.textContent = "Could not load sales. Check the server connection and try again.";
    salesElements.error.hidden = false;
  } finally {
    isRefreshing = false;
    salesElements.refresh.disabled = false;
  }
}

salesElements.refresh.addEventListener("click", refreshSales);
window.addEventListener("storage", (event) => {
  if (event.key === window.COMSData.salesStorageKey) refreshSales();
});

updateClock();
window.setInterval(updateClock, 1000);
refreshSales();
if (window.COMSData.apiBaseUrl) window.setInterval(refreshSales, 30000);
