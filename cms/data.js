var config = require('../config');
var $cms_data = {}, http = require("http");


$cms_data.get = function(req,res,resource,q,callback) {

		if(typeof req.session.authentication==="undefined") {
				req.session.authentication=null
		} 

		var key="";
		var keyPrefix ="?";
		if(q!=="") { q = "?q="+JSON.stringify(q); keyPrefix ="&amp;"; }

		
		if(typeof req.session.authentication!="undefined" && req.session.authentication!=null) {
			if(typeof req.session.authentication.key!=="undefined") {
				key = keyPrefix+"key="+req.session.authentication.key;
			}
		} 

		/* public private pages */

		if(resource==="pages") {
			if(req.session.authentication==null) {
				q='?q={"status":"published"}';
			}
		}

		console.log("--- S: QUERY ==============");
		console.log(q);
		console.log("--- E: QUERY ==============");
		
		var restapi = config.http.apiContext;
		console.log("get: " + restapi+resource+q+key);

		http.get(restapi+resource+q+key, function(httpres) {
			var body = '';
			httpres.on('data', function(chunk) { body += chunk; });
			httpres.on('end', function() { var templatedata = JSON.parse(body); 
				callback(templatedata); });
			}).on('error', function(e) { console.log("Got error: ", e); callback({ error: e });
		});
};

$cms_data.post = function(resource,data,callback) {

		console.log("post: " + config.http.apiContext+resource);

			var options = {
			  path: config.http.apiContext+resource,
			  headers : {"Content-Type": "application/json"},
			  method: 'POST'
			};

			var serverdata = "";

			var apirequest = http.request(options, function(apiresponse) {
			  apiresponse.on('data', function (chunk) { serverdata += chunk;  });
			  apiresponse.on('end', function () { callback(serverdata); });
			  
			});
			
			apirequest.on('error', function(e) {  console.log( e.stack ); callback({ error: e.message }); });
			apirequest.write(JSON.stringify(data));
			apirequest.end();

};



module.exports = $cms_data;