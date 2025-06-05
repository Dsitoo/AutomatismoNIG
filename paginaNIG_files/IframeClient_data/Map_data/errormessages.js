
// This is just a similar thing as the messages in the redlining. As message is meant only for the redlining this serves as the generic one.
var errormessages = new Object();
// English translation ----------------------
var errormessages_en = new Object();
errormessages["en"]    = errormessages_en;
errormessages["en_gb"] = errormessages_en;
errormessages["en_us"] = errormessages_en;

errormessages_en ["CLOSED_TRAIL_WARNING"]  = "No more points can be added because the trail is closed.";


// German translation ----------------------
var errormessages_de = new Object();
errormessages["de"]    = errormessages_de;
errormessages["de_de"] = errormessages_de;

errormessages_de ["CLOSED_TRAIL_WARNING"]  = "Weitere Punkte können nicht hinzugefügt werden, da der Hilfslinienzug geschlossen wurde.";

// French
var errormessages_fr = new Object();
errormessages["fr"]    = errormessages_fr;

errormessages_fr["CLOSED_TRAIL_WARNING"]  = "Plus de points ne peuvent être ajoutés car le sentier est fermé.";

// We can use this as the generic message provider.
function getErrorMessage(msgID) {
	var lang;
	// Detect the browser lang
	// Null work around
	if(root == null ) lang = "en";
	
	// Take it from root
	lang = root.getLanguage();

	if(lang == null) {
		if (navigator.userLanguage) // Explorer
			lang = navigator.userLanguage;
		else if (navigator.language) // FF
			lang = navigator.language;
		else 
			lang = "en";
	}
	lang = lang.substring(0, 2);
	
	var messages_for_lang = errormessages[lang];
	if (!messages_for_lang) {
		// Translation does not exist. Use default
		messages_for_lang = errormessages["en"];
	}
	return messages_for_lang[msgID];
} 

