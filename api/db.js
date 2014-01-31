var config = require('../config');
var mongojs = require('mongojs');
var mongoose = require('mongoose');

/* 	==========================================================================================================

	DATABASE - CREATE, READ, UPDATE and DELETE FUNCTIONS
		_____________________________________
		These functions recieve:

		- COLLECTION 
		- QUERY / FIELDS / OPTIONS
		- DATA ( to insert or update )
		
		Each of these functions returns:

		{ success: obj, fail: obj }
		__________________________________

		The Purpose of this file is to separate the mongodb (mongojs and mongoose) specific database 
		driver calls from the application logic - $app.js

		Should the db engine be changed in the future, 
		it is possible to intercept db requests using this file

		All Request data, queries and options are javascript objects.
		All Responses are javascript objects.

		__________________________________

		ALL database calls are routed through these functions.

	============================================================================================================= */

		/* mongojs connection */
		var mongojscollections =[];

		config.db.collections.forEach(function(val,key) {
			mongojscollections.push(val.name);
		});

		var db = mongojs.connect(config.db.url,mongojscollections);

		/* mongoose saving connection */
		var Schema 	= mongoose.Schema;
		var models = require('../api/models');
		mongoose.connect('mongodb://'+config.db.url);


		/* support functions and utilities */
		var $response = require('../api/response');
		var ObjectId = mongojs.ObjectId, checkValidHex = new RegExp("^[0-9a-fA-F]{24}$");
		var _ = require('underscore');

	/* 	========================================================================================================= */

		var $db = {};

		/* 	====================
			CREATE 
			==================== */
			$db.create = function(collection,data,useORM,callback) {

				/* useORM = use mongoose model schema validation and restriction */

				if(useORM) {
						data.save(function(error, object) { callback({success:object,fail:error}); });
				} else {
						db[collection].save(data, function(error, object) { 

							console.log("save err :" + JSON.stringify(error));
							console.log("return object :" + JSON.stringify(object));
							console.log("attempting to save :" + data);
							callback({success:object,fail:error});

							 });
				}

			}

		/* 	====================
			READ MANY
			==================== */
			$db.read = function(collection,query,fields,options,callback) {

				db[collection].find(query,fields,options,function(error, object) {  callback({success:object,fail:error});  });

			}

		/* 	====================
			READ ONE
			==================== */
			$db.readOne = function(collection,query,fields,options,callback) {

				db[collection].findOne(query,fields,options,function(error, object) {  callback({success:object,fail:error});  });

			}
		/* 	====================
			UPDATE
			==================== */

			$db.update = function(collection,query,update,options,callback) {

				db[collection].update(query,update,options,function(error, object) {  callback({success:object,fail:error});  });

			}

		/* 	====================
			DELETE
			==================== */

			$db.delete = function(collection,query,deletecount,callback) {

				db[collection].remove(query,deletecount, function(error, object) {  callback({success:object,fail:error});  });

			}

module.exports = $db;