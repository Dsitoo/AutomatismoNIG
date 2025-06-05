/** JavaScript code for Select (drop down) boxes and List boxes. */

var COMBO_BOX_BUTTON_WIDTH = 18;

DynComboBox = function(id, editable, disabled, onChangeCode, onSubmitCode) {

	this.id = id||null;
	root.registerObject(this);

	// Register this combo box to be blocked when a modal window is displayed
	root.addObjectToBlock(this);

	this.layer = document.getElementById(this.id + "div");
	this.valueField = document.getElementById(this.id + "value");
	this.selectField = document.getElementById(this.id + "select");
	this.selectField.comboBox = this;
	this.iFrame = document.getElementById(this.id + "iframe");
	this.inputField = document.getElementById(this.id + "input");
	this.inputField.comboBox = this;

	this.editable = editable != false;
	this.disabled = disabled == true;
	if (!$.browser.msie) {
			if (disabled) {
				$(this.selectField).css({'color': "grey"});
			} else {		
				$(this.selectField).css({'color': ""});
			};
	};

	this.onChangeCode = onChangeCode || null;
	this.onSubmitCode = onSubmitCode || null;

	this.list = new DynLinkedList();
	this.selectedItem = null;
	
	// Flag which indicates whether a specific custom value has been added.
	// That is an item which normally does not belong to the list of items. 
	// This specific custom value is added to the value list as first item.
	this.customValueSet = false;
	this.autosetTitle = false;
	
	// Flag which inhibits a submit in order to avoid that up/down arrow keys 
	// trigger a select and submit. Also see issue CBG00137797.
	this.blockSubmit = false;
	
	this.submitButton = document.getElementById(this.id + "submit") || "";
	this.submitButton.comboBox = this;

	/**
	 * handles the mousedown action of the select field of a combobox
	 */
	this.selectField.onmousedown = function(event) {
		//console.log("selectField.onmousedown");
		this.comboBox.blockSubmit = false;
		event = jQuery.event.fix(event || window.event);
		event.stopPropagation();
	};
	/**
	 * handles the onchange action of the select field of a combobox
	 */
	this.selectField.onchange = function() {
		//console.log("selectField.onchange");
		var tempNode = document.getElementById(this.value);
		this.comboBox.inputField.value = tempNode.optionname;
		this.comboBox.valueField.value = this.comboBox.list.getItem(tempNode.optionname + tempNode.optionvalue).getValue();
		this.comboBox.value = this.value;
		this.comboBox.onChange();		
	};
	/**
	 * handles the onkeydown action of the select field of a combobox
	 */
	this.selectField.onkeydown = function(evnt) {		
		//console.log("selectField.onkeydown");
		evnt = evnt || window.event;		
		var key = evnt.keyCode;
		// If the user simply navigates through the item list using the up/down keys
		// then set the blockSubmit flag to remember that we should not submit.
		if (key == 38) /* arrow up */ {
				//console.log("comboBox.blockSubmit = true");
				this.comboBox.blockSubmit = true;
		} else if (key == 40) /* arrow down */ {
				//console.log("comboBox.blockSubmit = true");
				this.comboBox.blockSubmit = true;
		} else if (key == 13) /* return */ {
			//console.log("key == 13");
			// The return key should trigger a submit
			this.comboBox.blockSubmit = false;
		}		
	};
	/**
	 * handles the onfocus action of the select field of a combobox
	 */
	this.selectField.onfocus = function(event) {
		//console.log("selectField.onfocus");
		// mod BP 2010
		if (event != null || window.event != null) {
			event = jQuery.event.fix(event || window.event);
			event.stopPropagation();
		};
		// end mod BP 2010
		root.isInput = true;
	};
	/**
	 * handles the onblur action of the select field of a combobox
	 */
	this.selectField.onblur = function(event) {
		//console.log("selectField.onblur");
		root.isInput = false;
		this.comboBox.blockSubmit = false;
	};
	
	/**
	 * blocks onkeydown action of the submit button of a combobox
	 */
	this.submitButton.onkeydown = function(event) {
		//console.log("submitButton.onkeydown");
		return false;
	};
	/*
	 * handles the onclick action of the submit button of a combobox
	 */
	/* this.submitButton.onclick = function() {
		if(this.comboBox.clickBlock==true || root.isBlocked()){
			return false;
		}
	};*/

	/**
	 * handles the mousedown action of the input field of a combobox
	 */
	this.inputField.onmousedown = function(event) {
		//console.log("inputField.onmousedown");
		if (event != null || window.event != null) {
			event = jQuery.event.fix(event || window.event);
			event.stopPropagation();
		};
		root.isInput = true;
		/*	 try {
			// work around a browser problem, force 'active' button.
			this.comboBox.clickBlock = true;
			this.comboBox.submitButton.click();
			this.comboBox.clickBlock = false;
		} catch (e) {	}*/
	};
	/**
	 * handles the onfocus action of the input field of a combobox
	 */
	this.inputField.onfocus = function(event) {
		//console.log("inputField.onfocus");
		if (event != null || window.event != null) {
			event = jQuery.event.fix(event || window.event);
			event.stopPropagation();
		};

		root.isInput = true;
	};
	/**
	 * handles the onblur action of the input field of a combobox
	 */
	this.inputField.onblur = function(event) {
		//console.log("inputField.onblur");
		root.isInput = false;
	};
	/**
	 * handles the onkeydown action of the input field of a combobox
	 */
	this.inputField.onkeydown = function(event) {
		//console.log("inputField.onkeydown");
		event = event || window.event;
		var key = event.keyCode;
		if (key == 38) /* arrow up */ {			
			if (this.comboBox.onChangeCode != "submit") {
				this.comboBox.selectPreviousItem();
			}		
		} else if (key == 40) /* arrow down */ {			
			if (this.comboBox.onChangeCode != "submit") {
				this.comboBox.selectNextItem();
			}
		} else if (key == 13) /* return */ {		
			this.comboBox.inputField.value = this.value;
			this.comboBox.valueField.value = this.value;
			this.comboBox.value = this.value;
			event = jQuery.event.fix(event);
			event.stopPropagation();
			this.comboBox.onChange();
		}			
	};
	/**
	 * handles the onchange action of the input field of a combobox
	 */
	this.inputField.onchange = function() {
		//console.log("inputField.onchange");
		if (!this.cboChanged) {
			this.comboBox.valueField.value = this.value;
			this.comboBox.value = this.value;
			this.comboBox.onChange();
		} else {
			this.cboChanged = false;
		}
	};

	// if the combo box is submitable, disable the mousewheel
	if (this.onChangeCode == "submit"){
		this.inputField.onmousewheel = this.selectField.onmousewheel = function(event) {
			// do nothing
			event = jQuery.event.fix(event || window.event);
			event.stopPropagation();
			return false;
		};
	}

	this.customValueSet = false;
	this.selectedItem = null;

	this.repaint();
	return this;
};

DynComboBox.prototype = {

	/**
	 * adds a group to a combobox
	 */
	addGroup : function(name, items) {
		this.removeGroup(name);
		var grp = new Array();
		this.list.addItem(name, grp);
		var optGrp = document.createElement("optgroup");
		optGrp.label = name;
		optGrp.id = 'grp_'+this.id+"_"+name;
		for(var i=0; i<items.length/2; i++){
			var oname = items[i*2];
			if ( oname!= null) {
				grp[i] = oname;
				var value = items[i*2+1];
				if (!value) {
					value = oname;
				}
				var item = this.list.addItem(oname + value, value);
				if (this.list.getLength() == 1) {
					this.selectedItem = item;
				}
				try {
					var tempNode = document.createElement("option");
					optGrp.appendChild(tempNode);
					tempNode.appendChild(document.createTextNode(oname));
					tempNode.id = 'opt_'+this.id+"_"+oname+"_"+value;
					tempNode.value = tempNode.id;
					tempNode.optionvalue = value;
					tempNode.optionname = oname;					
					if(this.autosetTitle){
						tempNode.title = oname;
					}
				} catch(ex) {
				}
			}
		}
		this.selectField.appendChild(optGrp);
	},

	/**
	 * adds an item to a combobox
	 */	
	addItem : function(name, value) {
		if (name != null) {
			if (!value) {
				value = name;
			}
			this.removeItem(name);
			var item = this.list.addItem(name + value, value);
			if (this.list.getFirst() == item) {
				this.selectedItem = item;
				try {
					this.valueField.value = item.getValue();
				} catch(ex) {
				}
				try {
					document.getElementById("opt_"+this.id+"_"+item.getName()+"_"+item.getValue()).selected = true;
				} catch(ex) {
				}
			}
			try {
				var tempNode = document.createElement("option");
				this.selectField.appendChild(tempNode);
				tempNode.appendChild(document.createTextNode(name));
				tempNode.id = 'opt_'+this.id+"_"+name+"_"+value;
				tempNode.value = tempNode.id;
				tempNode.optionvalue = value;
				tempNode.optionname = name;				
				if(this.autosetTitle){
					tempNode.title = name;
				}				
			} catch(ex) {
			}
//			if (this.getValue() == null /*|| this.getValue().length == 0*/) {
//				this.setValue(value, false);
//			}
		}
	},

	/**
	 * Blocks the combo box.
	 */
	block : function(block) {
		if(block) {
			if(this.disabled){
				this.wasDisabled = true;
			} else {
				this.setDisabled(block);
			}
		} else {
			if(this.wasDisabled==true){
				this.wasDisabled = false;
			} else {
				this.setDisabled(block);
			}
		}
	},

	/**
	 * returns the active name
	 */
	getActive : function() {
		return this.valueField.value;
	},
	/**
	 * returns the id of a combobox
	 */
	getId : function() {
		return this.id;
	},
	/**
	 * returns the title of a combobox
	 */
	getTitle : function() {
		return this.title;
	},
	/**
	 * returns the value of a combobox
	 */
	getValue : function() {
		var value = this.list.getValue(this.inputField.value);
		return value != null ? value : this.inputField.value;
	},
	/**
	 * is this a combobox?
	 */
	isComboBox : true,
	/**
	 * is editable?
	 */
	isEditable : function() {
		return this.editable;
	},
	/**
	 * is disabled?
	 */
	isDisabled: function() {
		return this.disabled;
	},

	/**
	 * handles the onChange action of a combobox
	 */
	onChange : function() {		
		//debugger;
		//console.log("combobox.onChange");
		
		if(this.autosetTitle){
			this.inputField.title = this.title != null ? this.title : this.inputField.value;
			this.selectField.title = this.title != null ? this.title : this.inputField.value;
		}
		if (this.customValueSet) {
			this.list.removeItem(this.list.getFirst());
			this.customValueSet = false;
			this.repaintOptionTags();
		}
		if (this.blockSubmit) {
			// If the user simply navigates through the item list using the up/down keys
			// then do not submit and only reset the blockSubmit flag to false.
			this.blockSubmit = false;
		} else {
			if (this.onChangeCode != null) {
				// this is for comboboxes in menubars
				if (this.onChangeCode == "submit") {
					try {
						if (root != null) {
							root.collapse();
						}
						if (this.onSubmitCode != null) {
							eval(this.onSubmitCode);
						}
	//					this.root.submit(this, this.getValue());
	//					document.getElementById(this.id + "submit").click();
						this.submitButton.click();						
					} catch(ex) {
					}
				} else {
					try{
						eval(this.onChangeCode);
					} catch(e){
						alert(e);
					}
				}
/*			} else {
				var event = window.event;
				var keycode = event.keyCode;
				if (keycode == 13) {
					this.submitButton.click();
				}*/
			}	
		}
	},

	/**
	 * removes all items from a combobox
	 */
	removeAllItems : function() {
		while(this.selectField.firstChild != null) {
			this.selectField.removeChild(this.selectField.firstChild);
		}
		this.list.removeAllItems();
		this.selectedItem = null;
		// Reset the value, so that no obsolete value can be submitted later (CBG00138487)
		this.valueField.value = "";
	},
	/**
	 * removes a group plus its items from a combobox
	 */
	removeGroup : function(name) {
		var grp = this.list.getValue(name);
		if (grp != null) {
			this.list.removeItem(name);
			var grpNode = document.getElementById("grp_"+this.id+"_"+name);
			for(var i=0; i<grp.length; i++){
				this.list.removeItem(grp[i]);
				var node = document.getElementById("opt_"+this.id+"_"+grp[i]);
				if (node != null) {
					grpNode.removeChild(node);
				}
			}
			if (grpNode != null) {
				this.selectField.removeChild(grpNode);
			}
		}
		if (this.list.getLength() == 0) {
			this.selectedItem = null;
			this.customValueSet = false;
		}
	},
	/**
	 * removes an item from a combobox
	 */
	removeItem : function(name) {
		if (this.list.getValue(name) != null) {
			this.list.removeItem(name);
			var node = document.getElementById("opt_"+this.id+"_"+name);
			if (node != null) {
				this.selectField.removeChild(node);
			}
		}
		if (this.list.getLength() == 0) {
			this.selectedItem = null;
			this.customValueSet = false;
		}
	},

	/**
	 * repaints the combobox
	 */
	repaint : function() {
		//var width = this.layer.offsetWidth;
		//var width = parseInt(this.layer.style.width);
		
		// mod BP 2010
		var width = $(this.layer).css('width');
	
		//debugger;		
		$(this.selectField).css({'width':width});
		
		if (this.editable) {
			if (width.endsWith("%")) {
				
				$(this.inputField).css({'width':width});
				$(this.iFrame).css({'width':width});
				
			} else {
				width = parseInt(width);
				
				$(this.inputField).css({'width':width-COMBO_BOX_BUTTON_WIDTH});
				$(this.iFrame).css({'width':width-COMBO_BOX_BUTTON_WIDTH});
				
			}
			// Firefox and other browsers don't render this.iFrame
			// at the correct position when this.iFrame.style.display = "block";
			$(this.iFrame).css({'display':"none",'visibility':"hidden"});
		
			// Firefox and other browsers don't render this.inputField
			// at the correct position this.inputField.style.display = "block";
			$(this.inputField).css({'display':"",'visibility':"visible"});
			
		} else {
			if(this.iFrame != null && this.iFrame != undefined){
				$(this.iFrame).css({'display':"none",'visibility':"hidden"});
			}
			$(this.inputField).css({'display':"none",'visibility':"hidden"});
			
			// end mod BP 2010
		}
	},
	/**
	 * repaints the option tags a combobox is based on
	 */
	repaintOptionTags : function() {
		while (this.selectField.hasChildNodes()) {
			this.selectField.removeChild(this.selectField.firstChild);
		}
		//debugger;
		var option = this.list.getFirst();
		while (option != null) {
			try {
				var tempNode = document.createElement("option");
				this.selectField.appendChild(tempNode);
				tempNode.appendChild(document.createTextNode(option.getName()));
				tempNode.id = 'opt_'+this.id+"_"+option.getName()+"_"+option.getValue();
				tempNode.value = tempNode.id;
				tempNode.optionvalue = option.getValue();
				tempNode.optionname = option.getName();	
				if(this.autosetTitle){
					tempNode.title = option.getName();
				}
				if (this.selectedItem == option) {
					tempNode.selected = true;
				}
			} catch(ex) {
			}
			if (option.getNext() != null && option != option.getNext()) {
				option = option.getNext();
			} else {
				option = null;
			}
		}
	},

	/**
	 * selects the next item in a combobox
	 */
	selectNextItem : function() {
		var item = this.list.getItem(this.inputField.value + this.valueField.value);
		try {
			this.setSelectedItem(item.getNext());
		} catch(ex) {
			if (this.list.getFirst() != null) {
				this.setSelectedItem(this.list.getFirst());
			}
		}
	},
	/**
	 * selects the previous item in a combobox
	 */
	selectPreviousItem : function() {
		var item = this.list.getItem(this.inputField.value + this.valueField.value);
		try {
			this.setSelectedItem(item.getPrevious());
		} catch(ex) {
			if (this.list.getLast() != null) {
				this.setSelectedItem(this.list.getLast());
			}
		}
	},
	/**
	 * sets the editable state of a combobox
	 */
	setEditable : function(editable) {
		this.editable = editable != false;
		this.repaint();
	},
	/**
	 * sets the disabled state of a combobox
	 */
	setDisabled : function(disabled) {
		disabled = disabled == true;
		if (disabled == this.disabled) return;
		this.disabled = disabled;
		this.inputField.disabled = disabled;
		this.selectField.disabled = disabled;
		if (!$.browser.msie) {
			if (disabled) {
				$(this.selectField).css({'color': "grey"});
			} else {
				$(this.selectField).css({'color': ""});
			};
		};
		this.valueField.disabled = disabled;
	},
	/**
	 * sets the list of items in a combobox
	 */
	setList : function(list) {
		this.removeAllItems();
		var item = list.getFirst();
		while(item != null) {
			this.addItem(item.getName(), item.getValue());
			item = item.getNext();
		}
	},
	/**
	 * sets the onChange behaviour of a combobox
	 */
	setOnChangeCode : function(onChangeCode) {
		this.onChangeCode = onChangeCode;
	},
	
	/**
	 * Sets the selected item of a combobox.
	 */
	setSelectedItem : function(item, bEvent) {
		//debugger;
		if (item != null && item.getName() != "null" /*&& item.getName() != ""*/) {
			if ((typeof item) == "string") {
				this.setSelectedItem(this.list.getItem(item, bEvent));
			} else {
				var repaint = false;
				
				// If there is a custom value, then remove it
				if (this.customValueSet) {
					this.list.removeItem(this.list.getFirst());
					this.customValueSet = false;
					repaint = true;
				}

				var tempItem = this.list.getItem(item.getName() + item.getValue());
				if (tempItem != null && tempItem.getValue() == item.getValue()) {
					this.selectedItem = tempItem;
					try {
						document.getElementById("opt_"+this.id+"_"+item.getName()+"_"+item.getValue()).selected = true;
					} catch(ex) {
					}
					
				} else {
					// introduce new item as "custom" item
					this.customValueSet = true;
					if (this.list.getFirst() == null) {
						this.selectedItem = this.list.addItem(item.getName() + item.getValue(), item.getValue());
					} else {
						this.selectedItem = this.list.addItemBefore(item.getName() + item.getValue(), item.getValue(), this.list.getFirst());
					}
					repaint = true;
				}
				
				if (repaint) {
					// an item has been added or removed. Re-create the option tags.
					this.repaintOptionTags();
				}
				
				this.inputField.value = item.getName();
				if(this.autosetTitle){
					this.inputField.title = this.title != null ? this.title : this.inputField.value;
					this.selectField.title = this.title != null ? this.title : this.inputField.value;
				}
				try {
					this.valueField.value = item.getValue();
				} catch(ex) {
				}
				
				if (bEvent != false) {
					this.onChange();
				}
			}
		}
	},
	
	/**
	 * sets the selected item of a combobox by its value
	 */
	setSelectedItemByValue : function(value, bEvent) {
		//debugger;
		var item = this.list.getFirst();
		var found = false;
		while(item != null) {
			if ((this.caseSensitiv && item.getValue() == value) 
				|| (!this.caseSensitiv && item.getValue().equalsIgnoreCase(value))) {								
				this.inputField.value = item.getName();
				if(this.autosetTitle){
					this.inputField.title = this.title != null ? this.title : this.inputField.value;
					this.selectField.title = this.title != null ? this.title : this.inputField.value;
				}
				try {
					this.valueField.value = item.getValue();
				} catch(ex) {
				}
				try {
					document.getElementById("opt_"+this.id+"_"+item.getName()+"_"+item.getValue()).selected = true;
				} catch(ex) {
				}
				this.selectedItem = item;
				found = true;
			} else {
				//document.getElementById("opt_"+this.id+"_"+item.getName()).selected = false;
			}
			item = item.getNext();
		}
		if (found == true && bEvent != false) {
			this.onChange();
		}
		return found;
	},
	/**
	 * sets the title of a comboxbox
	 */
	setTitle : function(title) {
		this.title = title;
		this.inputField.title = this.title != null ? this.title : this.inputField.value;
		this.selectField.title = this.title != null ? this.title : this.inputField.value;
	},
	/**
	 * sets the value of a combobox
	 */
	setValue : function(value, bEvent) {
		//debugger;
		if ((typeof value) == "string") {
			if (this.customValueSet) {
				this.list.removeItem(this.list.getFirst());
				this.customValueSet = false;
			}
			if (!this.setSelectedItemByValue(value, false)) {
				this.customValueSet = true;
				if (this.list.getFirst() == null) {
					this.selectedItem = this.list.addItem(value + value, value);
				} else {
					this.selectedItem = this.list.addItemBefore(value + value, value, this.list.getFirst());
				}
				this.inputField.value = value;
				if(this.autosetTitle){
					this.inputField.title = this.title != null ? this.title : this.inputField.value;
					this.selectField.title = this.title != null ? this.title : this.inputField.value;
				}
				this.valueField.value = value;
			}
			this.repaintOptionTags();
		} else {
			//debugger;
			this.setSelectedItem(new DynListItem(value[0] + value[0], value[1]), false);
		}
		if (bEvent != false) {
			this.onChange();
		}
	},
	/**
	 * unloads a combobox
	 */
	unload : function() {
	 	root.removeObjectToBlock(this);
		if (this.layer!=null)
			delete this.layer;
		if (this.bounds!=null)
			delete this.bounds;
		if (this.selectField)
			delete this.selectField;
		if (this.valueField)
			delete this.valueField;
		if (this.iframe)
			delete this.iframe;
		if (this.inputField)
			delete this.inputField;
		if (this.list!=null){
			this.list.unload();
			delete this.list;
		}
	}
};
