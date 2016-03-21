var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

function McJs() {
    this.app = app;
}