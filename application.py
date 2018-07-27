import os
import sys

from flask import Flask, render_template, request, redirect
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

users = ['ronnie']
channels = [{
		'chname':'avatar',
		'creator':'someone',
		'messages':[{'asdfsad':'asdfsda'}, {'sdfsadf':'asdfsadf'}]
		},
		{
			'chname':'star wars',
			'creator':'anotherone',
			'messages':[]
		}
]

@app.route("/")
def index():
    return render_template("index.html")

@socketio.on('username list')
def senduserlist():
	emit('users', users, broadcast=True)

@socketio.on('req channels')
def sendchannellist():
	emit('res channels', channels, broadcast=True)

@socketio.on('add channel')
def updatechannellist(data):
	channels.append(data)

@socketio.on('req messages')
def sendmessages(data):
	chname = data['chname']
	messages = next((item for item in channels if item["chname"] == chname))['messages']
	emit('res messages', messages, broadcast=True)

@app.route("/auth", methods=["POST"])
def auth():
	if request.form['username']:
		uname = request.form['username']
		if uname not in users:
			users.append(uname)
	return redirect("/chat")

@app.route('/chat')
def chat():
	return render_template("chat.html", channels=channels)

@socketio.on('add message')
def addMessage(data):
	msgdict = {'uname':data['uname'], 'message':data['message']}
	messages = next((item for item in channels if item["chname"] == data['chname']))['messages']
	messages.append(msgdict)
	if len(messages) > 100:
		messages = messages[-100:]
		next((item for item in channels if item["chname"] == data['chname']))['messages'] = messages
	emit('message added', messages, broadcast=True)