//Submit username/password to login
var submit = document.getElementById('submit_btn');
submit.onclick = function(){
    //MAke a request to the server and send the name 
     //Create a request object
    var request = new XMLHttpRequest();
    
    //Capture the response and store it in a variable
    request.onreadystatechange = function(){
        if(request.readyState === XMLHttpRequest.DONE){
            //Take Some action
            if(request.status === 200){
                //capture the list of name and render it as a list
                console.log('user is logged in');
                alert('Logged in Successfully');
            } else if (request.status === 403){
                alert('Username/Password is incorrect');
            } else if (request.status === 500){
                alert('Something went wrong on the server');
            }
    }
            //Not done yet
    };
    
    //Make the request
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    console.log(username);
    console.log(username);
    request.open('POST','http://hardikrathod62.imad.hasura-app.io/login',true);
    request.setRequestHeader('Content-Type','application/json');
    request.send(JSON.stringify({username: username, password: password}));
    
    
};