// @flow
// variable definitions here
// d3 things here:
let margin = { top: 10, right: 10, bottom: 40, left: 40 },
    graphwidth = 600 - margin.left - margin.right,
    graphheight = 650 - margin.top - margin.bottom;
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
// constants for easier change later
const radius = 5;
const mass = 1e-21;
const R = 8.314;
const k = R / 6.02e+23;

// d3 stuff
let xScale = d3.scaleLinear().domain([0, 5]).range([0, graphwidth]);
let xAxis = d3.axisBottom(xScale);
let yScale = d3.scaleLinear().domain([0, 1]).range([graphheight, 0]);
let yAxis = d3.axisLeft(yScale);
svg.append("g").call(yAxis);
svg.append("g").call(xAxis).attr("transform", "translate(" + 0 + ", " + yScale(0) + ")").attr("class", "xAxis");
svg.append("path").attr("stroke", "black").attr("stroke-width", 1).attr("fill", "none").attr("class", "probability");
svg.append("rect").attr("fill", "red").attr("class", "velocity").attr("width", 1).attr("visibility", "hidden");
svg.append("text").attr("text-anchor", "middle").attr("transform", "translate("+ (-29) +","+(graphheight/2)+")rotate(-90)").text("Probability");
svg.append("text").attr("text-anchor", "middle").attr("transform", "translate(" + (graphwidth/2) + ", " + (graphheight+35) + ")").text("Velocity of Particle");

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
	this.x_speed = Math.random() * 3 * randNeg();
	this.y_speed = Math.random() * 3 * randNeg();
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
			this.x_speed = Math.sign(this.x_speed) * v_init * Math.cos(theta);
		}
	}
};
// separate function so that the particles can check for bouncing after the update, also it was easier to separate updating and bouncing from each other for better coding.
Ball.prototype.bounce = function(p, i){
	for (i; i<app.particles.length-1; i++){
		if (Math.pow(p.x-app.particles[i+1].x, 2)+Math.pow(p.y-app.particles[i+1].y, 2) < (Math.pow(2*radius, 2)+0.1)){ // no Math.sqrt to save computing power, checks if particles are touching. [i+1] is included so that if there is no valid particle at [i+1] it will not be counted, unlike before where i+1 was in the for loop, and caused strange problems where vectors would become undefined
			// still has weird bumping behavior when particles are cooled a lot
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
		particlenum: 20,
		particles: [],
		width: 400,
		height: 600,
		track_particle: false,
		fps: 60,
		heating: "none",
		lock: false,
		show: false,
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
		},
		measuredTemp: function(){
			let totalKE = this.totalVelList.reduce((total, amount) => total + 0.5 * Math.pow(amount, 2) * mass, 0);
			let averageKE = totalKE / this.particles.length;
			let temperature = averageKE / (1.5 * k);
			return temperature;
		},
		measuredPressure: function(){
			let totalPressure = this.totalVelList.reduce((total, amount) => total + (mass * (Math.pow(amount, 2)))/(this.width * this.height), 0);
			return totalPressure;
		},
		totalVelList: function(){
			let newMap = this.particles.map((item) => totalVelocity(item.x_speed, item.y_speed));
			return newMap;
		},
		calculatedTemp: function(){
			// PV = nRT equation
			// T = PV/nR
			let n = this.particlenum / 6.02e+23;
			let temperature = this.measuredPressure * this.width * this.height;
			temperature = temperature / (n * R);
			return temperature;
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
					tempx = Math.floor(Math.random()*this.width);
					tempy = Math.floor(Math.random()*this.height);
					while(particleObstruct(tempx, tempy) == false){
						tempx = Math.floor(Math.random()*this.width);
						tempy = Math.floor(Math.random()*this.height);
					}
					this.particles.push(new Ball(tempx, tempy));
					// pushes new particles in random places, but the function particleObstruct makes sure that the random place isn't going to touch another particle
					// kinda inefficient
					// don't know how much it actually helps
				}
			}
		},
		canvasRender: function(){
			this.particles.forEach(p => p.draw());
		},
		update: function(){
			let tempxScale = this.xScale();
			// clears the rectangle that the particle currently occupies. Supposed to save more computing power
			// uses radius variable to ensure future changeability, could also potentially be linked in vue to mass and stuff to provide more variables to change
			this.particles.forEach(p => context.clearRect(p.x-(radius+1), p.y-(radius+1), 2*radius+2, 2*radius+2));
			this.particles.forEach((p,i) => p.bounce(p, i));
			this.particles.forEach(p => p.update(this.heating));
			if(this.track_particle == true){
				// draws the colorful circles as a trail
				context2.beginPath();
				context2.arc(this.particles[0].x, this.particles[0].y, 2, 0, 2*Math.PI, false);
				let speed = totalVelocity(this.particles[0].x_speed, this.particles[0].y_speed);
				// fills the circle depending on the speed, roughly corresponding to the picture scale by dividing by 8.
				// if speed/8 is less than 1, then the color scale will fit, and will return speed/8, otherwise if it's going to fast, it just returns 1 (purple) instead to prevent errors in the trail
				context2.fillStyle = colorscale((speed/8 < 1) ? speed/8 : 1);
				context2.fill();
				let newheight = this.maxwellDist(speed);
				d3.select(".velocity").attr("height", yScale(1-this.maxwellDist(speed))).attr("x", tempxScale(speed)).attr("y", yScale(newheight)).attr("visibility", "visible");
			}
			else {
				d3.select(".velocity").attr("visibility", "hidden");
			}
		},
		animate: function(thing){
			// animation frame is native and it allows for the animation to stop when focus is on another area
			let animation = window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			function(callback){
				window.setTimeout(callback, 1000/this.fps);
			};
			return animation(thing);
		},
		maxwellDist: function(velocity){
			/* Maxwell Boltzman graph: */
			let probability = 4 * Math.PI * Math.pow((mass / (2 * Math.PI * k * this.measuredTemp)), 1.5) * Math.pow(velocity, 2) * Math.pow(Math.E, (-(mass * Math.pow(velocity, 2)) / (2 * k * this.measuredTemp)));
			return probability;
		},
		maxSpeed: function(){
			let maxspeed = 5;
			if(this.measuredTemp < 100){
				maxspeed = 5;
			}
			else if(this.measuredTemp < 400){
				maxspeed = 10;
			}
			else if(this.measuredTemp < 1000){
				maxspeed = 15;
			}
			else{
				maxspeed = 20;
			}
			return maxspeed;
		},
		xScale: function(){
			return d3.scaleLinear().domain([0, this.maxSpeed()]).range([0, graphwidth]);
		},
		updateGraph: function(){
			let numberList = Array.from(Array(this.maxSpeed() * 50 + 1).keys());
			let velocityList = numberList.map((element) => {return element/50;});
			let tempxScale = this.xScale();
			d3.select(".xAxis").call(d3.axisBottom(tempxScale));
			let line = d3.line()
				.x(function(d){return tempxScale(d);})
				.y(function(d){return yScale(app.maxwellDist(d));});
			d3.select(".probability").attr("d", line(velocityList));
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
		},
		measuredTemp: function(){
			this.updateGraph();
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

function randNeg(){ // needed to generate negative sign randomly for more interesting things.
	return Math.floor(Math.random()*2) == 1 ? 1 : -1;
}
function totalVelocity(x, y){ // to make code easier to read
	return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}
function particleObstruct(particle){
	for(let i = 0; i < this.particlenum; i++){
		if(particle.x < app.particles[i].x + radius || particle.x > app.particles[i].x - radius){

		}
	}
}
function particleObstruct(x, y){
	for(let i = 0; i < this.particlenum; i++){
		if(x < app.particles[i].x + radius && x > app.particles[i].x - radius){
			if(y < app.particles[i].y + radius && y > app.particles[i].y - radius){
				return true;
			}
			else{
				return false;
			}
		}
		else{
			return false;
		}
	}
}