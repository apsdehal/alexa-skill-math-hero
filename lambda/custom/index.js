'use strict'

const alexa = require('alexa-app');
const Speech = require('ssml-builder');
const AmazonSpeech = require('ssml-builder/amazon_speech');
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
    const answer = req.slots['choices'].value;
    const awesomes = ["awesome", "woot", "great", "hurray", "ha", "good"];
    const bads = ["unfortunately", "sorry", "apologies", "sadly", "Hmmm"];
    let speech = new Speech("You gave option " + answer + " as the answer");
    res.say(speech.ssml(true));

    const session = req.getSession();
    if (session.get('answer').trim() === answer.trim()) {
      const currentTime = Date.now();

      const session = req.getSession();

      const diff = currentTime - session.get('start_time');

      if (diff < 0) {
        const prompt = new AmazonSpeech()
        .emphasis(bads[utils.getRandomInt(bads.length)] + "!")
        .pause('1s')
        .say('You took more than 90 seconds to solve the problem.')
        .pause('500ms')
        .say('So, you received no score for this question')
        .pause('1s')
        .say('The correct answer is ' + answer);

        res.say(prompt.ssml(true));
      } else {
        const currentScore = session.get('score');
        const scoreReceived = diff / (90000) * 1.0;

        const updatedScore = currentScore + scoreReceived;

        const prompt = new AmazonSpeech()
        .emphasis(awesomes[utils.getRandomInt(awesomes.length)] + "!")
        .pause('1s')
        .say("That is the correct answer!")
        .pause('1s')
        .say("You received " + scoreReceived + " for this question")
        .pause('1s')
        .say("Your current score is " + updatedScore);

        session.set('score', updatedScore);
        res.say(prompt.ssml(true));
      }
    } else {
      const prompt = new AmazonSpeech()
      .emphasize(bads[utils.getRandomInt(bads.length)] + "!")
      .pause('1s')
      .say("That is incorrect")
      .pause('1s')
      .say('The correct answer is ' + answer);

      res.say(prompt.ssml(true));
    }

    session.set("skill_status", SKILL_STATES.RATIONALE);

    speech = new Speech()
    .pause('1s')
    .say("Would you like to know the rationale for this answer?")
    .pause("Say yes or no.")
    res.say(speech.ssml(true)).shouldEndSession(false);
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
  } else if (skillState && skillState === SKILL_STATES.RATIONALE) {
    const prompt = new Speech()
    .say("Ok, the rationale for this question is")
    .pause("1s")
    .say(session.get('rationale'));

    res.say(prompt.ssml(true));

    let counter = session.get('question_counter');
    if (counter === 4) {
      utils.finishSession(req, res);
    } else {
      utils.newQuestion(req, res);
    }

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
  } else if (skillState && skillState === SKILL_STATES.RATIONALE) {
    let counter = session.get('question_counter');
    if (counter === 4) {
      utils.finishSession(req, res);
    } else {
      utils.newQuestion(req, res);
    }
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
