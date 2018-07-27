// Connect to websocket
var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
var currentChannel;
var messageCount;
// get the username 'uname' from localStorage
// if there is no 'uname' in localStorage, it returns null
var uname = localStorage.getItem('uname');
document.addEventListener('DOMContentLoaded', () => {	

	$('#exampleModal').on('show.bs.modal', function () {
	  	var input = $('#msg-text')[0];
	  	setTimeout(function(){input.focus();}, 100);
		
	});

	// Let the user see his signed in username in place of the welcome message
	document.getElementById('welcome').innerHTML = "Signed in as "+uname;
	
	// This is to add a channel list item to the active class when they are active (hovered)
	toggleActiveClass();

    socket.on('connect', () => {

    	// Get channel name input field
    	var chname_in = document.getElementById('channelname');

    	// Get the new channel name input form
    	var form = document.getElementById('createchannel');

    	// This is a small hint under the input field
    	var hint = document.getElementById('hint');

    	// This function requests over the websocket for the current list of channels
    	var validate = function(){
            socket.emit('req channels');
            console.log('channel list requested');
        };

        // invoke the validate function for cases like the input field already has some data in it somehow
        validate();

        // invoke the validate function whenever a user types something
       	chname_in.onkeyup = validate;

        // This handles the received list of channels from the server
        // This is an implicit continuation of the validate function
    	socket.on('res channels', data => {

    		// create an empty array for the list of channels
    		var channels = [];

    		// add each channel item's channel name 'chname' to the array of channels
    		data.forEach(item => {
    			channels.push(item['chname']);
    		});

    		// validate that the channel name typed in the create channel field is unique
    		validateChannelname(channels, chname_in);

    		// this is for development purposes
    		console.log(channels);
    		console.log(data);
    	});

        form.onsubmit = function(event){

        	// prevent the form from default (being submitted)
        	// but do check its validity when submit button is clicked
        	event.preventDefault();

        	// Get the new channel name
        	var channel = chname_in.value;

        	// emit to the server an object of the new channel
        	socket.emit('add channel', {"chname":channel, "creator":uname, 'messages':[]});

        	// update the form so that the old input data is cleared
        	form.reset();

        	// note the user about the channel creation
        	document.getElementById('welcome').innerHTML = "New channel \'"+channel+"\' has been created by "+uname;

        	// Get hold of a channel item from the list of channels
        	var channelItem = document.querySelector('li.channels');

        	// Copy and customize the channel item for the new channel
        	var newChannelItem = channelItem.cloneNode(true);
        	newChannelItem.innerHTML = channel;

        	// Get hold of the list of channels and append the new channel item
        	var channelList = document.querySelector('ul.channels');
        	channelList.appendChild(newChannelItem);

        	// Create a new badge on the new channel item and initialize its value to 0
        	var badge = document.querySelector('span.badge');
        	var newBadge = badge.cloneNode(true);
        	newBadge.innerHTML = "0";
        	newChannelItem.appendChild(newBadge);

        	// Fix the data attribute
        	newChannelItem.dataset.channel = channel;

        	// Call the following method so that the updated list of channels is toggled
        	toggleActiveClass();

        	// Allow opening and writing messages
        	openChannel();
        };

        
	    openChannel();
	    displayMessages();
        
        var msgform = document.getElementById('msg-form');

		var messages = document.querySelector('div.messages');
		var messageTemp1 = document.querySelector('div.message');
		var messageTemp2 = messageTemp1.cloneNode(true);
		messageTemp1.style.display = 'none';

        msgform.onsubmit = function(event){
        	event.preventDefault();
        	var message = document.getElementById('msg-text').value;
            addMessage(message);
        	msgform.reset();
			
            updateScroll();

        	// Update the message count badge on channel classList
        	messageCount++;
        	var channelItem = $("[data-channel=\'"+currentChannel+"\']");
        	channelItem[0].children[0].innerHTML = messageCount;
        };

    });
	
	document.getElementById("msg-text")
	    .addEventListener("keydown", function(event) {
	    if (event.keyCode === 13) {
	    	event.preventDefault();
	        document.getElementById("submit-msg").click();
	    }
	});
});

// This is to check if the typed channel name is not already in the list of channels
function validateChannelname(channels, chname_in) {
	
	// This checks if the typed in name is in the 'channels' array
    if (channels.includes(chname_in.value)) {
        chname_in.setCustomValidity("Channel name is not available");
    }
    
    // Custom validity of null means that everything is okay
    // In this case, the user will not be prompted about validity
    else {
        chname_in.setCustomValidity("");
    }
}

// This is to add a functionality like active and inactive to channel list items
function toggleActiveClass(){

	// for each channel item in the channels list, make sure it has the following functionality
	document.querySelectorAll('li.channels').forEach(channelItem => {
		
		// when hovered, the item should be added to the active class 
		// also, the cursor should be shaped as pointer on hover event
		channelItem.onmouseover = function() {
			channelItem.classList.add('active');
			channelItem.style.cursor = 'pointer';
		};

		// when the hover event is over, remove the item from active class
		channelItem.onmouseleave = function(){
			channelItem.classList.remove('active');
		};
	});
}

function openChannel(){
	document.querySelectorAll('li.channels').forEach(channelItem => {
		channelItem.onclick = function(){
			var chname = channelItem.dataset.channel;
			currentChannel = chname;
			document.querySelector('h5.modal-title').innerHTML = 'Messages in '+chname;
			socket.emit('req messages', {'chname':chname});
			console.log(chname);
		}
	});
}

function displayMessages(){
	var messages = document.querySelector('div.messages');
	var messageTemp1 = document.querySelector('div.message');
	var messageTemp2 = messageTemp1.cloneNode(true);
	messageTemp1.style.display = 'none';

	socket.on('res messages', data => {
		console.log(data);
		messageCount = data.length;
		if (data.length == 0){
			messages.innerHTML = "No messages in this channel yet";
		}
		else {
            messages.innerHTML = "";
			data.forEach(item => {
				var messageElement = messageTemp2.cloneNode(true);
				var messageUnameEl = messageElement.children[0].children[0];
				var messageTextEl = messageElement.children[1];

				messageUnameEl.innerHTML = item['uname'];
				messageTextEl.innerHTML = item['message'];

				messages.appendChild(messageElement);
			});
		}
		$('#exampleModal').modal('show');
		updateScroll();
	});
}

function addMessage(message){
	socket.emit('add message', {'chname':currentChannel, 'uname':uname, 'message':message});
}

function updateScroll(){
    var element = document.querySelector('div.modal-body');
    element.scrollTop = element.scrollHeight;
}

