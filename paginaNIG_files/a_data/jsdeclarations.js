/**
 * JavaScript that will be included in every dynamic sub-frame. 
 * It provides a link to the root object, gives access to local 
 * objects (without the frameId) and redirects key handling to the root.
 */

var root = parent.root;
var localObjects = new Array();

/**
 * Returns a local object by it's id. The local id of an object is the client id
 * without the frameId prefix and should the id of the tag.
 */
function getLocalObject(objId) {
	if (localObjects.length == 0) {
		localObjects = root.getLocalObjects(frameId);
	}
	var i;
	for (i = 0; i < localObjects.length; i++) {
		obj = localObjects[i];
		try {
			if (obj.id.substring(obj.id.length-objId.length, obj.id.length) == objId) {
				return obj;
			}
		} catch(ex) {}
	}
	return null;
}

/** Redirects onkeydown handling to the root. */
document.onkeydown = function(evnt) {
	evnt = evnt || window.event;
	root.handleOnKeyDownEvent(evnt);	
};

/** Redirects onkeyup handling to the root. */
document.onkeyup = function(evnt) {
	evnt = evnt || window.event;
	root.handleOnKeyUpEvent(evnt);
};

/** Redirects onkeypress handling to the root. */
document.onkeypress = function(evnt) {
	evnt = evnt || window.event;
	root.handleOnKeyPressEvent(evnt);
};

/** Redirects onmousedown handling to the root. 
 *  This is used to collapse, for example opened menus or drop down buttons. */
document.body.onmousedown = function(evnt) {
	evnt = evnt || window.event;
	root.handleOnMouseDownEvent(evnt);
};
