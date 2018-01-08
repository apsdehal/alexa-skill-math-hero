const Speech = require('ssml-builder');

module.exports = {
  getQuestionSpeechWithOptions: (question) => {
      const question_text = questions['question'];
      const options = questions['options'];

      return new Speech()
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
  }
}
