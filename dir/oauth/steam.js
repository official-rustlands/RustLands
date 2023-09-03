this.$ = new Object();

const uuid = require('uuid');
const crypto = require('crypto');
const express = require('express');
const router = this.$.router = express.Router();
const passport = require('passport');
const path = this.$.path = ['/oauth/steam'][0];

router.get('/', passport.authenticate('steam', {failureRedirect: '/options/account'}), async (req, res) => {
    res.redirect('/options/account');
});

router.get('/return', passport.authenticate('steam', {failureRedirect: '/options/account'}), async (req, res) => {
    const {
        steamid
    } = req.user._json;

    res.cookie('steamid', steamid, {
        maxAge: 900000
    });

    res.redirect('/login?redirected=true');
});

module.exports = this;