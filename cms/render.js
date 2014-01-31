var http = require("http");
var $cms_utils = require('../cms/utils.js');
var $cms_data = require('../cms/data.js');
var $cms_request = require('../cms/request.js');
var $cms_response = require('../cms/response.js');

var $cms_render = {};

$cms_render.setHierarchy = function(pages) {

	var pagesHierarchy =[];
	
	/* level 1's */
	for (var i = 0, leni=pages.length; i < leni; ++i) {	
		if(pages[i].parent==="") { pagesHierarchy.push(pages[i]); pages[i].pages=[]; }
	};

	/* level 2's */
	for (var j = 0, lenj=pages.length; j < lenj; ++j) {	
		if(pages[j].parent!="") { 
			for (var k = 0, lenk=pagesHierarchy.length; k < lenk; ++k) {	
				if(pagesHierarchy[k]._id===pages[j].parent) {
					pages[j].pages=[];
					pagesHierarchy[k].pages.push(pages[j]);
				}
			}
		}
	};

	/* level 3s's */
	for (var l = 0, lenl=pages.length; l < lenl; ++l) {
		if(typeof pages[l].pages==="undefined") {
			for (var m = 0, lenm=pages.length; m < lenm; ++m) {	
				if(typeof pages[m].pages!=="undefined") {
					var pagespages = pages[m].pages;
					for (var n = 0, lenn=pagespages.length; n < lenn; ++n) {	
						if(pagespages[n]._id===pages[l].parent) {
							pagespages[n].pages.push(pages[l]);
						}
					}
				}
			}
		}
	}

	return pagesHierarchy;

};

$cms_render.buildpage = function(req,res,requestObject) {

    /* get the links */
    $cms_data.get(req,res,"pages","",function(pages) {

    	console.log("________________");
    	console.log(pages);
    	console.log("________________");

            if(pages.status==="403") { } else { }

            var renderdata = {};

            pages.results.sort($cms_utils.page.sort.byPriority);

            var flatPages = pages.results;

            pages.results = $cms_render.setHierarchy(pages.results);


            renderdata.pages = pages.results;




            if(requestObject.page==="login") { 
            	$cms_render.login(req,res,requestObject,renderdata); 
            } 
            else if(requestObject.page==="logout") { $cms_render.logout(req,res,requestObject,renderdata); } 
            else if(requestObject.page==="register") { $cms_render.register(req,res,requestObject,renderdata); } 
            else {

                    /* get the current page id and get content, check if matches already made pages and respond */
                    var page;
                    var pagefound = false;
                    if(requestObject.page!=="") {
                            for (var i = 0; i < flatPages.length; i++) { 
                            if(requestObject.page===flatPages[i].href) { page=flatPages[i]; pagefound=true; break;} 

                            }
                    } else { requestObject.page = pages.results[0]; page=pages.results[0]; pagefound=true; }

                    if(!pagefound) {  $cms_render.pagenotfound(req,res,requestObject,renderdata);  } 
                    else { 

                            var apiauthenticated = false;
                            renderdata.admin = [];

                            if(typeof pages.information.authenticated!=="undefined") {
                            	apiauthenticated=pages.information.authenticated;
                            }

                            /* the start of switching abilities if in admin mode */
                            if(typeof req.session.authentication!=="undefined") {
                            	if(apiauthenticated) {
                            		req.session.authentication.expires = pages.information.expires;
                            		req.session.authentication.userid = pages.information.userid;
                            		req.session.authentication.email = pages.information.email;
	                                    renderdata.admin.push({"active":"yes","user":req.session.authentication.user,"key":req.session.authentication.key});
                                	} else { 
                                		req.session.authentication = null;
                                		renderdata.login ={"login":"no"};
                                	}
                            }
                            renderdata.page = page;

                            /* get the content for this page */
                            $cms_data.get(req,res,"content",{page:page._id},function(contents) {

                                    contents.results.sort($cms_utils.contents.sort.byPriority);

                                    /* temp string to int */
                                    contents.results = $cms_utils.contents.ordertointeger(contents.results);

                                    renderdata.contents=contents.results;
                                    if(typeof req.session.authentication!=="undefined") {
                                    renderdata.authentication = req.session.authentication;	
                                    }

                                    $cms_response.send(req,res,renderdata);
                            });

                    }

            }

    });

};

$cms_render.pagenotfound = function(req,res,requestObject,renderdata) {

	/* get the theme */
	var theme = "basic";
		if(typeof renderdata.pages[0]!=="undefined") {
		theme = renderdata.pages[0].theme;
	}

	renderdata.page = {
				name: "Page Not Found",
				href: requestObject.page,
				vieworder: 1,
				description: "Sorry the Page was not found",
				keywords: "Home,where,the,heart,is",
				layout: "col1",
				theme: theme,
				_id: "404"
			};

	renderdata.contents = [{
				_id: "404content",
				author: {
					name: "rsedgwick",
					date: "thursday"
				},
				html: "<h1>Page not Found</h1><p>Sorry the page you have requested does not exixt. <a href='/'>Home</a></p>",
				lastmodified: {
					author: {
						name: "rsedgwick",
						date: "thursday"
					}
				},
				page: "404",
				position: {
					position: "relative",
					column: 1,
					row: 1,
					vieworder: 1
				}
			}];

			$cms_response.send404(req,res,renderdata);

};

$cms_render.login = function(req,res,requestObject,renderdata) {

	/* get the theme */
	var theme = "basic";
		if(typeof renderdata.pages[0]!=="undefined") {
		theme = renderdata.pages[0].theme;
	}

	renderdata.page = {
				name: "Login",
				href: requestObject.page,
				vieworder: 1,
				description: "Website Administration",
				keywords: "Home,where,the,heart,is",
				layout: "col1",
				theme: theme,
				_id: "login"
			};

	renderdata.contents = [{
				_id: "logincontent",
				author: {
					name: "rsedgwick",
					date: "thursday"
				},
				html: "Login using the credentials below",
				lastmodified: {
					author: {
						name: "rsedgwick",
						date: "thursday"
					}
				},
				page: "login",
				position: {
					position: "relative",
					column: 1,
					row: 1,
					vieworder: 1
				}
			}];

			renderdata.login ={"login":"yes"};
        	if(typeof requestObject.autherror!=="undefined") {
        		renderdata.login.error = requestObject.autherror.error;
        	}
			$cms_response.send(req,res,renderdata);

};

$cms_render.logout = function(req,res,requestObject,renderdata) {

	/* get the theme */
	var theme = "basic";
		if(typeof renderdata.pages[0]!=="undefined") {
		theme = renderdata.pages[0].theme;
	}

	renderdata.page = {
				name: "Logout",
				href: requestObject.page,
				vieworder: 1,
				description: "You have logged out",
				keywords: "Home,where,the,heart,is",
				layout: "col1",
				theme: theme,
				_id: "logout"
			};

	renderdata.contents = [{
				_id: "logoutcontent",
				author: {
					name: "rsedgwick",
					date: "thursday"
				},
				html: "You have logged out",
				lastmodified: {
					author: {
						name: "rsedgwick",
						date: "thursday"
					}
				},
				page: "logout",
				position: {
					position: "relative",
					column: 1,
					row: 1,
					vieworder: 1
				}
			}];

			renderdata.login ={"login":"no"};
			$cms_response.send(req,res,renderdata);

};


$cms_render.register = function(req,res,requestObject,renderdata) {

	/* get the theme */
	var theme = "basic";
		if(typeof renderdata.pages[0]!=="undefined") {
		theme = renderdata.pages[0].theme;
	}

	renderdata.page = {
				name: "Register",
				href: requestObject.page,
				vieworder: 1,
				description: "Create a new admin",
				keywords: "Home,where,the,heart,is",
				layout: "col1",
				theme: theme,
				_id: "login"
			};

	renderdata.contents = [{
				_id: "registercontent",
				author: {
					name: "rsedgwick",
					date: "thursday"
				},
				html: "Sign Up using the credentials below",
				lastmodified: {
					author: {
						name: "rsedgwick",
						date: "thursday"
					}
				},
				page: "login",
				position: {
					position: "relative",
					column: 1,
					row: 1,
					vieworder: 1
				}
			}];
			renderdata.login ={"register":"yes"};

			$cms_response.send(req,res,renderdata);

};

module.exports = $cms_render;