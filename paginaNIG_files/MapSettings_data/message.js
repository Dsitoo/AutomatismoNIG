DynMessage = function(id, layerId) {
	this.id = id||null;
	root.registerObject(this);
	this.layer = document.getElementById(layerId);
};

DynMessage.prototype = {
	/**
	 * adds a message
	 */
	addMessage : function(summary, detail, style, styleClass, showSummary, showDetail, showTooltip) {
		var span = this.layer.appendChild(document.createElement("span"));
		
		if (style != null) {
			span.style = style;
		}
		if (styleClass != null) {
			span.className = styleClass;
		}
		if (showTooltip && summary != null) {
			span.title = summary;			
		}
		if (showSummary && summary != null) {
			span.appendChild(document.createTextNode(summary));
		}
		if (showDetail && detail != null) {
			span.appendChild(document.createTextNode(detail));
		}
		
		this.layer.appendChild(document.createElement("br"))
	},
	/**
	 * remove all messages
	 */
	removeAll : function() {
		while(this.layer.firstChild != null) {
			this.layer.removeChild(this.layer.firstChild);
		}
	}
};
