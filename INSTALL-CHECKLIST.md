# NuttyMilk — Installation Checklist

## Before you start, prepare:

- [ ] cPanel login credentials
- [ ] Node.js 18+ enabled in cPanel (Setup Node.js App section)

## Steps:

### 1. [ ] Create MySQL Database in cPanel
- Go to cPanel → MySQL Databases
- Create a database (e.g. `youruser_nuttymilk`)
- Create a database user with a password
- Add user to database with **ALL PRIVILEGES**
- ✍️ Write down: database name, username, password

### 2. [ ] Upload files
- Upload the project zip to your domain folder via File Manager
- Extract it

### 3. [ ] Set up Node.js App
- Go to cPanel → Setup Node.js App → Create Application
- Node.js version: **18** or higher
- Application root: the folder you uploaded to
- Startup file: `index.js`
- Click Create, then click **Run NPM Install**

### 4. [ ] Open your website in browser
- You'll see the setup wizard

### 5. [ ] Fill the setup form:
- **Database:** host (`localhost`), port (`3306`), name, username, password
- **Site Name:** your store name (required)
- **Logo:** upload your logo image (optional — can add later)
- **Language:** code (e.g. `en`), name (e.g. `English`), direction (LTR or RTL), flag emoji
- **Currency:** code (e.g. `USD`), symbol (e.g. `$`), country name
- **Admin:** your email + password (this is your login)

### 6. [ ] Click Install

### 7. [ ] Restart the app
- Go to cPanel → Node.js App → click **Restart**

### 8. [ ] Done! Log in at `/login` with your admin email & password

---

## After installation (optional):

- [ ] Add more languages: Admin Panel → Content & Languages
- [ ] Add more currencies: Admin Panel → Content & Languages
- [ ] Set up email provider: Admin Panel → Messaging (add Resend API key for verification emails)
- [ ] Upload products: Admin Panel → Manage Products
