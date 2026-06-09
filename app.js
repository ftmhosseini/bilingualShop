require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "build")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/shipping', require('./routes/shipping'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/languages', require('./routes/languages'));
app.use('/api/content', require('./routes/content'));
app.use('/api/faq', require('./routes/faq'));
app.use('/api/navlinks', require('./routes/navlinks'));
app.use('/api/translations', require('./routes/translations'));
app.use('/api/currencies', require('./routes/currencies'));
app.use('/api/plugins', require('./routes/plugins'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/messaging', require('./routes/messaging'));
app.use('/api/blogs', require('./routes/blogs'));

module.exports = app;
