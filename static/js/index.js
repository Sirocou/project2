document.addEventListener('DOMContentLoaded', () => {
    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    // When connected, configure the form
    socket.on('connect', () => {
        var button = document.getElementsByTagName('button')[0];
        
        function newuser(){
            console.log("creating new user");
            hint.innerHTML = "Type in a new username";
            button.innerHTML = "Submit";
            var validate = function(){
                socket.emit('username list');
                console.log('hello');
            };
            validate();
            uname_in.onkeyup = validate;

            socket.on('users', data => {
                console.log(data);
                validateUsername(data, uname_in);
            });
            
            form.onsubmit = function(){
                localStorage.setItem('uname', uname_in.value);
            };
        }

        // Get form object
        var form = document.getElementsByTagName('form')[0];

        // Get username input
        var uname_in = document.getElementsByName('username')[0];

        var hint = document.getElementById('hint');

        // Check if the localstorage has username
        if (localStorage.getItem('uname')){
            // Retrieve username
            var uname = localStorage.getItem('uname');

            // Remove input field for username
            uname_in.value = uname;
            hint.innerHTML = "Continue with existing username or type a new one";
            uname_in.onkeyup = newuser;

            button.innerHTML = "Continue";
        }
        else {
            newuser();
        }
    });
});

function validateUsername(users, uname_in) {
    if (users.includes(uname_in.value)) {
        uname_in.setCustomValidity("Username is not available");
    }
    else {
        uname_in.setCustomValidity("");
    }
}
