'use strict'

const alexa = require('alexa-app');
const Speech = require('ssml-builder');
const questions = require('./questions');
const utils = require('./utils');
const constants = require('./constants')
const app = new alexa.app('math-hero');

app.customSlot('choices', ['A', 'B', 'C', 'D', 'E'])

const SKILL_STATES = constants.SKILL_STATES;

const NUM_TO_WORD_MAP = [null, null, 'second', 'third', 'fourth', 'fifth'];

app.launch((req, res) => {
  let prompt = new Speech()
  .say("Hello")
  .pause('1s')
  .say("Welcome to Math Hero.")
  .pause('500ms')
  .say("I can help you in getting stronger in Mathematics")
  .pause('1s')
  .say("Would you like to start a trivia quiz?");

  let reprompt = new Speech()
  .say("If you would like to start a trivia quiz")
  .pause('500ms')
  .say("say yes otherwise say no.")
  .pause('1s')
  .say("You can start math trivia quiz anytime by saying")
  .pause('500ms')
  .say('Start math trivia quiz or math hero');

  prompt = prompt.ssml(true);
  reprompt = reprompt.ssml(true);

  const session = req.getSession();
  session.set('skill_state', SKILL_STATES.STARTED)
  res.say(prompt).reprompt(reprompt).shouldEndSession(false);
});

app.intent('AnswerIntent', {
    'slots': {
      'choices': 'choices'
    },
    'utterances': [
      "my {answer|solution} is {-|choices}",
      "my {answer|solution} is option {-|choices}",
      "{answer|solution} is {-|choices}",
      "{answer|solution} is option {-|choices}",
      "correct option is {-|choices}",
      "correct {answer|solution} is {-|choices}",
      "{-|choices}"
    ]
  },
  (req, res) => {
    res.say("You gave answer this").reprompt("Yes, this");
    utils.newQuestion(req, res);
  }
);

app.intent('DontKnowIntent', {
    'utterances': [
      "i don't know",
      "don't know",
      "skip",
      "i don't know that",
      "who knows",
      "i don't know this question",
      "i don't know that one",
      "dunno"
    ]
  }, (req, res) => {
    const session = req.getSession();
    const prompt = new Speech()
    .say("Ok, no problem")
    .pause("Let's try next question");
    res.say(prompt.ssml(true))
    utils.newQuestion(req, res);

  }
);

app.intent('AMAZON.StartOverIntent', (req, res) => {
  res.say("Hello");
});

app.intent('AMAZON.RepeatIntent', (req, res) => {
  const session = req.getSession();
  const skillState = session.get('skill_state');

  if (skillState && skillState === SKILL_STATES.QA) {
    const repeat = session.get('repeat');
    const repeatPrompt = session.get('repeat_prompt');

    res.say(repeat)
    .say(repeatPrompt).shouldEndSession(false);
  }
});

app.intent('AMAZON.HelpIntent', (req, res) => {
  res.say("Hello");
});

app.intent('AMAZON.StopIntent', (req, res) => {
  res.say("Hello");
});

app.intent('AMAZON.CancelIntent', (req, res) => {
  res.say("Hello");
});

app.intent('AMAZON.YesIntent', (req, res) => {
  const session = req.getSession();
  const skillState = session.get('skill_state');

  if (skillState && skillState === SKILL_STATES.STARTED) {
    const prompt = new Speech()
    .say("Ok")
    .pause('500ms')
    .say("Now I will start a trivia quiz.")
    .pause('1s')
    .say("I will ask you 5 questions.")
    .pause('500ms')
    .say("You will have 90 seconds to solve each question.")
    .pause('1s')
    .say("Faster you do it, more you will score")
    .pause('1s')
    .say("Whenever you are done with a question, say alexa, tell math hero my answer is X.")
    .pause('500ms')
    .say("Where X can be A, B, C, D or E")
    .pause('500ms')
    .say("For example, you can say, alexa, tell math hero my answer is B")
    .pause('1s')
    .say("So, let's get started")
    .pause('1s')

    res.say(prompt.ssml(true));

    questions.startSession()

    utils.newQuestion(req, res);
  }
});

app.intent('AMAZON.NoIntent', (req, res) => {
  const session = req.getSession();
  const skillState = session.get('skill_state');

  if (skillState && skillState === SKILL_STATES.QA) {
    const prompt = new Speech()
    .say("Sure.")
    .pause('1s')
    .say("Your timer start now, call me when you are done");

    session.set('start_time', Date.now());
    res.say(prompt.ssml(true))
  }
});

app.intent('Unhandled', (req, res) => {
  res.say("Hello");
});


app.sessionEnded((req, res) => {
  console.log('Session Ended');
});

if (process.argv.length > 2) {
  console.log(app.schemas.askcli('math hero'))
}
exports.handler = app.lambda();
