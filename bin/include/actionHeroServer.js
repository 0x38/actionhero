exports['actionHeroServer'] = function(binary, next){
	try{
		var actionHero = require("actionHero").actionHero;
	}catch(e){
		var actionHero = require("../../api.js").actionHero;
	}

	var cluster = require('cluster');

	// if there is no config.js file in the application's root, then actionHero will load in a collection of default params.
	// You can overwrite them with params.configChanges
	var params = {};
	params.configChanges = {};

	// start the server!
	var startServer = function(next){
		if(cluster.isWorker){ process.send("starting"); }
		actionHero.start(params, function(err, api_from_callback){
			if(err){
				console.log(err);
				process.exit();
			}else{
				api = api_from_callback;
				api.log("Boot Sucessful @ worker #" + process.pid, "green");
				if(typeof next == "function"){
					if(cluster.isWorker){ process.send("started"); }
					next(api);
				}
			}
		});
	}

	// handle signals from master if running in cluster
	if(cluster.isWorker){
		process.on('message', function(msg) {
			if(msg == "start"){
				process.send("starting");
				startServer(function(){
					process.send("started");
				});
			}
			if(msg == "stop"){
				process.send("stopping");
				actionHero.stop(function(err, api_from_callback){
					api = null;
					process.send("stopped");
					process.exit();
				});
			}
			if(msg == "restart"){
				process.send("restarting");
				actionHero.restart(function(err, api_from_callback){
					api = api_from_callback;
					process.send("restarted");
				});
			}
		});
	}

	// start the server!
	startServer(function(api){
		api.log("Successfully Booted!", ["green", "bold"]);
		next();
	});

}