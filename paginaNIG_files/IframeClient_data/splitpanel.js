/** JavaScript code for a SplitPanel which can be split into two parts.
 * <ul>
 *  <li>Creates a panel, 
 *  <li>moves the separator between the two parts
 *  <li>hides or shows one of the two parts. 
 *  </ul> */

var activeSplitPanel = null;
var splitImgClicked = false;

/**
 * Handles the mouse down event for the click on the separator in a splitpanel.
 */
function handleSplitMouseDown(event, clientId) {
	event = event || window.event;
	// Transform browser specific event to neutral jQuery event
	var jQueryEvent	= jQuery.event.fix( event );
	
	// collapse open menues
	root.collapse();
	
	if (!splitImgClicked) {
		
		// Support for other browsers
		var posX;
		var posY;
		var offsetX;
		var offsetY;
		// Retrieve the x & y position in a browser independent way
		posX = jQueryEvent.pageX;
		posY = jQueryEvent.pageY;	
		// Traverse the document with jQuery to retrieve the event source
		var eventSrc = $(jQueryEvent.target);
		// Calculate the jQuery offsets in the same way for all browsers	
		var deltaX = eventSrc.position().left;
		var deltaY = eventSrc.position().top;
		offsetX = jQueryEvent.pageX - deltaX;
		offsetY = jQueryEvent.pageY - deltaY;	
		
        activeSplitPanel = root.getObject(clientId);
        if (activeSplitPanel.orientation == SPLIT_HORIZONTAL) {
            activeSplitPanel.beginResizing(posX, offsetX);
        } else {
            activeSplitPanel.beginResizing(posY, offsetY);
        }
    } else {
    	splitImgClicked = false;
    }

	// use jQuery's neutral mechanism to stop event propagation
	jQueryEvent.stopPropagation();
    
    return false;
}
/**
 * Handles the mouse move action for a splitpanel.
 */
function handleSplitMouseMove(event, clientId) {
	event = event || window.event;

	// Support for other browsers
	var posX;
	var posY;
	// Transform browser specific event to neutral jquery event
	var jQueryEvent = jQuery.event.fix( event );
	// and retrieve the x & y position in the same way for all browser
	posX = jQueryEvent.pageX;
	posY = jQueryEvent.pageY;	

    if (activeSplitPanel.orientation == SPLIT_HORIZONTAL) {
		activeSplitPanel.resize(posX);
    } else {
		activeSplitPanel.resize(posY);
    }

	// use jquery neutral mechanism to stop event propagation
	jQueryEvent.stopPropagation();
    
    return false;
}
/**
 * Handles the mouse up action for a splitpanel.
 */
function handleSplitMouseUp(event, clientId) {
	event = event || window.event;

	// Support for other browsers
	var posX;
	var posY;
	// Transform browser specific event to neutral jquery event
	var jQueryEvent = jQuery.event.fix( event );
	// and retrieve the x & y position in the same way for all browser
	posX = jQueryEvent.pageX;
	posY = jQueryEvent.pageY;
		
    if (activeSplitPanel.orientation == SPLIT_HORIZONTAL) {
		activeSplitPanel.endResizing(posX);
    } else {
		activeSplitPanel.endResizing(posY);
    }

	// use jquery neutral mechanism to stop event propagation
	jQueryEvent.stopPropagation();
    
    return false;
}
/**
 * Initialises a splitpanel.
 */
function initSplitPanel(clientId, orientation, fixed, size, hidden, minSize, maxSize) {
    var panel = new SplitPanel(clientId, orientation, fixed, size, hidden, minSize, maxSize);
    root.registerObject(panel);
}

/** Releases a splitpanel. */
function releaseSplitPanel(clientId) {
}

/** SplitPanel constructor. 
    The constructor is called like this, for example:
    initSplitPanel("default:_id36:_id38:_id4", 0, "second", 345, false, 300, 800) */
SplitPanel = function (clientId, orientation, fixed, size, hidden, minSize, maxSize) {
    this.id = clientId;
    this.layer = document.getElementById(this.id); // surrounding DIV tag
    this.orientation = orientation; // values: 0 = SPLIT_HORIZONTAL, 1 = SPLIT_VERTICAL
    this.size = size;
    this.hidden = hidden;
    this.minSize = minSize || -1;
    this.maxSize = maxSize || -1;
    
    // suffix of id for the fixed element. Value "first" or "second"
    this.fixed = fixed;

    this.fixedCell = document.getElementById(this.id + fixed); // points to a <TR> tag
    this.splitBar = document.getElementById(this.id + "bar"); // the <td> of the separator
    this.splitImage = document.getElementById(this.id + "img"); // the <img> of the separator
    this.shadow = document.getElementById(this.id + "shadow");
    this.shadowBack = document.getElementById(this.id + "shadow_back");
    this.dragLayer = document.getElementById(this.id + "draglayer");
    
    this.hiddenInputField = document.getElementById(this.id + "hiddenInputField");
    this.hiddenSubmit = document.getElementById(this.id + "submit");
};
SplitPanel.prototype = {
	splitterDelta : 0,
	
	startCursorPosition : 0,
	
	/**
	 * Starts the moving of a separator in a splitpanel.
	 * Shows the shadow bar (which represents the moving separator in the split panel)
	 * and the drag layer of the panel.
	 */
	beginResizing : function (position, splitterDelta) {
	    this.startCursorPosition = position;
	    this.splitterDelta = splitterDelta;

	    var left = 0;
	    var top = 0;
    	var width = this.splitBar.offsetWidth;
    	var height = this.splitBar.offsetHeight;
	    if (this.orientation == SPLIT_HORIZONTAL) {
	        top = getAbsoluteTop(this.layer);
	        left = this.getShadowLeft(position);
	    } else {
	        left = getAbsoluteLeft(this.layer);
	        top = this.getShadowTop(position);
	    }

	    $(this.shadowBack).css({'left':left,'top':top,'width':width,'height':height});
	    $(this.shadow).css({'left':left,'top':top,'width':width,'height':height});
	    $(this.dragLayer).css({'left':getAbsoluteLeft(this.layer),'top':getAbsoluteTop(this.layer),'display':"block"}); 
	
		$(this.shadow).css({'display':"block"});
		$(this.shadowBack).css({'display':"block"});
	},
	
	/**
	 * Ends the moving of a separator in a splitpanel.
	 * Updates the height or width of the splitpanel element.
	 * Hides the shadow bar and the drag layer.
	 */
	endResizing : function (position) {
		if (this.startPosition != position) {
			this.show();
		}
		
	    if (this.orientation == SPLIT_HORIZONTAL) {
	        if (this.fixed == "first") {
	        	$(this.fixedCell).css({'width':this.getShadowLeft(position)});
	        } else {
	        	$(this.fixedCell).css({'width':this.layer.offsetWidth - this.splitBar.offsetWidth - this.getShadowLeft(position) + getAbsoluteLeft(this.layer, false)});
	        }
	    } else {
	        if (this.fixed == "first") {
	        	$(this.fixedCell).css({'height':this.getShadowTop(position)});
	        } else {
	        	$(this.fixedCell).css({'height':
	        		this.layer.offsetHeight - this.splitBar.offsetHeight
	        		- this.getShadowTop(position) + getAbsoluteTop(this.layer, false)
	        		});
	        }
	    }
	  
	    $(this.dragLayer).css({'display':"none"});
	    $(this.shadow).css({'display':"none"});
	    $(this.shadowBack).css({'display':"none"});
	},
	
	/**
	 * Returns the left distance of the shadow.
	 */
	getShadowLeft : function(position) {
        var left = /*getAbsoluteLeft(this.layer, false) +*/ position - this.splitterDelta;
        if (this.fixed == "first") {
            if (this.minSize > -1) {
                left = Math.max(this.minSize, left);
            }
            if (this.maxSize > -1) {
                left = Math.min(this.maxSize, left);
            }
        } else {
            left = this.layer.offsetWidth - (left + this.splitBar.offsetWidth);
            if (this.minSize > -1) {
                left = Math.max(this.minSize, left);
            }
            left = Math.min((this.layer.offsetWidth - (this.splitBar.offsetWidth + getAbsoluteLeft(this.layer, false) + 3)), left);
            if (this.maxSize > -1) {
                left = Math.min(this.maxSize, left);
            }
            left = Math.max(-(getAbsoluteLeft(this.layer, false) - 2), left);
            left = this.layer.offsetWidth - this.splitBar.offsetWidth - left;
        }
        return left;
	},
	/**
	 * Returns the top distance of the shadow.
	 */
	getShadowTop : function(position) {
        var top = /*getAbsoluteTop(this.layer, false) +*/ position - this.splitterDelta;
        //var top = position;
        if (this.fixed == "first") {
            if (this.minSize > -1) {
                top = Math.max(this.minSize, top);
            }
            if (this.maxSize > -1) {
                top = Math.min(this.maxSize, top);
            }
        } else {
            top = this.layer.offsetHeight - (top + this.splitBar.offsetHeight);
            if (this.minSize > -1) {
                top = Math.max(this.minSize, top);
            }
            top = Math.min((this.layer.offsetHeight - (this.splitBar.offsetHeight + getAbsoluteTop(this.layer, false) + 3)), top);
            if (this.maxSize > -1) {
                top = Math.min(this.maxSize, top);
            }             	
            top = Math.max(-(getAbsoluteTop(this.layer, false) - 2), top);               	     	
			   if (root.debug == true) {
            	 window.status = top + " | " + (this.layer.offsetHeight - this.splitBar.offsetHeight - getAbsoluteTop(this.layer, false));
				}
            top = this.layer.offsetHeight - this.splitBar.offsetHeight - top;
        }
        return top;
	},
	
	/**
	 * Hides (minimises) a splitPanelElement.
	 * Updates the button image in the separator bar.
	 * Submits to the server.
	 */
	hide : function () {
	    this.hidden = true;
	    this.hiddenInputField.value = this.hidden;

	    if (this.orientation == SPLIT_HORIZONTAL) {
	        if (this.fixed == "first") {
	            this.splitImage.src = "modules/component/themes/" + THEME_PATH + "/split_hbtn_right.gif";	           
	        } else {
	            this.splitImage.src = "modules/component/themes/" + THEME_PATH + "/split_hbtn_left.gif";
	        }
	    
	        this.fixedCell.oldWidth = $(this.fixedCell).css('width');
	        $(this.fixedCell).css({'width':0});

	    } else {
	        if (this.orientation == SPLIT_VERTICAL) {
	            if (this.fixed == "first") {
	                this.splitImage.src = "modules/component/themes/" + THEME_PATH + "/split_vbtn_down.gif";
	            } else {
	                this.splitImage.src = "modules/component/themes/" + THEME_PATH + "/split_vbtn_up.gif";
	            }
	            
		        this.fixedCell.oldHeight = $(this.fixedCell).css('height');
	        	$(this.fixedCell).css({'height': 0});
	        }
	    }

	   $(this.fixedCell).css({'display':"none",'visibility':"hidden"});
	   
	    this.hiddenSubmit.click();
	},
	
	/**
	 * Animates the moving of the separator by moving a "shadow bar".
	 */
	resize : function (position) {
	    if (this.orientation == SPLIT_HORIZONTAL) {
	        var left = this.getShadowLeft(position);
	        $(this.shadow).css({'left':left});
	        $(this.shadowBack).css({'left':left});
	    } else {
	        var top = this.getShadowTop(position);
	        $(this.shadow).css({'top':top});
		    $(this.shadowBack).css({'top':top});
	    }
	},
	
	/**
	 * Shows a splitPanelElement.
	 * Updates the button image in the separator bar.
	 * Submits to the server.
	 */
	show : function () {
	    this.hidden = false;
	    this.hiddenInputField.value = this.hidden;
	    // mod BP 2010
	    // Firefox and other browsers don't render this.fixedCell
		// at the correct position when we set this.fixedCell.style.display = "block";
	    $(this.fixedCell).css({'display':'','visibility':"visible"});

	    if (this.orientation == SPLIT_HORIZONTAL) {
	        if (this.fixed == "first") {
	        	if (this.splitImage != null) {
	            	this.splitImage.src = "modules/component/themes/" + THEME_PATH + "/split_hbtn_left.gif";
	            }
	        } else {
	            if (this.splitImage != null) {
	            	this.splitImage.src = "modules/component/themes/" + THEME_PATH + "/split_hbtn_right.gif";
	            }
	        }
	        if(this.fixedCell.oldWidth!=null){
	        	$(this.fixedCell).css({'width':this.fixedCell.oldWidth});
		     }
	    } else {
	        if (this.orientation == SPLIT_VERTICAL) {
	            if (this.fixed == "first") {
	            	if (this.splitImage != null) {
	                	this.splitImage.src = "modules/component/themes/" + THEME_PATH + "/split_vbtn_up.gif";
	                }
	            } else {
	            	if (this.splitImage != null) {
	                	this.splitImage.src = "modules/component/themes/" + THEME_PATH + "/split_vbtn_down.gif";
	                }
	            }
	            
	            if(this.fixedCell.oldHeight!=null){
	            	$(this.fixedCell).css({'height':this.fixedCell.oldHeight});
			      }
	        }
	    }
	    this.hiddenSubmit.click();
	},
	
	/** Hides or shows the panel element. */
	toggle : function () {
	    if (this.hidden) {
	        this.show();
	    } else {
	        this.hide();
	    }
	}
};

