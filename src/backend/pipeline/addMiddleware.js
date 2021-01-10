'use strict';

const app = require('./initialize.js');
const config = require('config');

const cookieParser = require('cookie-parser');
const compression = require('compression');
const express = require('express');
const path = require('path');

app.use(compression());
app.use(cookieParser());

app.use('/static', express.static(path.resolve(__dirname, '../../static/')));

module.exports = app;