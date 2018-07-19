
var http = require('https');
var Promise = require('bluebird');
var doc = require('dynamodb-doc');
var dynamo = Promise.promisifyAll(new doc.DynamoDB());

var pageAccessToken = process.env.pageAccessToken;
var tableUser = process.env.tableUser;


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

function getProfile(userid){

    var params = {};
    params.TableName = tableUser;
    params.Key = {userid : userid};

    return dynamo.getItemAsync(params).then(function(data){
        if(data.Item != null)
            return data.Item;
        else{
            return PromiseRequest({
                    method: 'GET',
                    host: 'graph.facebook.com',
                    path: '/v2.6/' + userid + '?access_token=' + pageAccessToken,
                }).then(function(value) {
                    var fbUser = JSON.parse(value.body);
                    var fbUserData = {
                        first_name: fbUser.first_name,
                        last_name: fbUser.last_name,
                        profile_pic: fbUser.profile_pic,
                        locale: fbUser.locale,
                        timezone: fbUser.timezone,
                        gender: fbUser.gender,
                        userid: fbUser.id 
                    };

                    removeUnusedProperties(fbUserData);

                    var paramUser = {};
                    paramUser.TableName = tableUser;
                    paramUser.Item = fbUserData;

                    return dynamo.putItemAsync(paramUser).then(function(data){
                        return fbUserData;
                    });
                });
        }
    });
}

function removeUnusedProperties(obj){
    Object.keys(obj).forEach(key => {
        if (obj[key] == null || obj[key] == undefined || obj[key]== '') delete obj[key];
    });
}

module.exports = {
  getProfile(userid) {
    return getProfile(userid);
  }
}

