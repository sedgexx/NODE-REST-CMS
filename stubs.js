	/* 	REST CRUD ROUTES for DATABASE ACTIONS  ========================
	
	- collect the requested route from start.js
	- use refunctions.js to police the request before any DB calls

	R. Sedgwick
	02/08/2013

	Revisions
	_______________________________

	DATE:
	AUTHOR: 

	========================================================= */

	var config = require('./config'),
	$request = require('./api/request'),
	$response 	= require('./api/response'),
	$app = require('./api/app');

/* 	=====================================================================
	handle the initial request via HTTP verb, check auth, paths and map to DB actions
	===================================================================== */

	var $stubs = {};


	$stubs.get 		= function(req,res) {
							var reqObj = $request.getReqObject(req);
							var valid = $request.OAC(reqObj)
							if(valid.OAC) { $app.preread(req,res,reqObj); } 
							else { $response.notfound(res);}

					};

	$stubs.post 		= function(req,res) {
							var reqObj = $request.getReqObject(req),
							valid = $request.OAC(reqObj);
							if(valid.OAC) {$app.precreate(req,res,reqObj);} 
							else { $response.notfound(res);}	
					};

	$stubs.put 		= function(req,res) {
							var reqObj = $request.getReqObject(req),
							valid = $request.OAC(reqObj);
							if(valid.OAC) {$app.preupdate(req,res,reqObj);} 
							else { $response.notfound(res);}	
					};

	$stubs.delete 	= function(req,res) {
							var reqObj = $request.getReqObject(req),
							valid = $request.OAC(reqObj);
							if(valid.OAC) {$app.predelete(req,res,reqObj);} 
							else { $response.notfound(res);}			
					};

	$stubs.media = 	{


						get: function(req,res) {
								var reqObj = $request.getReqObject(req);
								$app.readMedia(req,res,reqObj);	
							}

					};

	/* ====================================================== */
	
	module.exports = $stubs;