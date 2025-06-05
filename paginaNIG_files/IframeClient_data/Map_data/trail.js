/** Objects DynTrail and TrailFlag. */

FLAG_SHIFT_X = -2;
FLAG_SHIFT_Y = -32;


DynTrail = function(id, unit, color, weight) {
	this.id = id||null;           // Components id
	root.registerObject(this);

	this.unit = unit||null;
	this.layer = null;
	this.color = color||"#66CC00";
	this.weight = weight||"2";
	this.points = new Array();
	this.flags = new Array();
	this.visible = true;	
	this.closed = false;
	this.svgdoc = null;
    isActive = false;
	return this;	
};

DynTrail.prototype = {
	addPoint : function(pt) {
		if(this.flags.length==1)
			return;
		var line = this.getNewLine();
		
		// Check to see whether trail is closed or not.
		this.checkCloseTrail();		
		
		if(this.closed){
			
		// add the closing line
			if(this.trail.length==0){
				var newline = this.getNewLine();
				this.trail.push(newline);
				var newpt = this.flags[this.flags.length-2].coord;
                newline["X1"] = newpt.x;
                newline["Y1"] = newpt.y;
			}		
            //this.trail[this.trail.length-1]["X2"] = pt.x;
            //this.trail[this.trail.length-1]["Y2"]= pt.y;		
		  	var pt = this.flags[this.flags.length-2].coord;
            line["X1"] = pt.x;
            line["Y1"] = pt.y;
			pt = this.flags[this.flags.length-1].coord;
            line["X2"] = pt.x;
            line["Y2"] = pt.y;

		} else {
		  	var pt = this.flags[this.flags.length-2].coord;
            line["X1"] = pt.x;
            line["Y1"] = pt.y;
			pt = this.flags[this.flags.length-1].coord;
            line["X2"] = pt.x;
            line["Y2"] = pt.y;
		}
		this.trail.push(line);
	},
	
	/**
	 * Check to see whether trail is closed or not.
	 * This basically compares the points with first point to decide the trail is closed.
	 */
	checkCloseTrail : function() {
		if (this.flags[0].coord.x == this.flags[this.flags.length - 1].coord.x
				&& this.flags[0].coord.y == this.flags[this.flags.length - 1].coord.y) {
			this.closed = true;
		}
	},
	
	/**
	 * Returns the id.
	 */
	getId : function() {
		return this.id;
	},
	
	/**
	 * Returns a new line.
	 */	
	getNewLine : function() {
        var lineStr = "<Line Stroke='"+this.color+"' StrokeThickness='"+this.weight+"'/>";
        var line = this.svgDoc.createFromXaml(lineStr,false);
        this.layer.Children.Add(line);
	  if(!this.visible){
  	      line["Visibility"] = "Collapsed";
	  }
  	  return line;
	},	
	
	hide : function() {
		this.visible = false;
		for(var i=0; i<this.trail.length; i++){
        this.trail[i]["Visibility"] = "Collapsed";
		}
	},
	
	init : function() {
		if (this.layer != null) {
			this.trail = new Array();
			for(var i=0; i<this.flags.length-1; i++){
				var line = this.getNewLine();
				this.trail.push(line);
			  	var pt = this.flags[i].coord;
                line["X1"] = pt.x;
                line["Y1"] = pt.y;
				pt = this.flags[i+1].coord;
                line["X2"] = pt.x;
                line["Y2"] = pt.y;
			} 
			if(this.closed && this.flags.length>1){
				var line = this.getNewLine();
				this.trail.push(line);
			  	var pt = this.flags[this.flags.length-1].coord;
               	line["X1"] = pt.x;
                line["Y1"] = pt.y;
				pt = this.flags[0].coord;
			    line["X2"] = pt.x;
                line["Y2"] = pt.y;
			}
		}
	},
	/**
	 * is closed?
	 */
	isClosed : function() {
		return this.closed;
	},
	
	isTrail : true,
	
	movePoint : function(index) {
		if(this.trail.length==0){
			return;
		}
		var pt = this.flags[index].coord;
		if(index==0) {
			if(this.closed && this.trail.length>1){
                this.trail[this.trail.length-1]["X2"]= pt.x;
                this.trail[this.trail.length-1]["Y2"]= pt.y;
			}
            this.trail[0]["X1"] = pt.x;
            this.trail[0]["Y1"] = pt.y;
		} else if(index==this.flags.length-1) {
			if(this.trail.length>0){
                this.trail[index-1]["X2"] = pt.x;
                this.trail[index-1]["Y2"]= pt.y;
				if(this.closed && this.trail.length>1){
                    this.trail[this.trail.length-1]["X2"]= pt.x;
                    this.trail[this.trail.length-1]["Y2"]= pt.y;
				}
			}
		} else {
            this.trail[index-1]["X2"]=pt.x;
            this.trail[index-1]["Y2"]= pt.y;
            this.trail[index]["X1"] = pt.x;
            this.trail[index]["Y1"]= pt.y;
		}
	},
	
	removeAllPoints : function() {
		if (this.trail) {
			while(this.trail.length>0){
				var line = this.trail.pop();
                this.layer.Children.remove(line);
				delete line;
			}
		}
	},
	
	removePoint : function(index) {
		this.points.splice(index, 1);
	},
	
	repaint : function() {
        if(this.closed && this.trail.length > 0) {
			// add the closing line
			var line = this.getNewLine();
            var last = this.flags.length -1;
            var pt = this.flags[last].coord;;
            line["X1"] = pt.x;
            line["Y1"] = pt.y;
            pt = this.flags[0].coord;
            line["X2"] = pt.x;
            line["Y2"] = pt.y;
            var trailFlag = new TrailFlag(pt, "addFlag", this.flags[last].number, this);
            this.flags.push(trailFlag);
			this.trail.push(line);
        } else if(!this.closed && this.trail.length>0) {
			// remove the closing line
			var line = this.trail.pop();
            this.layer.Children.remove(line);
			delete line;
		}
	},
	/**
	 * set closed
	 */
	setClosed : function(closed) {
		this.closed = closed;
		this.repaint();
	},
	/**
	 * sets the layer
	 */
	setLayer : function(layer) {
		if (layer != null) {
		this.layer = layer;
		} else {
			try {
				while(this.trail.length>0){
					var line = this.trail.pop();
					this.layer.removeChild(line);
					delete line;
				}
			} catch(ex) {
			}
			this.layer = null;
		}
	},
	
	show : function() {
		this.visible = true;
		for(var i=0; i<this.trail.length; i++){
            this.trail[i]["Visibility"] = "Visible";
		}
	}, 
	
	/**
	 * adds a flag to the trail
	 */
	addFlag : function(id, x, y, number) {
		// If the trail is closed then we shouldn't add the flags
		if(this.closed) return;
		var pt = new DynPoint(x,y);
		var trailFlag = new TrailFlag(pt, id, number, this);
		this.flags.push(trailFlag);
		this.addPoint(pt);
		return trailFlag;
	},
	/**
	 * returns a flag by its id
	 */
	getFlagById : function(id) {
		var i;
		for (i=0; i<this.flags.length; i++) {
			if (this.flags[i].id == id) {
				return this.flags[i];
			}
		}
		return null;
	},
	/**
	 * removes all flags
	 */
	removeAll : function() {
		while (this.flags.length > 0) {
           var fl = this.flags.pop();
           this.removeFlag(fl);
           delete fl;
		}
		this.removeAllPoints();
		// Once we clear the trail, we should reset the closed flag.
		this.closed = false;
	},
	/**
	 * removes a flag by a id (Id can be addFlag/refreshFlag)
	 */
    removeFlagById : function(id) {
		var flag = this.getFlagById(id);
		if (flag != null) {
            removeFlag(flag);  
		}
    },
    
    /**
     * removes a flag object.
     */
    removeFlag : function(flag) {
    	
        flag.elm.GetParent().Children.remove(flag.elm);
			delete flag.elm;
         flag.text.GetParent().Children.remove(flag.text);
			delete flag.text;
         flag.rect.GetParent().Children.remove(flag.rect);
			delete flag.rect;
			delete flag;
	},
    
	/**
	 * moves a flag
	 */
	moveFlag : function(flag, x, y) {
		if (flag != null) {
			flag.moveTo(x, y);
			this.movePoint(flag.index);
		}
	},
	/**
	 * gets a flag at a point
	 */
	getFlagAt : function(pt) {
		//search this window for flags
		for (var i = this.flags.length -1; i>=0; i--) {
			//pick up a single flag
			var flag = this.flags[i];
			if (flag.contains(pt)) {
				//if the user clicked on it, then return it
				return flag;
			}
		}
		return null;
	},
	/**
	 * returns a unit
	 */
	getUnit : function() {
		return this.unit;
	},
	/**
	 * sets a unit
	 */
	setUnit : function(unit) {
		this.unit = unit;
	}
};

TrailFlag = function(ptCoord, id, number, trail) {
    // Components - A rectangle that holds the flag image
    // and the text box.
    // Text box - Zindex is 40 (to display text during overlaps)
    // Rectangle - Zindex is 50 (to enable event handling)
	var plugin = trail.layer.getHost().content;
	this.coord = ptCoord;
	this.id = id;
	this.index = number;
	this.number = number+1;
    var xamlStr = "<Image Source='" + root.getURL() + "/modules/measure/themes/xp/trail_flag.png' />";
    this.elm = plugin.createFromXaml(xamlStr, false); 
    this.elm["Canvas.Left"] = ptCoord.x + this.SHIFT_X;
    this.elm["Canvas.Top"] = ptCoord.y + this.SHIFT_Y;
    this.elm["Width"] = 32;
    this.elm["Height"] = 32;
    this.elm["Visibility"] = "Visible";
    this.elm["Canvas.ZIndex"] = 40;
    trail.layer.Children.Add(this.elm);
    this.text = plugin.createFromXaml("<TextBlock FontFamily='Arial' TextAlignment='Center'><Run Foreground='white' FontSize='15'>"+this.number+"</Run></TextBlock>",false);
    this.text["Canvas.Left"] = ptCoord.x + this.TEXT_X;
    this.text["Canvas.Top"] = ptCoord.y + this.TEXT_Y;
    this.text["Width"] = 32;
    this.text["Height"] = 16;
    this.text["Canvas.ZIndex"] = 40;
    trail.layer.Children.Add(this.text);
    var rectStr = "<Rectangle Opacity='0' Fill='White' />";
    this.rect = plugin.createFromXaml(rectStr,false);
    this.rect["Canvas.Left"] = ptCoord.x + this.SHIFT_X;
    this.rect["Canvas.Top"] = ptCoord.y + this.SHIFT_Y;
    this.rect["Width"] = 32;
    this.rect["Height"] = 32;
    this.rect["Canvas.ZIndex"] = 50;
    // mod BP 2010
    // use of the alternative syntax that specifies the event handler as a string (enclosed in quotation marks) 
	// for Safari browsers, which did not have the ability in the browser object model to retain handler references
    this.rect.addEventListener("MouseEnter","setTrailCustomCursor");
    this.rect.addEventListener("MouseLeave", "resetTrailCustomCursor");  
    // end mod BP 2010
    trail.layer.Children.Add(this.rect);
};


TrailFlag.prototype = {
	SHIFT_X : -2,
	SHIFT_Y : -32,
    TEXT_X : -2,
    TEXT_Y : -32,

	toString : function() {
		return "TrailFlag("+this.coord+")";
	},
	contains : function(pt) {
		var rect = new DynRect(
            parseInt(this.elm["Canvas.Left"]), 
            parseInt(this.elm["Canvas.Top"]),
            parseInt(this.elm["Width"]),
            parseInt(this.elm["Height"]));
		return rect.isWithinRect(pt);
	},
	moveTo : function(x, y) {
		var target;
		if (x instanceof DynPoint) {
			target = x;
		} else {
			target = new DynPoint(x, y);
		}
        this.elm["Canvas.Left"]= target.x + this.SHIFT_X;
        this.elm["Canvas.Top"]= target.y + this.SHIFT_Y;
        this.text["Canvas.Left"]= target.x + this.TEXT_X;
        this.text["Canvas.Top"]= target.y + this.TEXT_Y;
        this.rect["Canvas.Left"]= target.x + this.SHIFT_X;
        this.rect["Canvas.Top"] = target.y + this.SHIFT_Y;
        this.coord.x = target.x;
        this.coord.y = target.y;
	}
};

/**
 * Set the custom cursor when mouse hovers over the trail flag.
 */
function setTrailCustomCursor(sender, eventArgs) {   
        if(DynTrail.isActive) {
           MeasureTool.map.setCursor("cursor_movetrail.png");
    }
}

/**
 * Reset the custom cursor when mouse leaves the trail flag.
 */
function resetTrailCustomCursor(sender, eventArgs) {
    if(DynTrail.isActive) {
         MeasureTool.map.setCursor("cursor_trail.png");
    }
}