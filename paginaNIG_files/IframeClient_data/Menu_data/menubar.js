/**
 * The MenuBar.
 */

MenuBar = function(id, autoPopUp) {
	this.id = id||null;           // Components id
	this.layer = document.getElementById(this.id+"menubar");
	root.registerObject(this);
	this.expanded = false;  // If a submenu is opened
	this.activeMenu = null; // The oldMenu, set by the mouseOut of its item
	this.items = new Array();        // Array of all menuitems, including separator
	this.autoPopUp = autoPopUp != false;
	this.menuForm = document.getElementById(this.id + "form");
	this.actionField = document.getElementById(this.id + "actionId");
	this.submitButton = document.getElementById(this.id + "submit");

	return this;
};

MenuBar.prototype = {
	/**
	 * Adds a menu to a menuBar.
	 */
	addMenu : function(id, label, title, image, disabled, mnemonic) {
		menu = new Menu(id, label, title, image, disabled, mnemonic);
		this.items.push(menu);
		menu.setRoot(this);
		menu.setAbsoluteRoot(this);
		return menu;
	},
	/**
	 * Adds a separator to a menuBar.
	 */
	addSeparator : function() {
		separator = new MenuSeparator();
		this.items.push(separator);
		return separator;
	},
	/**
	 * Closes a menu.
	 */
	closeMenu : function(menu) {
		if (this.activeMenu == menu) {
			this.activeMenu == null;
		}
		menu.hide();
	},
	/**
	 * Collapses a menu.
	 */
	collapse : function() {
		if (this.expanded) {
			this.expanded = false;
			try {
				this.activeMenu.collapse();
			} catch(ex) {
			}
			this.activeMenu = null;
		}
	},
	/**
	 * Returns the absolute root of a menuBar in this case always itself.
	 */
	getAbsoluteRoot : function() {
		return this;
	},
	/**
	 * Returns the root of a menuBar in this case always itself.
	 */
	getRoot : function() {
		return this;
	},
	/**
	 * Returns the level within a menuBar.
	 */
	getLevel : function() {
		return 0;
	},
	/**
	 * Indicates whether this is auto pop up.
	 */
	isAutoPopUp : function() {
		return this.bAutoPopUp;
	},
	/**
	 * Indicates whether this is a menuBar.
	 */
	isMenuBar : true,
	/**
	 * Opens a menu.
	 */
	openMenu : function(menu) {
		if (menu && !menu.opened && !menu.isDisabled()) {
			if (this.activeMenu != null) {
				this.activeMenu.collapse();
			}
			this.activeMenu = menu;
			this.expanded = true;
			root.markToCollapse(this);
			menu.show();
		}
	},
	/**
	 * Repaints the menuBar.
	 */
	repaint : function() {				
		var content = new Array();
		// so this is hardcoded xpclasic style
		//if (img_menubar_background == true) {
			
		// BEGIN OTHERS BROWSERS SUPPORT 
			//content.push("<div style='position:absolute; width: 100%; height: 100%;'");
			content.push("<div style='position:absolute; width: 100%; height: 25px;'");
			
			// handle collapse for click beside the menu on the menubar
			content.push(" onmousedown='root.collapse();'");
			
			content.push(">");			
			content.push("<img src='modules/menu/themes/"+THEME_PATH+"/menubar_background.gif' style='width:100%; height:100%; border:0px'>");
			content.push("</div>");
			content.push("<div style='position:absolute; width: 100%; height: 25px; z-index:1;' onmousedown='root.collapse();'>");		
		//}
		 // END OTHERS BROWSERS SUPPORT 
		
		content.push("<table class='menubar' cellpadding='0' cellspacing='0'><tr>");
		for (i=0; i<this.items.length; i++) {
			var item = this.items[i];			
			if (!item.isSeparator) {				
				content.push("<td");
				content.push(" id='td_"+item.id+"'");				
				if (item.isDisabled()) {
					content.push(" class='menudisabled'");
				} else {
					content.push(" class='menunormal'");
				}				
				if (item.isMenu || item.isMenuItem) {
					content.push(item.getTitle()==null?"":" title='"+item.getTitle()+"'");
					content.push(" onMouseOver='return root.getObject(\""+item.id+"\").mouseOver(event)'");
					content.push(" onMouseOut='return root.getObject(\""+item.id+"\").mouseOut(event)'");
					content.push(" onMouseDown='return root.getObject(\""+item.id+"\").mouseDown(event)'");
					content.push(" onMouseUp='return root.getObject(\""+item.id+"\").mouseUp(event)'");
				}
				content.push(">&nbsp;");
				if (item.getLabel) {
					content.push(item.getLabel());
				}
				content.push("&nbsp;</td>");				
			} else {
				content.push("<td class='menubarseparator'>");
				content.push("<img class='separator' src='themes/blind.gif' style='width:1px; height:1px; border:0px;'>");
				content.push("</td>");
			}
		}
		content.push("</tr></table>");		
		
		// close the background div hardcoded
		//if (img_menubar_background == true) {
			content.push("</div>");
		//}		
	
		setHTML(this.layer, content.join(''));
	},
	/**
	 * Sets the autopopup state.
	 */
	setAutoPopUp : function(bAutoPopUp) {
		this.autoPopUp = bAutoPopUp != false;
	},
	/**
	 * Submits this menuBar.
	 */
	submit : function(clientId) {
		this.actionField.value = clientId;
		this.submitButton.click();
	},
	/**
	 * Removes this menuBar.
	 */
	unload : function() {
		while(this.items.length>0){
			var item = this.items[this.items.length-1];
			this.items.pop();
			if (!item.isSeparator) {
				item.unload();
			}
			delete item;
		}
		delete this.items;
	}
}

/**
 * The Menu     
 */
Menu = function(id, label, title, image, disabled, mnemonic) {
	this.id = id;           // Components id
	root.registerObject(this);

	this.expanded = false;  // If a submenu is opened
	this.activeMenu = null; // The oldMenu, set by the mouseOut of its item
	this.items = new Array();        // Array of all menuitems, including separator
	this.label = label||"";
	this.title = title||null;
	this.disabled = disabled == true;
	this.root = null;
	this.absoluteRoot = null;
	this.image = image||null;
	this.opened = false;
	 
	return this;
}

Menu.prototype = {
	/**
	 * Adds a menu to a menu.
	 */
	addMenu : function(id, label, title, image, disabled, mnemonic) {
		menu = new Menu(id, label, title, image, disabled, mnemonic);
		this.items.push(menu);
		menu.setRoot(this);
		menu.setAbsoluteRoot(this.getAbsoluteRoot());
		return menu;
	},
	/**
	 * Adds a menu item to a menu.
	 */
	addMenuItem: function(id, label, title, image, disabledImage, disabled, mnemonic, checked, onsubmit, hasAction) {
		menuItem = new MenuItem(id, label, title, image, disabledImage, disabled, mnemonic, checked);
		this.items.push(menuItem);
		menuItem.onsubmit = onsubmit;
		menuItem.setRoot(this);
		menuItem.setAbsoluteRoot(this.getAbsoluteRoot());
		// "hasAction" is a new and optional argument, introduced in version SIAS 4.2.
		// Therefore check if that argument is present.
		// hasAction indicates whether an action method binding has been defined for the menu item.
		if(typeof hasAction == "boolean") {
			menuItem.hasAction = hasAction;
		}
		return menuItem;
	},
	/**
	 * Adds a separator to a menu.
	 */
	addSeparator : function() {
		separator = new MenuSeparator();
		this.items.push(separator);
		return separator;
	},
	/**
	 * Closes a menu.
	 */
	closeMenu : function(menu) {
		if (this.activeMenu == menu) {
			this.activeMenu == null;
		}
		menu.hide();
	},
	/**
	 * Collapses a menu.
	 */
	collapse : function() {
		if (this.expanded) {
			this.expanded = false;
			try {
				this.activeMenu.collapse();
			} catch(ex) {
			}
			this.activeMenu = null;
		}
		this.opened = false;
		setClassNode(root.getElementById("tr_"+this.id)||document.getElementById("td_"+this.id), "menunormal");
	},
	/**
	 * Collapses a submenu.
	 */
	collapseSubMenu : function() {
		if (this.expanded) {
			this.expanded = false;
			try {
				this.activeMenu.collapse();
			} catch(ex) {
			}
			this.activeMenu = null;
		}		
		this.opened = false;
		setClassNode(root.getElementById("tr_"+this.id)||document.getElementById("td_"+this.id), "menuclicked");	
		if (this.isMenu) {
			this.getRoot().openMenu(this);
		} 
	},
	/**
	 * Returns the absolute root of this menu.
	 */
	getAbsoluteRoot : function() {
		return this.absoluteRoot;
	},
	/**
	 * Returns the content of a menu.
	 */
	getContent : function() {
		var content = new Array();
		content.push("<table id='table_"+this.id+"' cellpadding='0' cellspacing='0' class='menuitem'>");
		for (i=0; i<this.items.length; i++) {
			var item = this.items[i];
			content.push("<tr id=tr_"+item.id);
			if (item.isMenu || item.isMenuItem) {
				if (item.isDisabled()) {
					content.push(" class='menudisabled'");
				} else {
					content.push(" class='menunormal'");
				}
			} else {
				content.push(" class='menuseperator'");
			}
			if (item.isMenu || item.isMenuItem) {
				content.push(" onmouseover='return root.getObject(\""+item.id+"\").mouseOver(event)'");
				content.push(" onmouseout='return root.getObject(\""+item.id+"\").mouseOut(event)'");
				content.push(" onmousedown='return root.getObject(\""+item.id+"\").mouseDown(event)'");
				content.push(" onmouseup='return root.getObject(\""+item.id+"\").mouseUp(event)'");
			}
			content.push(">");
			if (item.isMenu || item.isMenuItem) {
				content.push("<td class='menuitem_left'>");
				if (item.isMenuItem) {
					content.push("<img id='img_"+item.id+"'");
					if (item.getImage() == null) {
						if (item.isChecked()) {
							if (item.isDisabled()) {
								content.push(" src='modules/menu/themes/"+THEME_PATH+"/checked_dis.gif'");
							} else {
								content.push(" src='modules/menu/themes/"+THEME_PATH+"/checked.gif'");
							}
						} else {
							content.push(" src='themes/blind.gif'");
						}
					} else {
						image = item.getImage();
						imgPath = image.substring(0,image.lastIndexOf("."));
						imgPostFix = item.getImage().substring(image.lastIndexOf(".")+1, image.length);
						if (item.isChecked()) {
							if (item.isDisabled()) {
								content.push(" src='"+imgPath+"_chk_dis."+imgPostFix+"'");
							} else {
								content.push(" src='"+imgPath+"_chk."+imgPostFix+"'");
							}
							content.push(" class='menuchecked'");
						} else {
							if (item.isDisabled()) {
								content.push(" src='"+imgPath+"_dis."+imgPostFix+"'");
							} else {
								content.push(" src='"+imgPath+"."+imgPostFix+"'");
							}
							content.push(" class='menuunchecked'");
						}
					}
					content.push(">");
				} else if (item.isMenu) {
					content.push("<img src='themes/blind.gif' class='menuunchecked'>");
				}
				content.push("</td>");
				content.push("<td class='menuitem_center' "+(item.getTitle()==null?"":"title='"+item.getTitle()+"'")+" style='white-space: nowrap;'>");
				content.push(item.getLabel());
				content.push("</td>");
				content.push("<td class='menuitem_right'>");
				if (item.isMenu) {
					content.push("<img style='right:0px; width:5px; height:9px;' src='modules/menu/themes/"+THEME_PATH+"/arrowright.gif'>");
				} else {
					content.push("&nbsp;");
				}
				content.push("</td>");
			} else {
				content.push("<td class='menuitem_left'></td><td colspan='2' style='height:0px;'><div class='menu_seperator'><img src='themes/blind.gif' style='width:1px;height:1px;'></div></td>");
			}
			content.push("</tr>");
		}
		content.push("</table>");
		return content.join('');
	},
	/**
	 * Returns a image for a menu.
	 */
	getImage : function() {
		return this.image;	
	},
	/**
	 * Returns a label for a menu.
	 */
	getLabel : function() {
		return this.label;
	},
	/**
	 * Returns the level of a menu in a menuconstruct.
	 */
	getLevel : function()  {
		return this.getRoot().getLevel() + 1;
	},
	/**
	 * Returns the root of a menu.
	 */
	getRoot : function() {
		return this.root;
	},
	/**
	 * Returns the title (tooltip) for a menu.
	 */
	getTitle : function() {
		return this.title;
	},
	/**
	 * Hides a menu
	 */
	hide : function() {
		this.collapse();
		this.opened = false;
	},
	/**
	 * Indicates whether this is autopopup.
	 */
	isAutoPopUp : function() {
		return this.getAbsoluteRoot().isAutoPopUp();
	},
	/**
	 * Indicates whether this is disabled.
	 */
	isDisabled : function() {
		return this.disabled;
	},
	/**
	 * is menu?
	 */
	isMenu : true,
	/**
	 * Handles the mouseDown action in a menu.
	 */
	mouseDown : function(evnt) {	
		var e = evnt||window.event; //getEvent(evnt);
		e.cancelBubble = true;
		if (!this.isDisabled()) {
			if (this.opened) {
				if (this.getRoot() == this.getAbsoluteRoot()) {
					root.collapse();
				}
			} else {
				this.getRoot().openMenu(this);
			}
			setClassNode(root.getElementById("tr_"+this.id)||document.getElementById("td_"+this.id), "menuclicked");
		}
	},
	/**
	 * Handles the mouseOut action in a menu.
	 */
	mouseOut : function(evnt) {
		var e = evnt||window.event; //getEvent(evnt);
        try {
    		e.cancelBubble = true;
        } catch(ex) {}
		if (!this.isDisabled()) {
			if (this.opened) {
				setClassNode(root.getElementById("tr_"+this.id)||document.getElementById("td_"+this.id), "menuclicked");
			} else {
				setClassNode(root.getElementById("tr_"+this.id)||document.getElementById("td_"+this.id), "menunormal");
			}									
		}
	},
	/**
	 * Handles the mouseOver action in a menu.
	 */
	mouseOver : function(evnt) {
		var e = evnt||window.event; //getEvent(evnt);
		e.cancelBubble = true;
        if (this.getRoot().activeItem != null && this.getRoot().activeItem.mouseOut) {
            this.getRoot().activeItem.mouseOut();
        }
        this.getRoot().activeItem = this;
		if (!this.isDisabled()) {
			if ((this.getRoot().isMenu || (this.getRoot().isMenuBar && this.getRoot().activeMenu!=null)) /*&& this.isAutoPopUp()*/) {
				this.getRoot().openMenu(this);
				setClassNode(root.getElementById("tr_"+this.id)||document.getElementById("td_"+this.id), "menuclicked");
				setClassNode(root.getElementById("tr_"+this.getRoot().id)||document.getElementById("td_"+this.getRoot().id), "menuclicked");				
			} else {
				setClassNode(root.getElementById("tr_"+this.id)||document.getElementById("td_"+this.id), "menumouseover");				
			}
		}
	},
	/**
	 * Handles the mouseUp action in a menu.
	 */
	mouseUp : function(evnt) {
		var e = evnt||window.event; //getEvent(evnt);
		e.cancelBubble = true;
		if (!this.isDisabled()) {
			setClassNode(root.getElementById("tr_"+this.id)||document.getElementById("td_"+this.id), "menumouseover");
		}
	},
	/**
	 * Opens a menu.
	 */
	openMenu : function(menu) {
		if (menu && !menu.opened) {
			if (this.activeMenu != null) {
				this.activeMenu.collapse();
			}
			this.activeMenu = menu;
			this.expanded = true;
			root.markToCollapse(this);
			menu.show();
		}
	},
	/**
	 * Sets the absolute root of a menu.
	 */
	setAbsoluteRoot : function(absoluteRoot) {
		this.absoluteRoot = absoluteRoot;
		for (i=0; i<this.items.length; i++) {
			if (this.items[i].isMenu) {
				this.items[i].setAbsoluteRoot(this.absoluteRoot);
			}
		}	
	},
	/**
	 * Disables a menu.
	 */
	setDisabled : function(bDisabled) {
		bDisabled = bDisabled == true;
		if (this.disabled != bDisabled) {
			this.disabled = bDisabled;
			setClassNode(root.getElementById("tr_"+this.id)||document.getElementById("td_"+this.id), this.disabled?"menunormal":"menudisabled");
		}
	},
	/**
	 * Sets a image for a menu.
	 */
	setImage : function(image) {
		if (this.image != image) {
			this.image = image;
		}
	},	
	/**
	 * Sets a label for a menu.
	 */
	setLabel : function(label, bRepaint) {
		if (label && this.label!=label) {
			this.label = label;
			if (bRepaint != false && this.getRoot() == this.getAbsoluteRoot()) {
				this.getRoot().repaint();
			}
		}
	},
	/**
	 * Sets the root of a menu.
	 */
	setRoot : function(root) {
		this.root = root;
	},
	/**
	 * Sets the title (tooltip) for a menu.
	 */
	setTitle : function(title, bRepaint) {
		if (title && this.title!=title) {
			this.title = title;
			if (bRepaint != false && this.getRoot() == this.getAbsoluteRoot()) {
				this.getRoot().repaint();
			}
		}
	},
	/**
	 * Shows a menu.
	 */
	show : function() {
		var parentNode = root.getElementById("tr_"+this.id) || document.getElementById("td_"+this.id);
		var layer = root.getMenuLayer(this.getLevel());

		if (this.getRoot().isMenu) {
			//SubMenu Layer positioning
			var parentMenu = root.getElementById("menuLayer_"+this.getRoot().getLevel()) || document.getElementById("menuLayer_"+this.getRoot().getLevel());
			setXPos(layer, parentMenu.offsetLeft+parentNode.offsetWidth + 3);
			setYPos(layer, parentMenu.offsetTop+parentNode.offsetTop);
			setXPos(layer.iFrameLayer, parentMenu.offsetLeft+parentNode.offsetWidth + 3);
			setYPos(layer.iFrameLayer, parentMenu.offsetTop+parentNode.offsetTop);
		} else {
			//Topmost Menu Layer positioning
			setXPos(layer, getFrameX(false) + parentNode.offsetLeft + 2);
			setYPos(layer, getFrameY(false) + parentNode.offsetTop+parentNode.offsetHeight + 2);
			setXPos(layer.iFrameLayer, getFrameX(false) + parentNode.offsetLeft + 2);
			setYPos(layer.iFrameLayer, getFrameY(false) + parentNode.offsetTop+parentNode.offsetHeight + 2);
		}
		setHTML(layer, this.getContent());
		setWidth(layer.iFrameLayer, layer.offsetWidth);
		setHeight(layer.iFrameLayer, layer.offsetHeight);
		this.opened = true;
	},
	/**
	 * Removes a menu.
	 */
	unload : function() {
		root.menuObjects[this.id] = null;
		while(this.items.length>0){
			var item = this.items[this.items.length-1];
			this.items.pop();
			if (!item.isSeparator) {
				item.unload();
			}
			delete item;
		}
		delete this.items;
	}
}

/**
 * MenuItem
 */

MenuItem = function(id, label, title, image, disabledImage, disabled, mnemonic, checked, confirmText) {
	this.id = id;           // Components id
	root.registerObject(this);
  	this.label = label||null;
	this.title = title||null;
	this.disabled = disabled == true;
	this.root = null;
	this.absoluteRoot = null;
	this.image = image||null;
	this.disabledImage = disabledImage||null;
	this.checked = checked == true
	this.confirmText = confirmText||null;
	this.onsubmit = null;
	this.hasAction = true;
	return this;
};

MenuItem.prototype = {
	/**
	 * Returns the absolute root of a menuItem.
	 */
	getAbsoluteRoot : function() {
		return this.absoluteRoot;
	},
	/**
	 * Returns the disabledImage of a menuItem.
	 */
	getDisabledImage : function() {
		return this.disabledImage;
	},
	/**
	 * Returns the image of a menuItem.
	 */
	getImage : function() {
		return this.image;
	},
	/**
	 * Returns the label of a menuItem.
	 */
	getLabel : function() {
		return this.label;
	},
	/**
	 * Returns the root of a menuItem.
	 */
	getRoot : function() {
		return this.root;
	},
	/**
	 * Returns the title (tooltip) for a menuItem.
	 */
	getTitle : function() {
		return this.title;
	},
	/**
	 * Indicates whether the menu item is checked.
	 */
	isChecked : function() {
		return this.checked;
	},
	/**
	 * Indicates whether the menu item is disabled.
	 */
	isDisabled : function() {
		return this.disabled;
	},
	/**
	 * Sets the actionId for a menuItem.
	 */
	setActionId : function(actionId) {
		this.actionId = actionId;
	},
	/**
	 * Indicates whether this is a menuItem.
	 */
	isMenuItem : true,
	/**
	 * Handles the mouseDown action of a menuItem.
	 */
	mouseDown : function(evnt) {
		var e = evnt||window.event; //getEvent(evnt);
		e.cancelBubble = true;
		if (!this.isDisabled()) {
			setClassNode(root.getElementById("tr_"+this.id), "menuclicked");
		}
	},
	/**
	 * Handles the mouseOut action of a menuItem.
	 */
	mouseOut : function(evnt) {
		var e = evnt||window.event; //getEvent(evnt);
        try {
    		e.cancelBubble = true;
        } catch(ex) {}
		if (!this.isDisabled()) {
			setClassNode(root.getElementById("tr_"+this.id), "menunormal");
		}
	},
	/**
	 * Handles the mouseOver action of a menuItem.
	 */
	mouseOver : function(evnt) {
		var e = evnt||window.event; //getEvent(evnt);
		e.cancelBubble = true;
        if (this.getRoot().activeItem != null && this.getRoot().activeItem.mouseOut) {
            this.getRoot().activeItem.mouseOut();
        }
        this.getRoot().activeItem = this;
		if (this.getRoot().activeMenu != null) {
			this.getRoot().activeMenu.getRoot().collapseSubMenu();
			setClassNode(root.getElementById(
				"tr_"+this.getRoot().id)||
				document.getElementById("td_"+this.getRoot().id), 
				"menuclicked");						
		}		
		if (!this.isDisabled()) {
			setClassNode(root.getElementById("tr_"+this.id), "menumouseover");
		}
	},
	/**
	 * Handles the mouseUp action of a menuItem.
	 */
	mouseUp : function(evnt) {
		var e = evnt||window.event; //getEvent(evnt);
		e.cancelBubble = true;
		if (!this.isDisabled()) {
			setClassNode(root.getElementById("tr_"+this.id), "menumouseover");
			root.collapse();
			
			if(this.confirmText==null || confirm(this.confirmText)) {
				if(this.onsubmit != null){
					// If the menu item contains an onsubmit action then execute it
					eval(this.onsubmit);
				}
				// Do a submit, but only if an action method binding 
				// has been defined for the menu item.
				if (this.hasAction) {
				this.getAbsoluteRoot().submit(this.id);
			}
		}
		}
	},
	/**
	 * Sets the absolute root of a menuItem.
	 */
	setAbsoluteRoot : function(root) {
		this.absoluteRoot = root;
	},
	/**
	 * Sets the checked state of a menuItem.
	 */
	setChecked : function(bChecked) {
		bChecked = bChecked != false;
		if (this.checked != bChecked) {
			this.checked = bChecked;
			var img = document.getElementById("img_"+this.id);
			if (img != null) {
				setClassNode(img, this.checked?'menuchecked':'menuunchecked');
				if (this.checked) {
					img.src = this.getImage()==null?"modules/menu/themes/"+THEME_PATH+"/checked.gif":this.getImage();
				} else {
					img.src = this.getImage()==null?"themes/blind.gif":this.getImage();
				}
			}
		}
	},
	/**
	 * Sets the confirm text for a menuItem.
	 * @deprecated 
	 */
	setConfirmText : function(confirmText) {
		this.confirmText = confirmText;
	},
	/**
	 * Disables a menuItem.
	 */
	setDisabled : function(bDisabled) {
		bDisabled = bDisabled == true;
		if (this.disabled != bDisabled) {
			this.disabled = bDisabled;
			setClassNode(document.getElementById("td_"+this.id), this.disabled?"menunormal":"menudisabled");
			var img = document.getElementById("img_"+this.id);
			if (img != null && this.image!=null && this.diabledImage != null) {
				setClassNode(img, this.disabled?"menunormal":"menudisabled");
				if (this.disabled) {
					img.src = this.getDisabledImage();
				} else {
					img.src = this.getImage();
				}
			}
		}
	},
	/**
	 * Sets the image of a menuItem.
	 */
	setDisabledImage : function(image) {
		this.disabledImage = image;
	},	
	/**
	 * Sets the image of a menuItem.
	 */
	setImage : function(image) {
		this.image = image;
	},	
	/**
	 * Sets the label of a menuItem.
	 */
	setLabel : function(label, bRepaint) {
		this.label = label;
	},
	/**
	 * Sets the root of a menuItem.
	 */
	setRoot : function(root) {
		if (root) {
			this.root = root;
		}
	},
	/**
	 * Sets the title (tooltip) of a menuItem.
	 */
	setTitle : function(title, bRepaint) {
		this.title = title;
	},
	/**
	 * Removes a menuItem.
	 */
	unload : function() {
		if(this.id != null && root.menuObjects != null){
			root.menuObjects[this.id] = null;
		}
	}
};