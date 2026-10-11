let menuItems = [];
let isMenuLoading = true;
let menuLoadFailed = false;

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const cart = new Map();
let activeCategory = "All";
let isSubmitting = false;
let toastTimer;

const elements = {
  menuGrid: document.querySelector("#menu-grid"),
  menuCount: document.querySelector("#menu-count"),
  allCategoryCount: document.querySelector("#all-category-count"),
  menuLoading: document.querySelector("#menu-loading"),
  menuLoadError: document.querySelector("#menu-load-error"),
  noResults: document.querySelector("#no-results"),
  search: document.querySelector("#menu-search"),
  categoryList: document.querySelector("#category-list"),
  tableSelect: document.querySelector("#table-select"),
  serviceType: document.querySelector("#service-type"),
  cartItems: document.querySelector("#cart-items"),
  emptyCart: document.querySelector("#empty-cart"),
  cartCount: document.querySelector("#cart-count"),
  clearCart: document.querySelector("#clear-cart"),
  subtotal: document.querySelector("#subtotal"),
  total: document.querySelector("#total"),
  buttonTotal: document.querySelector("#button-total"),
  placeOrder: document.querySelector("#place-order"),
  toast: document.querySelector("#toast"),
};

function formatMoney(amount) {
  return money.format(amount);
}

function createElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderMenu() {
  const query = elements.search.value.trim().toLocaleLowerCase();
  const visibleItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesQuery = !query || `${item.name} ${item.category} ${item.description}`.toLocaleLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  elements.menuGrid.replaceChildren();
  const fragment = document.createDocumentFragment();

  visibleItems.forEach((item) => {
    const card = createElement("article", "menu-card");
    const body = createElement("div", "dish-body");
    const tag = createElement("span", "dish-tag", item.category);
    const name = createElement("h3", "dish-name", item.name);
    const description = createElement("p", "dish-description", item.description);
    const bottom = createElement("div", "dish-bottom");
    const price = createElement("span", "dish-price", formatMoney(item.price));
    const addButton = createElement("button", "add-button");
    addButton.type = "button";
    addButton.dataset.addItem = item.id;
    addButton.setAttribute("aria-label", `Add ${item.name} to order`);
    addButton.append(createElement("span", "", "+"), document.createTextNode(" Add"));
    bottom.append(price, addButton);
    body.append(tag, name, description, bottom);
    card.append(body);
    fragment.append(card);
  });

  elements.menuGrid.append(fragment);
  elements.menuCount.textContent = `${visibleItems.length} ${visibleItems.length === 1 ? "item" : "items"}`;
  elements.allCategoryCount.textContent = String(menuItems.length);
  elements.menuLoading.hidden = !isMenuLoading;
  elements.menuLoadError.hidden = !menuLoadFailed;
  elements.noResults.hidden = isMenuLoading || menuLoadFailed || visibleItems.length > 0;
  elements.menuGrid.hidden = isMenuLoading || menuLoadFailed || visibleItems.length === 0;
}

async function loadMenu() {
  isMenuLoading = true;
  menuLoadFailed = false;
  renderMenu();

  try {
    menuItems = await window.COMSData.getMenuItems();
  } catch (error) {
    console.error("Could not load the menu from the API:", error);
    menuLoadFailed = true;
  } finally {
    isMenuLoading = false;
    renderMenu();
  }
}

function getCartSummary() {
  let quantity = 0;
  let subtotal = 0;
  cart.forEach((entry) => {
    quantity += entry.quantity;
    subtotal += entry.item.price * entry.quantity;
  });
  return { quantity, subtotal };
}

function renderCart() {
  const fragment = document.createDocumentFragment();

  cart.forEach(({ item, quantity }) => {
    const row = createElement("li", "cart-item");
    const main = createElement("div", "cart-item-main");
    const copy = createElement("div", "cart-item-copy");
    copy.append(createElement("strong", "", item.name), createElement("span", "", `${formatMoney(item.price)} each`));
    main.append(copy);

    const side = createElement("div", "cart-item-side");
    side.append(createElement("span", "cart-item-total", formatMoney(item.price * quantity)));
    const controls = createElement("div", "quantity-control");
    controls.setAttribute("aria-label", `Quantity for ${item.name}`);
    const decrease = createElement("button", "", "−");
    decrease.type = "button";
    decrease.dataset.cartAction = "decrease";
    decrease.dataset.itemId = item.id;
    decrease.setAttribute("aria-label", `Remove one ${item.name}`);
    const count = createElement("span", "", String(quantity));
    count.setAttribute("aria-live", "polite");
    const increase = createElement("button", "", "+");
    increase.type = "button";
    increase.dataset.cartAction = "increase";
    increase.dataset.itemId = item.id;
    increase.setAttribute("aria-label", `Add one ${item.name}`);
    controls.append(decrease, count, increase);
    side.append(controls);
    row.append(main, side);
    fragment.append(row);
  });

  elements.cartItems.replaceChildren(fragment);
  const { quantity, subtotal } = getCartSummary();
  elements.emptyCart.hidden = cart.size > 0;
  elements.cartItems.hidden = cart.size === 0;
  elements.cartCount.textContent = String(quantity);
  elements.subtotal.textContent = formatMoney(subtotal);
  elements.total.textContent = formatMoney(subtotal);
  elements.buttonTotal.textContent = formatMoney(subtotal);
  elements.placeOrder.disabled = cart.size === 0 || isSubmitting;
  elements.placeOrder.querySelector("span:first-child").textContent = isSubmitting ? "Sending order..." : "Place order";
  elements.clearCart.disabled = cart.size === 0;
}

function updateTableLabel() {
  const selected = elements.tableSelect.value;
  elements.serviceType.textContent = selected === "Takeaway" ? "TAKEAWAY" : "DINE IN";
}

function showToast(message, isError = false) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", isError);
  elements.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 3200);
}

function addToCart(itemId) {
  const item = menuItems.find((entry) => String(entry.id) === String(itemId));
  if (!item) return;
  const existing = cart.get(itemId);
  cart.set(itemId, { item, quantity: (existing?.quantity || 0) + 1 });
  renderCart();
}

function changeQuantity(itemId, amount) {
  const entry = cart.get(itemId);
  if (!entry) return;
  const quantity = entry.quantity + amount;
  if (quantity <= 0) cart.delete(itemId);
  else cart.set(itemId, { ...entry, quantity });
  renderCart();
}

function createOrderPayload() {
  const { subtotal } = getCartSummary();
  return {
    tableNumber: elements.tableSelect.value,
    orderType: elements.tableSelect.value === "Takeaway" ? "TAKEAWAY" : "DINE_IN",
    items: Array.from(cart.values(), ({ item, quantity }) => ({
      menuItemId: item.id,
      name: item.name,
      quantity,
      unitPrice: item.price,
      lineTotal: item.price * quantity,
    })),
    subtotal,
    total: subtotal,
    currency: "INR",
    status: "PLACED",
  };
}

async function submitOrder() {
  if (!cart.size || isSubmitting) return;
  const payload = createOrderPayload();
  isSubmitting = true;
  renderCart();

  try {
    const order = await window.COMSData.createOrder(payload);
    cart.clear();
    renderCart();
    showToast(`${order.orderNumber} sent to the kitchen.`);
  } catch (error) {
    console.error("Could not place the order:", error);
    showToast("Order could not be sent. Please check the server and try again.", true);
  } finally {
    isSubmitting = false;
    renderCart();
  }
}

elements.menuGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-item]");
  if (button) addToCart(button.dataset.addItem);
});

elements.cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;
  changeQuantity(button.dataset.itemId, button.dataset.cartAction === "increase" ? 1 : -1);
});

elements.categoryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  elements.categoryList.querySelectorAll("[data-category]").forEach((chip) => {
    const selected = chip === button;
    chip.classList.toggle("is-active", selected);
    chip.setAttribute("aria-pressed", String(selected));
  });
  renderMenu();
});

elements.search.addEventListener("input", renderMenu);
elements.tableSelect.addEventListener("change", updateTableLabel);
elements.clearCart.addEventListener("click", () => {
  cart.clear();
  renderCart();
});
elements.placeOrder.addEventListener("click", submitOrder);

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    elements.search.focus();
  }
  if (event.key === "Escape" && document.activeElement === elements.search) {
    elements.search.value = "";
    renderMenu();
    elements.search.blur();
  }
});

loadMenu();
renderCart();
updateTableLabel();
