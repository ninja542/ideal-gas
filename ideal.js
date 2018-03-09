// adjustable controls: number of particles, temperature, volume, tracking one particle, boltzman distribution of energy (1/2 mv^2)
var fps = 60;
// calls the callback at about 60 times per second.
// kinda like setTimeout, but computer optimizes it.
var animate = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	function(callback){
		window.setTimeout(callback, 1000/fps);
	};

// create the canvas
var canvas = document.createElement('canvas');
var width = 400;
var height = 600;
canvas.width = width;
canvas.height = height;
var context = canvas.getContext('2d');
var particles = [];
for(let i = 0; i < 5; i++){
	particles.push(new Ball(i*Math.pow(2, 0.5)*10, i*Math.pow(2, 0.5)*10));
}

// update function
var update = function(){
	particles.forEach(p => p.update());
};

// render function
var render = function(){
	particles.forEach(p => context.clearRect(p.x-15, p.y-15, 30, 30));
	particles.forEach(p => p.draw());
	// context.clearRect(0, 0, width, height);
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
	this.x_speed = 1;
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
	for(let i = 0; i<particles.length-1; i++){
		for(let j = i+1; j<particles.length; j++){
			if(Math.pow(particles[j].x-particles[i].x, 2)+Math.pow(particles[j].y-particles[i].y, 2)<=401){
				console.log("collision");
				// insert collision code here
			}
		}
	}
};

// when webpage is loaded, attach canvas to it. Also calls the step function to animate it.
window.onload = function(){
	document.body.appendChild(canvas);
	animate(step);
};
