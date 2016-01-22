'use strict';

var mongodb = require('mongodb');
var Promise = require('bluebird');
var request = require('request');
var MongoClient = mongodb.MongoClient;
var Collection = mongodb.Collection;

Promise.promisifyAll(MongoClient);
Promise.promisifyAll(Collection.prototype);
Promise.promisifyAll(request);

module.exports = function (context, callback) {
  var mongoUrl = context.data.MONGO_URL;
  var gitHubToken = context.data.GITHUB_TOKEN;
  var body = context.body;
  var action = body.action;
  var repository = body.repository.full_name;
  var issue = body.issue;
  var user = body.comment && body.comment.user.login;
  var comment = body.comment && body.comment.body;
  var db;

  new Promise.resolve()
    .then(connect)
    .then(function () {
      if (action === 'opened') {
        return insertIssue({ issue: issue.number, repository: repository, body: issue.body });
      }
      else if (action === 'created' && /^(\+1)/.test(comment)) {
        return addUser({ issue: issue.number, repository: repository, user: user });
      }
      else if (action === 'created' && /^(-1)/.test(comment)) {
        return removeUser({ issue: issue.number, repository: repository, user: user });
      }
      else if (body.hook) {
        return;
      }
      else {
        throw new Error('invalid payload');
      }
    })
    .then(function () {
      callback();
    })
    .catch(function (err) {
      callback(err);
    })
    .finally(function () {
      db.close();
    });

  function connect() {
    return MongoClient.connectAsync(mongoUrl)
      .then(function (_db) {
        db = _db;
      });
  }

  function insertIssue(obj) {
    return db
      .collection('issues')
      .insertAsync(
        { issue: obj.issue, repository: obj.repository, body: obj.body, users: [] }
      );
  }

  function addUser(obj) {
    return db
      .collection('issues')
      .updateAsync(
        { issue: obj.issue, repository: obj.repository },
        { '$addToSet': { users: obj.user } }
      ).then(function () {
        return updateBody(obj);
      });

  }

  function removeUser(obj) {
    return db
      .collection('issues')
      .updateAsync(
        { issue: obj.issue, repository: obj.repository },
        { '$unset': { users: obj.user } }
      ).then(function () {
        return updateBody(obj);
      });
  }

  function updateBody(obj) {
    return db
      .collection('issues')
      .findOneAsync(
        { issue: obj.issue, repository: obj.repository }
      ).then(function (dbObj) {
        var usersList = (dbObj.users || [])
          .map(function (user) { return '- @' + user; })
          .join('\n');
        var usersLength = (dbObj.users || []).length;

        return requestAsync(
          {
            url: 'https://api.github.com/repos/' + obj.repository + '/issues/' + obj.issue,
            headers: {
              'Content-type': 'application/json',
              'Authorization': 'token ' + gitHubToken,
              'User-Agent': 'GH-List-App'
            },
            method: 'PATCH',
            json: {
              body: dbObj.body + '\n\n' + usersLength + ' *user' + (usersLength > 1 ? 's' : '') + '*:\n' + usersList
            }
          }
        );
      });
  }

  function requestAsync(payload) {
    return new Promise(function (resolve, reject) {
      request(payload, function (err, response) {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }
};
