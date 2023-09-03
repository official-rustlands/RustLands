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
const path = this.$.path = ['/servers'][0];

router.get('/', async (req, res, next) => {
    next();
}, async (req, res) => {
    const next = async () => {
        res.render('libraries/servers', {
            layout: '2',
            _url: '/servers',
            cly: req.session.cly || false,
            users: false
        });
    }

    next();
});

module.exports = this;