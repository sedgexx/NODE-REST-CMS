var http = require("http");
var $cms_utils = require('../cms/utils.js');
var $cms_data = require('../cms/data.js');
var $cms_request = require('../cms/request.js');
var $cms_response = require('../cms/response.js');
var $cms_render = require('../cms/render.js');
var $cms_authenticate = require('../cms/authenticate.js');

var $cms_stubs = {};

$cms_stubs.get = function(req, res){
        var template_engine = req.app.settings.template_engine;
        res.locals.session = req.session;
        var requestObject = $cms_request.getReqObject(req);
        if(requestObject.page==="logout") { $cms_authenticate.logout(req,res,requestObject); } 
        else {  $cms_render.buildpage(req, res,requestObject); }
};

$cms_stubs.post = function(req, res){
        var template_engine = req.app.settings.template_engine;
        res.locals.session = req.session;
        var requestObject = $cms_request.getReqObject(req);
        if(requestObject.page==="login") {
                $cms_authenticate.login(req,res,requestObject);
        } else { 
                $cms_render.buildpage(req, res,requestObject); 
        }

};


module.exports = $cms_stubs;