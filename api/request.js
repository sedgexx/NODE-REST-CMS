	/* 	HTTP Req Utilities  ========================
	
	- validated requests 
	- sanitise requests
	- match requests with config.collections
	- create request object for use in dbfunctions
	- return generic response for invalid http requests

	R. Sedgwick
	02/08/2013

	Revisions
	___________

	DATE:
	AUTHOR: 

	========================================================= */

	var config = require('../config');
	var bcrypt = require('bcryptjs');

	var $request = {}

	/* sanitise url / XSS and custom */
	$request.collectionURLSanitise = function(col) {
		var san = require('validator').sanitize;
		col = san(col).trim(); col = san(col).xss();
		if(col.indexOf("?")>=0) { col=col.substring(0,col.indexOf("?")); }
		return col;
	}

	/* allow for both double and single quoted json and trim */
	$request.setJSONObj = function(obj) {
		var jo=JSON.stringify(obj).replace(/'/g,'\\"').trim();
		jobj=JSON.parse(jo,true);
		return jobj;
	}

	/* get the ?q= params JSON and make an object */
	$request.getQueryParamsObj = function(req) {
		var u= require('url');
		var up = u.parse(req.url,true);
		var qobj =up.query;
		qobj = $request.setJSONObj(qobj);
		return qobj;
	}
	
	/* Make a program friendly request object */
	$request.getReqObject = function(req) { 

		var parts = req.url.split("/");
		var col = parts[2],colid = parts[3], coldata = parts[4];

		var method=req.method;

		if(typeof col!=="undefined")   	{ col   = $request.collectionURLSanitise(col);   	} else { col="";	}
		if(typeof colid!=="undefined") 	{ colid = $request.collectionURLSanitise(colid); 	} else { colid="";	}
		if(typeof coldata!=="undefined") { coldata = $request.collectionURLSanitise(coldata);} else { coldata="";	}

		/* query params collect */
		var queryParams = $request.getQueryParamsObj(req);


		var reqObj = {};
		reqObj.collection = col;
		reqObj.collectionid = colid;
		reqObj.collectiondata = coldata;
		reqObj.query = queryParams;
		reqObj.method = method;

		/* return request object for response */
		if(config.developer.consolemode) {
			console.log("--- REQUEST : "+new Date() + "------------------");
			console.log(reqObj);
			console.log("---------------------------------");
		}
		return reqObj;

	}

    /* 	==============================================================================

    	OBJECT ACCESS CONTROL 

    	1) Has Valid access, public or Key access to Private ?
    	2) Is valid resource Request ? ( config.collections )

    	returns {status:<CODE>,OAC:true/false}

    	============================================================================== */


	$request.OAC = function(reqObj) {
		var isvalid = false, status = "404";
		var collectionreq = reqObj.collection;
		config.db.collections.forEach(function(val,key) { 
			if(collectionreq===val.name) { isvalid=true; status="200"; } });
		return {status:status,OAC:isvalid};
	}

	$request.isPublicOAC = function(reqObj) {
		var isvalid = false, status = "404";
		var collectionreq = reqObj.collection;
		if(reqObj.method==="GET") {
		config.db.collections.forEach(function(val,key) { 
			if(collectionreq===val.name) {
			 if(val.GET==="public") {
				isvalid=true; status="200"; } 
			  }
			});
		}
		return {status:status,OAC:isvalid};
	}

	/* check a bcrypt */
	$request.bcryptCheckStr = function(str,hash) {
		bcrypt.compare(str, hash, function(err, res) {
		    if(res) { return res; } else { return false; }
		});
	}

	/* bcrypt a string */
	$request.bcryptStr = function(str) {
		bcrypt.genSalt(config.passwordcryptlevel, function(err, salt) { 
			bcrypt.hash(str, salt, function(err, hash) { return hash; }); 
		}); 
	}

module.exports = $request;