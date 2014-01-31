	/* 	HTTP Response Utilities  ========================
	
	- set content type
	- respond and close response

	R. Sedgwick
	02/08/2013

	Revisions
	___________

	DATE:
	AUTHOR: 

	========================================================= */

	var config = require('../config');

	var $response = {};

	/* ===================
		PRINT RESPONSES
	   ===================  */

	   		$response.xDomain = function(res) {
			    res.header('Access-Control-Allow-Origin', config.http.responseHeaders.AccessControlAllowOrigin);
			    res.header('Access-Control-Allow-Methods', config.http.responseHeaders.AccessControlAllowMethods);
			    res.header('Access-Control-Allow-Headers', config.http.responseHeaders.AccessControlAllowHeaders);
	   		}

	   		$response.public = function(req,res,message) {
	   			$response.xDomain(res);
				res.writeHead(403, config.http.contenttype); 
				var returnmsg = config.messages.publicgeneric;
				if(typeof message!=="undefined") {
					returnmsg.message = message;
				}
				res.end(JSON.stringify(returnmsg));
	   		}

			/* set a 401 for unathenticated requests */
			$response.unauthorized = function(res) {
				res.writeHead(401, config.http.contenttype); 
				res.end(JSON.stringify({'error':'unauthorized','status':'401'}));
			}

			/* set a  404 for requests to invalid collections */
			$response.notfound = function(res) {
				res.writeHead(404, config.http.contenttype); 
				res.end(JSON.stringify({'error':'resource not found','status':'404'}));
			}

	   		$response.safe = function(resObj) {
	   			/* restrict fields we do not want to return */
	   			/* multiple */
	   			for (var i = 0; i < resObj.length; i++) { 
	   				for (var iv = 0; iv < config.omitValues.length; iv++) { 
	   					var checkKey = config.omitValues[iv];
	   					if(resObj[i][checkKey]) { delete resObj[i][checkKey]; }
	   				}
				} 
				/* single */
	   			for (var iv = 0; iv < config.omitValues.length; iv++) { 
	   				var checkKey = config.omitValues[iv];
	   					if(resObj[checkKey]) { delete resObj[checkKey]; }
	   			}
	   			return resObj;
	   		}

	   		$response.print = function(req,res,objString) 	{
	   			$response.xDomain(res);
				res.writeHead(200, config.http.contenttype); 
				res.end(objString);
			}

			$response.printAuth = function(req,res,objString,httpcode) 	{
				$response.xDomain(res);
				res.writeHead(200, config.http.contenttype); 
				res.end(objString);
			}

	   		$response.printMedia = function(req,res,mediaobj) 	{
				var str64 =  mediaobj.data;
				if(typeof str64==="undefined") { str64 = config.noimage; }
					str64 = str64.substring(str64.indexOf(",")+1);
					var mediaRes = new Buffer(str64, 'base64');
					res.writeHead(200, { 'Content-Length': mediaRes.length, 'Content-Type': 'image/jpeg' });
					res.end(mediaRes);
			}

			$response.printValidation = function(req,res,resObj) {
				$response.xDomain(res);
				res.writeHead(200, config.http.contenttype); 
				res.end(JSON.stringify(config.messages.genericinvalidrequest));
			}

			$response.safeError = function(err) 	{

				/* mongoose gives us a nasty error return 
				eg. error MongoError: E11000 duplicate key error index: mongoosetest.people.$email_1  dup key: { : \"rob@new4.co.uk\" }

				*/
				var errStr = err.toString();
				errStr = errStr.replace(/MongoError/g, 'Error');
				errStr = errStr.replace(/mongoosetest.people./g, 'Error');

				if(errStr.indexOf("E11000 duplicate key error index:")>0) { 
					errStr = errStr.substring(errStr.indexOf("E11000 duplicate key error index:")+34);
					if(errStr.indexOf("$")>=0) {
						errStr = errStr.substring(errStr.indexOf("$")+1);
						if(errStr.indexOf("_")>1) {
							errStr = errStr.substring(0,errStr.indexOf("_"));
						}
					}
				}
				/* add more as they arise */

	   			return errStr;
			}

module.exports = $response;