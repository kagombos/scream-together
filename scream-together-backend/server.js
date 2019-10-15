const express = require('express');
const app = express();
const cors = require('cors');

const webSocketServer = require('websocket').server;

const http = require("http");
const async = require('async');
const Pool = require('pg').Pool;

const pool = new Pool({
	user: 'postgres',
	host: 'localhost',
	database: 'scream-together',
	port: 5432
})

const server = http.createServer();
server.listen(5000);
//server.use(cors());
//app.use(express.json());


const wsServer = new webSocketServer({
	httpServer: server
});

const clients = {};

var value = 0;

const getUniqueID = () => {
	const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	return s4() + s4() + '-' + s4();
};

const sendMessage = (json) => {
	Object.keys(clients).map((client) => {
		clients[client].sendUTF(json);
	});
}

wsServer.on('request', function(request) {
	  var userID = getUniqueID();
	  console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');
	  const connection = request.accept(null, request.origin);
	  clients[userID] = connection;
	  console.log('connected: ' + userID + ' in ' + Object.getOwnPropertyNames(clients));
	  connection.sendUTF(JSON.stringify({ value: value }));
	  connection.on('message', function(message) {
		 if (message.type === 'utf8') {
			 const dataFromClient = JSON.parse(message.utf8Data);
			 value = dataFromClient.value;
			 sendMessage(JSON.stringify({ value: value }));
		 } 
	  });
	  connection.on('close', function(connection) {
		    console.log((new Date()) + " Peer " + userID + " disconnected.");
		    delete clients[userID];
		  });
	});
