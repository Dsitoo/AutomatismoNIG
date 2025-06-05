/** Map tool which draws a box on the map for selecting objects on the map. */

function initSelectionTool(clientId) {
}

function releaseSelectionTool(clientId) {
}

SelectionTool = {
	layer : null,
	map : null,
	selectionBox : null,
	startPoint : new DynPoint(0,0),
	endPoint : new DynPoint(0,0),
	panning : false,
	zooming : false,
	
	/**
	 * Activates this tool. Displays the tool on the map and enables interaction for the user.
	 * @param clientId identifies the map and its layers.
	 */
	activate : function(clientId) {
		this.map = Map.getMap(clientId);
		this.layer = this.map.toolsLayer;
		var xamlFragment = "<Rectangle Name='selectionbox' Stroke='Red' StrokeThickness='2' />";
		this.selectionBox = this.map.silverlightContent.createFromXaml(xamlFragment, false);
		this.map.setCursor("Default");
		//console.log( "Created: " + this.selectionBox.Name );
	},
	
	/** Deactivates the tool. */
	deactivate : function(clientId) {
	},
	/**
	 * Handles the mouseDown action. The map calls this method for the active tool.
	 */
	handleMouseDown : function(clientId, point, mouseEventArgs) {		
		/* The user can no longer use the Alt key to temporarily 
			change from the selection mode on the map to the zoom map.
			The Silverlight API does not allow to detect the Alt key in mouse events.
			if (this.map.activatePanTool && evnt.altKey) {
			this.panning = true;
			PanTool.activate(clientId);
			PanTool.handleMouseDown(clientId,point);
		} else */
		if (this.map.activateZoomInTool && mouseEventArgs.Ctrl) {
			this.zooming = true;
			ZoomTool.activate(clientId);
			ZoomTool.handleMouseDown(clientId,point);
		} else {
			this.startPoint.moveTo(point.x, point.y);
			this.selectionBox["Canvas.Left"] = this.startPoint.x;
			this.selectionBox["Canvas.Top"]  = this.startPoint.y;
			this.selectionBox.Width = 0;
			this.selectionBox.Height = 0;
			this.layer.Children.Add(this.selectionBox);
			//this.selectionBox["Canvas.ZIndex"] = 1000;
			//console.log( "MouseDown. " + this.selectionBox["Canvas.Left"] + "/" + this.selectionBox["Canvas.Top"] );
		}
	},
	/**
	 * Handles the mouseMove action.
	 */
	handleMouseMove : function(clientId, point, mouseEventArgs) {
		if (this.panning) {
			PanTool.handleMouseMove(clientId,point);
		} else if (this.map.activateZoomInTool && mouseEventArgs.Ctrl) {
			if (!this.zooming) {
				this.switchSelectToZoom(clientId);
			}			
			ZoomTool.handleMouseMove(clientId,point);
		} else {
			if (this.zooming) {
				this.switchZoomToSelect(clientId, mouseEventArgs);
			}	
			this.selectionBox["Canvas.Left"] =  Math.min(point.x, this.startPoint.x);
			this.selectionBox["Canvas.Top"]  =  Math.min(point.y, this.startPoint.y);
			this.selectionBox.Width  = Math.abs(point.x - this.startPoint.x);
			this.selectionBox.Height = Math.abs(point.y - this.startPoint.y);
			//console.log( "MouseMove. X/Y  Width/Height: " + this.selectionBox["Canvas.Left"] + "/" + this.selectionBox["Canvas.Top"] + "  " + this.selectionBox.Width + "/" + this.selectionBox.Height );
		}
	},
	/**
	 * Handles the mouseUp action.
	 */
	handleMouseUp : function(clientId, point, mouseEventArgs) {
		// Remark:  mouseEventArgs may be null, when this function is called 
		//   after the event MouseLeave.
		if (this.panning) {
			PanTool.handleMouseUp(clientId,point);
			this.activate(clientId);
			this.panning = false;		
		} else if (this.map.activateZoomInTool && mouseEventArgs &&
				mouseEventArgs.Ctrl && mouseEventArgs.Shift) {
			if (!this.zooming) {
				this.switchSelectToZoom(clientId);
			}
			ZoomTool.zoomInMode = false;
			ZoomTool.handleMouseUp(clientId,point);
			this.activate(clientId);
			this.zooming = false;
		} else if (this.map.activateZoomInTool && mouseEventArgs &&
					mouseEventArgs.Ctrl) {
			if (!this.zooming) {				
				this.switchSelectToZoom(clientId);
			}
			ZoomTool.zoomInMode = true;
			ZoomTool.handleMouseUp(clientId,point);			
			this.activate(clientId);
			this.zooming = false;
		} else {
			if (this.zooming) {
				this.switchZoomToSelect(clientId, mouseEventArgs);
			}
			this.endPoint.moveTo(point.x, point.y);
			this.layer.Children.remove(this.selectionBox);
			this._submit(clientId, mouseEventArgs.Shift);
			//console.log( "MouseUp. startPoint endPoint: " + this.startPoint.x + "/" + this.startPoint.y + " " + point.x + "/" + point.y );
		}
	},
	/**
	* Submits the tool data to the server. 
	* Collects the relevant data (start and end position etc.) to be submitted.
	* Calls the map's submit method.
	 */
	_submit : function(clientId, shift) {
		if (this.map) {
			var parameters = {
				startX: this.startPoint.x,
				startY: this.startPoint.y,
				endX: this.endPoint.x,
				endY: this.endPoint.y,
				replace: !shift
			};
			// Submit the form 
			this.map.submit("selection",parameters);
		}
	},
	/**
	 * Switches form selection tool to zoomtool.
	 */
	switchSelectToZoom : function(clientId) {
		this.zooming = true;
		this.layer.removeChild(this.selectionBox);
		ZoomTool.activate(clientId);
		ZoomTool.handleMouseDown(clientId,this.startPoint);
	},
	/**
	 * Switches from zoom to selectiontool.
	 */
	switchZoomToSelect : function(clientId, event) {
		this.zooming = false;
		this.handleMouseDown(clientId,ZoomTool.startPoint, event);
		ZoomTool.layer.removeChild(ZoomTool.zoomBox);
}
};

/* Add a method to the map which will be called by the updater method 
 * to activate the selection tool. */
Map.prototype.activateSelectionTool = function() {
	this.activateTool(SelectionTool);
};