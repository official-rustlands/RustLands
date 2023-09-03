this.$ = new Object();

const express = require('express');
const router = this.$.router = express.Router();
const path = this.$.path = ['/statistics'][0];
const paths = require('path');
const fs = require('fs');

router.get('/', async (req, res, next) => {
    if (!req.session._uuid) {
        return res.redirect('/login');
    }

    next();
}, async (req, res) => {
    const {
        hbs
    } = req.query;

    if (hbs) {
        return req.app.render(`libraries/statistics`, {
            layout: false,
            _url: `/statistics?hbs=true`,
            location: req.session.location || false,
            users: res.locals.session.users || false
        }, async (err, hbs) => {
            if (err) {
                return console.error(err);
            }

            res.send(hbs);
        });
    }

    res.render(`libraries/statistics`, {
        layout: '1',
        _url: `/statistics`,
        location: req.session.location || false,
        users: res.locals.session.users || false
    });
});

module.exports = this;