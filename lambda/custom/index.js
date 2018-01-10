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
const MAX_TIME = 180000;

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


app.intent('TriviaIntent', {
    'utterances': [
      'start a {trivia|quiz}',
      'start {trivia|quiz}',
      'let\' {play|talk}',
      '{play|talk|start}'
    ],
  },
  (req, res) => {
    req.getSession().set('skill_state', SKILL_STATES.STARTED);

    app.intents['AMAZON.YesIntent'].handler(req, res);
  }
)

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
    const skillState = req.getSession().get('skill_state');

    if (!skillState || skillState !== SKILL_STATES.QA) {
      res.say("Sorry, You must start a trivia to answer a question").shouldEndSession(false);
      return;
    }
    const answer = req.slots['choices'].value[0];
    const awesomes = ["awesome", "woot", "great", "hurray", "ha", "good"];
    const bads = ["unfortunately", "sorry", "apologies", "sadly", "Hmmm"];
    let speech = new Speech("You gave option " + answer + " as the answer");
    res.say(speech.ssml(true)).shouldEndSession(false);

    const session = req.getSession();
    const correctAnswer = session.get('answer');

    if (correctAnswer.trim().toLowerCase() === answer.trim().toLowerCase()) {
      const currentTime = Date.now();

      const session = req.getSession();

      const diff = currentTime - session.get('start_time');

      if (diff > MAX_TIME) {
        const prompt = new AmazonSpeech()
        .emphasis('strong', bads[utils.getRandomInt(bads.length)] + "!")
        .pause('1s')
        .say('You took more than 90 seconds to solve the problem.')
        .pause('500ms')
        .say('So, you received no score for this question')
        .pause('1s')
        .say('The correct answer is ' + correctAnswer);

        res.say(prompt.ssml(true)).shouldEndSession(false);
      } else {
        const currentScore = session.get('score');
        const scoreReceived = Math.round(((MAX_TIME - diff) / (MAX_TIME) * 1.0) * 100) / 100;

        const updatedScore = Math.round((currentScore + scoreReceived) * 100) / 100 ;

        const prompt = new AmazonSpeech()
        .emphasis('strong', awesomes[utils.getRandomInt(awesomes.length)] + "!")
        .pause('1s')
        .say("That is the correct answer!")
        .pause('1s')
        .say("You took " + diff / 1000 + " seconds to solve this question")
        .pause('1s')
        .say("and you received " + scoreReceived + " points")
        .pause('1s')
        .say("Your current score is " + updatedScore);

        session.set('score', updatedScore);
        res.say(prompt.ssml(true)).shouldEndSession(false);
      }
    } else {
      const prompt = new AmazonSpeech()
      .emphasis('strong', bads[utils.getRandomInt(bads.length)] + "!")
      .pause('1s')
      .say("That is incorrect")
      .pause('1s')
      .say('The correct answer is ' + correctAnswer);

      res.say(prompt.ssml(true)).shouldEndSession(false);
    }

    session.set("skill_state", SKILL_STATES.RATIONALE);

    utils.displayCard(req, res, true);

    const counter = session.get('question_counter');

    speech = new Speech()
    .pause('1s')
    .say("Rationale for this question has been posted to your alexa app")

    const nextQuestionPrompt = new Speech()
    .pause('1s')
    .say("Should I ask next question?")
    .pause('1s')
    .say("Say yes or no.");

    if (counter === 4) {
      res.say(speech.ssml(true)).shouldEndSession(false);
      utils.finishSession(req, res);
    } else {
      res.say(speech.ssml(true)).say(nextQuestionPrompt.ssml(true)).shouldEndSession(false);
    }
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
    const skillState = session.get('skill_state');

    if (skillState && skillState === SKILL_STATES.QA) {
      session.set("skill_state", SKILL_STATES.RATIONALE);

      utils.displayCard(req, res, true);

      const counter = session.get('question_counter');

      const speech = new Speech()
      .say("Ok, no problem")
      .pause('1s')
      .say("Rationale for this question has been posted to your alexa app")

      const nextQuestionPrompt = new Speech()
      .pause('1s')
      .say("Should I ask next question?")
      .pause('1s')
      .say("Say yes or no.");

      if (counter === 4) {
        res.say(speech.ssml(true)).shouldEndSession(false);
        utils.finishSession(req, res);
      } else {
        res.say(speech.ssml(true)).say(nextQuestionPrompt.ssml(true)).shouldEndSession(false);
      }
    }
  }
);

app.intent('AMAZON.StartOverIntent', (req, res) => {
  res.say("Hello");
});

app.intent('AMAZON.RepeatIntent', (req, res) => {
  const session = req.getSession();
  const skillState = session.get('skill_state');
  const repeatState = session.get('repeated');

  if (skillState && skillState === SKILL_STATES.QA && repeatState === 0) {
    const repeat = session.get('repeat');
    session.set('repeated', 1);

    res.shouldEndSession(false);
    res.say(repeat).send()
  }
});

app.intent('AMAZON.HelpIntent', (req, res) => {
  const prompt = new Speech()
  .say("In each trivia")
  .pause('500ms')
  .say("I will ask you 5 questions.")
  .pause('500ms')
  .say("You will have 3 minutes to solve each question.")
  .pause('1s')
  .say("Faster you do it, more you will score")
  .pause('1s')
  .say("The timer for question starts as soon as I start speaking")
  .pause('1s')
  .say("You can also ask me to repeat a question once")
  .pause('1s'           )
  .say("Whenever you are done with a question, say alexa, tell math hero my answer is X.")
  .pause('500ms')
  .say("Where X can be A, B, C, D or E")
  .pause('500ms')
  .say("For example, you can say, alexa, tell math hero my answer is B")
  .pause('1s')
  .say("or if you don't know, you can say, alexa, tell math hero, i don't know")
  .pause('1s');

  req.getSession().clear();
  res.say(prompt.ssml(true)).shouldEndSession(false);
});

app.intent('AMAZON.StopIntent', (req, res) => {
  res.say("Sure, let's play some other time").shouldEndSession(true);
  req.getSession().clear()
});

app.intent('AMAZON.CancelIntent', (req, res) => {
  res.say("Sure, let's play some other time").shouldEndSession(true);
  req.getSession().clear()
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
    .say("For more information, on how to answer ask alexa for help")
    .pause('1s')
    .say("So, let's get started")
    .pause('1s')

    res.say(prompt.ssml(true)).shouldEndSession(false);

    questions.startSession()

    utils.newQuestion(req, res);
  } else if (skillState && skillState === SKILL_STATES.RATIONALE) {
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
    res.say(prompt.ssml(true)).shouldEndSession(false);
  } else if (skillState && skillState === SKILL_STATES.RATIONALE) {
    utils.finishSession(req, res);
  }
});

app.intent('Unhandled', (req, res) => {
  res.say("Sorry, I don't know that one").shouldEndSession(false);
});


app.sessionEnded((req, res) => {
  console.log('Session Ended');
});

if (process.argv.length > 2) {
  console.log(app.schemas.askcli('math hero'))
}
exports.handler = app.lambda();
