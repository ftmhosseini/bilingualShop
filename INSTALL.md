# 🥛 NuttyMilk — cPanel Installation Guide

## Requirements

- cPanel with **Node.js Selector** (or SSH access)
- MySQL database (created via cPanel → MySQL Databases)
- Node.js 18+

---

## Step 1: Upload Files

1. Zip the `backend/` folder (which includes the `build/` folder inside it)
2. Upload to your cPanel via **File Manager** → `public_html/` (or a subdomain folder)
3. Extract the zip

Your folder should look like:
```
your-domain/
├── index.js
├── install.js
├── app.js
├── db.js
├── mailer.js
├── sms.js
├── package.json
├── routes/
├── build/          ← frontend files
├── uploads/
└── node_modules/   ← (or run npm install)
```

---

## Step 2: Create MySQL Database

In cPanel → **MySQL Databases**:
1. Create a new database (e.g., `username_nuttymilk`)
2. Create a new user with a password
3. Add the user to the database with **ALL PRIVILEGES**

Note the database name, username, and password — you'll need them in Step 4.

---

## Step 3: Set Up Node.js App

### Option A: cPanel Node.js Selector
1. Go to **Setup Node.js App**
2. Click **Create Application**
3. Set Node.js version: `18` or higher
4. Application root: path to your uploaded folder
5. Application startup file: `index.js`
6. Click **Create**
7. Click **Run NPM Install** (if you didn't upload node_modules)

### Option B: SSH
```bash
cd ~/public_html   # or your app folder
npm install --production
node index.js
```

---

## Step 4: Run the Web Installer

1. Open your domain in a browser: `https://yourdomain.com`
2. You'll see the **NuttyMilk Setup** page
3. Fill in:
   - **Database**: Host, Port, Name, Username, Password (from Step 2)
   - **Site Info**: Store name + logo (logo is optional, can add later in admin)
   - **Language**: First language code, name, direction (LTR/RTL), flag emoji
   - **Currency**: Code (USD, EUR, IRR...), symbol ($, €, ﷼...), country
   - **Admin Account**: Email + password
4. Click **Install**
5. Wait for "Installation complete!" message
6. The app will restart automatically

> You can only add one language and currency during installation.
> Additional languages and currencies can be added from the admin panel later.

---

## Step 5: Restart the App

After installation, restart the Node.js app:
- **cPanel**: Node.js Selector → click **Restart**
- **SSH**: `node index.js` (or use PM2: `pm2 start index.js`)

Your site is now live! Log in at `/login` with your admin credentials.

---

## Step 6: Configure Email (Optional)

1. Log in as admin → go to `/admin/messaging`
2. Add an email provider:
   - Channel: **Email**
   - Provider: **Resend**
   - API Key: get one free at [resend.com](https://resend.com)
   - From Email: `YourStore <noreply@yourdomain.com>`
3. Save

This enables verification codes and password reset emails.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot connect to database" | Check DB name/user/password in cPanel MySQL |
| App shows installer again | The .env file wasn't saved — check folder permissions |
| 502 Bad Gateway | Restart the Node.js app in cPanel |
| Blank page | Make sure `build/` folder exists inside the app folder |

---

## Re-installing

To start fresh:
1. Delete the `.env` file from the app folder
2. Drop the database tables (or delete the database and recreate)
3. Restart the app — the installer will appear again
