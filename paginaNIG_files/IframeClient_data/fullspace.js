var oldWidthValues = new Array();
var oldHeightValues = new Array();
var startWidthValues = new Array();
var startHeightValues = new Array();
var resizeTimeouts = new Array();

/**
 * Resizes an element.
 * This is used by the FullSpace component. The map is a FullSpace component.
 * The FullSpace component is rendered with 100% width and height.
 * When its size changes then the onresize event will call this function resize(clientId).
 * As there is no event which describes the end of resizing 
 * this function will try to detect when the user finished resizing. 
 * This is done by calling a sub-function after some short time which checks whether 
 * the size does not change anymore. Then the current size is submitted to the server.
 */
function resize(clientId) {
	element   = root.getObject("fullspacediv"+clientId);
	aDocument = element.ownerDocument;
	_intResize(aDocument,element,clientId,false,null);
}

function resizeFullspaceSplitpanel(clientId,force,forceHeight) {
	element   = root.getObject("fullspacediv"+clientId);
	aDocument = element.ownerDocument;
	_intResize(aDocument,element,clientId,force,forceHeight);
}

/* Internal sub-function called by resize(clientId) */ 
function _intResize(aDocument,element,clientId,force,forceHeight) {
    if (element != null) {
		if (typeof(startWidthValues[clientId]) == 'undefined') {
			startWidthValues[clientId] = -1;
		}
		if (typeof(startHeightValues[clientId]) == 'undefined') {
			startHeightValues[clientId] = -1;
		}
		if (typeof(oldWidthValues[clientId]) == 'undefined') {
			oldWidthValues[clientId] = element.offsetWidth;
		}
		if (typeof(oldHeightValues[clientId]) == 'undefined') {
			oldHeightValues[clientId] = element.offsetHeight;
		}
		
		// Check whether the size really changed
		if (!(oldWidthValues[clientId] == element.offsetWidth &&
			  oldHeightValues[clientId] == element.offsetHeight)
			|| force == true ) {
		
			oldWidthValues[clientId] = element.offsetWidth;
			oldHeightValues[clientId] = element.offsetHeight;
			if (resizeTimeouts[clientId] != null) {
				window.clearTimeout(resizeTimeouts[clientId]);
			}
	
			if (force != true) {
				// If size changed then some time later check again
				resizeTimeouts[clientId] = window.setTimeout("checkResize('"+clientId+"');", 1000);
			} else {
				resizeTimeouts[clientId] = window.setTimeout("forceCheckResize('"+clientId+"','"+forceHeight+"');", 200);
			}
		}
    }
}

/**
 * Checks whether the size does not change anymore and then submits the new size to the server.
 * Ensures that the submit has not been done before.
 * The call of this method is scheduled by the function resize(clientId) for some 
 * short time after each onresize event to find the end of resizing.
 */
function checkResize(clientId) {
	element   = root.getObject("fullspacediv"+clientId);
	aDocument = element.ownerDocument;
	_intCheckResize(aDocument,element,clientId,false,null);
}

/**
 * Resizes element with a check.
 */
function forceCheckResize(clientId,forceHeight) {
	element   = root.getObject("fullspacediv"+clientId);
	aDocument = element.ownerDocument;
	_intCheckResize(aDocument,element,clientId,true,forceHeight);
}


function _intCheckResize(aDocument,element,clientId,force,forceHeight) {
	if (element != null) {
		var elementHeight;
		if (force == true && forceHeight != null){
			elementHeight = parseInt(forceHeight);
		} else {
			elementHeight = element.offsetHeight;
		}
		
		if (force == true || 
			(oldWidthValues[clientId]  == element.offsetWidth &&
			 oldHeightValues[clientId] == element.offsetHeight &&
			 element.state == "idle" && 
			 root.getObject(frameId+"Blocker")!='true')) {

			//This prevents requests that are caused by flickering
			//without actually changing the size
			if (startWidthValues[clientId] == element.offsetWidth &&
			    startHeightValues[clientId] == elementHeight) {
				window.clearTimeout(resizeTimeouts[clientId]);
				if (force != true ) { return; }
			}
			
			// The following call instead of root.setServerBlocker() fixes the issue CBG00122552.
			//root._setMapRequestPending();

			root.dynObjects[frameId+"Blocker"]='true';
			element.state = "working";
			
			startWidthValues[clientId] = element.offsetWidth;
			startHeightValues[clientId] = element.offsetHeight;
			
			var activeElement = $($(element.ownerDocument).context.body);
			var offsetWidthScrollbar = activeElement.attr("offsetWidth")- activeElement.attr("clientWidth");
			// set width to hidden input field in form
			aDocument.getElementById(clientId+"width").value = element.offsetWidth + offsetWidthScrollbar;
			
			
			var headerHeight = activeElement.css("min-height");
			if (headerHeight == "auto") { headerHeight = "0px"; }
			
			var offsetHeightScrollbar = activeElement.attr("offsetHeight")- activeElement.attr("clientHeight");
			// set height to hidden input field in form
			if (force == true && forceHeight != null){
				aDocument.getElementById(clientId+"height").value = elementHeight - parseInt(headerHeight) + offsetHeightScrollbar ;
			} else {
				aDocument.getElementById(clientId+"height").value = activeElement.attr("clientHeight") - parseInt(headerHeight) + offsetHeightScrollbar ;
			}
			
			// add this to the cancelFunctions
			root.addCancelFunction("root.getObject('fullspacediv"+clientId+"').state='idle'");
			root.addCancelFunction("root.dynObjects['"+frameId+"Blocker']='false'");

			// Submit sizes to server
			aDocument.getElementById(clientId+"button").click();
		} else {
			 resize(clientId);
		}
	}
}