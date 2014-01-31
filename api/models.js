var config = require('../config');
var mongoose = require('mongoose');
var Schema 	= mongoose.Schema;

var models = {}

/* collections */
	
	/* resource models */
	models.people 		= { name : "people" 	}
	models.locations 	= { name : "locations"	}
	models.events 		= { name : "events"		}
	models.media 		= { name : "media"		}
	models.activities 	= { name : "activies" 	}
	models.articles 	= { name : "articles" 	}
	models.comments 	= { name : "comments" 	}
	/* application models */
	models.circles 		= { name : "circles"	}
	models.workflow 	= { name : "workflow" 	}

/*	====================================================================================
	RESOURCE MODEL Definitions
	==================================================================================== */

/* 	======================================== 
	PEOPLE 
	======================================== */

		models.people.Schema = new Schema(

				{
					firstname 		: String,
				    lastname 		: String,
				    gender 			: { type: String, enum: ['male', 'female']}, 
				    title 			: { type: String, enum: ['Mr', 'Mrs', 'Ms']}, 
					roles			: { type: String, enum: ['teacher', 'parent', 'student']}, 
					circles 		: [{ type: Schema.Types.Mixed, ref: models.circles.name }],
					circlemember 	: { type: Schema.Types.Mixed, ref: models.circles.name },
				    email 			: { type: String, unique: true}, 
				    username 		: String, 
				    password 		: String,  
					_createddate	: {type: Date, default: Date.now }
				},
				{ collection:models.people.name, versionKey:config.modelconfig.versionkey}
		);

		models.people.Schema.path('email').validate(function (email) { var regx = config.validations.emailRegx; return regx.test(email); }, config.validations.emailResponse);
		models.people.Person = mongoose.model(models.people.name, models.people.Schema);
		models.people.init = function(obj) { var o = new models.people.Person(obj); return o; }


/* 	======================================== 
	LOCATIONS
	======================================== */

		models.locations.Schema = new Schema(

				{
					name	: String,	/* free string */
					details	: {
									address		: String, /* free string */
									phonenumber	: String, /* free string */
									description : String, /* free string */
									media       : [{ type: Schema.Types.Mixed, ref: 'media' }], /* ID references to media objects ( avatar ) */
									location 	: {
													lon: Number,
													lat: Number
												  }	
							   },
					avatar 	: { type: Schema.Types.Mixed, ref: 'media' },  	/* ID reference to media object */
					parent	: { type: Schema.Types.Mixed, ref: models.locations.name }, 	/* ID reference to parent location object */
				    author	:  {	
									id      	: { type: Schema.Types.Mixed, ref: models.people.name },  /* ID reference to people object */
									firstname 	: String,  /* derefenced firstname at time of authoring */
									lastname 	: String,  /* derefenced lastname at time of authoring 	*/
									role 		: String   /* derefenced jobtitle at time of authoring 	*/
							    },
					canuse	: 	[{ type: Schema.Types.Mixed, ref: models.people.name  }],   /* ID references to people objects */

					/* meta doc values */
					_createddate	: {type: Date, default: Date.now }
				},
				{ collection:models.locations.name, versionKey:config.modelconfig.versionkey}
		);

		models.locations.Location = mongoose.model(models.locations.name, models.locations.Schema);
		models.locations.init = function(obj) { var o = new models.locations.Location(obj); return o; }


/* 	======================================== 
	EVENTS 
	======================================== */

		models.events.Schema = new Schema(

				{
					locationid  	: { type: Schema.Types.Mixed, ref: models.locations.name }, /* ID reference to location object */
					name			: String, /* free string */
					description		: String, /* free string */
					type			: String, /* free string */
					startdate		: Date, /* BSON Date Object */
					enddate			: Date, /* BSON Date Object */
					duration		: Number,  /*  hours to 1 decimal */
					owner          : String,
					reservations 	: [{ type: Schema.Types.Mixed, ref: models.people.name }],  /* ID references to people objects */
					attendance		: [{ type: Schema.Types.Mixed, ref: models.people.name }],  /* ID references to people objects */
				    author			:  {	
											id      	: { type: Schema.Types.Mixed, ref: models.people.name },  /* ID reference to people object */
											firstname 	: String,  /* derefenced firstname at time of authoring */
											lastname 	: String,  /* derefenced lastname at time of authoring 	*/
											role 		: String   /* derefenced jobtitle at time of authoring 	*/
							    		},

					/* meta doc values */
					_createddate	: {type: Date, default: Date.now }
				},
				{ collection:models.events.name, versionKey:config.modelconfig.versionkey}
		);

		/*models.locations.Schema.path('email').validate(function (email) { var regx = config.validations.emailRegx; return regx.test(email); }, config.validations.emailResponse);*/

		models.events.Event = mongoose.model(models.events.name, models.events.Schema);
		models.events.init = function(obj) { var o = new models.events.Event(obj); return o; }


/* 	==============================================
	MEDIA ( only jpeg at present without GRIDFS )
	============================================== */

		models.media.Schema = new Schema(

				{
					name			: String, /* free string */
					type			: String, /* mime friendly */
					use				: String, /* activity type use */
			  		data 			: String, /* base64 */
				    author			:  {	
											id      	: { type: Schema.Types.Mixed, ref: models.people.name },  /* ID reference to people object */
											firstname 	: String,  /* derefenced firstname at time of authoring */
											lastname 	: String,  /* derefenced lastname at time of authoring 	*/
											role 		: String   /* derefenced jobtitle at time of authoring 	*/
							    		},
					/* meta doc values */
					_createddate	: {type: Date, default: Date.now }
				},
				{ collection:models.media.name, versionKey:config.modelconfig.versionkey}
		);

		models.media.Media = mongoose.model(models.media.name, models.media.Schema);
		models.media.init = function(obj) { var o = new models.media.Media(obj); return o; }

/* 	======================================== 
	ACTIVITIES ( TYPES OF ) 
	======================================== */

		models.activities.Schema = new Schema(

				{
					name 			: String, /* free string , friendly used , the tag name */
					description 	: String, /* free string */
					type 			: String, /* string no space, simple tagging id */
					role 			: [], /* teacher , parent , matching roles see this activity */
					properties		: {}, /* populated keys/values from models.activities.properties */
					workflow		: {}, /* populated values from models.activities.workflow ?? can be used to instruct workflow creation */
				    author			:  {	
											id      	: { type: Schema.Types.Mixed, ref: models.people.name },  /* ID reference to people object */
											firstname 	: String,  /* derefenced firstname at time of authoring */
											lastname 	: String,  /* derefenced lastname at time of authoring 	*/
											role 		: String   /* derefenced jobtitle at time of authoring 	*/
							    		},
					/* meta doc values */
					_createddate	: {type: Date, default: Date.now }
				},
				{ collection:models.activities.name, versionKey:config.modelconfig.versionkey}
		);

		models.activities.Activity = mongoose.model(models.activities.name, models.activities.Schema);
		models.activities.init = function(obj) { var o = new models.activities.Activity(obj); return o; }


/* 	======================================== 
	COMMENTS  
	======================================== */

		models.comments.Schema = new Schema(
				{
					articleid		: { type: Schema.Types.Mixed, ref: models.articles.name },
					authorid    	: { type: Schema.Types.Mixed, ref: models.people.name }, 
					authorname  	: String,
					authoravatar  	: { type: Schema.Types.Mixed, ref: models.media.name },
					comment  		: String,
					rating	    	: String,
					/* meta doc values */
					_createddate	: {type: Date, default: Date.now }
				},
				{ collection:models.comments.name, versionKey:config.modelconfig.versionkey}
		);

		models.comments.Comment = mongoose.model(models.comments.name, models.comments.Schema);
		models.comments.init = function(obj) { var o = new models.comments.Comment(obj); return o; }

/* 	======================================== 
	ARTICLES
	======================================== */

		models.articles.Schema = new Schema(

				{
					name			: String, 	/* name-unique given for poss use in friendly URL viewing */
					headline 		: String,  /* free string , the title of the article */
					href			: String,
					activity    	: {
										id 		: { type: Schema.Types.Mixed, ref: models.activities.name }, 
										name    : String, /* ID reference to activity type object */
										values  : [{ type: Schema.Types.Mixed}]

									  },						
					author			: {	
										id      	: { type: Schema.Types.Mixed, ref: models.people.name }, 	/* ID reference to people object 				*/
										firstname 	: String, 	/* derefenced firstname at time of authoring 	*/
										lastname 	: String, 	/* derefenced lastname at time of authoring 	*/
										role 		: String 	/* derefenced jobtitle at time of authoring 	*/
									  },
					workflow		: { type: Schema.Types.Mixed, ref: 'workflow' }, 	/* dereferenced workflow object */
					location 		: {
										id 			: { type: Schema.Types.Mixed, ref: models.locations.name }, /* ID reference to location object */
										name		: String, /* dereference to location name */
										location 	: { 
														lon 	: Number, /* dereference to location latitude */
														lat 	: Number  /* dereference to location longitude */
													   }
										},
					eventref        : {}, 	/* dereference to event reference */
					subjects  		: [{ type: Schema.Types.Mixed, ref: models.people.name }],  	/* ID references to tagged people */
					commentary		: [{ type: Schema.Types.Mixed, ref: models.comments.name }],  	/* ID references to comment objects */
				 	history			: [],  	/* this article previous to author update / undo, redo, audit trail - legacy, handled by version now */
					media			: [{ type: Schema.Types.Mixed, ref: models.media.name }],   	/* ID references to media objects */

					/* meta doc values */
					_createddate	: {type: Date, default: Date.now },
					_modifieddate	: Date,
					_expirydate		: Date

				},
				/* collection to store in */
				{ collection:models.articles.name, versionKey:config.modelconfig.versionkey}
		);

		models.articles.Article = mongoose.model(models.articles.name, models.articles.Schema);
		models.articles.init = function(obj) { var o = new models.articles.Article(obj); return o; }


/*	====================================================================================
	APPLICATION MODELS 
	==================================================================================== */

/* 	============================================= 
	CIRCLES ( OAC )
	============================================= */

		models.circles.Schema = new Schema(

				{
					name		: String, /* name of Circle - could be name of site, or family name - a default is created each sign up */ 
				    author		:  {  	/* author/Owner of the circle object */
										id      	: { type: Schema.Types.Mixed, ref: models.people.name },  /* ID reference to people object */
										firstname 	: String,  /* derefenced firstname at time of authoring */
										lastname 	: String,  /* derefenced lastname at time of authoring 	*/
										role 		: String   /* derefenced jobtitle at time of authoring 	*/
						    		},
					/* meta doc values */
					_createddate	: {type: Date, default: Date.now }
				},
				{ collection:models.circles.name, versionKey:config.modelconfig.versionkey}
		);

		models.circles.Circle = mongoose.model(models.circles.name, models.circles.Schema);
		models.circles.init = function(obj) { var o = new models.circles.Circle(obj); return o; }

/* 	============================================= 
	WORKFLOW
	============================================= */

		models.workflow.Schema = new Schema(
				{
					stage		: Number, /* current stage */
					stages 		: [ {  	/* defined for each stage */
										stage 	: Number,
										action 	: String,
										person 	: { type: Schema.Types.Mixed, ref: models.people.name }
									} 
			   				  	  ],
			   		articleid	: { type: Schema.Types.Mixed, ref: models.articles.name }, /* article the workflow relates to */
				    author			:  {  	/* author of the workflow object */
											id      	: { type: Schema.Types.Mixed, ref: models.people.name },  /* ID reference to people object */
											firstname 	: String,  /* derefenced firstname at time of authoring */
											lastname 	: String,  /* derefenced lastname at time of authoring 	*/
											role 		: String   /* derefenced jobtitle at time of authoring 	*/
						    		},
					/* meta doc values */
					_createddate	: {type: Date, default: Date.now }
				},
				{ collection:models.workflow.name, versionKey:config.modelconfig.versionkey}
		);

		models.workflow.Workflow = mongoose.model(models.workflow.name, models.workflow.Schema);
		models.workflow.init = function(obj) { var o = new models.workflow.Workflow(obj); return o; }

/*	==================================================================================== */
	module.exports = models;
/*	==================================================================================== */


