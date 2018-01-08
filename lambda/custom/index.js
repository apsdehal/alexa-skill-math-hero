'use strict'

const alexa = require('alexa-app');
const Speech = require('ssml-builder');
const questions = require('./questions');
const utils = require('./utils');

const app = new alexa.app('math-hero');

app.customSlot('choices', ['A', 'B', 'C', 'D', 'E'])

const SKILL_STATES = {
  STARTED: 'started',
  QA: 'question_asked'
}

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
    "slots": {
      "choices": "choices"
    },
    "utterances": [
      "my {answer|solution} is {-|choices}",
      "{answer|solution} is {-|choices}",
      "correct option is {-|choices}",
      "correct {answer|solution} is {-|choices}",
      "{-|choices}"
    ]
  },
  (req, res) => {
    res.say("You gave answer this").reprompt("Yes, this");
  }
);

app.intent('DontKnowIntent', (req, res) => {
  res.say("Ok, you don't know");
});

app.intent('AMAZON.StartOverIntent', (req, res) => {
  res.say("Hello");
});

app.intent('AMAZON.RepeatIntent', (req, res) => {
  const session = req.getSesion();
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
    .say("You will have 1 minute to solve each question.")
    .pause('1s')
    .say("So let's get started");

    res.say(prompt.ssml(true));

    questions.startSession()


    const questionClearPrompt = new Speech()
    .pause('1s')
    .say("If you want me to repeat the question,")
    .pause('500ms')
    .say("say repeat otherwise say no").ssml(true);

    const question = questions.getNewQuestion();
    const questionPrompt = utils.getQuestionSpeechWithOptions(question).ssml(true);

    session.set('skill_state', SKILL_STATES.QA);
    session.set('repeat', questionPrompt);
    session.set('repeat_prompt', questionClearPrompt)
    session.set('answer', question['correct']);
    session.set('rationale', question['rationale']);

    res.say(questionPrompt)
    .say(questionClearPrompt).shouldEndSession(false);

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
