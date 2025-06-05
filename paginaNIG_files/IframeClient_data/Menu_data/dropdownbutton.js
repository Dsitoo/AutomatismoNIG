DropDownButton = function(id) {
	this.id = id||null;           // Components id
	this.layer = document.getElementById(this.id+"layer");
	root.registerObject(this);
	
	this.button = document.getElementById(this.id+"button");
	this.input = document.getElementById(this.id+"input");
	this.buttonLayer = document.getElementById(this.id+"buttonlayer");
	this.image = document.getElementById(this.id+"img");
	this.clickLayer = document.getElementById(this.id+"clicklayer");

	this.expanded = false;  	// Indicates whether a sub-menu is opened
	this.activeMenu = null; 	// The oldMenu, set by the mouseOut of its item
	this.items = new Array();  // Array of all menuitems, including separator

	this.disabled = false;
	this.layer.disabled = false;
	this.checkedItem = null;
	
    this.isMenu = true;
    
	this.onsubmit = null;
	
	var img = null;
	if (this.disabled) {
		img = document.getElementById(this.id + "_img_dis");
	} else {
		img = document.getElementById(this.id + "_img");
	}
	if (img != null) {
		// mod BP 2010
		$(img).css({'display':"inline"});
		// end mod BP 2010
	}

	return this;
};

DropDownButton.prototype = {
    /**
     * Adds a menu to a dropDownButton.
     */
    addMenu : function(id, label, title, image, disabled, mnemonic) {
        menu = new Menu(id, label, title, image, disabled, mnemonic);
        this.items.push(menu);
        menu.setRoot(this);
        menu.setAbsoluteRoot(this);
        return menu;
    },
	/**
	 * Adds a menuItem to a dropDownButton.
	 */
	addMenuItem: function(id, label, title, image, disabledImage, disabled, mnemonic, checked, onsubmit, hasAction) {
		menuItem = new MenuItem(id, label, title, image, disabledImage, disabled, mnemonic, checked);
		if(checked){
			this.checkedItem = menuItem;
		}
		this.items.push(menuItem);
		menuItem.setRoot(this);
		menuItem.setAbsoluteRoot(this);
		menuItem.onsubmit = onsubmit;
		// "hasAction" is a new and optional argument, introduced in version SIAS 4.2.
		// Therefore check if that argument is present.
		if(typeof hasAction == "boolean") {
			menuItem.hasAction = hasAction;
		}
		return menuItem;
	},
	/**
	 * Adds a separator to a dropDownButton.
	 */
	addSeparator : function() {
		separator = new MenuSeparator();
		this.items.push(separator);
		return separator;
	},
	/**
	 * Checks a menuItem.
	 */
	checkItem : function(id) {
		if(this.checkedItem != null){
			this.checkedItem.setChecked(false);
		}
		for(var i=0; i<this.items.length; i++){
			if(this.items[i].id == id){
				this.checkedItem = this.items[i];
				this.checkedItem.setChecked(true);
				return;
			}
		}
	},
	/**
	 * Handles the click.
	 */
	click : function() {
		if(this.disabled){
			return;
		}
		if(this.onsubmit!=null){
			eval(this.onsubmit);
		}
		this.input.value = this.id;
		this.button.click();
	},
	/**
	 * Collapse a dropDownButton.
	 */
	collapse : function() {
		this.expanded = false;
		this.opened = false;
	},
    /**
     * Collapses a sub-menu.
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
	 * Returns the absolute root of a dropDownButton. in this case this.
	 */
	getAbsoluteRoot : function() {
		return this;
	},
	/**
	 * Returns the HTML content for a dropDownButton.
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
								content.push(" src='"+contextPath+"modules/menu/themes/"+THEME_PATH+"/checked_dis.gif'");
							} else {
								content.push(" src='"+contextPath+"modules/menu/themes/"+THEME_PATH+"/checked.gif'");
							}
						} else {
							content.push(" src='"+contextPath+"themes/blind.gif'");
						}
					} else {
						image = item.getImage();
						imgPath = image.substring(0,image.lastIndexOf("."));
						imgPostFix = item.getImage().substring(image.lastIndexOf(".")+1, image.length);
						if (item.isChecked()) {
							if (item.isDisabled()) {
								content.push(" src='"+contextPath+imgPath+"_chk_dis."+imgPostFix+"'");
							} else {
								content.push(" src='"+contextPath+imgPath+"_chk."+imgPostFix+"'");
							}
							content.push(" class='menuchecked'");
						} else {
							if (item.isDisabled()) {
								content.push(" src='"+contextPath+imgPath+"_dis."+imgPostFix+"'");
							} else {
								content.push(" src='"+contextPath+imgPath+"."+imgPostFix+"'");
							}
							content.push(" class='menuunchecked'");
						}
					}
					content.push(" title='" + item.getTitle() + "'");
					content.push(">");
				} else if (item.isMenu) {
					content.push("<img src='"+contextPath+"themes/blind.gif' class='menuunchecked' title='" + item.getTitle() + "'>");
				}
				content.push("</td>");
				content.push("<td class='menuitem_center' "+(item.getTitle()==null?"":"title='"+item.getTitle()+"'")+" style='white-space: nowrap;'>");
				// Set a not null label
				if (item.getLabel()!=null && item.getLabel()!=""){
					content.push(item.getLabel());
				// else try to set the title as label
				} else if(item.getTitle()!=null && item.getTitle()!=""){
					content.push(item.getTitle());
				}
				content.push("</td>");
				content.push("<td class='menuitem_right'>");
				if (item.isMenu) {
					content.push("<img style='right:0px; width:5px; height:9px;' src='"+contextPath+"modules/menu/themes/"+THEME_PATH+"/arrowright.gif'>");
				} else {
					content.push("&nbsp;");
				}
				content.push("</td>");
			} else {
				content.push("<td class='menuitem_left'></td><td colspan='2' style='height:0px;'><div class='menu_seperator'><img src='"+contextPath+"themes/blind.gif' style='width:1px;height:1px;'></div></td>");
			}
			content.push("</tr>");
		}
		content.push("</table>");		
		return content.join('');
	},
	/**
	 * Returns the level of a dropDownButton.
	 */
	getLevel : function()  {
		return 1;
	},
	/**
	 * Returns the root of a dropDownButton, the button itself.
	 */
	getRoot : function() {
		return this;
	},
	/**
	 * Hides a dropDownButton.
	 */
	hide : function() {
		this.collapse();
		this.opened = false;
	},
	/**
	 * Indicates whether this is autoPopUp.
	 */
	isAutoPopUp : function() {
		return this.getAbsoluteRoot().isAutoPopUp();
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
	 * Removes all items from a dropDownButton.
	 */
	removeAllItems : function() {
		while(this.items.length>0){
			var item = this.items[this.items.length-1];
			this.items.pop();
			if (!item.isSeparator) {
				item.unload();
			}
			delete item;
		}
	},
	/**
	 * Disables this.
	 */
	setDisabled : function(bDisabled) {
		bDisabled = bDisabled == true;
		if (this.disabled != bDisabled) {
			this.disabled = bDisabled;
			this.layer.disabled = this.disabled;
			
			var img = null;
			var hide_img = null;
			if (this.disabled) {
				img = document.getElementById(this.id + "_img_dis");
				hide_img = document.getElementById(this.id + "_img");
			} else {
				img = document.getElementById(this.id + "_img");
				hide_img = document.getElementById(this.id + "_img_dis");
			}
			if (img != null) {
				// mod BP 2010
				$(img).css({'display':"inline"});
				$(hide_img).css({'display':"none"});
				// end mod BP 2010
			}
		}
	},
	/**
	 * Shows the collapsed dropDownButton.
	 */
	show : function(event) {
		if(this.disabled){
			return;
		}
		if(this.items.length == 0){
			// do not open the drop down when it is empty to avoid
			// small empty box (CBG00110422)
			return;
		}
		// When the drop down already is displayed then collapse it.
		// Only show the drop down content if it is not shown already.
		if (this.opened) {
			root.collapse();
		} else {
			root.collapse(); // first collapse other possibly opened items.
			var layer = root.getMenuLayer(this.getLevel());
			root.markToCollapse(this);
	
			//Topmost Menu Layer positioning
	        
	        if (!dynamicPage) {
	            // for portlets
				// alert(this.layer.offsetLeft+" - "+getAbsoluteLeft(this.layer)+ " - "+getAbsoluteTop(this.layer)+" - "+(this.layer.offsetTop + this.layer.offsetHeight));
	            setXPos(layer, this.layer.offsetLeft);
	            setYPos(layer, this.layer.offsetTop + this.layer.offsetHeight);
	            setXPos(layer.iFrameLayer, this.layer.offsetLeft);
	            setYPos(layer.iFrameLayer, this.layer.offsetTop + this.layer.offsetHeight);
	        } else {
	            // if no portlets
	        	if (event != null) {
	        		
	        		// Transform browser specific event to neutral jquery event
	        		var jQueryEvent	= jQuery.event.fix( event );
	        		offsetMouseY = jQueryEvent.pageY - $(this.layer).offset().top;
	        		layerOffsetY = getFrameY() + jQueryEvent.clientY + this.layer.offsetHeight - offsetMouseY;
	        		offsetMouseX = jQueryEvent.pageX - $(this.layer).offset().left;
	        		layerOffsetX = getFrameX() +  jQueryEvent.clientX - offsetMouseX;
	        		setXPos(layer, layerOffsetX);
	        		setYPos(layer, layerOffsetY);
	        		setXPos(layer.iFrameLayer, layerOffsetX);
	        		setYPos(layer.iFrameLayer, layerOffsetY);
	        	} else { 
	        		// without scroll offset (old behaviour)
	        		setXPos(layer, getFrameX() + $(this.layer).offset().left);
	        		setYPos(layer, getFrameY() + $(this.layer).offset().top + this.layer.offsetHeight);
	        		setXPos(layer.iFrameLayer, getFrameX() + $(this.layer).offset().left);
	        		setYPos(layer.iFrameLayer, getFrameY() + $(this.layer).offset().top + this.layer.offsetHeight);
	        	};
	            
	        }
	        
			setHTML(layer, this.getContent());
			setWidth(layer.iFrameLayer, layer.offsetWidth);
			setHeight(layer.iFrameLayer, layer.offsetHeight);
			this.opened = true;
		}
	},
	/**
	 * Submits the dropDownButton data.
	 */
	submit : function(clientId) {
		if(this.disabled){
			return;
		}
		this.input.value = clientId;
		this.button.click();
	},
	/**
	 * Removes a dropDownButton.
	 */
	unload : function() {
		if(this.id != null && root.menuObjects != null){
			root.menuObjects[this.id] = null;
		}
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
};
