var $cms_render = require('../cms/render.js');
var $cms_data = require('../cms/data.js');
var $cms_response = require('../cms/response.js');

var $cms_authenticate = {};

$cms_authenticate.cantry = function(authObject) {

	var can = false;
		if(typeof authObject.body!=="undefined") {
			if(typeof authObject.body.email!=="undefined") {
				if(typeof authObject.body.password!=="undefined") { can=true; }
			}	
		}	

	return can;
}

$cms_authenticate.login = function(req,res,requestObject) {

	if($cms_authenticate.cantry(requestObject)) {

		console.log(requestObject.body);
		$cms_data.post("login",requestObject.body,function(result) {
			
			var authRead = JSON.parse(result);

			if(authRead.status===200) {
				var authRead = JSON.parse(result);
				console.log("=============================");
				console.log(authRead);
				console.log("=============================");
				req.session.authentication = { 
						authenticated:true,
						user:authRead.email,
						key:authRead.password.key,
						expires : authRead.password.expires };

			} else { req.session.authentication = { authenticated:false }; }
			
			$cms_response.JSON(req,res,result);

		});


	} else {

		req.session.authentication = { authenticated:false };
		var authObject ={status:403,error:"Invalid Credentials"};

		$cms_response.JSON(req,res,JSON.stringify(authObject));

	}

};

$cms_authenticate.logout = function(req,res,requestObject) {

	if(typeof req.session.authentication!=="undefined" && req.session.authentication!==null) {
		console.log(requestObject.body);
		requestObject.body.email = req.session.authentication.user;
		requestObject.body.password ={};
		requestObject.body.password.key = req.session.authentication.key;

		$cms_data.post("logout",requestObject.body,function(result) {
			
			var authRead = JSON.parse(result);

			req.session.authentication = null; 
         	$cms_render.buildpage(req,res,requestObject);

		});

	} else {
		/* maybe someone hit this page without being logged in */
		res.redirect("/");
	}

};

module.exports = $cms_authenticate;