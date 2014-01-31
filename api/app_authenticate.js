	var config = require('../config'),
	$utils = require('../api/app_utils'),
	bcrypt = require('bcryptjs'),
	mongojs = require('mongojs');

	/* connection */
	var mongojscollections =[];

	config.db.collections.forEach(function(val,key) { mongojscollections.push(val.name); });
	var db = mongojs.connect(config.db.url,mongojscollections),

	/* mongoose ORM */
	mongoose = require('mongoose'),
	Schema 	= mongoose.Schema,
	models = require('../api/models'),

	/* support functions and utilities */
	$response = require('../api/response'),
	$db = require('../api/db'),
	ObjectId = mongojs.ObjectId, 
	checkValidHex = new RegExp("^[0-9a-fA-F]{24}$"),
	_ = require('underscore');

/* ======================================================================== */

	$authenticate = {};

	$authenticate.removeSession = function(id,callback) {
		db.sessions.remove({_id:id},1, function(error, object) {  
			if(callback) { callback(error,object,id); }
		});
	};

	$authenticate.updateSession = function(id,callback) {
		var update = { $set : {from:new Date()} };
		db.sessions.update({_id:id},update,{},function(error, object) {  
			if(callback) { callback(error,object,id); }
		});
	};

	$authenticate.createSession = function(req,res,authuser,authResponse){

	var userTokenObj = {}
		userTokenObj.userid = authuser._id;
		userTokenObj.email 	= authuser.email;
		userTokenObj.from 	= new Date();

		$db.create("sessions",userTokenObj, false, function(dbreturn) {

			if(dbreturn.fail || !dbreturn.success) { 
				/* technical problem */
				authResponse.message=config.messages.servicestatus; 
				authResponse.status=503;
				$response.printAuth(req,res,JSON.stringify(authResponse));

			} else { 

			 	/* 	====================================================
					SUCCESS / AUTH COMPLETE, Return KEY from NEW Session
					==================================================== */
				console.log("______________________");
				console.log("New Session Created for :" +dbreturn.success._id);
				console.log("______________________");
				 	authResponse.password = {key:dbreturn.success._id,expires:$utils.setExpiryDate(dbreturn.success.from,config.sessiontimeout)};
				 	authResponse.status = 200;  
					$response.printAuth(req,res,JSON.stringify(authResponse));
				 }
		});

	};

	$authenticate.login  = function(req,res,reqObj) {

			var authResponse = req.body;
			var reqU = req.body.email;
			var reqP = req.body.password;
			authResponse.password = {key:""}; 
					
			/* find a user with email address */

			var options 	= {};
			options.limit 	= {};
			options.sort 	= {};
			var q = {"email":reqU};
			var f = {};
			/* perform search */
			$db.read("people",q,f,options, function(dbreturn) { 

						/* 	================================
							FAIL / INVALID EMAIL 
							================================ */

						if(dbreturn.fail) { 

							console.log(dbreturn.fail);
							authResponse.status = "503";
							authResponse.message=config.messages.servicestatus;
							$response.printAuth(req,res,JSON.stringify(authResponse));

						} else if(!dbreturn.success.length) { 

							authResponse.message=config.messages.loginfailed;
							authResponse.status = "400";
							$response.printAuth(req,res,JSON.stringify(authResponse));
						}

						/* 	================================
							SUCCESS / VALID EMAIL 
							================================ */

						else { 	
							var authuser = dbreturn.success[0];
							/* Check Password */
							bcrypt.compare(reqP, authuser.password, function(err, resstatus) {
		
    							if(resstatus) { 
    								/* 	=====================================
										SUCCESS / PASSWORD VALID 
										===================================== */

										/* find session object */
		
										var options2 	= {};
										options2.limit 	= {};
										options2.sort 	= {};
										var q2 = {"userid": authuser._id};
										var f2 = {};
										/* perform search */
										$db.read("sessions",q2,f2,options2, function(dbreturn2) { 


											if(dbreturn2.fail)  { 
													/* a technical problem */
													authResponse.message=config.messages.servicestatus; 
													authResponse.status="503"; 
													$response.printAuth(req,res,JSON.stringify(authResponse));

											} else {

												if(!dbreturn2.success.length) { 
												/* 	=====================================
													CREATE SESSION OBJ 
													===================================== */

													$authenticate.createSession(req,res,authuser,authResponse);

												} else {
												/* 	====================================================
													SUCCESS / AUTH COMPLETE, CHECK DATE AND KEY from OLD Session
													==================================================== */

													var sessionObject = dbreturn2.success[0];
													var sessiondate = sessionObject.from;


													if($utils.hasDateExpired(sessiondate,new Date(),config.sessiontimeout)) {
														/* session has timed out */

													console.log("______________________");
													console.log("session has timed Out for :" +sessionObject._id );
													console.log("______________________");

													$authenticate.removeSession(dbreturn2.success[0]._id, function(error, object,id) { 
														$authenticate.createSession(req,res,authuser,authResponse);
													});


													} else { 

													console.log("______________________");
													console.log("session still valid for :" +sessionObject._id );
													console.log("______________________");

														/* update the date */

														$authenticate.updateSession(sessionObject._id, function(error,object,id) {

															console.log("______________________");
															console.log("session date Updated :" +sessionObject._id );
															console.log("______________________");
															authResponse.password = {key:dbreturn2.success[0]._id,expires:$utils.setExpiryDate(dbreturn2.success[0].from,config.sessiontimeout)}; 
															authResponse.status = 200;
															$response.printAuth(req,res,JSON.stringify(authResponse));

														});

													}

												}

											}

										});
									
								/* 	=====================================
									FAIL / PASSWORD INVALID 
									===================================== */
    							} else { 

									authResponse.message=config.messages.loginfailed;
									authResponse.status ="400";
									$response.printAuth(req,res,JSON.stringify(authResponse));

    							}

							});
							
						}

					});
	}

	$authenticate.logout  = function(req,res,reqObj) {

		var unauthReq 	= req.body,
		reqU 			= req.body.email,
		reqKey 			= req.body.password.key;

		var q = {"_id": ObjectId(reqKey),"email":reqU};
		
		$db.delete("sessions",q,1, function(dbreturn) {
			var unaUthRes = {email:reqU,status:"authenticated"};
			if(dbreturn.fail) { unaUthRes.error=dbreturn.fail; } else { unaUthRes.status ="unauthenticated";  }
			$response.print(req,res,JSON.stringify(unaUthRes));
		});

	}

module.exports = $authenticate;