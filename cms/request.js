	var $cms_request={};

	$cms_request.URLSanitise = function(urlpart) {
		if(typeof urlpart!=="undefined") {
			if(urlpart.indexOf("?")>=0) { urlpart=urlpart.substring(0,urlpart.indexOf("?")); }
			var san = require('validator').sanitize;
			urlpart = san(urlpart).trim();
			urlpart = san(urlpart).escape()
		}
		return urlpart;
	};

	/* get the ?q= params JSON and make an object */
	$cms_request.getQueryParamsObj = function(req) {
		var u= require('url');
		var up = u.parse(req.url,true);
		var qobj =up.query;
		qobj = $cms_request.setJSONObj(qobj);
		return qobj;
	};

	/* allow for both double and single quoted json and trim */
	$cms_request.setJSONObj = function(obj) {
		var jo=JSON.stringify(obj).replace(/'/g,'\\"').trim();
		jobj=JSON.parse(jo,true);
		return jobj;
	}

	$cms_request.getReqObject = function(req) { 

		var requesturl = req.url, page="",section="",article="";

		if(requesturl.indexOf("/")>=0) { 
		var parts = req.url.split("/");

		 	for (var i = 0; i < parts.length; i++) {
		 		if(i===1) { 
		 			page = req.url;
		 			if(page.indexOf("/")===0) { page = page.substring(1); }
		 			 }
		 		if(i===2) { section = parts[2]; }
		 		if(i===3) { article = parts[3]; }
		 	};
		}

		if(page!=="")		{ page   	= $cms_request.URLSanitise(page); } 
		if(section!=="")	{ section 	= $cms_request.URLSanitise(section); } 
		if(article!=="")	{ article 	= $cms_request.URLSanitise(article); } 

		/* query params collect */
		var queryParams = $cms_request.getQueryParamsObj(req);

		var reqObj = {};
		reqObj.page = page;
		reqObj.section = section;
		reqObj.article = article;
		reqObj.query = queryParams;

		/* any payloads */
		if(typeof req.body!=="undefined") {
			reqObj.body = req.body;	
		}
		
		/* return request object for response */
		return reqObj;

	};

	module.exports = $cms_request;