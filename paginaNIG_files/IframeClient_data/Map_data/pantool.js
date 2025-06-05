function initPanTool(clientId) {
}

function releasePanTool(clientId) {
}

PanTool = {
	map : null,
	layer : null,
	startPoint : null,
	endPoint : null,
	offsetX : 0,
	offsetY : 0,
	/**
	 * Activates this tool.
	 */
	activate : function(clientId) {
		this.map = Map.getMap(clientId);
		this.map.setCursor("cursor_pan.png");
		this.layer = this.map.panLayer;
	},
	
	deactivate : function(clientId) {
	},
	/**
	 * Handles the mouseDown action.
	 */
	handleMouseDown : function(clientId, point) {
		this.startPoint.moveTo(point.x, point.y);
	},
	/**
	 * Handles the mouseMove action.
	 */
	handleMouseMove : function(clientId, point) {
		var x = Math.min(point.x - this.startPoint.x);
		var y = Math.min(point.y - this.startPoint.y);
		this.layer["Canvas.Left"] = x;
		this.layer["Canvas.Top"] = y;
	},
	/**
	 * Handles the mouseUp action.
	 */
	handleMouseUp : function(clientId, point) {
		this.endPoint.moveTo(point.x, point.y);
		this.submit(clientId);
	},
	/**
	* Submits the tool data to the server. 
	* Collects the relevant data (start and end position) to be submitted.
	* Calls the map's submit method.
	 */
	submit : function(clientId) {
		if (this.map) {
			var parameters = {
				startX: this.startPoint.x,
				startY: this.startPoint.y,
				endX: this.endPoint.x,
				endY: this.endPoint.y
			};
			// Submit the form 
			this.map.submit("pan",parameters);
		}
	}
}

PanTool.startPoint = new DynPoint(0,0);
PanTool.endPoint = new DynPoint(0,0);

Map.prototype.activatePanTool = function() {
	this.activateTool(PanTool);
}