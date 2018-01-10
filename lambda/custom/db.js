const AWS = require('aws-sdk');
const promisify = require('es6-promisify');

const table = 'math-hero-users';

const docClient = new AWS.DynamoDB.DocumentClient();

// convert callback style functions to promises
const scan = promisify(docClient.scan, docClient);
const get = promisify(docClient.get, docClient);
const put = promisify(docClient.put, docClient);
const del = promisify(docClient.delete, docClient);



module.exports = {
  scan,
  get,
  put,
  del,
  table
};
