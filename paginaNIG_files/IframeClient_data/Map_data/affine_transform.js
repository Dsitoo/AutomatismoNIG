/** 
 * AffineTransform - represents a 2D affine transform, ie a transform which maps
 * straight lines to straight lines and parallel lines to parallel lines. Typically
 * used to convert between the display coordinate system (eg lat/long or British
 * National Grid) and pixel space on the map.
 */
 

/**
 * Make an affine transform from the standard representation as
 * 2x2 matrix + translation
 * a, b, c, d are the matrix components
 * r, s the translation vector     
 */  
function AffineTransform(a, b, c, d, r, s) {
    this.a = Number(a); this.b = Number(b); 
    this.c = Number(c); this.d = Number(d);
    this.r = Number(r); this.s = Number(s);
	return this;
}

// ************* Class methods ***********************************************************************

/**
 * Returns a new identity matrix
 */
AffineTransform.identity = function() {
    return new AffineTransform(1, 0, 0, 1, 0, 0);
};

/**
 * Nominal radius of the earth in mm
 */
AffineTransform.NOMINAL_EARTH_RADIUS_MM = 6378137000.0;

/**
 * Conversion factor from degrees to mm. Used to calculate lengths
 * when using degree-based coordinate systems.
 */
AffineTransform.DEG_TO_MM_FACTOR = 2 * Math.PI * AffineTransform.NOMINAL_EARTH_RADIUS_MM / 360;    


/** 
 * Returns a new transform which maps pixel space to 
 * current display coordinate system in the units used by that CS.
 *   pixelDim - DynPoint giving dimensions of window in pixels
 *   scale - the internal map scale (ie what the map service returns * pixel_size)
 *   csCentre - the centre of the map in current display coordinate system coords
 *   rotationInDegrees - the map rotation in _degrees_
 *   unitName - name of unit used by current display coordinate system
 * Assumes pixel space origin is top-left, display CS origin is bottom-left
 */
AffineTransform.newPixelToCS = function(pixelDim, scale, csCentre, rotationInDegrees, unitName) {
    
    scale /= this.getUnitFactor(unitName);

    var t = this.identity().
                 translate(-pixelDim.x/2, -pixelDim.y/2).         // put centre at origin
                 reflectX().                                      // flip for different y directions
                 rotate(2 * Math.PI * rotationInDegrees /360).    // rotate to final rotation
                 scale(scale).                                    // scale to final scale
                 translate(csCentre.x, csCentre.y);               // move to display CS centre
   
    return t;
};

/**
 * Used to supply length unit names & conversion factors from SIAS unit service
 * UNITS is an object/hashtable with 
 *   key = internal name of unit
 *   value = object {short: <short human-readable unit name>, 
 *                   factor: how many mm in 1 of these units
 *   fullname: <long human-readable unit name>}
 */
AffineTransform.setUnits = function(units) {
    
    // Add in degrees if not present
    if (!units.degree) {
        // FIXME need to localise fullname
		units.degree = {short: "°", factor: this.DEG_TO_MM_FACTOR,  fullname: "Degrees"};
    }
	AffineTransform._units = units;
};

/**
 * Returns information (short name, unit to mm factor, full name) for
 * the unit UNITNAME
 */
AffineTransform.getUnit = function(unitName) {
	return AffineTransform._units[unitName];
};

/**
 * Helper method for units that are not in the units Array (or if no units are available)
 */
AffineTransform.getUnitFactor = function(unitName) {
	try {
		return AffineTransform._units[unitName].factor;
	} catch (e) {
		return 1.0;
	}
};

// ************* Instance methods ***********************************************************************

/**
 * Return a new coordinate which is the result of transform COORD using THIS
 */
AffineTransform.prototype.transformPoint = function(coord) {
    var x = coord.x;
    var y = coord.y;
    var newX = this.a * x + this.b * y + this.r;
    var newY = this.c * x + this.d * y + this.s;
    return new DynPoint(newX, newY);
};

/**
 * Transform each element of an array of coordinates COORDS using THIS
 */
AffineTransform.prototype.transformPoints = function(coords) {

    var result = [];
    for (var i = 0; i < coords.length; i++) {
        result.push(this.transformPoint(coords[i]));
    }
    return result;
};


/**
 * Returns the combined transform which is the effect of performing
 * THIS then OTHER
 */    
AffineTransform.prototype.multiply = function(other) {
    // Suppose this = Ax + r, other = Bx + s
    // then this.multiply(other) = (BA)x + (Br + s)
    return new AffineTransform( other.a * this.a + other.b * this.c,
                                other.a * this.b + other.b * this.d,
                                other.c * this.a + other.d * this.c,
                                other.c * this.b + other.d * this.d,
                                other.a * this.r + other.b * this.s + other.r,
                                other.c * this.r + other.d * this.s + other.s );
};
      
/**
 * Return the inverse transform to this.
 * No error checking for zero determinant as that won't arise in 
 * the uses we make of tranforms.
 */     
AffineTransform.prototype.inverse = function() {
    var det =  this.a * this.d - this.b * this.c;
    
    return new AffineTransform(  this.d / det, -this.b / det,
                                -this.c / det,  this.a / det,
                               (-this.d * this.r + this.b * this.s) / det,
                               ( this.c * this.r - this.a * this.s) / det );
};


/**
 * Return a new transform which corresponds to performing THIS followed
 * by a translation (x, y)
 */
AffineTransform.prototype.translate = function(x, y) {
    return new AffineTransform(this.a, this.b, this.c, this.d, 
                               this.r + x,
                               this.s + y);
};

/** 
 * Return a new transform which corresponds to performing THIS followed
 * by a reflection in the X axis
 */
AffineTransform.prototype.reflectX = function() {
    return this.multiply(new AffineTransform(1, 0, 0, -1, 0, 0));
};

/**
 * Return a new transform which corresponds to performing THIS followed
 * by a rotation round the origin of angleInRadians radians
 */
AffineTransform.prototype.rotate = function(angleInRadians) {
    var cos = Math.cos(angleInRadians);
    var sin = Math.sin(angleInRadians);    
    return this.multiply(new AffineTransform(cos, -sin,
                                             sin,  cos,
                                             0,    0));
};

/** 
 * Return a new transform which corresponds to performing THIS followed
 * by uniform scaling from the origin of FACTOR
 */
AffineTransform.prototype.scale = function(factor) {
    return this.multiply(new AffineTransform(factor, 0, 0, factor, 0, 0));
};

/** 
 * Return the scale factor of THIS transform.
 */
AffineTransform.prototype.scaleFactor = function(factor) {
    
    // scaling factor is the square root of the determinant
    var det =  this.a * this.d - this.b * this.c; 
    return Math.sqrt(Math.abs(det));
};


// ************ Silverlight ********************************************************************


/**
 * Returns a new AffineTransform initialised from the Silverlight 
 * transform object SLTRANS
 */
 AffineTransform.newFromSLTransform = function(slTrans) {
 
    // See applyToSLTransform for why M21 and M12 are "flipped".
 
    return new AffineTransform(slTrans.M11,     slTrans.M21, 
                               slTrans.M12,     slTrans.M22, 
                               slTrans.OffsetX, slTrans.OffsetY);
 }

/**
 * Applies to THIS to the Silverlight transform object SLTRANS.
 */
AffineTransform.prototype.applyToSLTransform = function(slTrans) {

    // AffineTransform is column-major (ie vectors are column vectors, 
    // multiplied with matrix on the left). Silverlight matrices are row-major 
    // (ie vectors are row vectors, multiplied with matrix on the right). 
    // This is why their M12 gets our c component and their M21 gets our b 
    // transform, opposite to what you might expect.

    slTrans.M11 = this.a;
    slTrans.M12 = this.c; 
    slTrans.M21 = this.b;
    slTrans.M22 = this.d;
    slTrans.offsetX = this.r;
    slTrans.offsetY = this.s;
}

AffineTransform.prototype.isIdentity = function() {
    var identity = this.isMatrixEqual([1, 0, 0, 1, 0, 0]);
    return identity;
}

AffineTransform.prototype.isMatrixEqual = function(matrixValues) {
        // Checks if Affine Transform's and matrixValues are identical.
        // Returns true if they are identical, false otherwise.
        var actualMatrix = [this.a, this.b, this.c, this.d, this.r, this.s];
       
        for( var i=0; i<6; i++) {
            if(! this.isFloatEqual( matrixValues[i], actualMatrix[i] ) ) {
                return false;
            }
        }
        return true;       
}    
    
AffineTransform.prototype.isFloatEqual = function(floatFirst, floatSecond) {        
        // Checks that floats of the two values are within 1e-6 of each other        
        if (Math.abs(floatFirst - floatSecond) > 1e-6) {
            return false;
        }
        return true;
}

// ************* Other ***********************************************************************

/** 
 * Returns the distance between coords POINT1 and POINT2. Point 
 * coordinates are in SOURCEUNITS (a string like "mm", "degree" etc), 
 * distance is returned in TARGETUNITS.
 */
function unitDistanceBetween(point1, point2, sourceUnits, targetUnits) {
	var srcDist = point1.distanceTo(point2).getLength();
	var sourceToMMFactor = AffineTransform.getUnitFactor(sourceUnits);
	var targetToMMFactor = AffineTransform.getUnitFactor(targetUnits);
	return srcDist * sourceToMMFactor / targetToMMFactor;
}

/** 
 * Converts coord POINT (in units SOURCEUNITS) to TARGETUNITS.
 */
function unitConvertPoint(point, sourceUnits, targetUnits) {
    if (sourceUnits == "degree" || targetUnits == "degree") {
    	throw "Can't convert to/from degree coordinates";
    }
	var sourceToMMFactor = AffineTransform.getUnitFactor(sourceUnits);
	var targetToMMFactor = AffineTransform.getUnitFactor(targetUnits);
	var factor = sourceToMMFactor / targetToMMFactor;
	return new DynPoint(point.getX() * factor, point.getY() * factor);
}

