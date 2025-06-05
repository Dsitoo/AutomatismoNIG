/**
 * Useful functions which are included into every dynamic JSF page.
 */

/**
 * Sets the HTML of a node.
 */
function setHTML(node, content) {
    node.innerHTML = content;
}
/**
 * Sets the distance of a <div>-HTMLObject to the left border of the browser window. 
 * 
 * @param lyr	object which distance should be changed
 * @param x		distance between the object an the left border of the browser window
 */
function setXPos(lyr, x) {
	// mod BP 2010
	$(lyr).css({'left': x});
	// end mod BP 2010
}
/**
 * Sets the distance of a <div>-HTMLObject to the top border of the browser window. 
 * 
 * @param lyr	object which distance should be changed
 * @param y		distance between the object an the top border of the browser window
 */
function setYPos(lyr, y) {
	// mod BP 2010
	$(lyr).css({'top': y});
	// end mod BP 2010
}
/**
 * Sets the width of a <div>-HTMLObject.
 * 
 * @param lyr	object which width should be changed
 * @param w		new width of the object
 */
function setWidth(lyr, w) {
	// mod BP 2010
	$(lyr).css({'width':w});
	// end mod BP 2010
}
/**
 * Sets the height of a <div>-HTMLObject.
 * 
 * @param lyr	object which height should be changed
 * @param h		new height of the object
 */
function setHeight(lyr, h) {
	// mod BP 2010
	$(lyr).css({'height':h});
	// end mod BP 2010
}

/**
 * Determines the absolute client left position of a layer.
 *
 * @param lyr the layer
 * @return the absolute left position
 */
function getAbsoluteLeft(lyr, debug) {
    var parent = lyr;
    var left = 0;
    var absolute = false;
 
    if ($(lyr).css('position') != null) {
        
    	absolute = $(lyr).css('position').toLowerCase() == "absolute";
    }

    var output = absolute + " - ";
    while (parent != null && parent != document.body) {
        if (parent.name == "dynjsfportletcontainer") {
            return 0;
        }
 
        if ((!absolute && parent.nodeName.toLowerCase() != "tr" && parent.nodeName.toLowerCase() != "tbody") || (absolute && (parent.nodeName.toLowerCase() == "div" || parent.nodeName.toLowerCase() == "table"))) {
            absolute = (parent.style != null && $(parent).css('position') != null && $(parent).css('position').toLowerCase() == "absolute") || absolute;
            if (parent.offsetLeft) {
                output += parent.nodeName + " - " + parent.offsetLeft + "; ";
                left += parent.offsetLeft;
            }
        }
  
        parent = parent.parentNode;
    }
    if (root.debug == true) {
        window.status = output + " - " + left;
    } 
    
    return left;
}

/**
 * Determines the absolute client top position of a layer.
 *
 * @param lyr the layer
 * @return the absolute top position
 */
function getAbsoluteTop(lyr, debug) {
 
	var parent = lyr;
    var top = 0;

    absolute = false;

    if ($(lyr).css('position') != null) {
        absolute = $(lyr).css('position').toLowerCase() == "absolute";
    }
  
    var output = absolute + " - ";
    while (parent != null && parent != document.body) {
        if (parent.name == "dynjsfportletcontainer") {
            return 0;
        }
  
        if ((!absolute && parent.nodeName.toLowerCase() != "td" && parent.nodeName.toLowerCase() != "tbody") || (absolute && (parent.nodeName.toLowerCase() == "div" || parent.nodeName.toLowerCase() == "table"))) {
            absolute = (parent.style != null && $(parent).css('position') != null && $(parent).css('position').toLowerCase() == "absolute") || absolute;
            if (parent.offsetTop) {
                output += parent.nodeName + " - " + parent.offsetTop + "; ";
                top += parent.offsetTop;
              
            }
        }

        parent = parent.parentNode;
    }
    if (root.debug || debug) {
        window.status = output + " - " + top;
    } 
 
    return top;
}

/**
 * Determines the frame x positions.
 *
 * @return the x position of a frame
 */
function getFrameX() {
    isSearchingParent = true;
    for (var frame = 0; frame < parent.frames.length; frame++) {
        if (parent.frames[frame].isSearchingParent == true) {
            isSearchingParent = false;
            var f = parent.document.getElementsByTagName("iframe")[frame];
            return getAbsoluteLeft(f) + parent.getFrameX();
        }
    }
    isSearchingParent = false;
    return 0;
}
/**
 * Determines the frame y position.
 *
 * @return the y position of a frame
 */
function getFrameY() {
    isSearchingParent = true;
    for (var frame = 0; frame < parent.frames.length; frame++) {
        var f = parent.document.getElementsByTagName("iframe")[frame];
        if (parent.frames[frame].isSearchingParent == true) {
            isSearchingParent = false;
            var at = getAbsoluteTop(f);
            return at + parent.getFrameY();
        }
    }
    isSearchingParent = false;
    return 0;
}

/**
 * Gets the key code of an event.
 *
 * @param event the event to handle
 * @return the key code of the event
 */
function getKeyCode(event) {
    return event.keyCode;
}
/**
 * Gets the event target.
 *
 * @param the event to handle
 * @return the event target
 */
function getEventTarget(e) {
    return e.srcElement;
}

/**
 * Adds a blocker for the keymap.
 *
 * @param the id of the element for which a keymap blocker is needed
 */
function addKeyMapBlocker(id) {
	var el = document.getElementById(id);
	if (el) {
		//console.log("addKeyMapBlocker for id: " + id );
	    var buffer = el.onfocus;
	    if ((buffer != null) && (buffer != undefined)) {
	    	el.oldonfocus = buffer;
	    	el.onfocus = function () {
	            root.setBlockKey();
	            this.oldonfocus();
	        };
	    } else {
	    	el.onfocus = function () {
	            root.setBlockKey();
	        };
	    }
	    buffer = el.onblur;
	    if ((buffer != null) && (buffer != undefined)) {
	    	el.oldonblur = buffer;
	    	el.onblur = function () {
	            root.unsetBlockKey();
	            this.oldonblur();
	        };
	    } else {
	    	el.onblur = function () {
	            root.unsetBlockKey();
	        };
	    }
    } //else {
	 //console.log("addKeyMapBlocker - id not found: " + id );
    //}
}

/**
* Removes all child nodes of the given node.
*
* @param the node from which all children should removed.
*/
function removeAllChildren(node) {
    while (node.firstChild != null) {
        node.removeChild(node.firstChild);
    }
}

/**
* This function belongs to the External Call Interface.
* It calls a request from a hidden IFrame.
*
* @param the request to be called.
*/
document.setHiddenURL = function (url) {
    if (url != null && url != "") {
        root.setServerBlocker();
        url = url + "&viewRoot=default&stateTarget=default&scriptOnly=true";
        var hiddenFrame = document.getElementById("default:body_hidden");
        hiddenFrame.contentWindow.location.href = url;
    }
};

/**
 * Returns the escaped dynJSF id.
 * The character ':' is being escaped because ':' is a special filter separator for jQuery.
 * @param originalElem the element to be escaped.
 */
function getEscapedId(originalElem) {
	// mod BP 2010
	var escapedId;
	if (originalElem != null) {
		escapedId = originalElem.id;
	} else {
		escapedId = this.id;
	}
    return "#" + escapedId.replace(/:/g,"\\:");
}

/**
 * Returns the escaped value of a string.
 * The character ':' is being escaped because it is a special filter separator for jQuery.
 * @param originalValue the string to be escaped.
 */
function getEscaped(originalValue) {
	// mod BP 2010
    return  originalValue.replace(/:/g,"\\:");
}

/**
 * Calls the click() function on the HTML element 'elem' 
 *  with attribute name=elemName .
 */
function clickElementByName(elem,elemName) {
	// mod BP 2010
	aElem = $(elem+"[name="+ getEscaped(elemName)+"]");
	if (aElem != null) 	aElem.click();
}

/** Indicates whether Chrome is used as the browser. 
 * @return true if the browser is Chrome */
function _Chrome() {
	return navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
}

/** Indicates whether the operating system for the browser is Apple Macintosh. 
 * @return true if the browser's platform is Mac */
function _platformMac() {
	return navigator.platform.toLowerCase().indexOf('mac') > -1;
}
