var express = require('express')
  , app = express(app)
  , server = require('http').createServer(app)
  , path = require('path');
//global.jQuery = require('jquery');
//require('bootstrap');

app.use(express.static(__dirname));

var connections = {};
var rooms = {};

var Eureca = require('eureca.io');
var eurecaServer = new Eureca.Server({allow:['cleanChat.welcome', 'cleanChat.send', 'cleanChat.setUserList', 'cleanChat.removeUser', 'cleanChat.addUser']});

eurecaServer.attach(server);

app.get('/', function (req, res, next) {
	res.sendFile(path.join(__dirname, 'index.html'));
}); 

app.get('/chat/:chatId', function (req, res, next) {
	//console.log(req.params.chatId);
	res.sendFile(path.join(__dirname, 'chat.html'));
}); 


eurecaServer.onConnect(function (connection) {
    //console.log('New client ', connection.id, connection.eureca.remoteAddress);
	connections[connection.id] = {nick:null, room:null, client:eurecaServer.getClient(connection.id)};
});

eurecaServer.onDisconnect(function (connection) { 
    //console.log('Client quit', connection.id);
	cleanChatServer.removeUser(connections[connection.id].nick, connections[connection.id].room);
	delete connections[connection.id];
});

var cleanChatServer = eurecaServer.exports.cleanChatServer = {};

cleanChatServer.login = function (nick, roomId) {
	//console.log('Client %s auth with %s', this.connection.id, nick);
	var id = this.connection.id;
	if (nick !== undefined)
	{
		connections[id].nick = nick;
		connections[id].room = roomId;
		connections[id].client.cleanChat.welcome();
	}
	cleanChatServer.addUser(connections[id].nick, connections[id].room);
}

cleanChatServer.send = function (message) {
	var sender = connections[this.connection.id];
	for (var c in connections)
	{
		if (sender.room == connections[c].room)
			connections[c].client.cleanChat.send(sender.nick, message, getFormattedDate());
	}
}

cleanChatServer.setUserList = function(){
	var users = [];
	for (var c in connections)
	{
		if (connections[c].nick && connections[c].nick != connections[this.connection.id].nick && connections[c].room == connections[this.connection.id].room)
			users.push(connections[c].nick);
	}

	connections[this.connection.id].client.cleanChat.setUserList(users);

}

cleanChatServer.removeUser = function(nick, room){

	if(!nick)
		return;

	for (var c in connections){
		if (room == connections[c].room)
			connections[c].client.cleanChat.removeUser(nick);
	}

}

cleanChatServer.addUser = function(nick, room){

	if(!nick)
		return;

	for (var c in connections){
		if (room == connections[c].room)
			connections[c].client.cleanChat.addUser(nick);
	}

}

function getFormattedDate() {
    var date = new Date()
    	, dd = date.getDate()
    	, mm = date.getMonth()+1
    	, hours = date.getHours()
    	, minutes = date.getMinutes()
    	, seconds = date.getSeconds();

    if(dd<10)
        dd='0'+dd;

    if(mm<10)
        mm='0'+mm;

    if(hours<10)
        hours='0'+hours;

    if(minutes<10)
        minutes='0'+minutes;

    if(seconds<10)
        seconds='0'+seconds;

    return date.getFullYear() + "-" + mm + "-" + dd + " " +  hours + ":" + minutes + ":" + seconds;
}

server.listen(8000);