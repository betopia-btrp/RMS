# 🍽️ RMS — Restaurant Management System

A full-stack Restaurant Management System built with **Next.js** (frontend) and **Laravel** (backend), powered by **PostgreSQL**.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (React) |
| Backend | Laravel (PHP) |
| Database | PostgreSQL |

---

## ⚙️ Requirements

Make sure the following are installed before getting started:

- [Node.js](https://nodejs.org/) v18+
- npm
- [PHP](https://www.php.net/) v8.3+
- [Composer](https://getcomposer.org/)
- [PostgreSQL](https://www.postgresql.org/) (psql)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/betopia-btrp/RMS.git
cd RMS
```

---

### 2. Backend Setup (Laravel)

```bash
# Navigate to backend directory
cd rms-be

# Install PHP dependencies
composer install

# Create an .env file , take it from .env example

# Run migrations and seed the database
php artisan migrate:fresh --seed

# Start the backend server
php artisan serve
```

> ⚠️ **Warning:** `migrate:fresh --seed` will **completely reset the database** and delete all existing data.

🌐 Backend runs at: `http://127.0.0.1:8000`

---

### 3. Frontend Setup (Next.js)

```bash
# Navigate to frontend directory
cd ../rms-fe

# Install Node dependencies
npm install

# Start the development server
npm run dev
```

🌐 Frontend runs at: `http://localhost:3000`

---

## 📋 Setup Flow Summary

```
1. composer install          → Install backend dependencies
2. php artisan migrate:fresh --seed  → Setup & seed the database
3. php artisan serve         → Start backend server
4. npm install               → Install frontend dependencies
5. npm run dev               → Start frontend server
6. Open http://localhost:3000 in your browser
```

---

## 📡 API Endpoints

### 🔓 Public Routes *(No Authentication Required)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/menu` | Get the current menu |

---

### 🧑‍🍽️ Staff Routes *(Roles: ADMIN, WAITER, KITCHEN)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Login for Admin, Waiter, and Kitchen staff |

---

## 📁 Project Structure

```
RMS/
├── rms-fe/     # Next.js Frontend
└── rms-be/     # Laravel Backend
```

---

## 📄 License

