

var ip = "ws://localhost:8888/";
if(document.location.hostname !== "localhost")
    ip = "wss://zer.herokuapp.com/:8888";
var ws = new WebSocket(ip);
ws.binaryType = "arraybuffer";

function prepareData(a){
    return new DataView(new ArrayBuffer(a));
}
ws.onopen = function(msg){
    console.log("connected");
};
ws.onclose = function(msg){
    console.log("disconnected");
};

function sendPixel(x, y, type){
    if(ws.readyState !== ws.OPEN)
        return;
    var msg = prepareData(4);
    msg.setUint8(0, 1);
    msg.setUint8(1, x);
    msg.setUint8(2, y);
    msg.setUint8(3, type);
    ws.send(msg.buffer);
}

if ( !window.requestAnimationFrame ){
    window.requestAnimationFrame = window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback){
            window.setTimeout(callback, 1000 / 60);
        };
}

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

function canvasResize() {
    window.scrollTo(0,0);
    xsize = window.innerWidth;
    ysize = window.innerHeight;
    canvas.width = xsize;
    canvas.height = ysize;
}
window.onresize = canvasResize;
canvasResize();

Math.clamp = function(a,b,c){
	return Math.max(b, Math.min(c, a));
};

var lastX = 0,
    lastY = 0,
    btnDown = false;

var grid = [];
for(var i=0; i < 50; i++) {
	grid.push([]);
	for(var j=0; j < 50; j++) {
		grid[i].push({
			value : 0,
			goal : 0
		});
	}
}

ws.onmessage = function(msg){
    msg = new DataView(msg.data);
    switch(msg.getUint8(0)){
        case 0:
            var str = "";
            for(var i=1; i < msg.buffer.byteLength-1; i+=2)
                str += String.fromCharCode(msg.getUint16(i, true));
            console.log("msg: " + str);
            break;
        case 1:
            var x = msg.getUint8(1),
                y = msg.getUint8(2),
                type = msg.getUint8(3);
            grid[x][y].goal = type;

            break;
    }
};

function setPixel(x, y, type) {
    grid[x][y].goal = type;
    sendPixel(x, y, type);
}

function changePixel(x, y) {
    setPixel(x, y, 1 - grid[x][y].goal);
}

window.onmousedown = function(event){
    btnDown = true;
    lastX = event.clientX;
    lastY = event.clientY;

	var rectSize = Math.ceil(Math.max(xsize, ysize) / 50);
    var x = ~~(event.clientX / rectSize),
    	y = ~~(event.clientY / rectSize);
    if(event.buttons % 2 === 1) {
        changePixel(x, y);
    } else {
        setPixel(x, y, 0);
    }
};
window.onmouseup = function(event){
    btnDown = false;
};
window.onmousemove = function(event) {
    if(!btnDown)
        return;
    console.log(event);

    var rectSize = Math.ceil(Math.max(xsize, ysize) / 50);
    var x = ~~(event.clientX / rectSize),
        y = ~~(event.clientY / rectSize);

    if(x !== ~~(lastX / rectSize) || y !== ~~(lastY / rectSize)) {
        if(event.buttons % 2 === 1) {
            changePixel(x, y);
        } else {
            setPixel(x, y, 0);
        }
    }

    lastX = event.clientX;
    lastY = event.clientY;
};

function loop(){
    xsize = window.innerWidth;
    ysize = window.innerHeight;
    ctx.fillStyle = '#D78900';
    ctx.fillRect(0, 0, xsize, ysize);

    var rectSize = Math.ceil(Math.max(xsize, ysize) / 50);
    for(var i = 0; i < 50; i++) {
    	for(var j = 0; j < 50; j++) {
    		grid[i][j].value += Math.clamp(grid[i][j].goal - grid[i][j].value, -0.05, 0.05);
    		if(grid[i][j].value > 0) {
    			ctx.save();

	    		ctx.fillStyle = '#3B71C7';
	    		ctx.globalAlpha = grid[i][j].value;
	    		ctx.fillRect(rectSize * i, rectSize * j, rectSize, rectSize);

	    		ctx.restore();
	    	}
    	}
    }
    
    window.requestAnimationFrame(loop);
}
loop();