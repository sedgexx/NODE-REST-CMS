var $cms_utils = {};

$cms_utils.contents = {};
	$cms_utils.contents.sort = {};
	$cms_utils.contents.sort.byPriority = function (a, b) { 
	   if (a.position.vieworder == b.position.vieworder) { return 0; }
	   if (a.position.vieworder > b.position.vieworder) { return 1; }
	   return -1;
	};
	$cms_utils.contents.ordertointeger = function(results) {
		for (var i = 0; i < results.length; i++) {
			if(typeof results[i].position.column==="string") { results[i].position.column = parseInt(results[i].position.column); }
			if(typeof results[i].position.row==="string") { results[i].position.row = parseInt(results[i].position.row); }
			if(typeof results[i].position.vieworder==="string") { results[i].position.vieworder = parseInt(results[i].position.vieworder); }
		};

		return results;
	}

$cms_utils.page = {};
	$cms_utils.page.sort = {};
	$cms_utils.page.sort.byPriority = function (a, b) { 
	   if (a.vieworder == b.vieworder) { return 0; }
	   if (a.vieworder > b.vieworder) { return 1; }
	   return -1;
	};


module.exports = $cms_utils;