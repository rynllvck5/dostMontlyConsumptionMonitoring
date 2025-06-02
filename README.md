# DOST Monthly Consumption Monitoring System

## Version 2.0.0 (May 30, 2025)

A major update to the DOST Monthly Consumption Monitoring System, introducing an inventory system for electric-consuming items and various improvements. This guide will help pmos upgrade from version 1.0.0 to 2.0.0.

---

## What's New in 2.0.0

### Major Features
- **Inventory System for Electric-Consuming Items**: Track and manage items that consume electricity, including quantity, kilowatts, and images.
- **Profile Picture for Preventive Maintenance Officer (PMO)s**: Preventive Maintenance Officer (PMO)s can now have profile pictures.
- **Database Schema Changes**: New tables and columns to support inventory and images.
- **Bug Fixes & UI Improvements**: Enhanced pmo experience and reliability.

### Database Changes
- Added `profile_picture` column to `pmos` table.
- New `consumption_items` table for item inventory.
- New `item_images` table for associating images with items.
- Optional: `image_url` column in `consumption_items`.

---

## Upgrade Guide (from v1.0.0 to v2.0.0)

### 1. Update Your Codebase
- Pull the latest code from the repository:
  ```
  git pull origin main
  ```
- Ensure both `backend` and `frontend` dependencies are up to date:
  ```
  cd backend
  npm install
  cd ../frontend
  npm install
  ```

### 2. Database Migration
#### a. Backup Your Database
Always backup your current data before running migrations.

#### b. Apply Migration Scripts
Run the following SQL scripts on your PostgreSQL database (in order):

**Add profile picture to pmos:**
```sql
ALTER TABLE pmos ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255) NOT NULL DEFAULT 'default-profile.jpg';
```

**Add inventory system:**
```sql
-- Create the consumption_items table
CREATE TABLE IF NOT EXISTS consumption_items (
    id SERIAL PRIMARY KEY,
    pmo_id INTEGER REFERENCES pmos(id),
    item_name VARCHAR(100) NOT NULL,
    kilowatts DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    period VARCHAR(20) DEFAULT 'per hour',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the item_images table
CREATE TABLE IF NOT EXISTS item_images (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES consumption_items(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add image_url column to consumption_items (optional)
ALTER TABLE consumption_items ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
```

#### c. (Optional) Use Provided Scripts
You may also run the migration scripts found in `backend/2025-05-27-add-profile-picture-to-pmos.sql` and `backend/2025-05-29-add-inventory-system.sql` for convenience.

### 3. Environment Variables
No changes required if you already have your `.env` files set up for backend and frontend.

### 4. Usage Changes
- Preventive Maintenance Officer (PMO)s can now upload and update their profile pictures.
- Admins and pmos can manage electric-consuming items and upload images for each item.

### 5. UI/UX Updates
- Notification bell icon is now in the header, to the left of the pmo's name, with clear spacing (not in the sidebar).
- Improved layout and responsiveness.

---

## Changelog
- Inventory system for items (with images)
- Profile picture support for pmos
- Notification bell moved to header
- Various UI/UX improvements
- Bug fixes

## Tech Stack
- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)

---

## Support
For issues or questions, open an issue on [GitHub](https://github.com/rynllvck5/dostMontlyConsumptionMonitoring).

---

## License
MIT

---

## Previous Version (1.0.0)
See [previous README](https://github.com/rynllvck5/dostMontlyConsumptionMonitoring/tree/v1.0.0) for older documentation.

---

### Thank you for upgrading to v2.0.0!
If you have suggestions or encounter issues, please contribute or report them on GitHub.

4. Set up your environment variables (create .env file in the backend directory)

5. Start the backend server
```
cd ../backend
npm start
```

6. Start the frontend development server
```
cd ../frontend
npm run dev
```

## License

This project is proprietary and confidential.

## Contributors

- Raynell Vick 