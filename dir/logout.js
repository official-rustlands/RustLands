this.$ = new Object();

const express = require('express');
const router = this.$.router = express.Router();
const path = this.$.path = ['/logout'][0];

router.get('/', async (req, res) => {
    res.clearCookie('_uuid');
    
    res.redirect('/login');
});

module.exports = this;