	/* imports */
	var config = require('../config'),
	bcrypt = require('bcryptjs'),
	mongojs = require('mongojs'),
	ObjectId = mongojs.ObjectId,
	path = require('path'),
	fs = require("fs");


/* ======================================================================== */

	$utils = {};

	$utils.returnInvalidQParams = function(error) {
	return {systemformat:"invalid",systemerror:error};
	}

	/* ===================
	CHECK IF VALID ID ( string: 24 char id )
	===================  */

	$utils.isValidID = function(id) 	{ 

		var valid = false, checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
		if(id.length==24) { if(checkForHexRegExp.test(id)) { valid=true; } } 
		return valid;
	}

	/* ==============================================================================================
	CHECK user/pass req comply ( string > 5 - populate with more rules from model schema definitions )
	===================  */

	$utils.isValidUserPass = function(user,pass) 	{ 

		if(user.length>5 && pass.length>5) { return true;} else { return false; } 
	}

	/* ===================
	QUERY PARAMS  - Query ( json )
	===================  */

	$utils.setQuery = function(res,qObj) 	{  
		var q ={},
		dateKey = "$date";


		try { 
			if(qObj.query.q) { 
				q =JSON.parse(qObj.query.q); 

				/* 	===================================
					$oid - map to Object ID
					=================================== */

				if(q._id) {  
					if(q._id.$in) { 
						for (var i = 0; i < q._id.$in.length; i++) { 
							if(q._id.$in[i].$oid) { q._id.$in[i] = ObjectId(q._id.$in[i].$oid); } /* awfull!  */
						} 
					}
				}
				/* 	============================================================
					$date - map date string to javascript Date() - 2 levels deep
					============================================================ */

					for(var key in q) {
	            	if(q[key].hasOwnProperty(dateKey)) { 
		            	q[key] = new Date(q[key][dateKey]);
	            	} else {

						for(var key2 in q[key]) {
				            	if(q[key][key2].hasOwnProperty(dateKey)) { 
				            	q[key][key2] = new Date(q[key][key2][dateKey]);
				            	} else {

				            		for(var key3 in q[key][key2]) {
						            	if(q[key][key2][key3].hasOwnProperty(dateKey)) { 
						            	q[key][key2][key3] = new Date(q[key][key2][key3][dateKey]);
						            	} else {

						            		for(var key4 in q[key][key2][key3]) {
								            	if(q[key][key2][key3][key4].hasOwnProperty(dateKey)) { 
								            	q[key][key2][key3][key4] = new Date(q[key][key2][key3][key4][dateKey]);
								            	}
						            		}
						            	}
				            		}

				            	}
				            }

	            	}
	            }

			}  

		} 

		catch (err) { console.log(err); q=$utils.returnInvalidQParams(err); }

		return q; 
	}

	/* ===================
	QUERY PARAMS  - Fields ( json: limit values returned )
	===================  */

	$utils.setFields = function(res,qObj) 	{  
		var f ={}; 
		try { if(qObj.query.f) { f =JSON.parse(qObj.query.f); }  } 
		catch (err) { console.log(err); f=$utils.returnInvalidQParams(err); }
		return f; 
	}

	/* ===================
	QUERY PARAMS - Limit ( int )
	===================  */

	$utils.setLimit = function(res,qObj) 	{  
		var l =config.db.rstlimit; /* system default limit is high but never exceeded */
		try { if(qObj.query.l) { l =JSON.parse(qObj.query.l); if(l>config.db.rstlimit){ l = config.db.rstlimit; } }  } 
		catch (err) { console.log(err); l=$utils.returnInvalidQParams(err); }
		return l; 
	}

	/* ===================
	QUERY PARAMS - SORT ( json )
	===================  */

	$utils.setSort = function(res,qObj) 	{  
		var s ={}; 
		try { if(qObj.query.s) { s =JSON.parse(qObj.query.s); }  } 
		catch (err) { console.log(err); s={systemformat:"invalid",systemerror:err} }
		return s; 
	}

	/* ===================
	QUERY PARAMS - SET DELETE COUNT ( 1 ( deletes only one object it finds via the query params, or 0 deletes all it finds )
	===================  */

	$utils.setDeleteCount = function(res,qObj) 	{  
		var dcount =0; /* default to delete all that match the query */
		if(qObj.query.dcount) { dcount = qObj.query.dcount; }  
		return dcount; 
	}

	/* ===================
	QUERY POP / populate sub references
	===================  */

	$utils.setPop = function(res,qObj) 	{ 
		var setPop =""; 
		if(qObj.query.pop) { setPop = qObj.query.pop; }  
		return setPop; 
	}

	/* ===================
	QUERY PATH - request for a subpath of data - eg - /RESOURCE/ID/DATA
	===================  */

	$utils.setDataReq = function(res,qObj) 	{  
		var collectiondata =""; /* default to delete all that match the query */
		if(qObj.collectiondata!="") { collectiondata = qObj.collectiondata; }  
		return qObj.collectiondata; 
	}

	/* ===================
	QUERY PATH / Validation if a valid subpath
	===================  */

	$utils.isSubRequest = function(resObj,collectiondata) 	{  

		var subRequest = false;
		if(typeof resObj[0]!="undefined") { if(collectiondata!="") { if(typeof resObj[0][collectiondata]!="undefined") {  subRequest = true; } } }
		return subRequest;
	}

	/* ===================
	QUERY PATH / tell $app.read to follow if the sub object is a reference
	===================  */

	$utils.isSubRequestFollow = function(subObj,collectiondata) 	{ 
	var subRequestFollow = false;
	if(typeof subObj[collectiondata]!="undefined") {
		if(typeof subObj[collectiondata]._ref!="undefined") { if(typeof subObj[collectiondata]._id!="undefined") { subRequestFollow = true; } }
	}
	return subRequestFollow;
	};

	$utils.addImage = function(imageobject) {

										/* write file(s) to disk */

								var finalimageurls =[];
								var currentFileCount;
								for (var i = 0; i < imageobject.data.length; i++) {

								

								var base64Data =imageobject.data[i];

								console.log("image detail ( length) ");
								console.log(base64Data.length);
								console.log("==========================");

								var idcontext = imageobject.part;
								var webdirectory = config.http.wwwroot+"\\media\\"+idcontext+"\\";
								base64Data = base64Data.replace(/^data:image\/jpeg;base64,/,"");




								var directory =path.join(config.http.wwwroot+"/www/media/"+idcontext);

								var pathexists = fs.existsSync(directory);
								if (!pathexists) { fs.mkdirSync(directory); }

								/* unique file name for the image */
								var currentfiles = fs.readdirSync(directory);
								

								if(typeof currentfiles!=="undefined") { 
									console.log(currentfiles);
								if(currentfiles.length>=1) { 
									currentFileCount= currentfiles.length+1;
								} else { currentFileCount = 1;}
								}

								var imagefilename = idcontext+"_"+currentFileCount+".jpg";


								var filePath = path.join(directory+"/"+imagefilename);

								fs.writeFile(filePath, base64Data, 'base64', function(err) {
								  console.log(err);
								});

								finalimageurls.push("/media/"+idcontext+"/"+imagefilename);
								};

								return finalimageurls;
	};

$utils.hasDateExpired = function(then,now,allowedtime) {

	var has = false, hoursDiff = Math.abs(then - now) / 36e5;
	console.log("hours diff: " + hoursDiff);
	if(hoursDiff>allowedtime) { has=true; }
	return has;
};

$utils.setExpiryDate = function(fromdate,h) {

		var expireDate = new Date(fromdate.setHours(fromdate.getHours()+h));
		return expireDate;
};

module.exports = $utils;