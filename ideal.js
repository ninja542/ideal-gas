
// calls the callback at about 60 times per second.
// kinda like setTimeout, but computer optimizes it.
var animate = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	function(callback){
		window.setTimeout(callback, 1000/60);
	};

// create the canvas
var canvas = document.createElement('canvas');
var width = 400;
var height = 600;
canvas.width = width;
canvas.height = height;
var context = canvas.getContext('2d');
var ball = new Ball(200, 300);
var ball2 = new Ball(100, 200);

// update function
var update = function(){
	ball.update();
	ball2.update();
};

// render function
var render = function(){
	context.clearRect(0, 0, width, height);
	ball.draw();
	ball2.draw();
};

// step function, which then calls itself again in a loop.
var step = function(){
	update();
	render();
	animate(step);
};

function Ball(x, y){
	this.x = x;
	this.y = y;
	this.x_speed = 10;
	this.y_speed = 3;
	this.radius = 10;
}

Ball.prototype.draw = function(){
	context.beginPath();
	context.arc(this.x, this.y, this.radius, 0, 2*Math.PI, false);
	context.fillStyle = "#0000FF";
	context.fill();
};

Ball.prototype.update = function(){
	this.x += this.x_speed;
	this.y += this.y_speed;
	var left_x = this.x - this.radius;
	var top_y = this.y - this.radius;
	var right_x = this.x + this.radius;
	var bottom_y = this.y + this.radius;
	if (left_x < 0){ // hitting left wall
		this.x = this.radius;
		this.x_speed = -this.x_speed;
	}
	else if (right_x > width){ // hitting right wall
		this.x = width - this.radius;
		this.x_speed = -this.x_speed;
	}
	else if (top_y < 0){ // hitting top wall
		this.y = this.radius;
		this.y_speed = -this.y_speed;
	}
	else if (bottom_y > height){ // hitting bottom wall
		this.y = height - this.radius;
		this.y_speed = -this.y_speed;
	}
};

// when webpage is loaded, attach canvas to it. Also calls the step function to animate it.
window.onload = function(){
	document.body.appendChild(canvas);
	animate(step);
};