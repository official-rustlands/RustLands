this.$ = new Object();

const {
    BSON
} = require('mongodb-stitch-browser-sdk');

const moment = require('moment');

const express = require('express');
const crypto = require('crypto');
const router = this.$.router = express.Router();
const path = this.$.path = ['/administration'][0];

router.get('/', async (req, res, next) => {
    if (!req.session._uuid || res.locals.session.users._options.clearance != 2) {
        return res.redirect('/login');
    }

    next();
}, async (req, res) => {
    const {
        hbs
    } = req.query;

    if (hbs) {
        return req.app.render(`libraries/administration`, {
            layout: false,
            _url: `/administration?hbs=true`,
            location: req.session.location || false,
            users: res.locals.session.users || false,
            _users: await req.db.db(req.env.realm.db).collection('users').find({})
        }, async (err, hbs) => {
            if (err) {
                return console.error(err);
            }

            res.send(hbs);
        });
    }

    res.render(`libraries/administration`, {
        layout: '1',
        _url: `/administration`,
        location: req.session.location || false,
        users: res.locals.session.users || false,
        _users: await req.db.db(req.env.realm.db).collection('users').find({})
    });
});

router.get('/getUsers', async (req, res, next) => {
    if (!req.session._uuid || res.locals.session.users._options.clearance != 2) {
        return res.redirect('/login');
    }

    next();
}, async (req, res) => {
    const users = await req.db.db(req.env.realm.db).collection('users').find({});

    res.send(users);
});

router.get('/pushNotification', async (req, res, next) => {
    if (!req.session._uuid || res.locals.session.users._options.clearance != 2) {
        return res.redirect('/login');
    }

    next();
}, async (req, res) => {
    const {
        username,
        message
    } = req.query;

    if (!await req.db.db(req.env.realm.db).collection('users').findOne({
        username: username.toString()
    })) {
        return res.json({
            err: true,
            body: false
        })
    }

    await req.db.db(req.env.realm.db).collection('users').updateOne({
        username: username.toString()
    }, {
        $push: {
            '_options.notifications': {
                _id: new BSON.ObjectID(),
                authors: {
                    profile: 'logo.svg',
                    username: 'RustLands'
                },
                notification: message.toString(),
                _moment: moment().format()
            }
        }
    }, {
        upsert: false,
        multi: true
    });

    res.json({
        err: null,
        body: {
            text: "Completed!"
        }
    });
});

router.post('/', async (req, res, next) => {
    if (!req.session._uuid) {
        return res.redirect('/login');
    }

    next();
}, async (req, res) => {
    const {
        username,
        password,
        remember
    } = req.body;

    const encryption = crypto.createHash('sha256').update(password).digest('base64');

    if (!await req.db.db(req.env.realm.db).collection('users').findOne({
        username: username,
        password: encryption,
        '_options.clearance': 2
    })) {
        return res.json({
            err: {
                elements: ['#username', '#password', '#clearance'],
                xhr: {
                    'username': 'You have provided an invalid username.',
                    'password': 'You have provided an invalid password.',
                    'clearance': 'You do not have high enough clearance.'
                },
                async: true
            }
        });
    }

    await req.db.db(req.env.realm.db).collection('users').findOne({
        username: username,
        password: encryption
    }).then(async (users) => {
        return res.json({
            err: false,
            _id: users._id,
            xhr: {
                uuid: users._options._uuid,
                url: '/options/billing',
                async: true
            }
        });
    });
});

module.exports = this;