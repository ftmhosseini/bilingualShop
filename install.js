/**
 * NuttyMilk Installer
 * Run once to set up database, first language, currency, site name, and admin account.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const ENV_PATH = path.join(__dirname, '.env');

if (fs.existsSync(ENV_PATH)) {
  console.log('.env already exists. Installation completed.');
  console.log('Delete .env to re-run installer, or start with: node index.js');
  process.exit(0);
}

const HTML = `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NuttyMilk - Installation</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f5f5f5;padding:40px 20px}
.container{max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 20px rgba(0,0,0,.08)}
h1{text-align:center;margin-bottom:8px;font-size:24px}
.subtitle{text-align:center;color:#666;margin-bottom:30px;font-size:14px}
label{display:block;font-weight:600;margin-bottom:4px;font-size:14px;margin-top:14px}
label .opt{font-weight:400;color:#999;font-size:12px}
input,select{width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px}
input:focus,select:focus{outline:none;border-color:#4a90d9}
.row{display:flex;gap:12px}.row>div{flex:1}
h3{margin-top:24px;margin-bottom:4px;padding-top:14px;border-top:1px solid #eee;font-size:15px;color:#333}
button{width:100%;padding:14px;background:#27ae60;color:#fff;border:none;border-radius:6px;font-size:16px;font-weight:600;cursor:pointer;margin-top:24px}
button:hover{background:#219a52}button:disabled{background:#ccc;cursor:not-allowed}
.msg{margin-top:16px;padding:12px;border-radius:6px;font-size:14px}
.msg.error{background:#fdecea;color:#c0392b}.msg.success{background:#eafaf1;color:#27ae60}
.spinner{display:inline-block;width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin .6s linear infinite;margin-right:8px;vertical-align:middle}
@keyframes spin{to{transform:rotate(360deg)}}
.logo-preview{max-height:60px;margin-top:8px;display:none}
</style></head><body><div class="container">
<h1>NuttyMilk Setup</h1>
<p class="subtitle">Configure your store in one step</p>
<form id="form" enctype="multipart/form-data">

<h3>Database (MySQL)</h3>
<div class="row"><div><label>Host</label><input name="db_host" value="localhost" required></div>
<div><label>Port</label><input name="db_port" value="3306" required></div></div>
<label>Database Name</label><input name="db_name" placeholder="nuttymilk" required>
<div class="row"><div><label>DB Username</label><input name="db_user" required></div>
<div><label>DB Password</label><input name="db_pass" type="password"></div></div>

<h3>Site Info</h3>
<label>Site Name</label><input name="site_name" placeholder="My Store" required>
<label>Logo <span class="opt">(optional, can add later in admin)</span></label>
<input name="logo" type="file" accept="image/*" onchange="var r=new FileReader();r.onload=function(e){var p=document.getElementById('lp');p.src=e.target.result;p.style.display='block'};r.readAsDataURL(this.files[0])">
<img id="lp" class="logo-preview">

<h3>Language & Currency</h3>
<div class="row">
<div><label>Language Code</label><input name="lang_code" placeholder="en" required maxlength="10"></div>
<div><label>Language Name</label><input name="lang_label" placeholder="English" required></div>
</div>
<div class="row">
<div><label>Direction</label><select name="lang_dir"><option value="ltr">LTR (Left to Right)</option><option value="rtl">RTL (Right to Left)</option></select></div>
<div><label>Flag Emoji</label><input name="lang_flag" placeholder="🇺🇸" maxlength="4"></div>
</div>
<div class="row">
<div><label>Currency Code</label><input name="currency_code" placeholder="USD" required maxlength="10"></div>
<div><label>Currency Symbol</label><input name="currency_symbol" placeholder="$" required maxlength="10"></div>
</div>
<label>Country</label><input name="currency_country" placeholder="United States" required>

<h3>Admin Account</h3>
<label>Admin Email</label><input name="admin_email" type="email" required>
<label>Admin Password</label><input name="admin_pass" type="password" minlength="6" required>

<button type="submit">Install</button>
</form><div id="msg"></div></div>
<script>
document.getElementById("form").onsubmit=async function(e){
e.preventDefault();var btn=this.querySelector("button"),msg=document.getElementById("msg");
btn.disabled=true;btn.innerHTML='<span class="spinner"></span>Installing...';msg.innerHTML="";
var fd=new FormData(this);
try{var r=await fetch("/install",{method:"POST",body:fd});
var j=await r.json();if(r.ok){msg.className="msg success";msg.innerHTML="\\u2705 "+j.message+"<br><br>Restarting...";setTimeout(function(){window.location="/"},3000);}
else{msg.className="msg error";msg.textContent="\\u274c "+j.error;btn.disabled=false;btn.textContent="Install";}}
catch(err){msg.className="msg error";msg.textContent="\\u274c "+err.message;btn.disabled=false;btn.textContent="Install";}};
</script></body></html>`;

// Parse multipart form data (minimal, no dependency)
function parseMultipart(buf, boundary) {
  const parts = {};
  const sep = '--' + boundary;
  const str = buf.toString('latin1');
  const segments = str.split(sep).slice(1, -1);
  for (const seg of segments) {
    const headerEnd = seg.indexOf('\r\n\r\n');
    const header = seg.slice(0, headerEnd);
    const body = seg.slice(headerEnd + 4, seg.endsWith('\r\n') ? seg.length - 2 : seg.length);
    const nameMatch = header.match(/name="([^"]+)"/);
    const fileMatch = header.match(/filename="([^"]+)"/);
    if (!nameMatch) continue;
    if (fileMatch && fileMatch[1]) {
      parts[nameMatch[1]] = { filename: fileMatch[1], data: Buffer.from(body, 'latin1') };
    } else {
      parts[nameMatch[1]] = body;
    }
  }
  return parts;
}

const server = http.createServer(function(req, res) {
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(HTML);
  }

  if (req.method === 'POST' && req.url === '/install') {
    const chunks = [];
    req.on('data', function(c) { chunks.push(c); });
    req.on('end', async function() {
      res.setHeader('Content-Type', 'application/json');
      try {
        const buf = Buffer.concat(chunks);
        const contentType = req.headers['content-type'] || '';
        const boundary = contentType.split('boundary=')[1];
        if (!boundary) { res.writeHead(400); return res.end(JSON.stringify({ error: 'Invalid form submission' })); }

        const fields = parseMultipart(buf, boundary);
        const db_host = fields.db_host;
        const db_port = fields.db_port;
        const db_name = fields.db_name;
        const db_user = fields.db_user;
        const db_pass = fields.db_pass || '';
        const site_name = fields.site_name;
        const lang_code = fields.lang_code;
        const lang_label = fields.lang_label;
        const lang_dir = fields.lang_dir;
        const lang_flag = fields.lang_flag || '';
        const currency_code = fields.currency_code;
        const currency_symbol = fields.currency_symbol;
        const currency_country = fields.currency_country;
        const admin_email = fields.admin_email;
        const admin_pass = fields.admin_pass;

        if (!db_name || !db_user || !site_name || !lang_code || !lang_label || !currency_code || !currency_symbol || !admin_email || !admin_pass) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'All fields except logo are required' }));
        }

        // Test MySQL connection
        const mysql = require('mysql2/promise');
        var conn;
        try {
          conn = await mysql.createConnection({ host: db_host, port: Number(db_port), user: db_user, password: db_pass });
          await conn.execute('CREATE DATABASE IF NOT EXISTS `' + db_name + '`');
          await conn.end();
        } catch (err) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'Database connection failed: ' + err.message }));
        }

        // Generate JWT secret
        const crypto = require('crypto');
        const jwtSecret = crypto.randomBytes(32).toString('hex');

        // Write .env
        const envContent = 'PORT=' + PORT + '\n'
          + 'DB_HOST=' + db_host + '\n'
          + 'DB_PORT=' + db_port + '\n'
          + 'DB_USER=' + db_user + '\n'
          + 'DB_PASSWORD=' + db_pass + '\n'
          + 'DB_NAME=' + db_name + '\n'
          + 'JWT_SECRET=' + jwtSecret + '\n'
          + 'ADMIN_EMAIL=' + admin_email + '\n'
          + 'ADMIN_PASSWORD=' + admin_pass + '\n';

        fs.writeFileSync(ENV_PATH, envContent);

        // Set env vars for initDB
        process.env.DB_HOST = db_host;
        process.env.DB_PORT = db_port;
        process.env.DB_USER = db_user;
        process.env.DB_PASSWORD = db_pass;
        process.env.DB_NAME = db_name;
        process.env.JWT_SECRET = jwtSecret;
        process.env.ADMIN_EMAIL = admin_email;
        process.env.ADMIN_PASSWORD = admin_pass;

        // Init database tables + admin user
        const { initDB } = require('./db');
        const db = await initDB();

        // Save logo if uploaded
        var logoUrl = '';
        if (fields.logo && fields.logo.filename) {
          const ext = path.extname(fields.logo.filename);
          const logoFile = 'logo' + ext;
          const uploadsDir = path.join(__dirname, 'uploads');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
          fs.writeFileSync(path.join(uploadsDir, logoFile), fields.logo.data);
          logoUrl = '/uploads/' + logoFile;
          await db.execute("INSERT INTO site_settings (key_name, value) VALUES ('logo_url',?) ON DUPLICATE KEY UPDATE value=?", [logoUrl, logoUrl]);
        }

        // Save site name
        await db.execute("INSERT INTO site_settings (key_name, value) VALUES ('site_name',?) ON DUPLICATE KEY UPDATE value=?", [site_name, site_name]);

        // Insert first language
        await db.execute(
          "INSERT INTO languages (code, label, flag, rtl, enabled, sort_order) VALUES (?,?,?,?,1,0) ON DUPLICATE KEY UPDATE label=VALUES(label), flag=VALUES(flag), rtl=VALUES(rtl), enabled=1",
          [lang_code, lang_label, lang_flag, lang_dir === 'rtl' ? 1 : 0]
        );

        // Insert currency
        await db.execute(
          "INSERT INTO currencies (language_code, country, flag, currency_code, symbol, active) VALUES (?,?,?,?,?,1)",
          [lang_code, currency_country, lang_flag, currency_code, currency_symbol]
        );

        res.writeHead(200);
        res.end(JSON.stringify({ message: 'Installation complete! Your store is ready.' }));
        setTimeout(function() { process.exit(0); }, 2000);
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Installation failed: ' + err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, function() {
  console.log('\nNuttyMilk Installer running at http://localhost:' + PORT);
  console.log('Open this URL in your browser to complete setup.\n');
});
