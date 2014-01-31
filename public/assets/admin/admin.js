
var $admin ={ 

	loadassets :  function(callback) {
			var adminCSS = "adminCSS";
			if (!document.getElementById(adminCSS)) {

				var head  = document.getElementsByTagName('head')[0];
				var link  = document.createElement('link');
				link.id   = "adminCSS"; link.rel  = 'stylesheet'; link.type = 'text/css';link.media = 'all';
				link.href = '/assets/admin/admin.css';

				var icons = document.createElement('link');
				icons.id   = "adminicons"; icons.rel  = 'stylesheet'; icons.type = 'text/css';icons.media = 'all';
				icons.href = '/assets/admin/icons/css/fa-icons.css';

				head.appendChild(link);
				head.appendChild(icons);
			}
			callback();
	}
};

$admin.models = {

  page  : {

		    name: "",
		    href: "",
		    vieworder: 1,
		    title: "",
		    description: "",
		    keywords: "",
		    layout: "",
		    theme: "",
		    parent:""

		}

};

$admin.utils = {

	getcontentid : function(el) {
		var contentid=el.attr("id");
		contentid = contentid.substring(contentid.indexOf("_")+1);
		return contentid;
	},
	userstamp : function() {
		return { date : new Date(), author: $auth.email, userid: $auth.userid };
	}

}; 
/* === SERVER FUNCTIONS ========================= */

$admin.server = {

		api : {
			url : "/v1/"
		},
		speak : function(uri,method,callback) {
			var request = $.ajax({ url: uri, datatype:"jsonp", type: method, contentType: "application/json" });
			request.done(function(data) { 
			 	if(data.information.expires!=="undefined") { $admin.session.update(data.information.expires); }
				if(callback){ callback(data); } 
			});
			request.fail(function(jqXHR, textStatus) { if(callback){ callback({id:id,success:textStatus}); } });
		},
		get : function(resource,id,callback) { 
			var ajaxuri = $admin.server.api.url+resource+"/"+id+"?key="+$auth.key;
			$admin.server.speak(ajaxuri,"GET",callback);
		},
		put : function(resource,id,q,data,callback) { 
			var query = "";
			if(q!="") { query="?q="+q+"&key="+$auth.key;
			} else { query="?key="+$auth.key; }
			var ajaxuri = $admin.server.api.url+resource+"/"+id+query;
			var request = $.ajax({ url: ajaxuri, datatype:"jsonp", data: JSON.stringify( { "$set" : data } ), type: "PUT", contentType: "application/json" });
			request.done(function(data) {  
				$admin.session.update(data.information.expires);
				if(callback){ callback({id:id,success:data.success}); } 
			});
			request.fail(function(jqXHR, textStatus) { if(callback){ callback({id:id,success:false}); } });
		},
		post : function(resource,data,callback) {
			var ajaxuri = $admin.server.api.url+resource+"?key="+$auth.key;
			console.log(ajaxuri);
			var request = $.ajax({ url: ajaxuri, datatype:"jsonp", data: JSON.stringify(data), type: "POST", contentType: "application/json" });
			request.done(function(data) { 
				if(resource!=="login") { $admin.session.update(data.information.expires); }
				callback({data:data,success:true}); 
			});
			request.fail(function(jqXHR, textStatus) { callback({data:textStatus,success:false}); });
		},
		remover : function(resource,id,callback) {
			var ajaxuri = $admin.server.api.url+resource+"/"+id+"?key="+$auth.key;
			var ajaxpayload = { url: ajaxuri, datatype:"jsonp", type: "DELETE", contentType: "application/json" };
			var request = $.ajax(ajaxpayload);
			request.done(function(data) {  
				$admin.session.update(data.information.expires);
				if(callback){ callback({id:id,success:data.success}); } });
			request.fail(function(jqXHR, textStatus) { if(callback){ callback({id:id,success:false}); } });
		}
};

/* === CONTENT FUNCTIONS ========================= */

$admin.content =  {

	create : {

		init : function() { 

				$("<div id='addnewcontent'><span>Add New Content</span></div>").insertAfter(".page");

				$("#addnewcontent").on("click",function() { 
					$admin.content.create.register();
				});

		},
		addtopage : function(contentObject) {

			if(contentObject.success) {

			/* new markup for new content area */
			var contentBlock = "<div id='content_"+contentObject.data._id+"' class='content editable' data-position_row='1' data-position_col='1' data-position_vieworder='0'>";
					contentBlock+= "<div class='content-data'><i>Add new content</i></div>";
					contentBlock+= "<div class='handle'></div></div>";
				contentBlock+= "</div>";

			var newcontent = $(contentBlock);
			newcontent.insertAfter("#addnewcontent");

				var newContentDiv = $("#content_"+contentObject.data._id);
				$(".contentcontainer").first().append(newContentDiv);

				$admin.content.sort.sort();
				$admin.content.editable.init();
				
			}
		},
		register : function() {


			/* add new Content to the server */
			var pageid = $(".page").first().attr("id");
			var contentModel = {
							author: {
							name: "rsedgwick",
							date: "thursday"
							},
							html: "<i>Add new content</i>",
							lastmodified: {
								author: {
									name: "rsedgwick",
									date: "thursday"
								}
							},
							page: pageid,
							position: {
								position: "relative",
								column: 1,
								row: 1,
								vieworder: 0
							}
					};

			$admin.server.post("content",contentModel,$admin.content.create.addtopage);
		}
	},
	/* content drag and drop =================== */
	sort : {
		done : function(serverObj) {
			var updateclass="servergood";
			if(!serverObj.success) { updateclass="serverbad"; }
			$("#content_"+serverObj.id).addClass(updateclass);
		},
		save : function() {
				/* update server */
				$(".content").each(function() {
					var contentid=$(this).attr("id");
						contentid = contentid.substring(contentid.indexOf("_")+1);
					var position = {
						position: "relative",
						column:parseInt( $(this).attr("data-position_column")),
						row: parseInt($(this).attr("data-position_row")),
						vieworder: parseInt($(this).attr("data-position_vieworder"))
						};
					$admin.server.put("content",contentid,"",{position:position},$admin.content.sort.done);
				});
		},
		sort : function() {
				/* row and column */
				$(".content").each(function() {
					var row = $(this).parent().attr("data-position_row");
					var col = $(this).parent().attr("data-position_column");
					$(this).attr("data-position_row",row);
					$(this).attr("data-position_column",col);
				});
				/* set order */
				$(".contentcontainer").each(function() {
					$(this).find(".content").each(function(index) {
						$(this).attr("data-position_vieworder",index+1);
					});
				});
				/* auto save */
				$admin.content.sort.save();
		},
		init : function(container,items) {

			/* build handle */
			$(items).each(function() {
					$(this).append($("<div class='handle'></div>"));
			});

			/* set sortable */
			$(container).sortable({ 
				items: "> "+items,
				connectWith:".contentSortable",
				cursor: "move",
				placeholder: "sortable-placeholder",
				scroll: true,
				helper: "clone",
				handle: ".handle",
				forceHelperSize: true,
				forcePlaceholderSize: true,
				stop: $admin.content.sort.sort
			});

			/* drop targets */
			$(container).droppable({ activeClass: "ui-state-highlight", hoverClass: "drop-hover" });

		}
	},
	/* content html editor =====================  */
	editable : { 
		    originalcontent : "",
		    saved : function() {
		    	var editor = $(".editableActive");
		    	editor.removeClass("content-saving");
		    	$("#formatSave").html("Save");
		    },
		    save : function() {
		    	var editor = $(".editableActive");
		    	editor.addClass("content-saving");
		    	var contentid= editor.attr("id");
		    	contentid = contentid.substring(contentid.indexOf("_")+1);
		    	var html = editor.find(".content-data").html();
		    	$admin.server.put("content",contentid,"",{html:html},$admin.content.editable.saved);

		    },
			start: function(el) {
				$admin.content.editable.stop(function() { 
					el.parent().addClass("editableActive");
					$admin.content.editable.originalcontent = el.html();
					if($admin.content.editable.originalcontent==="<i>Add new content</i>") { 
						el.html(""); 
					}
					el.parent().append($("#formatBar"));
					/*document.designMode = "on";*/
					el.attr("contenteditable",true).focus();
					el.parent().addClass("editableActive");
				});

			},
			stop : function(callback) {
				/*document.designMode = "off";*/
				$(".content-data").each(function() { 
					$(this).attr("contenteditable",false);
					$(this).parent().removeClass("editableActive");

				});
				
				$("body").append($("#formatBar"));
				callback();
			},
			formatButtons : function() {
				/* prompt actions */
				$("#content_delete").on("click",function() {
						$admin.content.editable.remover();
					});
				$("#content_cancel").on("click",function() {
						$(".prompts").each(function() { $("#prompts").append($(this)); });
					});
				/* format buttons */
				$("#formatButtons button").on("click",function(e) {
					e.preventDefault();
					$admin.content.editable.format($(this).attr("data-format"));
				});
			},
			prompt : function(type) {
				var editor = $(".editableActive");
		    	editor.addClass("confirm");
				if(type==="delete") {
					$("#content_prompt_delete").appendTo(editor);
				}
			},
			removerDone : function(removerObject) {
				if(removerObject.success) {
					$("#content_"+removerObject.id).fadeOut(400, function() {
						$("#trash").append($(this));
					});
				}
			},
			remover : function() {
				var contentid=$admin.utils.getcontentid($(".editableActive").first());
				$admin.server.remover("content",contentid,$admin.content.editable.removerDone);
			},
			format : function(cmd) {

				switch(cmd){
					case "save":
						$("#formatSave").html("Saving");
						$admin.content.editable.save();
						break;
					case "delete":
						$admin.content.editable.prompt("delete");
						break;
					case "2col":
						var html = "<div class='contentcol'><div class='detail'></div></div><div class='contentcol'><div class='detail'></div></div><div class='c'></div>";
						document.execCommand('inserthtml', false, html);
						break;
					case "insertImage":
						document.execCommand("insertImage", false, "http://www.new4.co.uk/web-soon.gif");
						break;
					default : 
						var headings = "h1,h2,h3";
							if(headings.indexOf(cmd)>=0) {  
								document.execCommand("formatBlock", false, "<"+cmd+">"); 
							} else { document.execCommand(cmd, false, null); } 
				}

			},
			init : function() {
				$(".content-data").each(function() { $(this).parent().addClass("editable"); });
				/*$(".page").on("click", function() {  $admin.content.editable.stop(); });*/
				$(".editable").on("click",function()  { $admin.content.editable.start($(this).find(".content-data")); });
				$admin.content.editable.formatButtons();
			}
	}
};

$admin.message = {
	empty : function() { $("#console").html(""); return this; },
	on : function() { $("#console").addClass("active"); return this;},
	off : function() { $("#console").removeClass("active"); return this;},
	print : function(msg) {  $admin.message.empty().on(); $("#console").html(msg); return this;  }
};

$admin.session = {
	update : function(newexpiry) {
				$auth.expires = newexpiry;
				if($admin.expireCheck!==null) { clearInterval($admin.expireCheck); }
				$admin.message.empty().off();
				$admin.session.timeout();
	},
	extend : function() {
		/* the get request will update the session */
		$admin.server.get("sessions",$auth.key,function(session) {
			if(typeof session.information.expires==="undefined") {
		   	/* too late */
		   	$("#sessionextend").html("sorry too late, we are unable to extend, logging out ...");
		   	setTimeout(function() { window.location.href="/logout"; },3000);
		   }
		});
	},
    alert : function(seconds) {
    	
    	if($("#sessionmessage").length === 0) {
	     	var message = $("<div id='sessionmessage'></div>");
	    	var extendButton = $("<button id='sessionextend'>Extend</button>");
	    	$admin.message.empty().on();
	    	$("#console").append(message);
	    	$("#console").append(extendButton);	
	    	$("#sessionextend").on("click",function() {  $admin.session.extend(); });
    	}

    	$("#sessionmessage").html("Your session is almost expired ( "+seconds+" )");
         
    },
    remaining : function(expirydate) {

    	    var current_date = new Date().getTime();
			var seconds_left = (expirydate - current_date) / 1000;
			var days, hours, minutes, seconds;

			days = parseInt(seconds_left / 86400);
			seconds_left = seconds_left % 86400;
			 
			hours = parseInt(seconds_left / 3600);
			seconds_left = seconds_left % 3600;
			  
			minutes = parseInt(seconds_left / 60);
			seconds = parseInt(seconds_left % 60);

			return {days:days,hours:hours,minutes:minutes,seconds:seconds};

    },
	expireCheck : null,
	timeout : function() {

		var expirydate = new Date($auth.expires).getTime();

		/* test */

		/*var expirydate = new Date();
		expirydate.setMinutes(expirydate.getMinutes() + 1);*/

		if($admin.expireCheck!==null) { clearInterval($admin.expireCheck); }

		$admin.expireCheck = setInterval(function () {

			var remaining = $admin.session.remaining(expirydate);
			if(remaining.days===0 && remaining.hours===0 && remaining.minutes===0) {
				if(remaining.seconds<=0) { window.location.href="/logout"; } 
				else if(remaining.seconds<=31) { $admin.session.alert(remaining.seconds); }
			}

		}, 1000);


	}


};

$admin.ui = {

	setAdminOptions : function() { 
		$("#admin").prependTo("body"); 
		$("<div id='console'></div>").prependTo("body"); 
		$admin.ui.adminMenu();
		$admin.ui.page.manage();
	},
	closePanels : function() {	
		$(".admin_panel").removeClass("active");
	},
	adminMenu : function() {
		$(".admin_open").on("click", function() {
			$admin.ui.closePanels();
			var action = $(this).attr("id");
			action = action.substring(action.indexOf("open_")+5);
			$("#admin_"+action).addClass("active");
			$(".admin_open").removeClass("active");
			$(this).addClass("active");
		});

		$(".closePanel").on("click",function() { 
			$admin.ui.closePanels();
		});
	},
	page : {
		remove : function(id){

			/* 

			1) get all content with this as the page id 
			2) Update all content with a new page id of 00_orphan
			3) Remove the page 
			4) Refresh to root

			*/

			/* orphan content */
			$admin.server.put("content","",JSON.stringify({page:id}),{"page":"orphan"},function(serverObj) {

				if(serverObj.success) { 
					/* remove page */
					$admin.server.remover("pages",id,function(pageRemoved) {
						if(serverObj.success) {  
							/* refresh to root */
							window.location.href="/"; } 
						else {
							/* TODO* - email alerts to us */
				 			$admin.message.print("problem removing page, server problem."); 
						}
					});

				 } else {  
				 	/* TODO* - email alerts to us */
				 	$admin.message.print("problem orphaning content, server problem.");
				 }

			});


		},
		removeconfirm : function() {
				$("#admin_page_edit_deleteConfirm").addClass("active");
				$("#admin_page_edit_deleteConfirmMessage").addClass("active");

		},
		removecancel : function() {
				$("#admin_page_edit_deleteConfirm").removeClass("active");
				$("#admin_page_edit_deleteConfirmMessage").removeClass("active");
		},
		publish : function(pageid,status,href) {

			$admin.server.put("pages",pageid,"",{status:status},function(page) {

				if(page.success) {

					window.location.href="/"+href;

				} else {

					/* TODO handle the error */
				}

			});

		},
		reorder : function() {

			$("#pagelinks li").each(function(vieworder) {
				vieworder++;
				var pageid=$(this).attr("data-pageid");
				$admin.server.put("pages",pageid,"",{vieworder:vieworder});
			});

		},
		manage : function() { 

			/* layouts */
			$admin.ui.page.selectLayout();

			/* page edit and create buttons */
			$("#admin_page_edit_button").on("click", function() { $admin.ui.page.update(); });
			$("#admin_page_create_button").on("click", function() { $admin.ui.page.create(); });

			$("#admin_page_edit_predelete_button").on("click",function() {  $admin.ui.page.removeconfirm(); });
			$("#admin_page_edit_deletecancel_button").on("click",function() {  $admin.ui.page.removecancel(); });
			$("#admin_page_edit_delete_button").on("click",function() {  $admin.ui.page.remove($(this).attr("data-pageid")); });
			
			$(".admin_page_edit_status").on("click",function() { 
				$admin.ui.page.publish($(this).attr("data-pageid"),$(this).attr("data-status"),$(this).attr("data-pagehref"));
			});

			/* sorting of page items */
			$("#pagelinks").sortable({ stop:function(){ $admin.ui.page.reorder(); } });
			$( "#pagelinks" ).disableSelection();
			
		},
		selectLayout : function() {

			/* visually show the default selected */
			$(".checkdefault").each(function() { 
				if($(this).val()!=="") {
					var defaultLayout = $(this).val();
					var selectTarget = $(this).parent().find(".layout_"+defaultLayout);
					selectTarget.parent().addClass("selected");
				}
			});

			/* listen for change of layout  */
			$(".layout").on("click",function() {

				$(this).parent().parent().find(".layout").find("span").removeClass("selected");
				$(this).find("span").addClass("selected");
				var layoutValue = $(this).find("img").attr("class");
				layoutValue = layoutValue.substring(layoutValue.indexOf("layout_")+7);
				$(this).parent().parent().parent().find(".layoutinput").val(layoutValue);

			});

		},
		returnPageData : function(action,vieworder,existingpagedata) {

		/* 	name: "",
		    href: "",
		    vieworder: 1,
		    title: "",
		    description: "",
		    keywords: "",
		    layout: "",
		    theme: ""*/

		    /* TODO Validation

		    	1) are fields empty 
		    	2) is the HREF taken  */ 

		    var returndata = {},valid = false;
			var page = $admin.models.page;

				page.name = $("#admin_page_"+action+"_name").val();
				page.href = $("#admin_page_"+action+"_href").val();
				if(page.href!=="") { page.href = page.href.toLowerCase(); }

				if(typeof vieworder!=="undefined") { page.vieworder = vieworder; } 
				else { page.vieworder = parseInt($("#admin_page_"+action+"_vieworder").val()); }
       
				page.title = $("#admin_page_"+action+"_title").val();
				page.description = $("#admin_page_"+action+"_description").val();
				page.keywords = $("#admin_page_"+action+"_keywords").val();
				page.layout = $("#admin_page_"+action+"_layout").val();
				page.theme = $("#admin_page_"+action+"_theme").val();
				page.status = $("#admin_page_"+action+"_status").val();

				

				/* validate blanks */
				for(key in page) {

					if(key!=="parent") {
						if(page[key]==="") {
							if(typeof returndata.errors==="undefined") {
								returndata.errors=[];
							}
							returndata.errors.push({element:""+key+"",message:"Enter a value"})
						}
					}

				}

				if(typeof returndata.errors==="undefined") { valid=true;}

				returndata.valid=valid;
				
				if(valid) {
					/* modified */
					page.lastupdated = $admin.utils.userstamp();
				}

				if(action==="create") {
					var isSubChecked = $("#isSubpage");
					if(isSubChecked.is(":checked")) {
						page.parent=isSubChecked.attr("data-parentpageid");
					}
				}

				returndata.obj=page;
				return returndata;
		},
		setPageData : function(action,callback) {

			var pageData = {};
		    if(action==="create") {
		    	/* get the most up to date view order */
		    	$admin.server.get("pages","",function(data) { 
		    		var pageCount = data.results.length+1;
		    		pageData = $admin.ui.page.returnPageData(action,pageCount,data.results);
		    	 	callback(pageData);
		    	});

		    } else {  
		    	pageData = $admin.ui.page.returnPageData(action);
		    	callback(pageData); 
		    }

		},
		update : function() {

		    var updateButton = $("#admin_page_edit_button").find("span");
		    var updateButtonIcon = $("#admin_page_edit_button").find("i");
		    updateButton.html("updating ... ");

		    var pageId = $("#admin_page_edit_id").val();

			$admin.ui.page.setPageData("edit",function(page) {  
				if(page.valid) {
					$admin.server.put("pages",pageId,"",page.obj,function(data) { 

						updateButton.html("Page Updated, <i>reloading changes, please wait...</i>");
							setTimeout(function() { 
								window.location.href="/"+page.obj.href;
							},2000);

					});
				} else {
					updateButton.html("Problem , check values");
				}
			});

		},
		create : function() {

		    var createButton = $("#admin_page_create_button").find("span");
		    var createButtonIcon = $("#admin_page_create_button").find("i");
		    createButton.html("creating ... ");

			$(".adminformerror").find(".message").removeClass("active").html("");
			createButtonIcon.removeClass("fa-exclamation").addClass("fa-check");

			$admin.ui.page.setPageData("create",function(page) { 

				if(page.valid) {
					/* author */
					page.obj.author = $admin.utils.userstamp();
					/* create */
					$admin.server.post("pages",page.obj,function(data) { 

						createButton.html("Page Creates, <i>loading page, please wait...</i>");
							setTimeout(function() { 
								window.location.href="/"+page.obj.href;
							},2000);

					});
				} else {
					var errors = page.errors;
					for (var i = 0, len=errors.length; i < len; ++i) {
						$("#admin_page_create_error_"+errors[i].element).find(".message").addClass("active").html(errors[i].message);
					};
					createButton.html("Create Page");

					createButtonIcon.removeClass("fa-check").addClass("fa-exclamation");
				}

			});

		}
	}

}

/* == START ADMIN  ========================= */
$admin.init = function() {

		$admin.loadassets(function(){ 
				$admin.ui.setAdminOptions();
				$admin.content.sort.init(".contentcontainer",".content"); 
				$admin.content.editable.init();
				$admin.content.create.init();

				$admin.session.timeout();
		});
	};


$admin.init();