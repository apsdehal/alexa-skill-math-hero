'use strict'

const alexa = require('alexa-app');
const Speech = require('ssml-builder');
const AmazonSpeech = require('ssml-builder/amazon_speech');
const questions = require('./questions');
const utils = require('./utils');
const constants = require('./constants')
const db = require('./db');
const app = new alexa.app('math-hero');

app.customSlot('choices', ['A', 'B', 'C', 'D', 'E'])

const SKILL_STATES = constants.SKILL_STATES;
const MAX_TIME = constants.MAX_TIME;

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
  session.set('skill_state', SKILL_STATES.STARTED);

  const checkIfUserExistsParams = {
    TableName: db.table,
    Key: {
      user_id: req.userId
    }
  };

  return db.get(checkIfUserExistsParams).then(data => {
    const user = data.Item;

    if (user) {
      session.set('total_score', user.score);
      session.set('level', user.level);

      session.set('avail_time', utils.getAvailTime(user.level));
      prompt = new Speech()
      .say("Hello")
      .pause('1s')
      .say("Welcome back to Math hero.")
      .pause('1s')
      .say('Your current score is: ' + user.score)
      .pause('1s')
      .say("Would you like to start a trivia quiz?")
      res.say(prompt.ssml(true)).reprompt(reprompt).shouldEndSession(false);
      return res.send()
    } else {
      const addUserParams = {
        TableName: db.table,
        Item: {
          user_id: req.userId,
          score: 0,
          level: 1
        }
      }

      return db.put(addUserParams).then(data => {
        session.set('total_score', 0);
        session.set('level', 1);
        session.set('avail_time', MAX_TIME);

        res.say(prompt).reprompt(reprompt).shouldEndSession(false);
        return res.send();
      }, data => {
        res.say('something went wrong, please try again').shouldEndSession(true);
        return res.send();
      });
    }
  }, data => {
    res.say('something went wrong, please try again').shouldEndSession(true);
    return res.send()
  });
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
    const session = req.getSession();
    session.set('skill_state', SKILL_STATES.STARTED);

    const checkIfUserExistsParams = {
      TableName: db.table,
      Key: {
        user_id: req.userId
      }
    };

    return db.get(checkIfUserExistsParams).then(data => {
      const user = data.Item;
      if (user) {
        session.set('total_score', user.score);
        session.set('level', user.level);

        session.set('avail_time', utils.getAvailTime(user.level));
        return app.intents['AMAZON.YesIntent'].handler(req, res);
      } else {
        const addUserParams = {
          TableName: db.table,
          Item: {
            user_id: req.userId,
            score: 0,
            level: 1
          }
        }

        return db.put(addUserParams).then(data => {
          return app.intents['AMAZON.YesIntent'].handler(req, res);
        }, data => {
          res.say('something went wrong, please try again').shouldEndSession(true);
          return res.send();
        });
      }
    }, data => {
      res.say('something went wrong, please try again').shouldEndSession(true);
      return res.send()
    });
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
      "{-|choices}",
      "is it {-|choices}"
    ]
  },
  (req, res) => {
    const skillState = req.getSession().get('skill_state');
    const dbParams = {
      TableName: db.table,
      Key: {
        user_id: req.userId
      }
    };

    return db.get(dbParams).then(success, failure);

    function failure(data) {
      res.say("Sorry, You must start a trivia to answer a question").shouldEndSession(true);
      return res.send();
    }

    function success(data) {
      const user = data.Item;
      if (!user) {
        return failure(data);
      }

      if (!user.answer) {
        return failure(data);
      }
      const session = req.getSession();
      utils.setSessionStuffFromUser(session, user);

      if (!req.slots['choices'].value || req.slots['choices'].value.length !== 1) {
        const speech = new Speech()
        .say("Sorry, answer must be one of A, B, C, D, or E")
        .pause('1s')
        .say("Otherwise, you can say I don't know")
        return res.say(speech.ssml(true)).send();
      }
      const answer = req.slots['choices'].value[0];
      const awesomes = ["awesome", "woot", "great", "hurray", "ha", "good"];
      const bads = ["unfortunately", "sorry", "apologies", "sadly", "Hmmm"];
      let speech = new Speech("You gave option " + answer + " as the answer");
      res.say(speech.ssml(true)).shouldEndSession(false);

      const correctAnswer = user.answer;
      if (correctAnswer.trim().toLowerCase() === answer.trim().toLowerCase()) {
        const currentTime = Date.now();

        const session = req.getSession();

        const diff = currentTime - user.start_time;
        const availTime = utils.getAvailTime(user.level);
        if (diff > availTime) {
          const prompt = new AmazonSpeech()
          .emphasis('strong', bads[utils.getRandomInt(bads.length)] + "!")
          .pause('1s')
          .say('You took more than ' + Math.round(availTime / 1000) + ' seconds to solve the problem.')
          .pause('500ms')
          .say('So, you received no score for this question')
          .pause('1s')
          .say('The correct answer is ' + correctAnswer);

          res.say(prompt.ssml(true)).shouldEndSession(false);
        } else {
          const currentScore = user.current_score;
          const scoreReceived = Math.round(((availTime - diff) / (availTime) * 1.0) * 100) / 100;
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
      session.set('rationale', user.rationale)

      utils.displayCard(req, res, true);

      const counter = user.question_counter;

      speech = new Speech()
      .pause('1s')
      .say("Rationale for this question has been posted to your alexa app")

      const nextQuestionPrompt = new Speech()
      .pause('1s')
      .say("Should I ask next question?")
      .pause('1s')
      .say("Say yes or no.");

      if (counter === 5) {
        res.say(speech.ssml(true)).shouldEndSession(false);
        return utils.finishSession(req, res);
      } else {
        res.say(speech.ssml(true)).say(nextQuestionPrompt.ssml(true)).shouldEndSession(false);
        return res.send();
      }
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

    const dbParams = {
      TableName: db.table,
      Key: {
        user_id: req.userId
      }
    };

    function failure(data) {
      res.say("Sorry, You must start a trivia to answer a question").shouldEndSession(true);
      return res.send();
    }

    return db.get(dbParams).then(success, failure);

    function success(data) {
      const user = data.Item;

      if (!user) {
        return failure(data);
      }
      session.set("skill_state", SKILL_STATES.RATIONALE);

      utils.setSessionStuffFromUser(session, user);
      utils.displayCard(req, res, true);

      const counter = user.question_counter;

      const speech = new Speech()
      .say("Ok, no problem")
      .pause('1s')
      .say("Rationale for this question has been posted to your alexa app")

      const nextQuestionPrompt = new Speech()
      .pause('1s')
      .say("Should I ask next question?")
      .pause('1s')
      .say("Say yes or no.");

      if (counter === 5) {
        res.say(speech.ssml(true)).shouldEndSession(false);
        return utils.finishSession(req, res);
      } else {
        res.say(speech.ssml(true)).say(nextQuestionPrompt.ssml(true)).shouldEndSession(false);

        return res.send();
      }
    }
  }
);

app.intent('AMAZON.StartOverIntent', (req, res) => {
  res.say("Hello");
});

app.intent('AMAZON.RepeatIntent', (req, res) => {
  const dbParams = {
    TableName: db.table,
    Key: {
      user_id: req.userId
    }
  };

  return db.get(dbParams).then((data) => {

    const user = data.Item;

    if (!user.answer) {
      res.say("Please start a trivia so that we have a question to repeat");
      return res.send();
    } else {
      const repeat = user.repeat;
      res.shouldEndSession(true);
      res.say(repeat);

      return res.send();
    }

  }, (data) => {
    res.say("Something went wrong, please try again");
    return res.send();
  })
});

app.intent('AMAZON.HelpIntent', (req, res) => {
  const session = req.getSession();
  function getPrompt(secs) {
    const prompt = new Speech()
    .say("You can start a trivia by saying, alexa, ask math hero to start a trivia")
    .pause('1s')
    .say("In each trivia")
    .pause('500ms')
    .say("I will ask you 5 questions.")
    .pause('500ms')
    .say("You will have " + secs + " seconds to solve each question.")
    .pause('1s')
    .say("Faster you do it, more you will score")
    .pause('1s')
    .say("After a certain score, you will level up")
    .pause('1s')
    .say("The timer for question starts as soon as I start speaking")
    .pause('1s')
    .say("You can also ask me to repeat a question once")
    .pause('1s'           )
    .say("Whenever you are done with a question, you need to invoke the skill again, say alexa, tell math hero my answer is X.")
    .pause('500ms')
    .say("Where X can be A, B, C, D or E")
    .pause('500ms')
    .say("For example, you can say, alexa, tell math hero my answer is B")
    .pause('1s')
    .say("or if you don't know, you can say, alexa, tell math hero, i don't know")
    .pause('1s')
    .say("What would you like to do?");
    return prompt;
  }

  const availTime = session.get('avail_time');

  if (availTime) {
    req.getSession().clear("question_counter");
    res.say(getPrompt(Math.round(availTime / 1000)).ssml(true)).shouldEndSession(false);

  } else {
    const getUserParams = {
      TableName: db.table,
      Key: {
        user_id: req.userId
      }
    };

    return db.get(getUserParams).then(data => {
      const user = data.Item;
      const availTime = MAX_TIME - 5000 * (parseInt(user.level, 10) - 1)

      req.getSession().clear("question_counter");
      res.say(getPrompt(Math.round(availTime / 1000)).ssml(true)).shouldEndSession(false);
      return res.send();
    })
  }

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
  const availTime = session.get('avail_time');

  if (skillState && skillState === SKILL_STATES.STARTED) {
    const prompt = new Speech()
    .say("Ok")
    .pause('500ms')
    .say("Now I will start a trivia quiz.")
    .pause('1s')
    .say("For more information, on how to answer ask alexa for help")
    .pause('1s')
    .say("You have " + Math.round(availTime / 1000) + " seconds to answer each question")
    .pause('1s')
    .say("So, let's get started")
    .pause('1s')

    res.say(prompt.ssml(true));

    questions.startSession()

    return utils.newQuestion(req, res);
  } else if (skillState && skillState === SKILL_STATES.RATIONALE) {
    let counter = session.get('question_counter');
    if (counter === 5) {
      return utils.finishSession(req, res);
    } else {
      return utils.newQuestion(req, res);
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
    return utils.finishSession(req, res);
  }
});

app.intent('Unhandled', (req, res) => {
  res.say("Sorry, I don't know that one").shouldEndSession(false);
});


app.sessionEnded((req, res) => {
});

if (process.argv.length > 2) {
}
exports.handler = app.lambda();
