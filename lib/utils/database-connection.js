var path = require('path');
var nedb = require('nedb');

exports.openDatabase = function (name) {
  var db = new nedb({ filename: path.join('./lib/database/' + name + '.db'), autoload: true });
  return db;
};
