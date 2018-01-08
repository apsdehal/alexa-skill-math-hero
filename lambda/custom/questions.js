'use strict';

const fs = require('fs');

let lines = fs.readFileSync('./test.json').toString().split('\n');

const total = lines.length;

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function containsNonLatinCodepoints(s) {
    return /[^\u0000-\u00ff]/.test(s);
}

function getQuestionFromIndex(index) {
  let question = JSON.parse(lines[index]);
  return question;
}

let selected = [];

let questions = {
  startSession: () => {
    selected = [];
  },
  getNewQuestion: () => {
    let nex = getRandomInt(total);
    let question = getQuestionFromIndex(nex);

    while(selected.indexOf(nex) !== -1 || containsNonLatinCodepoints(question['question'])) {
      nex = getRandomInt(total);
      question = getQuestionFromIndex(nex);
    }

    selected.push(nex);
    return question;
  }
}

module.exports = questions
