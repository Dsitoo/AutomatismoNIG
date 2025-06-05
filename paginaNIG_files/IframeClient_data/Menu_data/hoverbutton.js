function hoverButton_down(clientId) {
	root.getObject(clientId+"hoverButton").mouseDown();
}

function hoverButton_up(clientId) {
	root.getObject(clientId+"hoverButton").mouseUp();
}

function hoverButton_over(clientId) {
	root.getObject(clientId+"hoverButton").mouseOver();
}

function hoverButton_out(clientId) {
	root.getObject(clientId+"hoverButton").mouseOut();
}

function initHoverButton(clientId, styleClass, checked, disabled, image, hoverImage, checkedImage, disabledImage) {
	var button = new HoverButton(clientId);
	button.styleClass = styleClass;
	button.checked = checked;
	button.disabled = disabled;
	button.image = image;
	button.hoverImage = hoverImage;
	button.checkedImage = checkedImage;
	button.disabledImage = disabledImage;
	button.refresh();
	root.registerObject(button);
}

HoverButton = function(clientId) {
	this.id = clientId + "hoverButton";
	this.button = document.getElementById(clientId);
};

HoverButton.prototype = {
	button : null,
	
	styleClass : "",
	
	checked : false,
	
	disabled : false,
	
	image : null,
	
	hoverImage : null,
	
	checkedImage : null,
	
	disabledImage : null,
	/**
	 * handles  the mouse down action of a hoverbutton
	 */
	mouseDown : function() {
		if (!this.disabled) {
			this.button.className = this.styleClass + HOVER_BUTTON_PRESSED;
		}
	},
	/**
	 * handles  the mouse up action of a hoverbutton
	 */
	mouseUp : function() {
		if (!this.disabled) {
			if (this.checked) {
				this.button.className = this.styleClass + HOVER_BUTTON_CHECKED_HOVER;
				if (this.checkedImage != null) {
					this.button.src = this.checkedImage;
				} else if (this.hoverImage != null) {
					this.button.src = this.hoverImage;
				} else if (this.image != null) {
					this.button.src = this.image;
				}
			} else {
				this.button.className = this.styleClass + HOVER_BUTTON_HOVER;
				if (this.hoverImage != null) {
					this.button.src = this.hoverImage;
				} else if (this.image != null) {
					this.button.src = this.image;
				}
			}
		}
	},
	/**
	 * handles  the mouse over action of a hoverbutton
	 */
	mouseOver : function() {
		this.mouseUp();
	},
	/**
	 * handles  the mouse out action of a hoverbutton
	 */
	mouseOut : function() {
		if (!this.disabled) {
			if (this.checked) {
				this.button.className = this.styleClass + HOVER_BUTTON_CHECKED;
				if (this.checkedImage != null) {
					this.button.src = this.checkedImage;
				} else if (this.image != null) {
					this.button.src = this.image;
				}
			} else {
				this.button.className = this.styleClass;
				if (this.image != null) {
					this.button.src = this.image;
				}
			}
		}
	},
	/**
	 * refreshes a hoverbutton
	 */
	refresh : function() {
		this.button.disabled = this.disabled;
		if (this.disabled) {
			this.button.className = this.styleClass + HOVER_BUTTON_DISABLED;
			if (this.disabledImage != null) {
				this.button.src = this.disabledImage;
			} else if (this.image != null) {
				this.button.src = this.image;
			} else {
				this.button.src = "";
			}
		} else if (this.checked) {
			this.button.className = this.styleClass + HOVER_BUTTON_CHECKED;
			if (this.checkedImage != null) {
				this.button.src = this.checkedImage;
			} else if (this.image != null) {
				this.button.src = this.image;
			} else {
				this.button.src = "";
			}
		} else {
			this.button.className = this.styleClass;
			if (this.image != null) {
				this.button.src = this.image;
			} else {
				this.button.src = "";
			}
		}
	}
}