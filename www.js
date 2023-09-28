const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const cors = require('cors');

const crypto = require('crypto');
const moment = require('moment');
const uuid = require('uuid');

const clc = require('cli-color');
const clt = require('cli-table');

const passport = require('passport');
const passportSteam = require('passport-steam');
const SteamStrategy = passportSteam.Strategy;

this.session = require('connect-mongodb-session')(session);
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const Realm = require('realm');
const {
    BSON
} = require('mongodb-stitch-browser-sdk');

const client = express();
const https = require('https').createServer({
    cert: fs.readFileSync(`${process.cwd()}/ssl/reece-barker_co.crt`, {
        encoding: 'utf8'
    }),
    ca: fs.readFileSync(`${process.cwd()}/ssl/reece-barker_co.ca-bundle`, {
        encoding: 'utf8'
    }),
    key: fs.readFileSync(`${process.cwd()}/ssl/reece-barker_co.key`, {
        encoding: 'utf8'
    })
},
    client);
const io = require('socket.io')(https);

const utils = require(`${process.cwd()}/env.js`);
const env = require(path.join(process.cwd(), '/env.json'))

fs.writeFile(path.join(process.cwd(), '/bin/hbs/4.hbs.js'), `
    module.exports = ['URL', (url) => {
        return 'https://${process.env.DOMAIN}/' + url;
    }];
`, (err) => {
    if (err) return console.error(err);
});

client.set('session', session({
    genid: () => {
        return uuid.v4();
    },
    secret: uuid.v4(),
    store: new this.session({
        uri: process.env.URI + `retryWrites=${process.env.RETRYWRITES}&w=${process.env.W}`,
        collection: env.mongodb.collection
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: 'strict'
    }
}));

client.set('hbs', exphbs.create({
    extname: '.hbs',
    defaultLayout: '1',
    partialsDir: `${process.cwd()}/views/partials`,
    layoutsDir: `${process.cwd()}/views/layouts`,
    helpers: utils.hbs()
}));

client.engine('hbs', client.get('hbs').engine);
client.set('trust proxy', 1);
client.set('view engine', 'hbs');

client.use(client.get('session'));
client.use(express.json());

client.use(cors({
    origin: `*.${process.env.DOMAIN}`
}));

client.use('/utils', express.static(`${process.cwd()}/bin`));

client.use(require('cookie-parser')());
client.use(require('body-parser').urlencoded({
    extended: true
}));

client.use(async (req, res, next) => {
    req.io = io;
    req.env = env;
    req.db = await utils.db();
    req.tls = utils.tls;
    req.utils = utils;
    req.ev = utils.ev;

    next();
});

client.use(async (req, res, next) => {
    if (!req.cookies['_uuid'] && req.session._uuid) {
        await req.session.regenerate(async (err) => {
            if (err) {
                console.error(err);
            }
        });
    } else if (req.cookies['_uuid'] !== req.session._uuid) {
        await req.session.regenerate(async (err) => {
            if (err) {
                console.error(err);
            }
        });
    }

    next();
});

client.use(async (req, res, next) => {
    let sr_users = {};

    if (req.session._uuid) {
        await req.db.db(req.env.realm.db).collection('users').findOne({
            _id: req.session.users._id
        }).then(async (users) => {
            let notifs = [];
            let notifs_before = users._options.notifications;
        
            for (var i = 0; i < notifs_before.length; i++) {        
                notifs.push(notifs_before[i]);
            }
        
            sr_users = {
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
        });
    }

    res.locals.session = req.session._uuid ? {
        _id: req.session.users._id,
        _uuid: req.session._uuid,
        status: true,
        users: sr_users
    } : false;

    next();
});

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(new SteamStrategy({
        returnURL: `https://${process.env.DOMAIN}` + '/oauth/steam/return',
        realm: `https://${process.env.DOMAIN}` + '/',
        apiKey: '12148C1CA5858CA82636C6951F0D8161'
    }, function (identifier, profile, done) {
        process.nextTick(function () {
            profile.identifier = identifier;
            return done(null, profile);
        });
    }
));

client.use(passport.initialize());
client.use(passport.session());

process.stdout.write(clc.reset);

https.listen(process.env.PORT, async () => {
    process.stdout.write(clc.yellow(`\nhttps://${process.env.DOMAIN}/`));
});

this.__init__ = async (dir, files) => {
    let _dir = await fs.readdirSync(dir);

    for (let i in _dir) {
        let v = `${dir}/${_dir[i]}`;

        if (fs.statSync(v).isDirectory()) {
            await this.__init__(v, files);
        } else {
            files.push(v);
        }
    }

    return files;
}

this.__init__(`${process.cwd()}/dir`, utils.ev).then(async (_v_) => {
    const routes = [];
    let _v = [];

    _v_.forEach(async (file) => {
        if (!file.includes('.DS_Store')) {
            _v.push(file);
        }
    });

    (async () => {
        _v.forEach(async (__v) => {
            const v = require(__v);

            routes.push(v.$.path);
            client.use(v.$.path, v.$.router);
        });
    })().then(async () => {
        client.get('*', async (req, res, next) => {
            if (routes.indexOf(req.path) >= 0) return;

            next();
        }, async (req, res) => {
            res.status(404).render('404', {
                layout: '2',
                _url: '/404',
                users: res.locals.session.users
            });
        });
    });
});

client.get('/', async (req, res) => {    
    res.render('@', {
        layout: '2',
        _url: '/',
        users: res.locals.session.users
    });
});