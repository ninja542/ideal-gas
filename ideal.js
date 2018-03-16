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
var particlenum = 100;
for(let i = 0; i < particlenum; i++){
	particles.push(new Ball(i*Math.pow(2, 0.5)*10, i*Math.pow(2, 0.5)*10));
}

// update function
var update = function(){
	particles.forEach(p => p.update());
	particles[0].bounce();
};

// render function
var render = function(){
	particles.forEach(p => context.clearRect(p.x-20, p.y-20, 40, 40));
	context.beginPath();
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
	this.x_speed = Math.ceil(Math.random()*5);
	this.y_speed = Math.ceil(Math.random()*5);
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

Ball.prototype.bounce = function(){
	for (let i = 0; i<particles.length; i++){
		for(let j = i+1; j<particles.length; j++){
			if(Math.pow(particles[j].x-particles[i].x, 2)+Math.pow(particles[j].y-particles[i].y, 2)<401){
				// angle1 = Math.atan2(particles[j].y_speed, particles[j].x_speed);
				// angle2 = Math.atan2(this.y_speed, this.x_speed);
				// finang = 0.5 * Math.asin(2/(Math.tan(angle1)+Math.tan(angle2)))
				// this.x_speed = particles[j].x_speed + this.x_speed;
				a_i_speed = [particles[i].x_speed, particles[i].y_speed];
				b_i_speed = [particles[j].x_speed, particles[j].y_speed];
				// if(particles[j].x_speed == 0 || particles[i].x_speed == 0){
				// 	particles[i].x_speed = b_i_speed[0];
				// 	particles[j].x_speed = a_i_speed[0];
				// }
				// else{
				// 	particles[i].x_speed += b_i_speed[0];
				// 	particles[j].x_speed += a_i_speed[0];
				// 	particles[i].y_speed += b_i_speed[1];
				// 	particles[j].y_speed += a_i_speed[1];
				// }
				// if(particles[j].y_speed == 0 || particles[i].y_speed == 0){
				// 	particles[i].y_speed = b_i_speed[1];
				// 	particles[j].y_speed = a_i_speed[1];
				// }
				// else {
				// 	console.log("sad")
				// }
				particles[i].x_speed = b_i_speed[0];
				particles[j].x_speed = a_i_speed[0];
				particles[i].y_speed = b_i_speed[1];
				particles[j].y_speed = a_i_speed[1];

				// this.y_speed = particles[j].y_speed;
				// particles[j].x_speed += this.x_speed;
				// console.log("collision");

				// insert collision code here
			}
		}
	}
}

// when webpage is loaded, attach canvas to it. Also calls the step function to animate it.
window.onload = function(){
	document.body.appendChild(canvas);
	animate(step);
};
