const {
    BSON
} = require('mongodb-stitch-browser-sdk');

const uuid = require('uuid');
const crypto = require('crypto');
const express = require('express');
const superagent = require('superagent');
const moment = require('moment');
const router = express.Router();

this['/login'] = {
    $: {
        router: router,
        path: '/login',
        url: 'https://www.acolytes.de/login',
        title: '/login',
        favicon: 'https://www.acolytes.de/utils/img/jpg/favicon.jpg',
        description: 'This area of our site allows users to login into their Acolytes account.'
    }
}

router.get('/', async (req, res, next) => {
    if (req.query.alt) {
        if (!req.session._uuid) {
            return res.redirect('/login');
        }

        req.session.destroy(async (err) => {
            if (err) {
                return res.redirect('/dashboard');
            }
        });

        return res.redirect('/login');
    }

    if (req.session._uuid) {
        return res.redirect('/dashboard');
    }

    next();
}, async (req, res) => {
    const next = async () => {
        res.render('login', {
            layout: '2',
            $: this['/login'].$,
            _url: '/login',
            cly: req.session.cly || false,
            users: false
        });
    }

    next();
});

router.get('/github', async (req, res, next) => {
    const {
        access_token
    } = req.query;

    if (!access_token) return res.redirect('/login');

    next();
}, async (req, res) => {
    const {
        access_token
    } = req.query;

    const {
        login,
        id
    } = (await superagent
        .get('https://api.github.com/user')
        .set('User-Agent', 'PostmanRuntime/7.26.8')
        .set('Authorization', `token ${access_token}`)).body;

    const encryption = await crypto.createHash('sha256').update(`${id}`).digest('base64');

    if (!await req.db.db(req.env.realm.db).collection('users').findOne({
        username: login,
        '_apis.github': encryption
    })) {
        return res.redirect(`/register/github?access_token=${access_token}`);
    }

    await req.db.db(req.env.realm.db).collection('users').findOne({
        username: login,
        '_apis.github': encryption
    }).then(async (users) => {
        const _uuid = uuid.v4();

        res.cookie('_uuid', _uuid);

        res.locals.users = users;

        req.session.cookie.maxAge = 60000 * 60;

        req.session._uuid = _uuid;
        req.session.users = {
            _id: users._id,
            _apis: users._apis,
            _clients: {
                _id: req.session.id,
                _credentials: {
                    username: users.username,
                    password: users.password
                }
            }
        }

        req.session.save();

        await req.db.db(req.env.realm.db).collection('users').updateOne({
            username: users.username
        }, {
            $set: {
                "_options.status": true
            }
        }, {
            upsert: false
        });

        res.redirect('/dashboard');
    });
});

router.post('/', async (req, res, next) => {
    if (req.session._uuid) {
        return res.redirect('/dashboard');
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
        password: encryption
    })) {
        return res.json({
            err: {
                elements: ['#username', '#password'],
                xhr: {
                    '#username': 'You have provided an invalid username.',
                    '#password': 'You have provided an invalid password.',
                },
                async: true
            }
        });
    }

    await req.db.db(req.env.realm.db).collection('users').findOne({
        username: username,
        password: encryption
    }).then(async (users) => {
        const _uuid = uuid.v4();

        res.cookie('_uuid', _uuid);

        let notifs = [];
        let notifs_before = users._options.notifications;

        for (var i = 0; i < notifs_before.length; i++) {
            notifs.push(notifs_before[i]);
        }

        let sr_users = {
            _id: users._id,
            _apis: users._apis,
            _information: {
                img: users._information.img,
                fn: users._information.fn,
                ln: users._information.ln,
                address: users._information.address,
                bio: users._information.bio,
                employed: users._information.employed,
                telephone: users._information.telephone,
                birthday: users._information.birthday
            },
            _options: {
                status: users._options.status,
                clearance: users._options.clearance,
                _uuid: users._options._uuid,
                notifications: notifs.reverse()
            },
            steamid: users.steamid,
            discordid: users.discordid,
            username: users.username,
            password: users.password
        }

        res.locals.users = sr_users;

        if (remember) {
            req.session.cookie.maxAge = (60000 * 60) * 3;
        } else {
            req.session.cookie.maxAge = 60000 * 60;
        }

        req.session._uuid = _uuid;
        req.session.users = {
            _id: users._id,
            _apis: users._apis,
            steam: {
                steamid: users.steamid 
            },
            _clients: {
                _id: req.session.id,
                _credentials: {
                    username: users.username,
                    password: users.password
                }
            }
        }

        if (req.cookies.steamid) {
            const steamid = req.cookies.steamid;

            if (!await req.db.db(req.env.realm.db).collection('users').findOne({
                steamid: steamid
            })) {
                await req.db.db(req.env.realm.db).collection('users').updateOne({
                    username: users.username
                }, {
                    $set: {
                        "steamid": steamid
                    }
                }, {
                    upsert: false
                });
            } else {
                await req.db.db(req.env.realm.db).collection('users').updateOne({
                    username: users.username
                }, {
                    $push: {
                        "_options.notifications": {
                            _id: new BSON.ObjectID(),
                            authors: {
                                profile: 'logo.svg',
                                username: 'RustLands'
                            },
                            notification: `Your recent request to link your steam account failed, it has already been linked to another account. (Contact an Administrator for Assistance!)`,
                            _moment: moment().format()
                        }
                    }
                }, {
                    upsert: false
                });
            }

            res.clearCookie('steamid');
        }

        req.session.save();

        await req.db.db(req.env.realm.db).collection('users').updateOne({
            username: users.username
        }, {
            $set: {
                "_options.status": true
            }
        }, {
            upsert: false
        });

        return res.json({
            err: false,
            _id: users._id,
            xhr: {
                uuid: users._options._uuid,
                url: '/dashboard',
                async: true
            }
        });
    });
});

module.exports = this['/login'];