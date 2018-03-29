var async = require("async")
var request = require("request");
var request = request.defaults({jar: true});
const fs = require('fs');

var username = "username"

var password = "password"

var api = "apikey"+":"

const express = require('express')
const app = express()



// holds values to pass into waterfall function
function values(callback){
	callback(null,username,password,api)
}



// API calls can initially be done against 'https://login.eagleeyenetworks.com' (The host url),
//  but after the authorization response is returned, API calls should 
//  then use the branded subdomain.
//  At this stage the branded host url will become 
//  'https://[active_brand_subdomain].eagleeyenetworks.com',
// where the 'active_brand_subdomain' field is returned in the authorization response

// First step is Authenticate, you pass the username and password and your api key
// and you recieve a token 
// referenced in https://apidocs.eagleeyenetworks.com/#1-authenticate
function authenticate(username,password,api,callback){
	request.post({
		url: 'https://login.eagleeyenetworks.com/g/aaa/authenticate',
		header: {
		    'Authorization' : api
		  },
		  formData : {
		    username: username,
		    password: password
			} 
		}, function (error, response, body) {
		  console.log("-------authenticate-------")
		  console.log('error: ', error); // Print the error if one occurred 
		  console.log('statusCode: ', response.statusCode); // Print the response status code if a response was received 
		  var token = JSON.parse(body).token;
		  console.log("token: ", token)
		  callback(null,api,token)
		})
	}

// Second step is Authorize, you pass the token and your api key
// and you recieve a cookie 
// you may pass the full response of cookie to any future calls 
// referenced in https://apidocs.eagleeyenetworks.com/#3-authorize
function authorize(api,token,callback){
	request.post({
	  url: "https://login.eagleeyenetworks.com/g/aaa/authorize",
	  header: {
	    'Authorization' : api,
	  },
	  formData: {
	          token : token
	         }
	      }, function (error, response, body) {
	      	console.log("-------authorize-------")
	        console.log("error : ", error)
	        console.log("response : ", response.statusCode)
	        var cookies = response.headers['set-cookie'];
	        console.log("cookies : ",  cookies)
	        callback(null, cookies)
		})
	}


	//gets list of camera the user has permission to view.
	//note that the camera esn has to be online to retrive video, or you will recieve a 400 error
function getDevices(cookies,callback){
	request.get({
		url:"https://login.eagleeyenetworks.com/g/device/list",
		header: {
	    'Authorization' : api,
	    'cookies': cookies
	  	}
	  },function (error, response, body) {
	  		var cameras = JSON.parse(body)
			console.log("-------authorize-------")
	        console.log("error : ", error)
	        console.log("response : ", response.statusCode)
	        // console.log("cameras : ",  cameras)
	  		console.log(cameras[15][1]) 
	  		var camera = cameras[15][1]
	  		callback(null, cookies, camera)
	  	})
	}


function getAuthKey(cookies,camera,callback){
		var holder=JSON.stringify(cookies)
		// console.log(holder)
		var holder =holder.split("auth_key=")
		holder = holder[1].split(";")
		console.log(holder[0])
		var sessionId= holder[0]
		callback(null,sessionId,camera)
	}

function renderPage(sessionId,camera,callback){

app.get('/', function(req, res) {
    res.send(("<HTML><body><iframe width=80% height=80% src=https://login.eagleeyenetworks.com/live/index.html?id="+camera+"&A="+sessionId+"/></body></html>"))
});
	app.listen(8080, '127.0.0.1')
	console.log("<iframe width=80% height=80% src='https://login.eagleeyenetworks.com/live/index.html?id="+camera+"&A="+sessionId+"'/>")
	callback(null)
}






//just a framework to force synchronous behavior in Node.js
async.waterfall([
	values,
    authenticate,
    authorize,
    getDevices,
    getAuthKey,
    renderPage
], function (err, result) {
    // result now equals 'done'
    console.log(err)
});