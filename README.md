# Cosmetic Inventory Management System (Victory Cosmetics)

A modern, full-stack Cosmetic Inventory Management System built with Angular 22, Tailwind CSS, NestJS, and Vercel Serverless API.

## Features
- **Authentication & RBAC**: Admin (Shop Owner) and Attendant roles.
- **Product & Category Management**: Full catalog tracking, brands, stock levels, reorder thresholds, and expiration dates.
- **Point of Sale (POS)**: Fast checkout, real-time stock validation, automated sale numbering, and receipt generation.
- **Purchases & Suppliers**: Restock recording with automated weighted/latest cost recalculation.
- **Reporting & Analytics**:
  - Live Dashboard (low stock alerts, expiring products, today's sales).
  - Detailed Inventory evaluation with total stock valuation.
  - Date-filtered sales and purchases breakdown.

## Default Credentials
| Role | Username | Password |
|---|---|---|
| **Admin** (Shop Owner) | `admin` | `ChangeMe123!` |
| **Attendant** (Sales) | `attendant` | `Attendant123!` |

## Project Structure
- `frontend/` - Angular 22 SPA with Tailwind CSS
- `backend/` - NestJS REST API with MongoDB / Mongoose
- `api/` - Vercel Serverless Function entry point for instant cloud deployment
- `docs/` - Complete REST API contract specification

## Local Development
```bash
# Install frontend & build
npm --prefix frontend install
npm --prefix frontend run build

# Start backend
npm --prefix backend install
npm --prefix backend run start:dev
```
