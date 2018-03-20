// object definition
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
	},
	methods: {
		adjustParticles: function(){
			if(this.particlenum < this.particles.length){
				this.particles.splice(0, this.particles.length - this.particlenum);
			}
			else{
				for(let i = 0; i < this.particlenum - this.particles.length; i++){
					this.particles.push(new Ball(0, 0));
				}
			}
		},
		canvasRender: function(){
			context.clearRect(0, 0, width, height);
			this.particles.forEach(p => p.draw());
		}
	},
	watch: {
		particlenum: function(){
			this.adjustParticles();
		}
	},
	mounted: function(){
		for(let i = 0; i < this.particlenum; i++){
			this.particles.push(new Ball(i*5%width, i*5%height));
		}
		this.canvasRender();
	}
});