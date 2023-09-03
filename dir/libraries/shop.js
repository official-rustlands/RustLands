this.$ = new Object();

const {
    BSON
} = require('mongodb-stitch-browser-sdk');

const moment = require('moment');
const uuid = require('uuid');
const superagent = require('superagent');
const crypto = require('crypto');
const express = require('express');
const router = this.$.router = express.Router();
const path = this.$.path = ['/shop'][0];

router.get('/redirect', async (req, res) => {
    const next = async () => {
        res.redirect('https://rustlands-webshop.tebex.io/');
    }

    next();
});

router.get('/', async (req, res, next) => {
    next();
}, async (req, res) => {
    const next = async () => {
        res.render('libraries/shop', {
            layout: '2',
            _url: '/shop',
            cly: req.session.cly || false,
            users: false
        });
    }

    next();
});

module.exports = this;