# COMS — Restaurant Order Management

A responsive, framework-free front-end for restaurant order entry and sales tracking. It includes menu filters, search, table/takeaway selection, quantity controls, date-wise order tables, and today/week/month/year revenue summaries.

## Run it

Run the Spring Boot backend on port `8080`, then serve this folder on port `5500` (for example, use VS Code Live Server on `D:\Projects\index.html`) and open `http://localhost:5500`. The order screen loads dishes from `GET /api/menu`, saves orders with `POST /api/orders`, and the Sales Tracker reads `GET /api/sales/orders` and `GET /api/sales/metrics`. Use the **Sales tracker** link in the header to open the log.

## Connect Spring Boot

`API_BASE_URL` in `data-service.js` is set to `http://localhost:8080`. The Place Order button sends a `POST` request to `/api/orders` with JSON shaped like this:

```json
{
  "tableNumber": "Table 04",
  "orderType": "DINE_IN",
  "items": [
    {
      "menuItemId": 2,
      "name": "Paneer Tikka",
      "quantity": 2,
      "unitPrice": 229,
      "lineTotal": 458
    }
  ],
  "subtotal": 458,
  "total": 458,
  "currency": "INR",
  "status": "PLACED"
}
```

The backend calculates order prices from the menu table; it does not trust the prices sent by the browser. The Sales Tracker reads database-backed orders and revenue metrics, refreshes automatically every 30 seconds, and has a manual refresh button. When the front end and API run on different origins, the Spring Boot server must allow the front-end origin through CORS.

Tax and discounts are not included yet, so the displayed total equals the item subtotal. Local date grouping and week totals use the browser's timezone, and the week starts on Monday.

## Cloud deployment configuration

The front end reads its Spring Boot API address from `config.js`. Keep the local value for Live Server. Before publishing to Vercel, set `apiBaseUrl` to the backend's public HTTPS URL.

For the backend, local database credentials are kept in the ignored `backend/coms-backend/src/main/resources/application-local.properties` file. The default `local` profile loads that file for development. On the cloud VM, activate the `prod` profile and set these environment variables:

```text
SPRING_PROFILES_ACTIVE=prod
PORT=8080
DB_URL=jdbc:mysql://<mysql-host>:3306/coms_db
DB_USERNAME=<database-user>
DB_PASSWORD=<database-password>
CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>
JPA_DDL_AUTO=none
```

Use the exact Vercel origin in `CORS_ALLOWED_ORIGINS`; add additional trusted origins as a comma-separated list if needed. Keep the database endpoint reachable from the backend VM only, and never commit real passwords or private keys.
