/* 
Copyright (C) 2020, Digilet Labs LLP.

This file is part of 360Katas.

360Katas is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

360Katas is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with 360Katas.  If not, see <https://www.gnu.org/licenses/>.
*/

//  __   __  ___        ___
// |__) /  \  |  |__/ |  |  
// |__) \__/  |  |  \ |  |  

// This is the main file for the 360kata bot.

// Import Botkit's core features
const { Botkit } = require('botkit');
const { BotkitCMSHelper } = require('botkit-plugin-cms');

// Import a platform-specific adapter for slack.

const { SlackAdapter, SlackMessageTypeMiddleware, SlackEventMiddleware } = require('botbuilder-adapter-slack');

const { MongoDbStorage } = require('botbuilder-storage-mongodb');

// Load process.env values from .env file
require('dotenv').config();

const Sentry = require('@sentry/node');
var mongoose = require('mongoose')
var authController = require('./src/controllers/authController')
const middleware = require('./features/middleware/middleware')
const cronJobs = require('./src/Cron')
const amplitudeService = require('./src/services/amplitudeService')
const appHomeView = require('./features/views/appHomeView')
const userController = require('./src/controllers/userController')
const slackService = require('./src/services/slackService')
const teamController = require('./src/controllers/teamController')
const webhookController = require('./src/controllers/webhookController');
const Constants = require('./src/Constants');
const cronController = require('./src/controllers/cronController');

if(process.env.ENV_TYPE === 'prod'){
    Sentry.init({ dsn: 'https://0632c73afa454fe29dd6b40af2354eab@o301059.ingest.sentry.io/5304431' })
} else {
    Sentry.init({ dsn: 'https://6f7ffead9e3d46b39b7c2e4a7fb0e574@o301059.ingest.sentry.io/5302264' })
}

let storage = null;
if (process.env.MONGO_URI) {
    storage = mongoStorage = new MongoDbStorage({
        url : process.env.MONGO_URI,
        database: 'threesixtydb'
    });
}


const adapter = new SlackAdapter({
    // REMOVE THIS OPTION AFTER YOU HAVE CONFIGURED YOUR APP!
    //enable_incomplete: true,

    // parameters used to secure webhook endpoint
    verificationToken: process.env.VERIFICATION_TOKEN,
    clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,  

    // auth token for a single-team app
    //botToken: process.env.BOT_TOKEN,

    // credentials used to set up oauth for multi-team apps
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scopes: ['im:history','im:write','users:read','chat:write'], 
    redirectUri: process.env.REDIRECT_URI,
    oauthVersion: 'v2',
 
    // functions required for retrieving team-specific info
    // for use in multi-team apps
    getTokenForTeam: authController.getTokenForTeam,
    getBotUserByTeam: authController.getBotUserByTeam,
});

// Use SlackEventMiddleware to emit events that match their original Slack event types.
adapter.use(new SlackEventMiddleware());

// Use SlackMessageType middleware to further classify messages as direct_message, direct_mention, or mention
adapter.use(new SlackMessageTypeMiddleware());

adapter.botkit_worker.prototype.startPrivateConversation = async function startPrivateConversation(userId){
    const channel = await this.api.conversations.open({ users: userId });

        if (channel.ok === true) {
            // now, switch contexts
            return this.changeContext({
                conversation: {
                    id: channel.channel.id,
                    // @ts-ignore this field is required for slack
                    team: this.getConfig('activity').conversation.team
                },
                user: { id: userId, name: null },
                channelId: 'slack'
            });
        } else {
            console.error(channel);
            throw new Error('Error creating IM channel');
        }
}

// let middlewares = [
//     (req, res, next) => { 
//         console.log(req.body); 
//         next(); 
//     }
// ]

const controller = new Botkit({
    webhook_uri: '/api/messages',

    adapter: adapter,

    storage,
    
    //webserver_middlewares: middlewares
});


if (process.env.CMS_URI) {
    controller.usePlugin(new BotkitCMSHelper({
        uri: process.env.CMS_URI,
        token: process.env.CMS_TOKEN,
    }));
}

controller.middleware.ingest.use(middleware.middlewareFunction)

// Once the bot has booted up its internal services, you can use them to do stuff.
controller.ready(() => {

    // load traditional developer-created local custom feature modules
    controller.loadModules(__dirname + '/features');

    /* catch-all that uses the CMS to trigger dialogs */
    if (controller.plugins.cms) {
        controller.on('message,direct_message', async (bot, message) => {
            let results = false;
            results = await controller.plugins.cms.testTrigger(bot, message);

            if (results !== false) {
                // do not continue middleware!
                return false;
            }
        });
    }

});

controller.webserver.get('/install', (req, res) => {
    // getInstallLink points to slack's oauth endpoint and includes clientId and scopes
    res.redirect(controller.adapter.getInstallLink());
});

controller.webserver.get('/install/auth', async (req, res) => {
    try {
        const results = await controller.adapter.validateOauthCode(req.query.code)
        let teamId = results.team.id
        let teamName = results.team.name
        let authUserId = results.authed_user.id
        if(teamId && teamName && authUserId && results.access_token && results.bot_user_id){
            let team = await authController.setTeamAndTokens(teamId, teamName, authUserId, results.access_token, results.bot_user_id)
            if(!team)
                throw 'There was some problem in authenticating your Slack workspace. Please remove the 360Katas from your workspace and add it back again.'
            setTimeout(async () => {
                let bot = await controller.spawn(teamId)
                await appHomeView.syncUsers(bot, team)
                let user = await userController.getUserBySlackId(authUserId)
                team = await teamController.getTeamBySlackId(teamId)
                await appHomeView.sendFirstMessage(bot, user)
                if(user){
                    amplitudeService.logEventAddToWorkspace({workspaceName: teamName, workspaceId: teamId}, user.id)
                    slackService.postNewWorkspaceAddedMessage(teamName, user.slackDisplayName, user.slackTimezoneName, team.numberOfUsers)
                } else {
                    amplitudeService.logEventAddToWorkspace({workspaceName: teamName, workspaceId: teamId}, authUserId)
                    slackService.postNewWorkspaceAddedMessage(teamName, "N/A", "N/A", team.numberOfUsers)
                }
            }, 500)
        }
        else
            throw 'There was some problem authentication. Please try again.'

        res.redirect(`https://www.360katas.com/success?team=${teamId}`)

    } catch (err) {
        console.error('OAUTH ERROR:', err)
        res.status(401)
        res.send(err.message)
    }
});

controller.webserver.post('/mautic/webhook', async(req, res) => {
    if(Constants.IS_LIVE && req.headers['x-auth'] !== '881m2QY7sXHlia2awRK4dP4G17WGG2'){
        res.send("failed")
        return
    }
    if (!Constants.IS_LIVE && req.headers['x-auth'] !== '5MqRA6mztrnPUjw4x3ajrERpcnh5zTrM'){
        res.send("failed")
        return
    }
    if(req.body && req.body.userId && req.body.message){
        let userId = req.body.userId
        let message = JSON.parse(req.body.message)
        webhookController.mauticSendMessageWebhookController(controller, userId, message)
        res.send("success")
    } else {
        res.send("failed")
    }
})

controller.on('receive_error', function(err, bot, message) {
    Sentry.captureException(err)
})

controller.publicFolder('/', __dirname + '/public')

mongoose.connect(process.env.MONGO_URI, function (err) {
    if (err) {
        console.log('Connecion to Mongodb failed  ' + err)
        return
    }
    console.log('Mongodb connected')
})
//cronController.processAllUsersForAllTeams(controller)
cronJobs(controller)