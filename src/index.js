'use strict';

const ALEXA_APP_ID = 'amzn1.ask.skill.74270607-5871-4a53-ae64-c9b3d8569ca9';
const APIAI_DEVELOPER_ACCESS_TOKEN = 'db9eedba45284deab427c0fb17e5517f';

var AlexaSdk = require('alexa-sdk');
var ApiAiSdk = require('apiai');
var ApiAi = ApiAiSdk(APIAI_DEVELOPER_ACCESS_TOKEN);
var cardTitle = "LegalShield";

var alexaSessionId;

exports.handler = function (event, context) {
    var alexa = AlexaSdk.handler(event, context);
    alexa.appId = ALEXA_APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        var self = this;
        setAlexaSessionId(self.event.session.sessionId);
        ApiAi.eventRequest({name: 'WELCOME'}, {sessionId: alexaSessionId})
            .on('response', function (response) {
                var speech = response.result.fulfillment.speech;
                self.emit(':askWithCard', speech, speech, cardTitle, speech);
            })
            .on('error', function (error) {
                console.error(error.message);
                self.emit(':tellWithCard', error);
            })
            .end();
    },
    'ApiIntent': function () {
        var self = this;
        var text = self.event.request.intent.slots.Reply.value;
        setAlexaSessionId(self.event.session.sessionId);
        if (text) {
            ApiAi.textRequest(text, {sessionId: alexaSessionId})
                .on('response', function (response) {
                    var speech = response.result.fulfillment.speech;
                    if (isResponseIncompleted(response)) {
                        self.emit(':askWithCard', speech, speech, cardTitle, speech);
                    } else {
                        self.emit(':tellWithCard', speech);
                    }
                })
                .on('error', function (error) {
                    console.error(error.message);
                    self.emit(':tellWithCard', error.message);
                })
                .end();
        } else {
            self.emit('Unhandled');
        }
    },
    'AMAZON.CancelIntent': function () {
        this.emit('AMAZON.StopIntent');
    },
    'AMAZON.HelpIntent': function () {
        this.emit('Unhandled');
    },
    'AMAZON.StopIntent': function () {
        var self = this;
        ApiAi.eventRequest({name: 'BYE'}, {sessionId: alexaSessionId})
            .on('response', function (response) {
                self.emit(':tell', response.result.fulfillment.speech);
            })
            .on('error', function (error) {
                console.error(error.message);
                self.emit(':tell', error.message);
            })
            .end();
    },
    'Unhandled': function () {
        var self = this;
        ApiAi.eventRequest({name: 'FALLBACK'}, {sessionId: alexaSessionId})
            .on('response', function (response) {
                var speech = response.result.fulfillment.speech;
                self.emit(':askWithCard', speech, speech);
            })
            .on('error', function (error) {
                console.error(error.message);
                self.emit(':tell', error.message);
            })
            .end();
    }
};

function isResponseIncompleted(response) {
    if (response.result.actionIncomplete) {
        return true;
    }

    for (var i = 0; i < response.result.contexts.length; i++) {
        if (response.result.contexts[i].lifespan > 1) {
            return true;
        }
    }
    return false;
}

function setAlexaSessionId(sessionId) {
    if (sessionId.indexOf("amzn1.echo-api.session.") != -1) {
        alexaSessionId = sessionId.split('amzn1.echo-api.session.').pop();
    } else {
        alexaSessionId = sessionId.split('SessionId.').pop();
    }
}
