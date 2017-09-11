// Eg: coco98.imad.hasura-app.io/articles/article-one will result in article-one
var currentArticleTitle = window.location.panthname.split('/')[2];

function loadCommentForm () {
    var commentFormHtml = `
        <h5>Submit a comment</h5>
        <textarea id="comment_text" rows = "5" cols = "100"placeholder = "Enter your comment here..."></textarea>
        <br/>
        <input type = "submit" id = "submit" value = "Submit" />
        <br/>
    `;
    document.getElementById('comment_form').innerHTML = commentFormHtml;
    
    
var submit = document.getElementById('submit');
submit.onclick = function(){
     //Create a request object
    var request = new XMLHttpRequest();
    
    //Capture the response and store it in a variable
    request.onreadystatechange = function(){
        if(request.readyState === XMLHttpRequest.DONE){
            //Take Some action
            if(request.status === 200){
                //clear the form &reload all the comments
                document.getElementById('comment_text').value = '';
                loadcomments();
            } else {
                alert('Error! Could not submit comment');
            }
            submit.value = 'Submit';
    }
};
    
    //Make the request
    var comment = document.getElementById('comment_text').value;
    request.open('POST', '/submit-comment' + currentArticleTitle, true);
    request.setRequestHeader('Content-Type','application/json');
    request.send(JSON.stringify({comment: comment}));
    submit.value = 'Submitting...';
    
    
};
}

function loadLogin(){
    //check if the user is already logged in
    var request = new XMLHttpRequest();
    request.onreadystatechange = function(){
        if(request.readyState === XMLHttpRequest.DONE){
            if(request.status === 200){
                loadCommentForm(this.responseText);
            }
        }
    };
    
    request.open('GET','/check-login',true);
    request.send(null);
}

function escapeHtml(text){
    var $text = document.createTextNode(text);
    var $div = document.createElement('div');
    $div.appendChild($text);
    return $div.innerHTML;
}

function loadComents(){
    //checl if the user is already logged in
    var request = new XMLHttpRequest();
    request.onreadystatechange = function(){
        if(request.readyState === XMLHttpRequest){
            if (request.status === 200){
                var content = '';
                var commentData = JSON.parse(this.responseText);
                for(var i=0; i<commentData.lenght;i++){
                    var time = new Date (commentData[i].timestamp);
                    content += `<div class = "comment">
                    <p>${escapeHtml(commentData[i].comment)}</p>
                    <div class = "commenter>
                        ${commentData[i].username} -${time.toLocalTimeString()} on ${time.toLocalDateString()}
                    </div>
                    </div>
                    `;
                }
                comments.innerHTML = content
            } else{
                comments.innerHTML('Oops! Could not load comments!');
            }
        }
    };
    
    request.open('GET','/get-comments/' + currentArticleTitle, ture);
    request.send(null);
}


// The first thing to do is to check if the user is logged in!
loadLogin();
loadComments();

