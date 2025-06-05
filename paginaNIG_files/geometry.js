/*
 * API - Geometry.
 * Contains the classes:
 *                DynPoint
 *                DynRect
 *                DynPath
 * Defines simple geometric objects and methods to handle them.
 * Should be included by tags that would like to use them.
 * Is available on the map.
 */

/**
 * DynPoint - a point class
 */
DynPoint = function(x, y) {
	if (typeof(x) == 'object'&& x.getX != null && x.getY != null) {
		this.x = x.getX() || 0;
		this.y = x.getY() || 0;
	} else if (typeof(x) == 'string') {
		this.x = 0;
		this.y = 0;
		this.parsePoint(x, y);
	} else {
		this.x = eval(x) || 0;
		this.y = eval(y) || 0;
	}
	return this;
};
/**
 * returns the class
 */
DynPoint.prototype.getClass = function() {
	return this.constructor;
};
/**
 * returns the class name
 */
DynPoint.prototype.getClassName = function() {
	return "DynPoint"};
/**
 * compair function for a point object
 */
DynPoint.prototype.equals = function(x, y) {
	if (typeof(x) == 'object'&& x.getX != null && x.getY != null) {
		return this.x == x.getX() && this.y == x.getY();
	} else {
		return this.x == x && this.y == y;
	}
};
/**
 * returns the distance to a another point given by its x/y coordinates
 */
DynPoint.prototype.distanceTo = function(x, y) {
	var dx, dy;
	if (typeof(x) == 'object'&& x.getX != null && x.getY != null) {
		dx = this.x - x.getX();
		dy = this.y - x.getY();
	} else {
		dx = this.x - x;
		dy = this.y - y;
	}
	return new DynPoint(dx, dy);
};

DynPoint.prototype.isDynPoint = true;
/**
 * returns the length of a point
 */
DynPoint.prototype.getLength = function() {
	return Math.sqrt(this.x * this.x + this.y * this.y);
};
/**
 * returns the x coordinate of a point
 */
DynPoint.prototype.getX = function() {
	return eval(this.x);
};
/**
 * returns the y coordinate of a point
 */
DynPoint.prototype.getY = function() {
	return eval(this.y);
};
/**
 * sets the x coordinate of a point
 */
DynPoint.prototype.setX = function(x) {
	this.x = x;
}
/**
 * sets the y coordinate of a point
 */
DynPoint.prototype.setY = function(y) {
	this.y = y;
}
/**
 * parse a point from a pair of coordinates divided by a seperator
 */
DynPoint.prototype.parsePoint = function(pair, s) {
	var se = (!s) ? "," : s;
	var p = pair.indexOf(se);
	this.x = parseFloat(pair.substring(0, p));
	this.y = parseFloat(pair.substring(p + 1));
	return this;
};
/**
 * moves a point to a new coordinate
 */
DynPoint.prototype.moveTo = function(x, y) {
	if (typeof(x) == 'object'&& x.getX != null && x.getY != null) {
		this.x = parseFloat(x.getX()) || 0;
		this.y = parseFloat(x.getY()) || 0;
	} else {
		this.x = x || 0;
		this.y = y || 0;
	}
};
/**
 * moves a point by the given distance
 */
DynPoint.prototype.moveBy = function(dx, dy) {
	if (typeof(dx) == 'object'&& dx.getX != null && dx.getY != null) {
		this.x += parseFloat(dx.getX()) || 0;
		this.y += parseFloat(dx.getY()) || 0;
	} else {
		this.x += dx || 0;
		this.y += dy || 0;
	}
	return this;
};
/**
 * returns the scaled point
 */
DynPoint.prototype.scaleSize = function(mul) {
	return new DynPoint(this.getX() * mul, this.getY() * mul);
};
/**
 * rotates a point by a angle and a given origin
 */
DynPoint.prototype.moveByAngle = function(d, angle) {
	this.moveBy(d * Math.cos(angle), d * Math.sin(angle));
};
/**
 * returns the string value of a point
 */
DynPoint.prototype.toString = function() {
	return "DynPoint(" + this.x + "|" + this.y + ")"};
/**
 * returns x + c + y
 */
DynPoint.prototype.join = function(c) {
	return this.x + c + this.y;
};
/**
 * returns a new point with rounded coordinates of a point
 */
DynPoint.prototype.round = function() {
	return new DynPoint(Math.round(this.x), Math.round(this.y));
};
/**
 * returns if a point is within a rect object
 */
DynPoint.prototype.isWithinRect = function(rect,pt) {
	if (!pt) pt = this;
	if (rect instanceof DynRect) return rect.isWithinRect(pt,rect);
	return false;
}

/**
 * DynRect - a rectangle class
 */
DynRect = function() {
	this.ul = new DynPoint(0, 0);
	this.height = 0;
	this.width = 0;
	var a = arguments;

	if (
		a.length == 2
			&& typeof(a[0]) == 'object'
			&& a[0] instanceof DynPoint
			&& typeof(a[1]) == 'object'
			&& a[1] instanceof DynPoint) { //Rectangle from 2 DynPoints
		this.ul.moveTo(
			Math.min(a[0].getX(), a[1].getX()),
			Math.min(a[0].getY(), a[1].getY()));
		this.height = Math.abs(a[1].y - a[0].y);
		this.width = Math.abs(a[1].x - a[0].x);
	} else if (
		a.length == 3
			&& typeof(a[0]) == 'object'
			&& a[0] instanceof DynPoint) {
		//Rectangle from a DynPoint, Width, Height
		this.ul.moveTo(a[0]);
		this.width = a[1];
		this.height = a[2];
	} else if (a.length == 4) {
		//Rectangle from Left, Top, Width, Height
		this.ul.moveTo(a[0], a[1]);
		this.width = a[2];
		this.height = a[3];
	} else {
		//Invalid Arguments
	}
};
/**
 * deletes a rectangle
 */
DynRect.prototype.destroy = function() {
	delete this.ul;
};
/**
 * moves a rectangle by a given distance
 */
DynRect.prototype.moveBy = function(x, y) {
	this.ul.moveBy(x, y);
};
/**
 * moves a rectangle to a new orgin
 */
DynRect.prototype.moveTo = function(x, y) {
	this.ul.moveTo(x, y);
};
/**
 * creates a rectangle from different arguments 
 * (2 points/point;width;height/left;top;width;height)
 */
DynRect.prototype.setBounds = function() {
	var a = arguments;
	if (a.length == 2
		&& typeof(a[0]) == 'object'
		&& a[0].getClass() == DynPoint
		&& typeof(a[1]) == 'object'
		&& a[1].getClass() == DynPoint) { //Rectangle from 2 DynPoints
		this.ul.moveTo(a[0]);
		this.height = a[1].y - a[0].y;
		this.width = a[1].x - a[0].x;
	} else if (
		a.length == 3
			&& typeof(a[0]) == 'object'
			&& a[0].getClass() == DynPoint) {
		//Rectangle from a DynPoint, Width, Height
		this.ul.moveTo(a[0]);
		this.width = a[1];
		this.height = a[2];
	} else if (a.length == 4) {
		//Rectangle from Left, Top, Width, Height
		this.ul.moveTo(a[0], a[1]);
		this.width = a[2];
		this.height = a[3];
	} else {
		//Invalid Arguments
	}
};
/**
 * returns the classname
 */
DynRect.prototype.getClassName = function() {
	return "DynRect";
};
/**
 * returns the string value of a rectangle
 */
DynRect.prototype.toString = function() {
	return "DynRect("
		+ this.ul.x
		+ "|"
		+ this.ul.y
		+ "|"
		+ this.getWidth()
		+ "|"
		+ this.getHeight()
		+ ")";
};
/**
 * returns the class
 */
DynRect.prototype.getClass = function() {
	return this.constructor;
};
/**
 * returns the top of a rectangle
 */
DynRect.prototype.getTop = function() {
	return this.ul.y;
};
/**
 * returns the bottom of a rectangle
 */
DynRect.prototype.getBottom = function() {
	return this.ul.y + this.height;
};
/**
 * returns the left of a rectangle
 */
DynRect.prototype.getLeft = function() {
	return this.ul.x;
};
/**
 * returns the right of a rectangle
 */
DynRect.prototype.getRight = function() {
	return this.ul.x + this.width;
};
/**
 * returns the height of a rectangle
 */
DynRect.prototype.getHeight = function() {
	return this.height;
};
/**
 * returns the width of a rectangle
 */
DynRect.prototype.getWidth = function() {
	return this.width;
};
DynRect.prototype.isDynRect = true;
/**
 * sets the top of a rectangle
 */
DynRect.prototype.setTop = function(t) {
	this.ul.y = t;
};
/**
 * sets the bottom of a rectangle
 */
DynRect.prototype.setBottom = function(b) {
	this.ul.y = b - this.height;
};
/**
 * sets the left of a rectangle
 */
DynRect.prototype.setLeft = function(l) {
	this.ul.x = l;
};
/**
 * sets the right of a rectangle
 */
DynRect.prototype.setRight = function(r) {
	this.ul.x = r - this.width;
};
/**
 * sets the height of a rectangle
 */
DynRect.prototype.setHeight = function(h) {
	this.height = h;
};
/**
 * sets the width of a rectangle
 */
DynRect.prototype.setWidth = function(w) {
	this.width = w;
};
/**
 * sets the size of a rectangle by its witdh and height
 */
DynRect.prototype.setSize = function(width, height) {
	this.setWidth(width);
	this.setHeight(height);
};
/**
 * returns the upper left corner of a rectangle
 */
DynRect.prototype.getUpperLeftCorner = function() {
	return this.ul;
};
/**
 * returns the lower right corner of a rectangle
 */
DynRect.prototype.getLowerRightCorner = function() {
	return new DynPoint(
		this.ul.getX() + this.getWidth(),
		this.ul.getY() + this.getHeight());
};
/**
 * returns the upper right corner of a rectangle
 */
DynRect.prototype.getUpperRightCorner = function() {
	return new DynPoint(
		this.ul.getX() + this.getWidth(),
		this.ul.getY()
	);
};
/**
 * returns the lower left corner of a rectangle
 */
DynRect.prototype.getLowerLeftCorner = function() {
	return new DynPoint(
		this.ul.getX(),
		this.ul.getY() + this.getHeight()
	);
};
/**
 * returns the center of rectangle
 */
DynRect.prototype.getCenter = function() {
	return new DynPoint(
		this.ul.x + this.width / 2,
		this.ul.y + this.height / 2);
};
/**
 * sets the center of a rectangle
 */
DynRect.prototype.setCenter = function(x, y) {
	if (typeof(x) == 'object'&& x instanceof DynPoint) {
		this.moveTo(x.x - this.width / 2, x.y - this.height / 2);
	} else {
		this.moveTo(x - this.width / 2, y - this.height / 2);
	}
};
/**
 * verifies if a point is in a rectangle
 */
DynRect.prototype.isWithinRect = function(pt, rect) {
	if (!rect)
		rect = this;
	if (pt.getClassName()=="DynPoint" && rect.getClassName()=="DynRect") {
		return pt.getX() >= rect.getLeft()
			&& pt.getX() <= rect.getRight()
			&& pt.getY() >= rect.getTop()
			&& pt.getY() <= rect.getBottom();
	}
	return false;
};
/**
 * verifies if a rectangle is above this rectangle
 */
DynRect.prototype.isAbove = function(rect) {
	//tests whether this rect is above rect
	if (rect.isWithinRect(this.getUpperLeftCorner())) return true;
	if (rect.isWithinRect(this.getLowerRightCorner())) return true;
	if (rect.isWithinRect(this.getLowerLeftCorner())) return true;
	if (rect.isWithinRect(this.getUpperRightCorner())) return true;

	return false;
};
/**
 * returns the area value of a rectangle
 */
DynRect.prototype.getAreaValue = function(rect) {
	if (!rect || !(rect instanceof DynRect))
		rect = this;
	return rect.getHeight() * rect.getWidth();
};
/**
 * returns the coordinates of a rectangle
 */
DynRect.prototype.join = function(delim) {
	delim = delim || ",";
	return this.getUpperLeftCorner().join(delim)
		+ delim
		+ this.getLowerRightCorner().join(delim);
};
/**
 * returns a copy of a rectangle
 */
DynRect.prototype.copy = function() {
	return new DynRect(this.getLeft(),this.getTop(),this.getWidth(),this.getHeight());
};

/**
 * DynPath - a path of points class
 */
DynPath = function() {
	//Either Argument[0] is an Array of DynPoints
	//or each Argument is a DynPoint
	this.coords = new Array();
	if (typeof(arguments[0]) == "object" && arguments[0].length != null) {
		//Argument[0] is an Array of DynPoints
		for (var i = 0; i < arguments[0].length; i++) {		
			this.coords[this.coords.length++] = arguments[0][i];
		}
	} else {
		for (var i = 0; i > arguments.length; i++) {			
			this.coords[this.coords.length++] = arguments[i];
		}
	}
	this.length = this.coords.length;
};
/**
 * returns the class name
 */
DynPath.prototype.getClassName = function() {
	return "DynPath";
};
/**
 * deletes this path
 */
DynPath.prototype.destroy = function() {
	delete this.coords;
};
/**
 * returns the lenght of a path (not the number of points in it)
 */
DynPath.prototype.getLength =	function(start,end) {
	//This is NOT the length of the coords Array, it's the whole Distance
	var s = !start ? 0 : start;
	var e = !end ? this.coords.length - 1 : end;
	var t = 0;
	for (var i = s; i < e; i++)
		t += this.coords[i].distanceTo(this.coords[i + 1]).getLength();
	return t;
};
/**
 * calculates the area which is surrounded by all points
 */
DynPath.prototype.getArea =	function(start,end) {
		// Calculates the area which is surrounded by all Points
	var s = !start ? 0 : start;
	var e = !end ? this.coords.length : end;
	var flaeche = 0;
	for (var i = s; i < e; i++) {
		flaeche =	flaeche
				+ (this.coords[i].getX().round()
					- this.coords[(i + 1) % e].getX().round())
					* (this.coords[i].getY().round()
						+ this.coords[(i + 1) % e].getY().round())
					/ 2;
	}
	if (flaeche < 0)
		flaeche = (-1) * flaeche;
	return flaeche;
};
/**
 * returns the number of points in a path
 */
DynPath.prototype.getCoordsLength = function() {
	return this.coords.length;
};
/**
 * returns the points in a path
 */
DynPath.prototype.getCoords = function(num) {
	return num == null ? this.coords : this.coords[num];
};
/**
 * adds a point to path at a given position
 */
DynPath.prototype.add = function(point, pos) {
	pos = pos||null;
	if (pos==null || pos>this.coords.length) {		
		this.coords[this.coords.length++] = point;
	} else {
		try {
			for (var i = this.coords.length; i >= pos; i++) {
				this.coords[i + 1] = this.coords[i];
			}
			this.coords[pos] = point;
		} catch (ex) {
			//NADA
		}
	}
	this.length = this.coords.length;
};
/**
 * removes a point from a path
 */
DynPath.prototype.remove = function(num) {
	if (num != null && num >= 0 && num < this.coords.length) {
		removeFromArray(this.coords, num);
	} else {
		this.coords.pop();
	}
	this.length = this.coords.length;
};
/**
 * removes the first point from a path
 */
DynPath.prototype.removeFirst = function() {
	removeFromArray(this.coords,0);
	this.length = this.coords.length;
};
/**
 * removes the last point fram a path
 */
DynPath.prototype.removeLast = function() {
	this.remove();
};
/**
 * removes all points from a path
 */
DynPath.prototype.removeAll = function() {
	while (this.coords.length>0) this.coords.pop();
	this.length = 0;
};
/**
 * replaces a point in a path
 */
DynPath.prototype.replace = function(point, num) {
	this.coords[num] = point;
};
/**
 * returns a subpath from a path
 */
DynPath.prototype.subpath = function(start, end) {
	return new DynPath(this.coords.slice(start, end));
};
/**
 * returns the last point from a path
 */
DynPath.prototype.lastPoint = function() {
	return this.coords.length > 0 ? this.coords[this.coords.length - 1] : null;
};
/**
 * returns the first point from a path
 */
DynPath.prototype.firstPoint = function() {
	return this.coords.length > 0 ? this.coords[0] : null;
};
/**
 * joins two paths
 */
DynPath.prototype.join = function(c,d) {
	d = d||c||",";
	var re = new Array();
	for (var i = 0; i < this.coords.length; i++) {
		try {			
			re[re.length++] = this.coords[i].join(c);
		} catch (ex) {
			re[re.length++] = this.coords[i];
		}
	}
	return re.join(d);
};
/**
 * returns the string value of a path
 */
DynPath.prototype.toString = function() {
	return this.join(",");
};