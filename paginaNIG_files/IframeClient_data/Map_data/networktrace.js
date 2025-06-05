/** Network trace tool */

NWTTool = {
	//fields
    id : null,
	map : null,
    isActive : false,
	isDragging : false,
	ptStart : null,
	ptDistance : null,
	dragFlag : null,
    flags : null,
    flagCount : 0,
	
	// Tool methods
	activate : function(clientId) {
        this.map = Map.getMap(clientId);
        // set custom mouse cursor "crosshair"
        this.map.setCursor("cursor_trace.png"); 
        NWTTool.isActive = true;   
	},
	
	deactivate : function(clientId) {
        this.removeFlags();
        NWTTool.isActive = false; 
	},
	
	getFlagAt : function(pt) {
		//search the active map for flags
        for (var i = this.flags.length -1; i >= 0; i--) {
			//pick up a single flag
            var flag = this.flags[i];
            if (flag != null && flag != "undefined" && flag.isVisible() && flag.contains(pt)) {
				//if the user clicked on it, then return it
				return flag;
			}
		}
		return null;
	},
	
	handleMouseDown : function(clientId, ptNow) {
        this.map.setCursor("cursor_trace.png");
		this.isDragging = true;
        this.map = Map.getMap(clientId);        
		this.dragFlag = this.getFlagAt(ptNow);
		
		this.ptStart = new DynPoint(0,0);
		this.ptStart.moveTo(ptNow);
        
		if (this.dragFlag == null) {
			this.ptDistance = new DynPoint(0,0);
		} else {
            this.map.setCursor("cursor_movetrail.png");
			this.ptDistance = this.dragFlag.getPosition().distanceTo(ptNow);
		}
	},

	handleMouseMove : function(clientId, ptNow) {
		if (this.isDragging && this.dragFlag != null) {
			ptNow.moveBy(this.ptDistance);
			this.dragFlag.moveTo(ptNow);
		}
	},
	
	handleMouseUp : function(clientId, ptNow) {
		if (this.isDragging) {
			this.isDragging = false;
			ptNow.moveBy(this.ptDistance);

			if (this.dragFlag == null) {
				this.submit(clientId, "addFlag", ptNow, "-1");
			} else {
				if (this.ptStart.x == ptNow.x && this.ptStart.y == ptNow.y) {
					this.submit(clientId, "selectFlag", this.dragFlag.coord, this.dragFlag.id);
				} else {
					this.dragFlag.moveTo(ptNow);
					this.submit(clientId, "moveSelectedFlag", this.dragFlag.coord, this.dragFlag.id);
				}
			}
            this.map.setCursor("cursor_trace.png");
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
                flagIndex: flagId
            };
            // Submit the form 
            this.map.submit("nwt",parameters);
		}
	},
	

    /** Adds a network trace flag.
    */
    addFlag : function(x, y, type, world) {
        if (this.flagCount < this.flags.length) {
            flag = this.flags[this.flagCount];
        } else {
            flag = new NWTFlag(new DynPoint(x,y), this.flagCount+1, this.map.toolsLayer);
            this.flags.push(flag);
        }
		
        flag.setWorld(world);
        if (flag.getWorld() == this.map.getWorld()) {
            flag.show();
        } else {
            flag.hide();
        }
			
        flag.moveTo(new DynPoint(x,y));
        flag.setType(type);
		
        this.flagCount++;
    },
  

    /** Removes all network trace flags. 
    * This is implemented by hiding the flags instead of really removing them in order
    * to allow a re-use of the flags.
    */
    removeFlags : function() {
        for (i = 0; i < this.flags.length; i++) {
            if(this.flags[i] != null && this.flags[i] != "undefined"){
                this.flags[i].hide();
            }
        }
        this.flagCount = 0;
	}
};

function initNWTTool(clientId) {
    NWTTool.id = "NWTTool" + clientId;
    NWTTool.flags = new Array();
    NWTTool.flagCount = 0;
    // Register the tool, so that it can be found later by the updater
    // for updating the flags.
    root.registerObject(NWTTool);

}

function releaseNWTTool(clientId) {
   root.unregisterObject('NWTTool'+clientId);
}

Map.prototype.activateNWTTool = function() {
	this.activateTool(NWTTool);
};


/** Adds a network trace flag.<br> 
* @deprecated Do not use this method of the Map object. It will be removed at the next release. 
* Instead call the method addFlag(x, y, type, world) on the map tool object NWTTool.
*/
Map.prototype.addNWTFlag = function(x, y, type) {
    var nwtTool = root.getObject("NWTTool" + this.id);
    if (nwtTool) {
		nwtTool.addFlag(x, y, type, null);
	}
};

/** Removes all network trace flags.<br> 
* @deprecated Do not use this method of the Map object. It will be removed at the next release. 
* Instead call the method removeFlags() on the map tool object NWTTool.
*/
Map.prototype.removeNWTFlags = function() {
    var nwtTool = root.getObject("NWTTool" + this.id);
    if (nwtTool) {
        nwtTool.removeFlags();
	}
};


/*============== NWTFlag ========================================================*/

/**
 * Constructor for a network trace flag.
 * @constructor
 * @param ptCoord coordinates of the flag as a DynPoint object.
 * @param index index of the flag, starting with 1.
 * @param layer a Silverlight canvas.
 */
NWTFlag = function(ptCoord, index, layer) {
	this.id = index-1;
	this.coord = ptCoord;
	this.index = index;
	this.visible = true;
	
    this.flagLayer = layer;	

    // Retrieve a reference to the plug-in.
    this.world = null;
    var plugin = this.flagLayer.getHost().content;
    
    this.layer = plugin.createFromXaml("<Image Source='" + root.getURL() + "/modules/networktrace/themes/xp/nwt_flag.png' />",false);
    this.layer["Canvas.Left"] = ptCoord.x + this.SHIFT_X;
    this.layer["Canvas.Top"] = ptCoord.y + this.SHIFT_Y;
    this.layer["Width"] = 32;
    this.layer["Height"] = 32;
    this.layer["Canvas.ZIndex"] = 30;
    this.flagLayer.Children.Add(this.layer);
    
    this.dot = plugin.createFromXaml("<Image />", false);
    this.dot["Canvas.Left"] = ptCoord.x + this.DOT_X;
    this.dot["Canvas.Top"] = ptCoord.y + this.DOT_Y;
    this.dot["Width"] = 16;
    this.dot["Height"] = 16;
    this.dot["Canvas.ZIndex"] = 40;
    this.flagLayer.Children.Add(this.dot);
    
    this.text = plugin.createFromXaml("<TextBlock />", false);
    this.text.Text = index + "";
    this.text["Canvas.Left"] = ptCoord.x + this.TEXT_X;
    this.text["Canvas.Top"] = ptCoord.y + this.TEXT_Y;
    this.text["Foreground"] = "black";
    this.text["Canvas.ZIndex"] = 40;
    this.flagLayer.Children.Add(this.text);
    
    this.rect = plugin.createFromXaml("<Rectangle StrokeThickness='0' Opacity='0' Fill='White'></Rectangle>",false);
    this.rect["Canvas.Left"] = ptCoord.x + this.SHIFT_X;
    this.rect["Canvas.Top"] = ptCoord.y + this.SHIFT_Y;
    this.rect["Width"] = 32;
    this.rect["Height"] = 32;
    this.rect["Canvas.ZIndex"] = 50;
    this.rect.addEventListener("MouseEnter", "setNWTCustomCursor");
    this.rect.addEventListener("MouseLeave", "resetNWTCustomCursor");  
    this.flagLayer.Children.Add(this.rect);
};

NWTFlag.prototype = {
	SHIFT_X : -2,
	SHIFT_Y : -32,
    DOT_X : 14,
    DOT_Y : -34,
    TEXT_X : 5,
    TEXT_Y : -34,
	type : 0,
	
	toString : function() {
		return "NWTFlag("+this.coord+")";
	},
	
	contains : function(pt) {
		var rect = new DynRect(
        parseInt(this.layer["Canvas.Left"]), 
        parseInt(this.layer["Canvas.Top"]), 
        parseInt(this.layer["Width"]), 
        parseInt(this.layer["Height"]));
		return rect.isWithinRect(pt);
	},
	
    getDotSource : function() {
        var src = root.getURL() + "/modules/networktrace/themes/xp/";
		if (this.type == NWTTool.TYPE_START) {
            src += "dotstart.png";
		} else if (this.type == NWTTool.TYPE_STOP) {
            src += "dotstop.png";
		} else if (this.type == NWTTool.TYPE_NOT) {
            src += "dotnot.png";
		}
        return src;
	},
	
	getType : function() {
		return this.type;
	},
	
	getPosition : function() {
		return this.coord;
	},
	
	hide : function() {
        if(this.visible){
		this.visible = false;
            this.flagLayer.Children.Remove(this.layer);
            this.flagLayer.Children.Remove(this.dot);
            this.flagLayer.Children.Remove(this.text);
            this.flagLayer.Children.Remove(this.rect);
        }
	},
	
	isVisible : function() {
		return this.visible;
	},
	
	moveTo : function(x, y) {
		var target;
		if (x instanceof DynPoint) {
			target = x;
		} else {
			target = new DynPoint(x, y);
		}
        this.layer["Canvas.Left"] = target.x + this.SHIFT_X;
        this.layer["Canvas.Top"] = target.y + this.SHIFT_Y;
        this.dot["Canvas.Left"] = target.x + this.DOT_X;
        this.dot["Canvas.Top"] = target.y + this.DOT_Y;
        this.text["Canvas.Left"] = target.x + this.TEXT_X;
        this.text["Canvas.Top"] = target.y + this.TEXT_Y;
        this.rect["Canvas.Left"] = target.x + this.SHIFT_X;
        this.rect["Canvas.Top"] = target.y + this.SHIFT_Y;
        this.coord.x = target.x;
        this.coord.y = target.y;
	},
	
	setType : function(type) {
		this.type = type;
        this.dot.Source = this.getDotSource();
    },
	
    setWorld : function(world) {
        this.world = world;
    },

    getWorld : function() {
        return this.world;
	},
	
	show : function() {
        if(!this.visible){
		this.visible = true;
            this.flagLayer.Children.Add(this.layer);
            this.flagLayer.Children.Add(this.dot);
            this.flagLayer.Children.Add(this.text);
            this.flagLayer.Children.Add(this.rect);
        }
	}
};


 /**
 * Set the custom cursor when mouse hovers
 * over the trail flag
 */
function setNWTCustomCursor(sender, eventArgs) {  
    if(NWTTool.isActive) {                 
        NWTTool.map.setCursor("cursor_movetrail.png");    
    }
}

/**
 * Reset the custom cursor when mouse leaves
 * over the trail flag
 */
function resetNWTCustomCursor(sender, eventArgs) {
    if(NWTTool.isActive) {  
       NWTTool.map.setCursor("cursor_trace.png"); 
    }       
}