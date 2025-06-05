/** Measure tool.
 *  Provides methods to access the trail. */

MeasureTool = {
	//fields
    id : null,  
	map : null,
	bIsDragging : false,
	ptStart : null,
	ptDistance : null,
	dragFlag : null,
	trail : null,
	transform : null, 
	blocked: false,
	
	// Tool methods
	/**
     * Activates the measure tool.
	 */
	activate : function(clientId) {
	    // set custom mouse cursor "trail_cursor"
        DynTrail.isActive = true; 
        this.map.setCursor("cursor_trail.png");
	},
	/**
     * Deactivates the measure tool.
	 */
	deactivate : function(clientId) {
        DynTrail.isActive = false;
	},
	/**
     * Handles the mouseDown action.
	 */
    handleMouseDown : function(clientId, ptNow, evnt) {
        this.map.setCursor("cursor_movetrail.png");
		if(this.blocked){
			return;
		}
        
        //this.blocked = true;
		this.dragFlag = this.trail.getFlagAt(ptNow);
		this.bIsDragging = true;
		var unit;
		if(this.map.unit == "degree"){
			unit = "degree";
		} else {
			unit = this.trail.unit;
		}
        this.transform = this.map.getTransformForUnit(unit);
		
		this.ptStart = new DynPoint(ptNow);
		if(this.dragFlag==null){
        	// If the trail is closed we should not allow the client to add more points.
            if(this.trail.closed) {
            	alert(getErrorMessage("CLOSED_TRAIL_WARNING"));
            	return;
            }
            this.ptDistance = new DynPoint(0,0);
			this.dragFlag = this.trail.addFlag("addFlag", ptNow.x, ptNow.y, this.trail.flags.length);
		} else {
        	
			this.ptDistance = new DynPoint(
                this.dragFlag.coord.x - ptNow.x,
                this.dragFlag.coord.y - ptNow.y
			);
		}
	},
	/**
     * Handles the mouseMove action.
	 */
	handleMouseMove : function(clientId, ptNow) {
        this.map.setCursor("cursor_movetrail.png");
		if (MeasureTool.bIsDragging && this.dragFlag != null) {
			ptNow.moveBy(this.ptDistance);

			this.trail.moveFlag(this.dragFlag, ptNow.x, ptNow.y);
			if(this.dragFlag.id!="addFlag"){
				updateMeasureDialog(this.map, this.transform, this.trail, this.dragFlag);
			}
		}
	},
	/**
     * Handles the mouseUp action.
	 */
	handleMouseUp : function(clientId, ptNow) {
        if (this.bIsDragging && !this.closed) {
			this.bIsDragging = false;
			if(this.dragFlag==null || this.dragFlag.id=="addFlag"){
				this.submit(clientId, "addFlag", ptNow, "");
			} else {
				ptNow.moveBy(this.ptDistance);
                this.dragFlag.moveTo(ptNow.x, ptNow.y);
				this.submit(clientId, "refreshFlag", this.dragFlag.coord, this.dragFlag.id);
			}
            this.map.setCursor("cursor_trail.png");
		}
	},
	/**
    * Submits the tool data to the server. 
    * Collects the relevant data (action, position, index of flag) to be submitted.
    * Calls the map's submit method.
	 */
	submit : function(clientId, action, point, flagId) {
        if (this.map) {
            var parameters = {
                action: action,
                pointX: Math.round(point.x),
                pointY: Math.round(point.y),
                flagId: flagId
            };
            // Submit the form 
            this.map.submit("measure",parameters);
	}
    },

    /**
     * Adds a flag to the trail by calling DynTrail.addFlag().
     */
    addFlag : function(id, x, y, number){
        return this.trail.addFlag(id, x, y, number);
    },  

    /**
     * Removes all flags by calling DynTrail method.
     */
    removeAllFlags : function(){
       this.trail.removeAll();
    },

    /**
     * Closes the trail.
     */
    closeTrail : function(){
        this.trail.setClosed(true);
    },
    
    /**
     * Returns the array of flags added in the trail.
     */
    getFlags : function(){
        return this.trail.flags;
    },

    /**
     * Returns the array of lines added in the trail.
     */
    getTrail : function(){
        return this.trail.trail;
    },

    /**
     * Sets the unit for the trail.
     */
    setUnit : function(unit) {
        this.trail.setUnit(unit);
    },
    
/**
     * Returns the unit of the trail.
 */
    getUnit : function() {
        return this.trail.getUnit();
    }    
};

/** Updates the measure dialog. */
function updateMeasureDialog(map, transform, trail, point){

	var dialog = root.getObject("MeasureDialog");
	if(dialog == null) return;
	dialog.movePoint(map, transform, trail, point);
}
/**
 * Adds the activateMeasureTool to the map.
 * That function will activate this measureTool.
 */
Map.prototype.activateMeasureTool = function() {
	this.activateTool(MeasureTool);
};

/** Initialises the measure tool. */
function initMeasureTool(clientId, unit, color) {
    MeasureTool.id = 'measureTool'+clientId;  
    var map = Map.getMap(clientId);
    MeasureTool.map = map;
	var trail = new DynTrail("trail"+clientId, unit, color);
    trail.layer = map.toolsLayer;
	MeasureTool.trail = trail;
    trail.svgDoc = trail.layer.getHost().content;
	trail.init();
    root.registerObject(MeasureTool);
}

/** Releases the measure tool. */
function releaseMeasureTool(clientId) {
    root.unregisterObject('measureTool'+clientId);
}