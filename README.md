# PantryBoard — Food Expiry & Nutrition Tracking System

A full-stack web application for tracking food expiry dates and monitoring daily nutrition intake. Built with **MySQL**, **Node.js + Express**, and a vanilla **HTML/CSS/JavaScript** frontend.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

- Real-time expiry tracking with three states: **Fresh**, **Near Expiry**, **Expired**
- Daily nutrition goal tracking (calories, protein, carbs, fat, fiber, sugar, sodium)
- 7-day calorie trend chart rendered as inline SVG
- Smart food recommendations based on remaining macro gaps
- Drag-and-drop pantry board with per-item nutrition and batch details
- Add new foods, users, and consumption logs — all persisted to MySQL
- Simulated "Next Day" to test expiry state transitions

---

## Tech Stack

| Layer     | Technology                       |
|-----------|----------------------------------|
| Database  | MySQL 8.x                        |
| Backend   | Node.js, Express, mysql2, dotenv |
| Frontend  | Vanilla HTML, CSS, JavaScript    |
| Runtime   | Node.js v18 or newer             |

---

## Project Structure

```
pantryboard/
├── package.json
├── .env
├── server.js
├── database.sql
├── README.md
└── public/
    └── PantryBoard.html
```

---

## Prerequisites

- **Node.js** v18 or newer — [nodejs.org](https://nodejs.org/)
- **MySQL Server** 8.x — [dev.mysql.com/downloads](https://dev.mysql.com/downloads/)
- A web browser (Chrome, Firefox, Edge, Safari)
- A terminal — PowerShell on Windows, bash on Linux/macOS

Verify installations:

```bash
node --version     # v18.x or newer
npm --version
mysql --version    # 8.x
```

---

## Setup Instructions

### 1. Place the project files

Ensure the folder structure matches the [Project Structure](#project-structure) section above.

### 2. Install Node dependencies

```bash
npm install
```

This installs `express`, `mysql2`, and `dotenv`.

### 3. Configure the database connection

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=food_expiry_nutrition_db
DB_PORT=3306
PORT=8000
```

Replace `your_mysql_password` with your MySQL root password. If your root user has no password, leave the value empty.

### 4. Start MySQL Server

**Windows (PowerShell):**

```powershell
Start-Service MySQL80
```

**Linux:**

```bash
sudo systemctl start mysql
```

**macOS:**

```bash
brew services start mysql
```

Verify the server is reachable:

```bash
mysql -u root -p -e "SELECT VERSION();"
```

### 5. Import the database schema and seed data

**Linux / macOS:**

```bash
mysql -u root -p < database.sql
```

**Windows PowerShell:**

```powershell
cmd /c "mysql -u root -pPASSWORD < database.sql"
```

Or, using pure PowerShell syntax:

```powershell
Get-Content .\database.sql | mysql -u root -p
```

This creates the database `food_expiry_nutrition_db` with all 10 tables and sample records.

Verify the import:

```bash
mysql -u root -p -e "USE food_expiry_nutrition_db; SHOW TABLES; SELECT COUNT(*) AS foods FROM Food_Item;"
```

Expected: 10 tables and `foods = 10`.

### 6. Start the server

```bash
npm start
```

Expected output:

```
PantryBoard running at http://localhost:8000
```

### 7. Open the app

Visit **<http://localhost:8000/PantryBoard.html>** in your browser.

---

## Verifying the Setup

- The left sidebar loads users from MySQL
- The right sidebar loads pantry items from MySQL
- Clicking a food item places a card on the board with expiry status and nutrition facts
- Adding a new item and then running the SQL below should show your row:

```bash
mysql -u root -p -e "USE food_expiry_nutrition_db; SELECT * FROM Food_Item ORDER BY food_id DESC LIMIT 1;"
```

---

## Database Schema

| Table             | Purpose                                      |
|-------------------|----------------------------------------------|
| `User`            | Account details and body metrics             |
| `Category`        | Food categories with display colors          |
| `Food_Item`       | Food catalog                                 |
| `Nutrition`       | Nutrition facts per food                     |
| `Food_Batch`      | Per-user batches with expiry dates           |
| `Consumption`     | Meal log entries                             |
| `Reminder`        | Expiry / consumption reminders               |
| `Diet_Goal`       | User diet goals                              |
| `Nutrition_Goal`  | Daily nutrient targets per user              |

Full DDL and seed data are in `database.sql`.

---

## API Reference

| Method | Endpoint                 | Purpose                            |
|--------|--------------------------|------------------------------------|
| GET    | `/api/bootstrap`         | Full initial data load             |
| POST   | `/api/foods`             | Add new food + nutrition + batch   |
| POST   | `/api/users`             | Add new user + diet + nutrition goals |
| POST   | `/api/consumption`       | Log a serving                      |
| DELETE | `/api/consumption/:id`   | Remove a logged serving            |
| POST   | `/api/advance-day`       | Sync batch statuses with today     |
| GET    | `/api/health`            | Database health check              |

---

## License

For academic and educational use only.