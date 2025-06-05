/**
 * Separator
 */ 
MenuSeparator = function(id) {
	this.id == id||null;
	root.registerObject(this);

	return this;
};

MenuSeparator.prototype = {
	isSeparator : true
};