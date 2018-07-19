var botBuilder = require('claudia-bot-builder');
var fbTemplate = botBuilder.fbTemplate;
var input = require('./input');
var profile = require('./profile');
var journal = require('./journal');
var experts = require('./experts.json').experts;
var _ = require('lodash');

module.exports = botBuilder(function (request, apiReq) {
	apiReq.lambdaContext.callbackWaitsForEmptyEventLoop = false;

	var parsedInput = input.parseInput(request);

	console.log(parsedInput);

	return profile.getProfile(parsedInput.userid).then(profileData => {
		console.log(profileData);
		
		if(parsedInput.command){
			switch(parsedInput.command["type"]){
				case "registerexpert":
					return process.env.replyRegisterExpert;
				case "askmeanything":
					return askMeAnything();
				case "menu":
					return getMenu();
				case "connecttoexperts":
					return getExperts(parsedInput.command.data.start);
				case "havesomefun":
					return haveFun();
				case "exercise":
					return exercise();
				case "getstarted":
				default:
					return getStarted(profileData);
			}
		}

		if(parsedInput.nlp != null){
			switch(parsedInput.nlp.match){
				case "greetings":
					return getStarted(profileData);
				case "sad":
					return feelingSad();
				case "menu":
					return getMenu();
				case "help":
					return askMeAnything();
				case "love":
					return process.env.replyLoveYou.replaceAll("{first_name}", profileData.first_name);
				case "thanks":
					return sayThanks(profileData);
				case "bye":
					return sayBye(profileData);
				case "fun":
					return haveFun();
				case "phone_number":
					return process.env.replyPhoneReceived.replaceAll("{first_name}", profileData.first_name);
				case "exercise":
					return exercise();
						
			}
		}

		/*
		if(parsedInput.attachment != null){
			return journal.createJournal(profileData, parsedInput.time, parsedInput.attachment).then(journalData => {
				return journalCreated(profileData);
			});
		}
		*/

		if(parsedInput.emoji != null){
			switch(parsedInput.emoji){
				case "like":
					return sayThanks(profileData);
			}
		}

		return catchAll(profileData);
	}); 
  	
});

function catchAll(profileData){
	const reply = new fbTemplate.Text(process.env.catchAll.replaceAll("{first_name}", profileData.first_name));
	reply.addQuickReply('Talk to experts', '#connecttoexperts|0');
	reply.addQuickReply('No thanks', '#menu');

	return reply.get();
}

function feelingSad(){
	const reply = new fbTemplate.Text("Oh dear! I am really sorry to hear the same, don't be depressed, I understand your pain, we can fight it together. Would you like to");
	reply.addQuickReply('Talk to experts', '#connecttoexperts|0');
	reply.addQuickReply('Refresh your mood', '#havesomefun');
	reply.addQuickReply('Other help', '#menu');

	return reply.get();
}

function journalCreated(profileData){
	const reply = new fbTemplate.Text(process.env.replyJournalCreated);
	reply.addQuickReply('View story book', '#menu');
	reply.addQuickReply('No thanks', '#menu');

	return reply.get();
}

function getStarted(profileData){
	const reply = new fbTemplate.Text(process.env.replyGetStarted.replaceAll("{first_name}", profileData.first_name));
	return reply.addQuickReply('About us', '#menu').get();
}

function sayThanks(profileData){
	const generic = new fbTemplate.Generic();

	generic.addBubble(format("You are welcome"), format("your small help can save a life"))
			.addUrl(process.env.webUrl)
			.addImage(process.env.pic2)
			.addButton('Donate', process.env.donationUrl)
			.addShareButton();

	return generic.get();
}

function sayBye(profileData){
	const generic = new fbTemplate.Generic();

	generic.addBubble(format("Take care {first_name}".replaceAll("{first_name}", profileData.first_name)), format("your small help can save a life"))
			.addUrl(process.env.webUrl)
			.addImage(process.env.pic3)
			.addButton('Donate', process.env.donationUrl)
			.addShareButton();

	return generic.get();
}

function getMenu(){

	const generic = new fbTemplate.Generic();

	generic.addBubble(format("Cure Leukaemia"), format("the blood cancer charity"))
			.addUrl(process.env.webUrl)
			.addImage(process.env.pic1)
			.addButton('What we do', process.env.whatWeDoUrl)
			.addButton('Patients story', process.env.patientStoryUrl)
			.addButton('Donate', process.env.donationUrl);

	generic.addBubble(format("Cure Leukaemia"), format("the blood cancer charity"))
			.addUrl(process.env.webUrl)
			.addImage(process.env.pic2)
			.addButton('Tell your story', process.env.pageUrl)
			.addButton('What they say', process.env.youtubeMotivationUrl)
			.addButton('Have some fun', "#havesomefun");

	generic.addBubble(format("Cure Leukaemia"), format("the blood cancer charity"))
			.addUrl(process.env.webUrl)
			.addImage(process.env.pic3)
			.addButton('Ask me anything', "#askmeanything")
			.addButton('Connect to experts', "#connecttoexperts|0")
			.addButton('Register as expert', "#registerexpert");

    return generic.get();
}

function haveFun(){

	const generic = new fbTemplate.Generic();

	generic.addBubble(format("Cure Leukaemia"), format("let's watch something interesting"))
			.addUrl(process.env.youtubeMotivationUrl)
			.addImage("https://s3.amazonaws.com/cureleukaemia/youtube.png")
			.addButton('Upcoming movies', "https://www.youtube.com/results?search_query=upcoming+movies")
			.addButton('Funny kids', "https://www.youtube.com/results?search_query=funny+videos+for+kids")
			.addButton('Latest gagets', "https://www.youtube.com/results?search_query=latest+gagets");

	generic.addBubble(format("Cure Leukaemia"), format("let's play a game"))
			.addUrl(process.env.youtubeMotivationUrl)
			.addImage("https://s3.amazonaws.com/cureleukaemia/game.png")
			.addButton('Game for kids', "https://html5games.com/")
			.addButton('Chess', "https://www.chess.com/play/computer")
			.addButton('Poker', "https://www.replaypoker.com/");

	generic.addBubble(format("Cure Leukaemia"), format("some more fun"))
			.addUrl(process.env.youtubeMotivationUrl)
			.addImage("https://s3.amazonaws.com/cureleukaemia/funny.png")
			.addButton('Tell a joke', "https://short-funny.com/")
			.addButton('Tricky riddles', "http://goodriddlesnow.com/best-riddles")
			.addShareButton()

	return generic.get();
}

function getExperts(startIndex){

	var start = parseInt(startIndex);
	if(isNaN(start)) start = 0;

	const generic = new fbTemplate.Generic();

	var endIndex = start + 2;
	if(endIndex >= experts.length){
		start = 0;
		endIndex = start + 2;
	}

	var data = _.filter(experts, (item) => {
		return item.id >= start && item.id <= endIndex;
	});

	_.map(data, (item) => {

		generic.addBubble(format(item.name), format(item.bio))
			.addUrl(item.url)
			.addImage(item.pic)
			.addButton('Talk to me', item.handle)
			.addShareButton();

		if(item.id == endIndex)
			generic.addButton('More', '#connecttoexperts|' + (endIndex+1).toString());

	});

    return generic.get();
}

function askMeAnything(){
	const reply = new fbTemplate.Text(process.env.replyAskMeAnything);
	reply.addQuickReply('Can I exercise', '#exercise');

	return reply.get();
}

function exercise(){
	const generic = new fbTemplate.Generic();

	generic.addBubble(format("Exercise"), format("after cancer diagnosis"))
			.addUrl("https://www.leukaemiacare.org.uk/support-and-information/information-about-blood-cancer/living-well-with-leukaemia/exercise/getting-more-active/")
			.addImage("https://s3.amazonaws.com/cureleukaemia/exercise.png")
			.addButton("See how", "https://youtu.be/MA00P_l71zQ")
			.addButton("Talk to experts", "#connecttoexperts|0")
			.addShareButton();

	return generic.get();
}

function format(s){
	return s.slice(0,80);
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};