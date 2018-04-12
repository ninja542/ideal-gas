// self notes for later math implementation
// average force = (mass*v_xi^2 / (2L_x) + mass*v_yi^2 / (2L_y))
// pressure = # of particles * Average force / Area, can't know force because we don't know the time that the force acts over, but we might be able to approximate with the x_speed/y_speed

// variable definitions here
// d3 things here:
var margin = { top: 10, right: 10, bottom: 10, left: 10 },
    graphwidth = 960 - margin.left - margin.right,
    graphheight = 640 - margin.top - margin.bottom;
var svg = d3.select('.graph').append('svg')
    .attr('width', graphwidth + margin.left + margin.right)
    .attr('height', graphheight + margin.top + margin.bottom)
  .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
let colorscale = d3.scaleSequential(d3.interpolateRainbow);
// for canvas drawing
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
// for easier change later
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
	// this doesn't actually return the actual magnitude, but since I only need it for a dot projection, I saved some math work by removing the Math.sqrt()
	return Math.pow(this.x, 2) + Math.pow(this.y, 2);
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
	this.x_speed = Math.random()*3 * randNeg();
	this.y_speed = Math.random()*3 * randNeg();
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
		let theta = Math.atan(Math.abs(this.y_speed/this.x_speed)); // theta variable to ensure that particles still hit the bottom with the same angle as before, but faster
		let v_init = totalVelocity(this.x_speed, this.y_speed); // initial velocity so that the y_speed can be increased by the correct amount to keep the angle
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
		if (this.x_speed != 0){ // to make sure that particles do not disappear from a undefined atan
			this.x_speed = Math.sign(this.x_speed) * v_init*Math.cos(theta);
		}
	}
};
// separate function so that the particles can check for bouncing after the update, also it was easier to separate updating and bouncing from each other for better coding.
Ball.prototype.bounce = function(p, i){
	for (i; i<app.particles.length-1; i++){
		if(Math.pow(p.x-app.particles[i+1].x, 2)+Math.pow(p.y-app.particles[i+1].y, 2) < (Math.pow(2*radius, 2)+0.1)){ // no Math.sqrt to save computing power, checks if particles are touching. [i+1] is included so that if there is no valid particle at [i+1] it will not be counted, unlike before where i+1 was in the for loop, and caused strange problems where vectors would become undefined
			let a_i_speed = new Vector(app.particles[i+1].x_speed, app.particles[i+1].y_speed); // second particle
			let b_i_speed = new Vector(p.x_speed, p.y_speed); // first particle
			let collision = new Vector(p.x-app.particles[i+1].x, p.y-app.particles[i+1].y);
			let tempvector = new Vector(app.particles[i+1].x_speed, app.particles[i+1].y_speed); // temporary vector so that the initial vector is untouched
			tempvector.subtract(b_i_speed); // to put it in the b_i_speed particle frame of reference

			let projvector = tempvector.dotProduct(collision);
			projvector = projvector / collision.magnitude();
			collision.scale(projvector);
			/* LONG MATH EXPLANATION
			Getting the projection vector so that we know what components make up the first velocity that are parallel and perpendicular to the collision
			After getting the components of the first velocity, we can subtract the parallel component from the first velocity and add it to the second velocity
			Because both particles have equal mass, the velocity that is in the parallel direction of the first particle transfers completely over to the next particle
			Which is what happens in the next two lines */

			b_i_speed.add(collision);
			a_i_speed.subtract(collision);

			// setting the speeds of the particles after doing too much math
			p.x_speed = b_i_speed.x;
			p.y_speed = b_i_speed.y;
			app.particles[i+1].x_speed = a_i_speed.x;
			app.particles[i+1].y_speed = a_i_speed.y;
		}
	}
};

// vue app part
let app = new Vue({
	el: "#app",
	data: {
		particlenum: 50,
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
								borderBottomWidth: "4px"}; // makes the heating plate look real
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
		dimension: function(){ // needed to make sure that canvas/the border changes size
			return {width: this.width,
							height: this.height};
		}
	},
	methods: {
		adjustParticles: function(){
			context.clearRect(0, 0, this.width, this.height);
			if(this.particlenum < this.particles.length){
				this.particles.splice(0, this.particles.length - this.particlenum); // removes particles
			}
			else if(this.particlenum > this.particles.length){
				for(let i = this.particles.length; i < this.particlenum; i++){
					this.particles.push(new Ball(Math.floor(Math.random()*this.width), Math.floor(Math.random()*this.height)));
					// pushes new particles in random places, need a better algorithm to avoid particles spawning within each other.
				}
			}
		},
		canvasRender: function(){
			this.particles.forEach(p => p.draw());
		},
		update: function(){
			// clears the rectangle that the particle currently occupies. Supposed to save more computing power
			// uses radius variable to ensure future changeability, could also potentially be linked in vue to mass and stuff to provide more variables to change
			this.particles.forEach(p => context.clearRect(p.x-(radius+1), p.y-(radius+1), 2*radius+2, 2*radius+2));
			this.particles.forEach(p => p.update(this.heating));
			this.particles.forEach((p,i) => p.bounce(p, i));
			if(this.track_particle == true){
				// draws the colorful circles as a trail
				context2.beginPath();
				context2.arc(this.particles[0].x, this.particles[0].y, 2, 0, 2*Math.PI, false);
				let speed = totalVelocity(this.particles[0].x_speed, this.particles[0].y_speed);
				// fills the circle depending on the speed, roughly corresponding to the picture scale by dividing by 8.
				// if speed/8 is less than 1, then the color scale will fit, and will return speed/8, otherwise if it's going to fast, it just returns 1 (purple) instead to prevent errors in the trail
				context2.fillStyle = colorscale((speed/8 < 1) ? speed/8 : 1);
				context2.fill();
			}
		},
		step: function(){
			this.update();
			this.canvasRender();
		},
		animate: function(thing){
			// animation frame is more native and it allows for the animation to stop when focus is on another area
			let animation = window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			function(callback){
				window.setTimeout(callback, 1000/this.fps);
			};
			return animation(thing);
		},
		sortData: function(){
			let sortedData = [];
		}
	},
	watch: {
		particlenum: function(){
			this.adjustParticles();
		},
		// changing the width and height of both canvases at the same time
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
		track_particle: function(){ // pressing the track_particle checkbox erases the current board, provides easy erase function without having an erase button
			context2.clearRect(0, 0, this.width, this.height);
		}
	},
	mounted: function(){
		for(let i = 0; i < this.particlenum; i++){ // initial particle initialization. Need a better algorithm so that particles do not spawn within each other
			this.particles.push(new Ball(20*i, 20*i));
		}
		this.canvasRender();
	},
});

// separate step function needed, not sure why, but it doesn't work inside of vue object
let step = function(){
	app.update();
	app.canvasRender();
	app.animate(step);
};

// start animation when page is loaded
window.onload = function(){
	app.animate(step);
};

// putting function definitions at the end
function randNeg(){ // needed to generate negative sign randomly for more interesting things.
	return Math.floor(Math.random()*2) == 1 ? 1 : -1;
}
function totalVelocity(x, y){ // to make code easier to read
	return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}