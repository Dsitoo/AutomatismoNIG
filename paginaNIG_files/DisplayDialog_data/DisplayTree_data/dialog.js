/** Script for the control of the layers/themes dialog. */

/**
 * Get the current scrolling offset, i.e.
 * how much the page has scrolled.
 */
function scrollOffset(){
	var x,y;
	if (self.pageYOffset) // all except Explorer
	{
		// x = self.pageXOffset;
		y = self.pageYOffset;
	}
	else if (document.documentElement && document.documentElement.scrollTop)
		// Explorer 6 Strict
	{
		// x = document.documentElement.scrollLeft;
		y = document.documentElement.scrollTop;
	}
	else if (document.body) // all other Explorers ("quirks mode")
	{
		// x = document.body.scrollLeft;
		y = document.body.scrollTop;
	}
	// return the vertical scrolling offset
	return y;
}
