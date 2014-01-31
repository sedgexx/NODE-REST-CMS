	var config = require('../config'),
	$utils = require('../api/app_utils'),
	$authenticate = require('../api/app_authenticate'),
	bcrypt = require('bcryptjs'),
	mongojs = require('mongojs'),

	/* connection */
	db = mongojs.connect(config.db.url,config.db.collections),

	/* mongoose ORM */
	mongoose = require('mongoose'),
	Schema 	= mongoose.Schema,
	models = require('../api/models'),

	/* support functions and utilities */
	$response = require('../api/response'),
	$request = require('../api/request'),
	$app = require('../api/app'),
	$db = require('../api/db'),
	ObjectId = mongojs.ObjectId;
	var checkValidKeyString = new RegExp("^[0-9a-fA-F]{24}$");
	var _ = require('underscore');

/* ======================================================================== */

	$authorise = {};

	$authorise.hasKey = function(res,qObj) {
			if(typeof qObj.query.key !="undefined") {  
				if(qObj.query.key.length>20) { 
					if(checkValidKeyString.test(qObj.query.key)) { return true }
				} 	
			}
			return false;
   }

	$authorise.checkKey = function(req,res,reqObj,callback) {

		if(!config.developer.noOAC) {  

			if($authorise.hasKey(res,reqObj)) {
				if(checkValidKeyString.test(reqObj.query.key)){ 
					
					    /* validate the key and return the auth object */
						$db.readOne("sessions",{"_id": ObjectId(reqObj.query.key)},{},{}, function(dbreturn) { 
							if(dbreturn.success.userid) { callback(req,res,reqObj); } else { $response.public(req,res); }
						});

				/* public unauthorised returns */
				}  else {  $response.public(req,res); }
			} else { $response.public(req,res); }

		/* dev authorisation OFF */
		} else { callback(req,res,reqObj); }

	}

	$authorise.is = function(req,res,reqObj,callback) {

		if(!config.developer.noOAC) {  

			if($authorise.hasKey(res,reqObj)) {
				console.log(reqObj.query.key);
				if(checkValidKeyString.test(reqObj.query.key)){ 
					
					    /* validate the key and return the auth object */
						$db.readOne("sessions",{"_id": ObjectId(reqObj.query.key)},{},{}, function(dbreturn) {

							if(dbreturn.success) { 

								/* has the session timed out */
								if($utils.hasDateExpired(dbreturn.success.from,new Date(),config.sessiontimeout)) {
									$authenticate.removeSession(dbreturn.success._id); /* fire and forget */
									if(callback) { callback({authenticated:false,message:"Session has timed out, login required"}); } /* require relogin */
								} else {
									/* extend the session */
									$authenticate.updateSession(dbreturn.success._id); /* fire and forget */
									if(callback) {  
										var expires = $utils.setExpiryDate(new Date(),config.sessiontimeout);
										callback({
												authenticated:true,
												userid:dbreturn.success.userid,
												email:dbreturn.success.email,
												lastlogin:dbreturn.success.from,
												expires: expires
											}); 
									} 
								}
								}

							else { if(callback) { callback({authenticated:false}); } }
						});

				/* public unauthorised returns */
				}  else {  if(callback) {  callback({authenticated:false}); } }
			} else { 

				/* might be a public resource */
				var requestPublic = $request.isPublicOAC(reqObj);
				if(requestPublic.OAC) {  if(callback) {  callback({authenticated:false,public:true,userid:"public"});  } }
				else  { if(callback) {  callback({authenticated:false});  } }
				 

			}

		/* dev authorisation OFF */
		} else { if(callback) {  callback({authenticated:true,userid:"developer"}); } }

	}

module.exports = $authorise;