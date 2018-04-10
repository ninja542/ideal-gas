// average force = (mass*v_xi^2 / (2L_x) + mass*v_yi^2 / (2L_y))
// pressure = # of particles * Average force / Area
function randNeg(){ // needed to generate negative sign randomly for more interesting things.
	return Math.floor(Math.random()*2) == 1 ? 1 : -1;
}
function totalVelocity(x, y){ // to make code easier to read
	return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}
let radius = 5;

// object definitions
function Vector(x, y){
	this.x = x;
	this.y = y;
}
Vector.prototype.dotProduct = function(vector2){
	return this.x * vector2.x + this.y * vector2.y;
};
Vector.prototype.magnitude = function () {
	return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
};
Vector.prototype.scale = function (scaleFactor) {
	this.x *= scaleFactor;
	this.y *= scaleFactor;
};
Vector.prototype.add = function (vector2) {
	this.x += vector2.x;
	this.y += vector2.y;
};
Vector.prototype.subtract = function(vector2){
	this.x -= vector2.x;
	this.y -= vector2.y;
};

function Ball(x, y){
	this.x = x;
	this.y = y;
	this.x_speed = Math.floor(Math.random()*5) * randNeg();
	this.y_speed = Math.floor(Math.random()*5) * randNeg();
	this.radius = radius;
}
Ball.prototype.draw = function(){
	context.beginPath();
	context.arc(this.x, this.y, this.radius, 0, 2*Math.PI, false);
	context.fillStyle = "#0000FF";
	context.fill();
};
Ball.prototype.update = function(heating){
	this.x += this.x_speed;
	this.y += this.y_speed;
	let left_x = this.x - this.radius;
	let top_y = this.y - this.radius;
	let right_x = this.x + this.radius;
	let bottom_y = this.y + this.radius;
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
		let theta = Math.atan(Math.abs(this.y_speed/this.x_speed));
		let v_init = totalVelocity(this.x_speed, this.y_speed);
		if (heating == "cold"){
			v_init -= 0.5;
			this.y = app.height - this.radius;
			this.y_speed = -v_init*Math.sin(theta);
		}
		else if (heating == "hot"){
			v_init += 0.5;
			this.y = app.height - this.radius;
			// this.y_speed = -this.y_speed - 1;
			this.y_speed = -v_init*Math.sin(theta);
		}
		else {
			this.y = app.height - this.radius;
			this.y_speed = -this.y_speed;
		}
		if (this.x_speed != 0){
			this.x_speed = Math.sign(this.x_speed) * v_init*Math.cos(theta);
		}
	}
};
Ball.prototype.bounce = function(p, i){
	for (i+1; i<app.particles.length; i++){
		if(Math.pow(p.x-app.particles[i].x, 2)+Math.pow(p.y-app.particles[i].y, 2) < (Math.pow(2*radius, 2) +1)){
			// insert collision code here
			let a_i_speed = new Vector(app.particles[i].x_speed, app.particles[i].y_speed); // second particle
			let b_i_speed = new Vector(p.x_speed, p.y_speed); // first particle
			// let collision = new Vector(p.x-app.particles[i].x, p.y-app.particles[i].y);
			// let tempvector = a_i_speed;
			// tempvector.subtract(b_i_speed);
			// let projvector = tempvector.dotProduct(collision);
			// projvector = projvector / Math.pow(collision.magnitude(), 2);
			// collision.scale(projvector);
			// a_i_speed.subtract(collision);
			// a_i_speed.add(b_i_speed);
			// let tempbvector = new Vector(0, 0);
			// tempbvector.add(collision);
			// tempbvector.add(b_i_speed);

			p.x_speed = a_i_speed.x;
			p.y_speed = a_i_speed.y;
			app.particles[i].x_speed = b_i_speed.x;
			app.particles[i].y_speed = b_i_speed.y;
		}
	}
};

let canvas = document.getElementById("canvas");
let canvas2 = document.getElementById("canvas2");
let width = 400;
let height = 600;
canvas.width = width;
canvas.height = height;
let context = canvas.getContext('2d');
canvas2.width = width;
canvas2.height = height;
let context2 = canvas2.getContext('2d');

let colorscale = d3.scaleSequential(d3.interpolateRainbow);

let app = new Vue({
	el: "#app",
	data: {
		particlenum: 10,
		particles: [],
		width: 400,
		height: 600,
		track_particle: false,
		fps: 60,
		heating: "none",
		lock: false,
	},
	computed: {
		plate: function(){
			if (this.heating == "cold"){
				/* cold plate */
				return {borderBottomColor:  "#00CCFF",
								borderBottomWidth: "4px"};
			}
			else if (this.heating == "hot"){
				/* hot plate */
				return {borderBottomColor:  "#F00",
								borderBottomWidth: "4px"};
			}
			else {
				return {borderBottomWidth: "1px"};
			}
		},
		dimension: function(){
			return {width: this.width,
							height: this.height};
		}
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
			this.particles.forEach(p => context.clearRect(p.x-(radius+1), p.y-(radius+1), 2*radius+2, 2*radius+2));
			this.particles.forEach(p => p.update(this.heating));
			this.particles.forEach((p,i) => p.bounce(p, i));
			if(this.track_particle == true){
				context2.beginPath();
				context2.arc(this.particles[0].x, this.particles[0].y, 2, 0, 2*Math.PI, false);
				let speed = totalVelocity(this.particles[0].x_speed, this.particles[0].y_speed);
				context2.fillStyle = colorscale((speed/8 < 1) ? speed/8 : 1);
				context2.fill();
			}
		},
		step: function(){
			this.update();
			this.canvasRender();
		},
		animate: function(thing){
			let animation = window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			function(callback){
				window.setTimeout(callback, 1000/this.fps);
			};
			return animation(thing);
		}
	},
	watch: {
		particlenum: function(){
			this.adjustParticles();
		},
		width: function(){
			canvas.width = this.width;
			canvas.style.width = this.width;

			canvas2.width = this.width;
			canvas2.style.width = this.width;
		},
		height: function(){
			canvas.height = this.height;
			canvas.style.height = this.height;

			canvas2.height = this.height;
			canvas2.style.height = this.height;
		},
		track_particle: function(){
			context2.clearRect(0, 0, this.width, this.height);
		}
	},
	mounted: function(){
		for(let i = 0; i < this.particlenum; i++){
			this.particles.push(new Ball(20*i, 20*i));
		}
		this.canvasRender();
	},
});
let step = function(){
	app.update();
	app.canvasRender();
	app.animate(step);
};

window.onload = function(){
	app.animate(step);
};