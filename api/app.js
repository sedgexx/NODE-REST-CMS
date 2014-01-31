/* 	=======================================================
	Application Functions 
	

	R. Sedgwick
	02/08/2013

	Revisions
	_______________________________

	DATE:
	AUTHOR: 

	========================================================= */

	/* imports */
	var config = require('../config'),
	bcrypt = require('bcryptjs'),
	mongojs = require('mongojs'),

	/* connection */
	db = mongojs.connect(config.db.url,config.db.collections),

	/* mongoose ORM */
	mongoose = require('mongoose'),
	Schema 	= mongoose.Schema,
	models = require('../api/models'),
	ObjectId = mongojs.ObjectId, 
	checkValidHex = new RegExp("^[0-9a-fA-F]{24}$"),
	_ = require('underscore'),


	$response = require('../api/response'),
	$db = require('../api/db'),
	$authenticate = require('../api/app_authenticate'),
	$authorise = require('../api/app_authorise'),
	$utils = require('../api/app_utils');


/* 	============================================================== */

	var $app = {};

	$app.primaryKey = config.db.primarykeys[0];
/* 	=======================================================================================
	VALIDATION / SCHEMA / MODEL CHECKING / VALUE SETTING

	Add all pre save / update / document model / schema /  validations and operations here 
	======================================================================================= */

		$app.prePrepareDocumentSave = function(req,res,reqObj) {

			var reqBody = req.body, 
			reqCollection = reqObj.collection;

			console.log("===================");
			console.log(reqBody);
			console.log("===================");

		/* 	================================
			"LOGIN" Document 
			================================ */

			if(reqCollection=="login") {

					var authResponse = reqBody,
					reqU = reqBody.email,
					reqP = reqBody.password;

					var doAuth = false;

					if(typeof reqU!=="undefined" && reqP!=="undefined") {
						if($utils.isValidUserPass(reqU,reqP)) { doAuth=true; }
					}
					/* fundamental check and response before attempting authentication */
					if(doAuth) { $authenticate.login(req,res,reqObj); } 
					else {
						authResponse=config.messages.loginfailed;
						$response.printAuth(req,res,JSON.stringify(authResponse),403);
					} 
			}

		/* 	================================
			"LOGOUT" function ROUTE 
			================================ */

			else if(reqCollection=="logout") { $authenticate.logout(req,res,reqObj);  }

		/* 	================================
			"PEOPLE" Document 
			================================ */

			else if(reqCollection=="people") {

					/* new person - crypt password */
					bcrypt.genSalt(config.passwordcryptlevel, function(err, salt) { 
						bcrypt.hash(reqBody.password, salt, function(err, hash) { 
							reqBody.password = hash;
							var preReq = req;
							preReq.body = reqBody; /* "preReq" : modify and update the request body before it is sent to the save function */

							/* create person obj */
							$app.create(preReq,res,reqObj,$app.newCircle);

						}); 
					}); 

			}

			else { 

				$authorise.is(req,res,reqObj, function(authis) {
					if(authis.authenticated) { $app.create(req,res,reqObj);  }
					else { 
						var msg="";
						if(typeof authis.message!="undefined") { msg=authis.message; }
						$response.public(req,res,msg); 
					}
				});
			} 

		}


/* 	================================================================================== 
	DB CREATE / READ / UPDATE / DELETE 
	================================================================================== */

	/* 	===================
		CREATE FUNCTIONS
		=================== */

			$app.precreate = function(req,res,reqObj) 	{
					$app.prePrepareDocumentSave(req,res,reqObj);
			}

			$app.create = function(req,res,reqObj,callback) 	{
				
					var reqBody = req.body;
					var reqCollection = reqObj.collection;
					var resObj;

					/* 	==========================
						perform save using mongoose
						==========================  */

						/* create a scheme reference for the new obj request */
						var newObjOutput = reqBody;


						/* Save */
						var demouseORM = config.modelconfig.ORM.active;
						if(reqCollection==="somecollectionwewanttomit") {  demouseORM=false; /* temp overide for demo */ }

						if(demouseORM) {
							newObjOutput = models[reqCollection].init(reqBody);
						}


						if(reqCollection==="media" && config.mediaFileSystem) {

								/*   IF MEDIA - WRITE TO DISK  */
								console.log("adding media");
								
								var imagediskurl = $utils.addImage(newObjOutput);

								$response.print(req,res,JSON.stringify({"imageurl":imagediskurl,"message":"building image to disk function"}));
						

						} else { 

						$db.create(reqCollection,newObjOutput,demouseORM, function(dbreturn) {

							if(dbreturn.fail) { 
								/* Handle Mongoose Validation returns  */
								if(typeof dbreturn.fail.errors!="undefined") { 
									var valueValidationError = {error:dbreturn.fail.errors}
									$response.print(req,res,JSON.stringify(valueValidationError)); } 
								else {
									/* Handle Mongo Error returns  */
									if(typeof dbreturn.fail.code!="undefined") {
										/* 11000 and 11001 are dup keys */
										var errorReturn = {error:"Validation Error",message:"",code:dbreturn.fail.code};
										if(dbreturn.fail.code==11000 || dbreturn.fail.code==11001) {
											var dupeKey = $response.safeError(dbreturn.fail);
											errorReturn.message ="An entry with those values already exists";
											errorReturn.duplicatekey = dupeKey;
										}
										$response.print(req,res,JSON.stringify(errorReturn));
									} else{
										console.log("fail: line 191 : "+JSON.stringify(dbreturn.fail));
										$response.printValidation(req,res);
									}
								}
							}  else { 

								resObj=dbreturn.success;

								/* respond */
								resObj =  $response.safe(resObj);

								$authorise.is(req,res,reqObj,function(authObject) {
										resObj.information = authObject;
										if(typeof callback==="undefined") { $response.print(req,res,JSON.stringify(resObj)); } 
										else { callback(req,res,resObj); }
								});	
							}

						});

						}	
	
			}

		/* REGISTERED USER - CREATE CIRCLE */
		$app.newCircle = function(req,res,newUserObj) {

			var resSavePerson =  $response.safe(newUserObj);
			$response.print(req,res,JSON.stringify(resSavePerson));

			/* refer to ESSESSENTIAL CLICNT STUBS FOR ADDING A USER TO A GROUP */
	
	   }


	/* 	================
		GET(http) / READ
		================ */

			
			$app.preread = function(req,res,reqObj) 	{

				$authorise.is(req,res,reqObj, function(authis) {
					if(authis.authenticated || authis.public) { 
						$app.read(req,res,reqObj); 
					}
					else { 
						var msg="";
						if(typeof authis.message!="undefined") { msg=authis.message; }
						$response.public(req,res,msg); 
					}
				});	

			};


			$app.read = function(req,res,reqObj) 	{

					var collection = reqObj.collection, collectionid = reqObj.collectionid;
					var findbyID=$utils.isValidID(collectionid); 


					/* Parameters */
						/* query */
						var q={}; 

						if(findbyID) { 
							q[$app.primaryKey]=ObjectId(collectionid);
						} else { q = $utils.setQuery(res,reqObj); }
						/* fields */
						var f = $utils.setFields(res,reqObj);
						/* limit */
						var l = $utils.setLimit(res,reqObj);
						/* sort */
						var s = $utils.setSort(res,reqObj);
						/* subdata path request */
						var collectiondata = $utils.setDataReq(res,reqObj);
						/* populate sub references */
						var pop = $utils.setPop(res,reqObj);
						
						/* TODO : permissions */
						/* always attach the OID of logged in user to the q Obj - where AUTHOR or CARES or PARTNER */

						/* TODO - search the q object for any $date references and change them to new Date("JSON STR") */

						/* check parameters */
						if(q.systemformat=="invalid" || f.systemformat=="invalid" || s.systemformat=="invalid") {  

							console.log("invalid params");
							 $response.printValidation(req,res);  

						} else {
							/* search preferences */
							var options 	= {};
							options.limit 	= l;
							options.sort 	= s;
							/* perform search */

							$db.read(reqObj.collection,q,f,options, function(dbreturn) { 

								var resObj;

								if(dbreturn.fail) {  resObj = []; console.log("fail:"+dbreturn.fail); 
								} else { resObj = dbreturn.success; }

									var subRequest = $utils.isSubRequest(resObj,collectiondata);

								/* 	===========================
									URL SUB REQUESTS 
									=========================== */

									if(subRequest) { 

										/* get the subRequest */
										var subObj = {}; subObj[collectiondata] = resObj[0][collectiondata]; 

										var subRequestFollow = $utils.isSubRequestFollow(subObj,collectiondata); 
										
										/* follow the subRequest ? ($ref) */
										if(subRequestFollow) { $app.readMore(req,res,subObj[collectiondata]._ref,subObj[collectiondata]._id,resObj[0]); } 
										else { 
											/* data return for sub request without follow */
											subObj =  $response.safe(subObj); 
											$response.print(req,res,JSON.stringify(subObj));
										}

									} else {

										/* !NOT URL SUB REQUEST but may be POP */
										var popCollection = $utils.setPop(res,reqObj);
										if(popCollection!="") {

											var subRequestFollow = $utils.isSubRequestFollow(resObj[0],popCollection); 

											if(subRequestFollow) { $app.readMore(req,res,resObj[0][popCollection]._ref,resObj[0][popCollection]._id,resObj,popCollection); }
											else { 
													/* 
													invalid pop request 
													grant normal data return */
													resObj =  $response.safe(resObj);							
													$response.print(req,res,JSON.stringify(resObj));
												}

										} else {

											/* data return */
											resObj =  $response.safe(resObj);
											var response = {};
											response.results = 	resObj;
											
												$authorise.is(req,res,reqObj,function(authObject) {
													response.information = authObject;
													$response.print(req,res,JSON.stringify(response));
												});					
										}
									}

							});
						}
			}

			$app.readMore = function(req,res,subcollection,subcollectionid,parentObj,popCollection) 	{

				var q = {};
					q[$app.primaryKey]=ObjectId(collectionid);
				var f = {};
				var options ={};

				$db.read(subcollection,q,f,options, function(dbreturn) { 

					var resObj;

					if(dbreturn.fail) {  resObj = {}; console.log("sub search error: "+dbreturn.fail); 
					} else { resObj = dbreturn.success[0]; }

					/* if pop, embed document */
					if(typeof popCollection!="undefined") { parentObj[0][popCollection] = obj[0]; resObj = parentObj[0]; }

					/* JSON or Media Response */
					if(subcollection=="media") { $response.printMedia(req,res,resObj); 
					} else {
						resObj =  $response.safe(resObj); 
						$response.print(req,res,JSON.stringify(resObj));
					}

				});

			}

	/* 	==================
		PUT(http) / UPDATE
		================== */

			$app.preupdate =function(req,res,reqObj) 	{ 

				$authorise.is(req,res,reqObj, function(authis) {
					if(authis.authenticated) { $app.update(req,res,reqObj);  }
					else { 
						var msg="";
						if(typeof authis.message!="undefined") { msg=authis.message; }
						$response.public(req,res,msg); 
					}
				});			
			}

			$app.update =function(req,res,reqObj) 	{

					var collection = reqObj.collection, collectionid = reqObj.collectionid;
					var findbyID=$utils.isValidID(collectionid); 

					var reqBody = req.body;


					/* Parameters */
						/* query */
						var q={}; if(findbyID) { q[$app.primaryKey]=ObjectId(collectionid); } else { 

							q = $utils.setQuery(res,reqObj); 

						}
						/* fields */
						var f = $utils.setFields(res,reqObj);
						/* limit */
						var l = $utils.setLimit(res,reqObj);
						/* sort */
						var s = $utils.setSort(res,reqObj);


						/* check parameters */
						if(q.systemformat=="invalid" || f.systemformat=="invalid" || s.systemformat=="invalid") {  $response.printValidation(req,res);  }
						else {
								/* search preferences */
								var options ={};
								options.multi = true;
								/*var update ={$set: reqBody};*/
								var update = reqBody;

								/* todo , schema checking for <COLLECTION> and reqBody */
								/* todo , permissions of authenticated for  <COLLECTION> and reqBody */
								$db.update(collection,q,update,options, function(dbreturn) { 
									resObj = {success : true};
									if(dbreturn.fail || !dbreturn.success) { 
										resObj.error = 'resource not found'; 
										console.log(dbreturn.fail);  
									} 
									$authorise.is(req,res,reqObj,function(authObject) {
										resObj.information = authObject;
										$response.print(req,res,JSON.stringify(resObj));
									});	

								});
							}
			}

	/* 	=====================
		DELETE(http) / DELETE
		===================== */

			$app.predelete =function(req,res,reqObj) 	{ 

				$authorise.is(req,res,reqObj, function(authis) {
					if(authis.authenticated) { $app.delete(req,res,reqObj);  }
					else { 
						var msg="";
						if(typeof authis.message!="undefined") { msg=authis.message; }
						$response.public(req,res,msg); 
					}
				});	

			}

			$app.delete =function(req,res,reqObj) 	{

					var collection = reqObj.collection, collectionid = reqObj.collectionid;
					var findbyID=$utils.isValidID(collectionid); 

					var reqBody = req.body;

					/* Parameters */
						/* query */
						var q={}; if(findbyID) { q[$app.primaryKey]=ObjectId(collectionid); } else {  q = $utils.setQuery(res,reqObj); }
						var deleteCount = $utils.setDeleteCount(res,reqObj);

						/* TODO : validate req body */

						/* TODO : permissions */
						/* always attach the OID of logged in user to the q Obj - where AUTHOR or CARES or PARTNER */

						/* check parameters */
						if(q.systemformat=="invalid") {  $response.printValidation(req,res);  }
						else {

								/* todo , schema checking for <COLLECTION> and reqBody */
								/* todo , permissions of authenticated for  <COLLECTION> and reqBody */

									$db.delete(reqObj.collection,q,deleteCount, function(dbreturn) {

										if(dbreturn.fail || !dbreturn.success) { 
											resObj = [{'error':'resource not found','status':'404'}]; 
											if(dbreturn.fail) { console.log(dbreturn.fail); } 
										} else { resObj = {success : true}; }

										$authorise.is(req,res,reqObj,function(authObject) {
											resObj.information = authObject;
											$response.print(req,res,JSON.stringify(resObj));
										});	

									});
							}
			}

	/* 	================
		MEDIA GET(http) / READ
		================ */

			$app.readMedia = function(req,res,reqObj) 	{

					var mediaRef = reqObj.collection;
					var validRef=$utils.isValidID(mediaRef); 
					

					var resObj = [];
					if(validRef) {  
						var q = {primaryKey: ObjectId(mediaRef)};
						var f = {};
						var options ={};

						$db.read("media",q,f,options, function(dbreturn) {

							if(dbreturn.fail) {  resObj = {}; console.log("media find error: "+dbreturn.fail); 
							} else { 

								resObj = dbreturn.success; 
							}
							$response.printMedia(req,res,resObj[0]);

						});

					} else { $response.printMedia(req,res,resObj); }

			}

module.exports = $app;