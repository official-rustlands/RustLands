this.$ = new Object();

const uuid = require('uuid');
const crypto = require('crypto');
const express = require('express');
const router = this.$.router = express.Router();
const axios = require('axios');
this.$.path = ['/oauth/discord'][0];

router.get('/', async (req, res) => {
    const redirect_url = `https://discord.com/oauth2/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&scope=identify&state=123456&redirect_uri=${process.env.REDIRECT_URI}&prompt=consent`
    res.redirect(redirect_url);
});

router.get('/return', async (req, res) => {
    const {
        code
    } = req.query;

    const disapi = await axios.post('https://discord.com/api/oauth2/token',
        new URLSearchParams({
            'client_id': process.env.CLIENT_ID,
            'client_secret': process.env.CLIENT_SECRET,
            'grant_type': 'authorization_code',
            'redirect_uri': process.env.REDIRECT_URI,
            'code': code
        }), {
            headers:
            {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    
    const disapi_usr = await axios.get(`https://discordapp.com/api/users/@me`, {
        headers: {
            Authorization: `Bearer ${disapi.data.access_token}`
        }
    });

    if (!await req.db.db(req.env.realm.db).collection('users').findOne({
        discordid: disapi_usr.data.id
    })) {
        await req.db.db(req.env.realm.db).collection('users').updateOne({
            username: res.locals.session.users.username
        }, {
            $set: {
                "discordid": disapi_usr.data.id
            }
        }, {
            upsert: false
        });
    } else {
        await req.db.db(req.env.realm.db).collection('users').updateOne({
            username: res.locals.session.users.username
        }, {
            $push: {
                "_options.notifications": {
                    _id: new BSON.ObjectID(),
                    authors: {
                        profile: 'logo.svg',
                        username: 'RustLands'
                    },
                    notification: `Your recent request to link your discord account failed, it has already been linked to another account. (Contact an Administrator for Assistance!)`,
                    _moment: moment().format()
                }
            }
        }, {
            upsert: false
        });
    }

    res.redirect(`https://${process.env.DOMAIN}/options/account`);
});

module.exports = this;