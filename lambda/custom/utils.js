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
      .say("You can check you screen or alexa app for clear information");
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

    // TODO: Add card support
    utils.displayCard(req, res);

    res.shouldEndSession(false);
    res.say(questionPrompt)
    .say(endPrompt.ssml(true)).send()
    session.set('start_time', Date.now());
  },

  displayCard: (req, res, rationale=false) => {
    const session = req.getSession();
    const questionNumber = session.get('question_counter');
    const question = session.get('question');
    let title = 'Question No. ' + questionNumber;
    let content = question['question'] + '\nOptions:\n' + question['options'].join('\n');
    if (rationale) {
      content = question['rationale'];
      title += ' Rationale'
    }
    res.card({
      type: 'Simple',
      title: title,
      content: content
    });
  },

  finishSession: (req, res) => {
    const session = req.getSession();
    const score = session.get("score");

    const totalScore = session.get('total_score');
    const level = session.get('level');

    const newLevel = Math.ceil((totalScore + score) / 5);

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
