
/////////////////////////////////////////////////////////////////////////////////
//
// Simple Canvas Renderer
// Jamie Davis
// 2021
//
/////////////////////////////////////////////////////////////////////////////



/////////////////////////////////////////
// CanvasRenderer class
/////////////////////////////////////////
function CanvasRenderer() {

}

CanvasRenderer.prototype.clearCanvas = function(canvas)  {

    var context = canvas.getContext('2d');

    // clear  
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.rect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'white';
    context.fill();
}

CanvasRenderer.prototype.renderToCanvas = function(canvas, displayBundle, center, scale)  {

    var context = canvas.getContext('2d');

    // clear  
    this.clearCanvas(canvas);

    // if no center specified, default to middle of canvas
    if (center == null || center == undefined)
        center = [canvas.width/2, canvas.height/2];

    // if no scale specified, default to 1
    if (scale == null || scale == undefined)
        scale = 1;     

    // iterate bundle
    for (var i = 0; i < displayBundle.displayList.length; i++)
    {
        var renderObj = displayBundle.displayList[i];
        this.renderObjToCanvas(canvas, renderObj, center, scale);
    }
}


CanvasRenderer.prototype.renderObjToCanvas = function(canvas, renderObj, center, scale)  {

    var context = canvas.getContext('2d');

    var img = renderObj.textureImg;

    var width = canvas.width * renderObj.scale * scale;
    var height = canvas.height * renderObj.scale * scale;
    var centerX = center[0] + canvas.width * renderObj.center[0] * scale;
    var centerY = center[1] + canvas.height * renderObj.center[1] * scale;
    var topLeftX = centerX - width / 2.0;
    var topLeftY = centerY - height / 2.0;   
    
    context.save();

    // handle rotation if specified
    if (renderObj.rotation != undefined)
    {     
        context.translate(centerX, centerY);
        context.rotate(renderObj.rotation);
        context.translate(-centerX, -centerY);
    }

    context.drawImage(img, topLeftX, topLeftY, width, height);   
    
    context.restore();
}
