var animate = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	function(callback){
		window.setTimeout(callback, 1000/60);
	};
function randNeg(){
	return Math.floor(Math.random()*2) == 1 ? 1 : -1;
}
// object definition
function Ball(x, y){
	this.x = x;
	this.y = y;
	this.x_speed = Math.floor(Math.random()*5) * randNeg();
	this.y_speed = Math.floor(Math.random()*5) * randNeg();
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
	else if (right_x > app.width){ // hitting right wall
		this.x = app.width - this.radius;
		this.x_speed = -this.x_speed;
	}
	else if (top_y < 0){ // hitting top wall
		this.y = this.radius;
		this.y_speed = -this.y_speed;
	}
	else if (bottom_y > app.height){ // hitting bottom wall
		this.y = app.height - this.radius;
		this.y_speed = -this.y_speed;
	}
};
Ball.prototype.bounce = function(p, i){
	for (i+1; i<app.particles.length; i++){
		if(Math.pow(p.x-app.particles[i].x, 2)+Math.pow(p.y-app.particles[i].y, 2)<401){
			a_i_speed = [app.particles[i].x_speed, app.particles[i].y_speed];
			b_i_speed = [p.x_speed, p.y_speed];
			app.particles[i].x_speed = b_i_speed[0];
			p.x_speed = a_i_speed[0];
			app.particles[i].y_speed = b_i_speed[1];
			p.y_speed = a_i_speed[1];
			// insert collision code here
		}
	}
};

var canvas = document.getElementById("canvas");
var width = 400;
var height = 600;
canvas.width = width;
canvas.height = height;
var context = canvas.getContext('2d');

var app = new Vue({
	el: "#app",
	data: {
		particlenum: 100,
		particles: [],
		width: 400,
		height: 600,
	},
	methods: {
		adjustParticles: function(){
			context.clearRect(0, 0, this.width, this.height);
			if(this.particlenum < this.particles.length){
				this.particles.splice(0, this.particles.length - this.particlenum);
			}
			else if(this.particlenum > this.particles.length){
				for(let i = this.particles.length; i < this.particlenum; i++){
					this.particles.push(new Ball(Math.floor(Math.random()*this.width), Math.floor(Math.random()*this.height)));
				}
			}
			// this.canvasRender();
		},
		canvasRender: function(){
			// context.clearRect(0, 0, width, height);
			this.particles.forEach(p => p.draw());
		},
		update: function(){
			this.particles.forEach(p => context.clearRect(p.x-10, p.y-10, 20, 20));
			this.particles.forEach(p => p.update());
			this.particles.forEach((p,i) => p.bounce(p, i));
		},
		step: function(){
			this.update();
			this.canvasRender();
		},
	},
	watch: {
		particlenum: function(){
			this.adjustParticles();
		},
		width: function(){
			canvas.width = this.width;
			canvas.style.width = this.width;
		},
		height: function(){
			canvas.height = this.height;
			canvas.style.height = this.height;
		}
	},
	mounted: function(){
		for(let i = 0; i < this.particlenum; i++){
			this.particles.push(new Ball(Math.floor(Math.random()*width), Math.floor(Math.random()*height)));
		}
		this.canvasRender();
	}
});
var step = function(){
	app.update();
	app.canvasRender();
	animate(step);
};

window.onload = function(){
	animate(step);
};