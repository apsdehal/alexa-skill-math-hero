const Speech = require('ssml-builder');
const questions = require('./questions');
const constants = require('./constants');

const SKILL_STATES = constants.SKILL_STATES;

const NUM_TO_WORD_MAP = ['first', 'second', 'third', 'fourth', 'fifth'];

const utils = {
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
      .say("You can check you screen or app for clear information");
  },

  newQuestion: (req, res) => {
    const session = req.getSession();
    let questionCounter = session.get('question_counter');

    if (!questionCounter) {
      questionCounter = 0;
    }

    const questionClearPrompt = new Speech()
    .pause('1s')
    .say("If you want me to repeat the question,")
    .pause('1s')
    .say("say repeat")
    .pause("1s")
    .say("otherwise say no")
    .ssml(true);

    const question = questions.getNewQuestion();
    const questionPrompt = utils.getQuestionSpeechWithOptions(question, questionCounter).ssml(true);

    session.set('skill_state', SKILL_STATES.QA);
    session.set('question_counter', questionCounter + 1);
    if (questionCounter == 0) {
      session.set('score', 0)
    }
    session.set('repeat', questionPrompt);
    session.set('repeat_prompt', questionClearPrompt)
    session.set('answer', question['correct']);
    session.set('rationale', question['rationale']);

    res.say(questionPrompt)
    .say(questionClearPrompt).shouldEndSession(false);
  }
}

module.exports = utils;
