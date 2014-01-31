var $cms_response = {};

$cms_response.send = function(req,res,data) {
	res.render('index', data);
};

$cms_response.send404 = function(req,res,data) {
			res.status(404); 
			res.setHeader("Content-Type","text/html");
			res.render('index', data);
};

$cms_response.JSON = function(req,res,data) {

	res.header('Access-Control-Allow-Origin', "*");
	res.header('Access-Control-Allow-Methods', "GET,POST");
	res.header('Access-Control-Allow-Headers', "Content-Type, Authorization, Content-Length, X-Requested-With");

	var jsData = JSON.parse(data);
	res.writeHead(jsData.status, {"Content-Type": "application/json"}); 
	res.end(JSON.stringify(jsData));
}

module.exports = $cms_response;