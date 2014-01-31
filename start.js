/* 
	WEBBUILDER - WEB CMS with REST API - built on NODE JS with MongoDB DataStore
	_____________________________________

	Copyright (c) 2014  - Robert Sedgwick - NEW4 Ltd. 

	MIT Licence - Open Source Software

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

	______________________________________

	AUTHOR: Rob Sedgwick - rob@new4.co.uk
	DATE: 31012014
	______________________________________

	COMMON DEPENDANCIES 

	EXPRESS 	- npm install express 	- ( web server )
	BYCRYPTJS 	- npm install bcryptjs 	- ( salt and password hash for authentication )
	MONGOJS 	- npm install mongojs 	- ( check! use this one - git://github.com/gett/mongojs.git) ( driver for mongodb )
	URL 		- npm install url 		- ( help with processing url requests )
	UTIL 		- npm install util 		- ( help with common js utilities )
	MONGOOSE 	- npm install mongoose 	- ( ORM for mongo - there if required )
	UNDERSCORE 	- npm install underscore - ( handy )
	NODE-VALIDATOR	- npm install node-validator - ( check! - http://github.com/chriso/node-validator - util for string sanitisation and value validation )
	______________________________________

	CMS DEPENDANCIES

	EJS-LOCALS 		- npm install ejs-locals 		- ( templating )
	DUSTJS-LINKEDIN - npm install dustjs-linked 	- ( templating )
	DUSTJS-HELPERS 	- npm install dustjs-HELPERSS 	- ( templating - logic )
	CONSOLIDATE 	- npm install consolidate 		- ( templating )
	LESS-MIDDLEWARE - npm install less-middleware 	- ( css rendering )

*/

	/* ext libs */
	var express = require("express"),
	url = require('url'),
	util = require('util'),
	template_engine = 'dust', domain = 'localhost',
	http = require('http'),
	store = new express.session.MemoryStore,
	path = require('path');

	/* app settings */
	var config = require('./config');
	config.http.wwwroot = __dirname;

	/* routed webservice methods  */
	var $stubs = require("./stubs"),
	$cms_stubs = require('./cms/stubs.js');

	/* init xpress */
	var app = express();

	/* CMS templating */
	var dust = require('dustjs-linkedin'),
	dustjshelpers = require('dustjs-helpers'),
	cons = require('consolidate');
	app.engine('dust', cons.dust);

	/* remove the option that strips white space from rendered HTML */
	if(config.developer.mode) {
	  dust.optimizers.format = function(ctx, node) { return node };
	}

	app.configure(function(){

	  app.set('template_engine', template_engine);
	  app.set('domain', domain);
	  app.set('port', process.env.PORT || 80);
	  app.set('views', __dirname + '/views');
	  app.set('view engine', template_engine);
	  if(config.gzip) { app.use(express.compress()); }
	  app.use(express.favicon());
	  app.use(express.logger('dev'));
	  app.use(express.bodyParser());
	  app.use(express.methodOverride());
	  app.use(express.cookieParser('wigglybits'));
	        app.use(express.session({ secret: '52c19a9a38930b6821000004', store: store }));
	  app.use(express.session());
	  app.use(app.router);
	  app.use(require('less-middleware')({ src: __dirname + '/public' }));
	  /*app.use(express.static(path.join(__dirname, 'public'),{ maxAge: 86400000 }));*/

	        //middleware
	        app.use(function(req, res, next){
	                if ( req.session.user ) {
	                        req.session.logged_in = true;
	                }
	                res.locals.message = req.flash();
	                res.locals.session = req.session;
	                res.locals.q = req.body;
	                res.locals.err = false; 
	                next();
	        });

	});

	/* allow remote REST AJAX Calls */
	var allowCrossDomain = function(req, res, next) {
	    res.header('Access-Control-Allow-Origin', '*');
	    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
	    if ('OPTIONS' == req.method) { res.send(200); } else { next(); }
	};
	app.use(allowCrossDomain);
	
	if(config.gzip) { app.use(express.compress()); }
	app.use(express.bodyParser());

/* 	===================================================================
	REST ROUTES 
	================================================================== */

        /* static web server */
/*		app.use(express.static(__dirname + config.http.static));*/

		/* API Routes */
		app.get(config.http.apiContext+"*", 		$stubs.get);
		app.post(config.http.apiContext+"*",		$stubs.post);
		app.put(config.http.apiContext+"*", 		$stubs.put);
		app.delete(config.http.apiContext+"*", 	$stubs.delete);
		app.get(config.http.mediaContext+"*", 	$stubs.media.get);

/* ===================================================================

   CMS ROUTES 

   =================================================================== */

	app.configure('development', function(){
	  app.use(express.errorHandler());
	});

	app.locals.inspect = require('util').inspect;

	/* static web server */
	app.get('/assets/*', function(req, res){
	    var uid = req.params.uid,
	        path = req.params[0] ? req.params[0] : 'index.html';
	        console.log(path);
	    res.sendfile(path, {root: './public/assets/'});
	});

	/* static web server */
	app.get('/theme/*', function(req, res){
	    var uid = req.params.uid,
	        path = req.params[0] ? req.params[0] : 'index.html';
	        console.log(path);
	    res.sendfile(path, {root: './public/theme/'});
	});

	/* dynamic routes */
	app.get('/*', $cms_stubs.get);
	app.post('/*', $cms_stubs.post);



/* 	===================================================================
	START SERVICE
	================================================================== */

		/* boot up the http */
http.createServer(app).listen(app.get('port'), function(){

 	console.log("                                   ");
	console.log("   --------------------------------");
  	console.log("NEW4 Webuilder - CMS and REST API server listening on port " + app.get('port'));
 	console.log("                                   ");
	console.log("   --------------------------------"); 
	console.log("                                   ");
	console.log("   == REST API ====================");
	console.log("                                   ");
	console.log("   API context       :   "+ config.http.apiContext);
	console.log("   DB Store          :   "+ config.db.store);
	console.log("   Database          :   "+ config.db.name);
	console.log("   Using ORM         :   "+ config.modelconfig.ORM.active);
	if(config.modelconfig.ORM.active) {
	console.log("   ORM               :   "+ config.modelconfig.ORM.library);	
	}
	console.log("                                   ");
	console.log("   Dev : console log :   "+config.developer.consolemode);
	console.log("   Dev : auth off    :   "+config.developer.noOAC);
	console.log("                                   ");
	console.log("   Dev : last commit :   "+config.developer.commit);
	console.log("   Dev : last commit :   "+config.developer.commitdetail);
	console.log("                                   ");
	console.log("   --------------------------------");
	console.log("                                   ");
	console.log("   http is listening on port :   "+ config.http.port);
	console.log("                                   ");
	console.log("   --------------------------------");
	console.log("                                   ");
	if(config.developer.noOAC) { 
	console.log("   WARNING !                       ");
	console.log("   Authentication IS NOT on        ");
	console.log("                                   ");
	console.log("   --------------------------------");
	}

});

/* 	================================================================= */


