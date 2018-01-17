const Speech = require('ssml-builder');
const questions = require('./questions');
const constants = require('./constants');
const db = require('./db');

const SKILL_STATES = constants.SKILL_STATES;
const MAX_TIME = constants.MAX_TIME;

const NUM_TO_WORD_MAP = ['first', 'second', 'third', 'fourth', 'fifth'];

const utils = {
  getRandomInt: (max) => {
    return Math.floor(Math.random() * Math.floor(max));
  },

  getQuestionSpeechWithOptions: (question, questionCounter) => {
      const question_text = question['question'];
      const options = question['options'];

      return new Speech()
      .say("Your " + NUM_TO_WORD_MAP[questionCounter] + " question is:")
      .pause('1s')
      .say(question_text)
      .pause('1s')
      .say("Your options are:")
      .pause('1s')
      .say(options[0])
      .pause('1s')
      .say(options[1])
      .pause('1s')
      .say(options[2])
      .pause('1s')
      .say(options[3])
      .pause('1s')
      .say(options[4])
      .pause('1s')
      .say("You can check your screen or alexa app for clear information");
  },

  newQuestion: (req, res) => {
    const session = req.getSession();
    let questionCounter = session.get('question_counter');

    if (!questionCounter) {
      questionCounter = 0;
    }

    const question = questions.getNewQuestion();
    const questionPrompt = utils.getQuestionSpeechWithOptions(question, questionCounter).ssml(true);

    const endPrompt = new Speech()
    .pause('500ms')
    .say("Call me when you are done.")

    session.set('skill_state', SKILL_STATES.QA);
    session.set('question_counter', questionCounter + 1);
    if (questionCounter === 0) {
      session.set('score', 0)
    }
    session.set('repeat', questionPrompt);
    session.set('question', question);
    session.set('answer', question['correct']);
    session.set('rationale', question['rationale']);
    session.set('repeated', 0);
    session.set('start_time', Date.now());

    const dbParams = {
      TableName: db.table,
      Item: {
        user_id: req.userId,
        answer: question['correct'],
        rationale: question['rationale'],
        start_time: session.get('start_time'),
        current_score: session.get('score'),
        question_counter: session.get('question_counter'),
        score: session.get('total_score'),
        level: session.get('level'),
        repeat: questionPrompt
      }
    }


    return db.put(dbParams).then((data) => {
      utils.displayCard(req, res);

      res.shouldEndSession(true);
      res.say(questionPrompt)
      .say(endPrompt.ssml(true));

      return res.send();
    }, (data) => {
      return res.say('Something went wrong will fetching question').send();
    });

  },

  getAvailTime: (level) => {
    return MAX_TIME - 5000 * (parseInt(level, 10) - 1)
  },

  displayCard: (req, res, rationale=false) => {
    const session = req.getSession();
    const questionNumber = session.get('question_counter');
    let title = 'Question No. ' + questionNumber;
    let content;
    if (rationale) {
      content = session.get('rationale');
      title += ' Rationale'
    } else {
      const question = session.get('question');
      content = question['question'] + '\nOptions:\n' + question['options'].join('\n');
    }
    res.card({
      type: 'Simple',
      title: title,
      content: content
    });
  },

  setSessionStuffFromUser: (session, user) => {
    session.set('score', user.current_score);
    session.set('question_counter', user.question_counter);
    session.set('rationale', user.rationale);
    session.set('answer', user.answer);
    session.set('level', user.level);
    session.set('total_score', user.score);
  },

  finishSession: (req, res) => {
    const session = req.getSession();
    const score = session.get("score");

    const totalScore = session.get('total_score');
    const level = session.get('level');

    const newLevel = Math.ceil((totalScore + score + 1) / 5);

    const updateParams = {
      TableName: db.table,
      Item: {
        user_id: req.userId,
        score: totalScore + score,
        level: newLevel
      }
    }

    return db.put(updateParams).then(data => {
      session.clear();
      let prompt = new Speech()
      .say('Your final score is ' + score)
      .pause('1s')
      .say('Your current total score is' + (score + totalScore))
      .pause('1s');
      res.say(prompt.ssml(true));

      if (newLevel !== level) {
        prompt = new Speech()
        .say('Woot! You levelled up to level ' + newLevel)
        .pause('1s')
        .say('Now you will have ' + Math.round((MAX_TIME - 5000 * (newLevel - 1)) / 1000) + ' seconds to solve each question')
        .pause('1s')
        .say('You are making progress and to make you better challenges will become tougher.');
        res.say(prompt.ssml(true));
      }
      res.shouldEndSession(true);
      return res.send();
    }, data => {
      res.say("Something went wrong, sorry, please try again.").shouldEndSession(true);
      return res.send();
    })
  }
}

module.exports = utils;
