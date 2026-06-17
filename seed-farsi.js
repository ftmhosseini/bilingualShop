require('dotenv').config();
const { getPool } = require('./db');

async function seed() {
  const db = await getPool();

  // 1. Nav links for Farsi
  await db.execute('DELETE FROM nav_links WHERE lang=?', ['fa']);
  const navLinks = [
    { label: 'خانه', url: '/', icon: '🏠', sort_order: 0 },
    { label: 'محصولات', url: '/products', icon: '🛒', sort_order: 1 },
    { label: 'درباره ما', url: '/about', icon: '📖', sort_order: 2 },
    { label: 'تماس با ما', url: '/contact', icon: '📞', sort_order: 3 },
    { label: 'سوالات متداول', url: '/faq', icon: '❓', sort_order: 4 },
    { label: 'بلاگ', url: '/blog', icon: '📝', sort_order: 5 },
    { label: 'پروفایل', url: '/profile', icon: '👤', sort_order: 6 },
    { label: 'سفارشات', url: '/orders', icon: '📦', sort_order: 7 },
  ];
  for (const l of navLinks) {
    await db.execute('INSERT INTO nav_links (lang, label, url, icon, sort_order) VALUES (?,?,?,?,?)',
      ['fa', l.label, l.url, l.icon, l.sort_order]);
  }
  console.log('✓ Nav links (fa) inserted');

  // 2. FAQ page labels
  const faqContent = {
    title: 'سوالات متداول',
    askTitle: '❓ آیا سوالی دارید؟ از ما بپرسید',
    askSubtitle: 'لطفاً سوالات بالا را بخوانید و اگر نمی‌توانید پاسخ خود را پیدا کنید، سوال خود را برای ما ارسال کنید. ما در اسرع وقت به شما پاسخ خواهیم داد.',
    askNamePlaceholder: 'نام کامل *',
    askEmailPlaceholder: 'ایمیل *',
    askMsgPlaceholder: 'پیام شما *',
    askBtn: 'ارسال',
    askSuccess: '✓ پیام شما ارسال شد. با تشکر!',
  };
  await db.execute(
    'INSERT INTO page_content (page, lang, title, content) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content)',
    ['faq', 'fa', faqContent.title, JSON.stringify(faqContent)]
  );
  console.log('✓ FAQ labels (fa) inserted');

  // 3. Contact Us page labels
  const contactContent = {
    title: 'تماس با ما',
    touch: 'در ارتباط باشید',
    email: 'ایمیل',
    emailValue: 'info@nuttymilk.com',
    phone: 'تلفن',
    phoneValue: '',
    address: 'آدرس',
    addressValue: '',
    hours: 'ساعات کاری',
    hoursValue: 'دوشنبه تا جمعه، ۹ صبح تا ۶ عصر',
    sendMsg: 'ارسال پیام',
    name: 'نام *',
    emailField: 'ایمیل',
    subject: 'موضوع',
    message: 'پیام *',
    send: 'ارسال پیام',
    success: '✓ پیام شما ارسال شد!',
    error: 'خطا! لطفاً دوباره تلاش کنید.',
  };
  await db.execute(
    'INSERT INTO page_content (page, lang, title, content) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content)',
    ['contact', 'fa', contactContent.title, JSON.stringify(contactContent)]
  );
  console.log('✓ Contact Us labels (fa) inserted');

  // 4. About Us page labels
  const aboutContent = {
    title: 'درباره ما',
    introText: 'ما در ناتی‌میلک به تولید شیرهای گیاهی طبیعی و کره‌های بادام‌زمینی با کیفیت بالا متعهد هستیم. محصولات ما بدون مواد نگهدارنده و کاملاً طبیعی هستند.',
    findUs: 'موقعیت ما',
  };
  await db.execute(
    'INSERT INTO page_content (page, lang, title, content) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content)',
    ['about', 'fa', aboutContent.title, JSON.stringify(aboutContent)]
  );
  console.log('✓ About Us labels (fa) inserted');

  // 5. Profile page labels
  const profileContent = {
    'profile.title': 'ویرایش پروفایل',
    'profile.firstName': 'نام',
    'profile.lastName': 'نام خانوادگی',
    'profile.email': 'ایمیل',
    'profile.phone': 'تلفن',
    'profile.passwordHint': 'برای حفظ رمز عبور فعلی، فیلدهای رمز عبور را خالی بگذارید.',
    'profile.currentPassword': 'رمز عبور فعلی',
    'profile.newPassword': 'رمز عبور جدید',
    'profile.confirmPassword': 'تأیید رمز عبور جدید',
    'profile.saveChanges': 'ذخیره تغییرات',
    'profile.saved': 'ذخیره شد',
    'profile.passwordMismatch': 'رمزهای عبور جدید مطابقت ندارند',
    'address.saved': 'آدرس‌های ذخیره شده',
    'address.add': '+ افزودن',
    'address.label': 'عنوان (مثلاً خانه، محل کار)',
    'address.fullName': 'نام کامل',
    'address.street': 'آدرس خیابان',
    'address.country': 'کشور',
    'address.province': 'استان',
    'address.city': 'شهر',
    'address.postal': 'کد پستی',
    'address.postalZip': 'کد پستی',
    'address.phone': 'تلفن',
    'address.setDefault': 'تنظیم به عنوان پیش‌فرض',
    'address.saveAddress': 'ذخیره آدرس',
    'address.cancel': 'انصراف',
    'address.default': 'پیش‌فرض',
    'address.edit': 'ویرایش',
    'address.none': 'هنوز آدرسی ذخیره نشده است.',
  };
  await db.execute(
    'INSERT INTO page_content (page, lang, title, content) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content)',
    ['profile', 'fa', '', JSON.stringify(profileContent)]
  );
  console.log('✓ Profile labels (fa) inserted');

  // 6. Home tab labels (update site_settings)
  const [existing] = await db.execute("SELECT value FROM site_settings WHERE key_name='home_tab_labels'");
  let tabLabels = {
    all: { en: 'All Products', fa: 'همه محصولات' },
    new: { en: 'New Arrivals', fa: 'جدیدترین‌ها' },
    deals: { en: 'Best Deals', fa: 'بهترین تخفیف‌ها' },
  };
  if (existing.length) {
    try { tabLabels = { ...tabLabels, ...JSON.parse(existing[0].value) }; } catch {}
    tabLabels.all.fa = 'همه محصولات';
    tabLabels.new.fa = 'جدیدترین‌ها';
    tabLabels.deals.fa = 'بهترین تخفیف‌ها';
  }
  await db.execute(
    "INSERT INTO site_settings (key_name, value) VALUES ('home_tab_labels', ?) ON DUPLICATE KEY UPDATE value=VALUES(value)",
    [JSON.stringify(tabLabels)]
  );
  console.log('✓ Home tab labels (fa) inserted');

  // 7. Auth page labels (login/register)
  const [authExisting] = await db.execute("SELECT value FROM site_settings WHERE key_name='auth_page_labels'");
  let authLabels = {};
  if (authExisting.length) { try { authLabels = JSON.parse(authExisting[0].value); } catch {} }
  authLabels.fa = {
    login_button: 'ورود',
    register_button_short: 'ثبت‌نام',
    login_title: 'ورود به حساب',
    register_title: 'ثبت‌نام',
  };
  await db.execute(
    "INSERT INTO site_settings (key_name, value) VALUES ('auth_page_labels', ?) ON DUPLICATE KEY UPDATE value=VALUES(value)",
    [JSON.stringify(authLabels)]
  );
  console.log('✓ Auth labels (fa) inserted');

  console.log('\n✅ All Farsi settings seeded successfully!');
  process.exit(0);
}

seed().catch(err => { console.error('Error:', err); process.exit(1); });
