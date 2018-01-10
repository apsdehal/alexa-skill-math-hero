const Speech = require('ssml-builder');
const questions = require('./questions');
const constants = require('./constants');

const SKILL_STATES = constants.SKILL_STATES;

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

    const timerPrompt = new Speech()
    .pause('1s')
    .say("Your timer starts now.")
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
    .say(timerPrompt.ssml(true)).send()
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
    const prompt = new Speech()
    .say("Your final score is " + score)
    .pause('1s')
    .say("Thanks for playing.")
    .pause('1s')
    .say("Ask alexa, to start math hero to play again anytime");

    session.clear();
    res.say(prompt.ssml(true)).shouldEndSession(true);
  }
}

module.exports = utils;
