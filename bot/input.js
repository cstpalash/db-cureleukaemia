'use strict'


function parseInput(request){
	console.log(JSON.stringify(request));
	var userid = request.sender;
	var time = request.originalRequest.timestamp;

	var payload = request.text;
	if(payload) 
		payload = payload.toLowerCase().trim();
	else 
		payload = "";

	var returnValue = {
		userid : userid,
		time : time,
		postback : request.postback == null ? false : request.postback,
		payload : payload
	};

	if(request.postback && payload.startsWith("#")){
		//This is a command
		var cmd = {
			type : "unknown",
			payload : payload
		};

		if(payload == "#getstarted"){
			cmd["type"] = "getstarted";
		}

		if(payload == "#registerexpert"){
			cmd["type"] = "registerexpert";
		}

		if(payload == "#askmeanything"){
			cmd["type"] = "askmeanything";
		}

		if(payload.startsWith("#connecttoexperts|")){
			cmd["type"] = "connecttoexperts";
			cmd["data"] = { start : payload.split('|')[1] };
		}

		if(payload == "#menu"){
			cmd["type"] = "menu";
		}

		if(payload == "#havesomefun"){
			cmd["type"] = "havesomefun";
		}

		if(payload == "#exercise"){
			cmd["type"] = "exercise";
		}


		returnValue.command = cmd;
	}

	if(request.originalRequest.message != null &&
		request.originalRequest.message.nlp != null &&
		request.originalRequest.message.nlp["entities"] != null){

		Object.keys(request.originalRequest.message.nlp["entities"]).forEach(key => {
	        var match =  request.originalRequest.message.nlp["entities"][key][0];

	        if(match.confidence > 0.8){
	        	returnValue.nlp = {
	        		"match" : match._entity,
	        		"value" : match.value
	        	};
	        }
	    });
	}

	if(request.originalRequest.message != null &&
		request.originalRequest.message.attachments != null &&
		request.originalRequest.message.attachments.length > 0){

		returnValue.attachment = request.originalRequest.message.attachments[0];
	}

	if(request.originalRequest.message != null &&
		request.originalRequest.message.sticker_id != null){

		switch(request.originalRequest.message.sticker_id){
			case 369239263222822:
				returnValue.emoji = "like";
		}
	}

	return returnValue;
}

module.exports = {
  parseInput (request) {
    return parseInput(request);
  }
}