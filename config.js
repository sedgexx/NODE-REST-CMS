var config = {};

/* REST API CONFIG */

config.db = {};
config.http = {};
config.validations = {};
config.messages = {};
config.developer = {};
config.modelconfig = {};

	/*  ========================================================
		HTTP
		======================================================== */

		config.http.port 			=  80;
		config.http.gzip			=  true;	
		config.http.contenttype 	=  {"Content-Type": "application/json"};
		config.http.responseHeaders =  {

										AccessControlAllowOrigin 	: 	"*",
										AccessControlAllowMethods 	: 	"GET,PUT,POST,DELETE,OPTIONS",
										AccessControlAllowHeaders 	: 	"Content-Type, Authorization, Content-Length, X-Requested-With"

								  	 }; 
		config.http.static 			= "/www";
		config.http.template 		= "/views"; 
		config.http.apiContext 		= "/v1/";
		config.http.mediaContext 	= "/media*";
							   
	/*  ========================================================
		DATABASE 
		======================================================== */

		/* database */
		config.db.store 	= "mongodb"; 
		config.db.name 	   	= "ribblevalleyweb";
		config.db.url 		= "127.0.0.1:27017/"+config.db.name;
		config.db.user		= "";
		config.db.password	= "";
		config.db.rstlimit 	= 500; 	/* default limit for reads */
		config.db.primarykeys = ["_id","name"];

		/* Resource settings and allowed DB routes */
		config.db.collections	= [ 
								{name:"pages",GET:"public"},
								{name:"layouts",GET:"public"},
								{name:"sections",GET:"public"},
								{name:"content",GET:"public"},
								{name:"promotions",GET:"public"},
								{name:"media",GET:"public"},
								{name:"people",GET:"public"},
								{name:"login",GET:"public"}, /* a route */
								{name:"logout",GET:"public"}, /* a route */
								{name:"sessions",GET:"public"},
								{name:"circles",GET:"public"}
							   ];

	/*  ========================================================
		MODELS AND SCHEMA
		======================================================== */

		config.modelconfig.ORM =  {active:false,library:"mongoose"}; 
		config.modelconfig.versionkey =  "_version";

		config.omitValues	= ["password","_ver"]; 	/* list of document values (cols) to omit from reads */

		config.validations.emailRegx = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
		config.validations.emailResponse = "Email address not valid";

	/*  ========================================================
		AUTHENTICATION
		======================================================== */

		config.passwordcryptlevel	= 10; 	/* salt and pass encrypt level 10 high, 1 low ( bcrypt ) */
		config.sessiontimeout		= 1; 	/* hours */
		/* application settings */
		config.authenticationkey = "email"; /* not hooked up yet, coded to use "email" - see dbfunctions.authenticate() */


	/*  ========================================================
		MESSAGES
		======================================================== */

		config.messages.loginfailed 			= {status:403,message:"Login Failed",href:"/login"};
		config.messages.loginsuccess 			= {status:200,message:"Login Success",href:"/login"};
		config.messages.servicestatus 			= "Service unavailable";
		/* common returns */
		config.messages.publicgeneric 			= {status:"403",message:"Resource not found or not authenticated",href:"/login"};
		config.messages.genericinvalidrequest 	= {status:"422",message:"invalid request parameters, check request is a valid format"};
		config.messages.validationError 		= {status:"422",message:"",Error:"",value:""};


	/*  ========================================================
		DEVELOPER
		======================================================== */
		config.developer.mode = true;
		config.developer.consolemode 	= true; 	/* enables console messages in node */
		config.developer.noOAC 			= false;	/* turn off access control for writing objects  */
		config.developer.commit			= "rsedgwick / 25/08/2013 22:30";
		config.developer.commitdetail	= "adding oac to req functions";
		config.mediaFileSystem = false;
		config.noimage = "data:image/jpeg;base64,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dRTpf9YaaOooAkooooAKKKKACiiigCM/eqSoz96pKAGfx/jSuO9J/H+NOIyMUACnIpo5bNIDgEetOUcfWgBG60+mN1p/agBjnnHpQGAGMUg5NSYHpQBGzA05Txj0pcD0pg4agB7dDSJS0wZU0ASUwg5pwIPSloAjII605fu0jEHgUq/doAR+tKFGKR+tPHQUAN2UBQDmnUUAFFFFABRRRQAU1+lOpr9KAGVYi/1YqvViL/VigCKX/WGmjqKdL/rDTR1FAElFFFABRRRQAUUUUANK5OadRRQA0rzmnUUUANK88UtLRQA1lyc0pGRgUtFADVGKdRRQAU1lycinUUAIOlBANLRQAwoaTa1SUUANCetOoooAaykmk2Gn0UAM2GjYafRQAnYUtFFABRRRQAU1+lOpr9KAGVYi/wBWKr1Yi/1YoAil/wBYaaOop0v+sNNHUUASUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFNfpTqa/SgBlWIv9WKr1Yi/1YoAil/1hpo6inS/6w00dRQBJRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAU1+lOpr9KAGVYi/wBWKr1Yi/1YoAil/wBYaaOop0v+sNMHBoAlopu/2o3+1ADqKbv9qN/tQA6im7/ajf7UAOopu/2o3+1ADqKbv9qN/tQA6im7/ajf7UAOopu/2o3+1ADqKbv9qN/tQA6im7/ajf7UAOopu/2o3+1ADqKbv9qN/tQA6im7/ajf7UAOopu/2o3+1ADqKbv9qN/tQA6im7/ajf7UAOopu/2o3+1ADqa/Sjf7U0tuHSgBKsRf6sVXqxF/qxQAkqbhkdRUBGOtW6TAPUUAVaKs7V/uijav90UAVqKs7V/uijav90UAVqKs7V/uijav90UAVqKs7V/uijav90UAVqKs7V/uijav90UAVqKs7V/uijav90UAVqKs7V/uijav90UAVqKs7V/uijav90UAVqKs7V/uijav90UAVqKs7V/uijav90UAVqKs7V/uijav90UAVqKs7V/uijav90UAVqKs7V/uijav90UAVqKs7V/uijav90UAVqKs7V/uijav90UAVqKs7V/uijav90UAVqKs7V/uijav90UAQIhY/wBasDilooA//9k=";
/*  ======================================================== */

module.exports 		= config;

/*  ======================================================== */