var http = require('https');
var Promise = require('bluebird');

var doc = require('dynamodb-doc');
var dynamo = Promise.promisifyAll(new doc.DynamoDB());

var pageAccessToken = process.env.pageAccessToken;
var tableJournal = process.env.tableJournal;


var PromiseRequest = Promise.method(function(options) {
    return new Promise(function(resolve, reject) { 
        var request = http.request(options, function(response) {
            // Bundle the result
            var result = {
                'httpVersion': response.httpVersion,
                'httpStatusCode': response.statusCode,
                'headers': response.headers,
                'body': '',
                'trailers': response.trailers,
            };

            // Build the body
            response.on('data', function(chunk) {
                result.body += chunk;
            });

            // Resolve the promise when the response ends
            response.on('end', function() {
                resolve(result);
            });
        });

        // Handle errors
        request.on('error', function(error) {
            console.log('Problem with request:', error.message);
            reject(error);
        });

        // Must always call .end() even if there is no data being written to the request body
        request.end();
    });
});

function createJournal(profileData, time, attachment){

    var paramJournal = {};
    paramJournal.TableName = tableJournal;

    var journalData = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        profile_pic: profileData.profile_pic,
        locale: profileData.locale,
        timezone: profileData.timezone,
        gender: profileData.gender,
        userid: profileData.userid,
        time: time,
        type: attachment["type"],
        url: attachment.payload.url,
        published: false
    };

    removeUnusedProperties(journalData);

    paramJournal.Item = journalData;

    return dynamo.putItemAsync(paramJournal).then(function(data){
        return journalData;
    });
}

function removeUnusedProperties(obj){
    Object.keys(obj).forEach(key => {
        if (obj[key] == null || obj[key] == undefined || obj[key]== '') delete obj[key];
    });
}

module.exports = {
  createJournal(profileData, time, attachment) {
    return createJournal(profileData, time, attachment);
  }
}

