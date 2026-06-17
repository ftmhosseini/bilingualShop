require('dotenv').config();
const { getPool, initDB } = require('./db');

async function seed() {
  await initDB(); // ensure all tables exist
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

  // 8. Farsi blog posts
  const [faBlogRows] = await db.execute("SELECT id FROM blogs WHERE lang='fa' LIMIT 1");
  if (faBlogRows.length === 0) {
    const faBlogPosts = [
      {
        title: 'شیر نارگیل در مقابل آب نارگیل در مقابل شیر ناتی‌میلک',
        slug: 'shir-nargil-vs-ab-nargil',
        excerpt: 'آب نارگیل یک نوشیدنی انرژی‌زای طبیعی است که مستقیماً از نارگیل به دست می‌آید.',
        content: 'آب نارگیل یک نوشیدنی طبیعی و انرژی‌بخش است که مستقیماً از داخل نارگیل به دست می‌آید. این نوشیدنی سرشار از الکترولیت‌ها، پتاسیم و ویتامین‌های طبیعی است. از طرف دیگر، شیر نارگیل از گوشت رنده‌شده نارگیل تهیه می‌شود و چربی و کالری بیشتری دارد. ترکیب نارگیل ناتی‌میلک یک ترکیب منحصربه‌فرد از پودر شیر، زعفران و پودر نارگیل است — طعم عالی و سرشار از مواد مغذی.',
        author: 'تیم ناتی‌میلک',
        published_at: '2025-12-23',
      },
      {
        title: 'شیر پسته',
        slug: 'shir-pesteh',
        excerpt: 'شیر پسته ترکیبی منحصربه‌فرد از پودر شیر، زعفران و پودر پسته است.',
        content: 'شیر پسته یکی از محبوب‌ترین محصولات ناتی‌میلک است. این نوشیدنی خوشمزه و مغذی از پودر شیر ممتاز، زعفران خالص، پودر خامه و پودر پسته تهیه شده است. سرشار از پروتئین، آهن، کلسیم و آنتی‌اکسیدان‌های زعفران است. مصرف روزانه از سیستم ایمنی حمایت می‌کند، حافظه را بهبود می‌بخشد و انرژی را افزایش می‌دهد. کافی است یک ساشه ۲۰ گرمی را در یک لیوان شیر گرم یا آب گرم حل کنید.',
        author: 'تیم ناتی‌میلک',
        published_at: '2025-12-23',
      },
      {
        title: 'نکاتی برای تهیه شیر زعفران پسته عالی',
        slug: 'nokateh-shir-zaferan-pesteh',
        excerpt: 'این نکات را دنبال کنید تا یک شیر زعفران پسته حرفه‌ای و عالی تهیه کنید.',
        content: 'نکاتی برای تهیه شیر زعفران پسته عالی:\n\n۱. دما: بهترین دمای حل کردن ۶۰ تا ۷۰ درجه سانتی‌گراد است.\n۲. نسبت: یک ساشه ۲۰ گرمی را در ۲۰۰ میلی‌لیتر شیر یا آب گرم حل کنید.\n۳. هم زدن: خوب هم بزنید تا کاملاً حل شود.\n۴. پودر پسته: پودر پسته را بعد از حل شدن پایه اضافه کنید.\n۵. سرو: گرم یا سرد (با یخ) میل کنید.',
        author: 'تیم ناتی‌میلک',
        published_at: '2025-09-13',
      },
      {
        title: 'دستور تهیه شیر زعفران پسته خانگی',
        slug: 'dastoor-shir-zaferan-pesteh-khanegi',
        excerpt: 'با این دستور ساده یک شیر زعفران پسته خانگی خوشمزه تهیه کنید.',
        content: 'مواد لازم:\n- ۱ ساشه ۲۰ گرمی ناتی‌میلک پسته‌ای\n- ۲۰۰ میلی‌لیتر شیر یا آب\n- پودر پسته (جداگانه موجود)\n\nطرز تهیه:\n۱. شیر یا آب را تا ۶۰-۷۰ درجه گرم کنید (نجوشانید).\n۲. محتویات ساشه را به تدریج به مایع گرم اضافه کنید.\n۳. با قاشق یا همزن خوب هم بزنید تا صاف شود.\n۴. پودر پسته را اضافه کنید و دوباره هم بزنید.\n۵. در فنجان بریزید و میل کنید. کمی دارچین هم می‌توانید اضافه کنید.',
        author: 'تیم ناتی‌میلک',
        published_at: '2025-09-13',
      },
      {
        title: 'استانداردهای کیفیت زعفران',
        slug: 'standard-keyfiat-zaferan',
        excerpt: 'کیفیت زعفران در آزمایشگاه‌ها بر اساس استانداردهای داخلی و بین‌المللی بررسی می‌شود.',
        content: 'زعفران یکی از گران‌ترین ادویه‌های جهان است و کیفیت آن با معیارهای دقیقی سنجیده می‌شود.\n\nشاخص‌های کیفیت:\n- کروسین: مسئول رنگ زرد طلایی — هرچه بیشتر بهتر.\n- پیکروکروسین: مسئول طعم تلخ.\n- سافرانال: مسئول عطر و بو.\n\nاستاندارد بین‌المللی ISO 3632 چهار درجه کیفیت برای زعفران تعریف می‌کند. زعفران ایرانی به دلیل آب و هوای منحصربه‌فرد، یکی از بهترین‌ها در جهان محسوب می‌شود. ناتی‌میلک از زعفران درجه یک ایرانی استفاده می‌کند.',
        author: 'تیم ناتی‌میلک',
        published_at: '2025-05-06',
      },
    ];

    for (const post of faBlogPosts) {
      await db.execute(
        "INSERT INTO blogs (lang, title, slug, excerpt, content, author, published_at) VALUES ('fa',?,?,?,?,?,?)",
        [post.title, post.slug, post.excerpt, post.content, post.author, post.published_at]
      );
    }
    console.log('✓ Blog posts (fa) inserted');
  } else {
    console.log('✓ Blog posts (fa) already exist, skipped');
  }

  console.log('\n✅ All Farsi settings seeded successfully!');
  process.exit(0);
}

seed().catch(err => { console.error('Error:', err); process.exit(1); });
