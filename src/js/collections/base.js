define([ 'backbone', 'app/config', 'app/errors/not_implemented' ], function(Backbone, AppConfig, NotImplementedError){
	return Backbone.Collection.extend({
		fetching: false,

		url: function(){
			return AppConfig.endpoint;
		},

		sync: function(method, collection, options){
			
			options = options || {};

			if((typeof AppConfig.cors !== 'undefined') && AppConfig.cors){
				options = _.extend(options, { crossDomain: true });				
			}

			if(method == 'read'){
				// See http://stackoverflow.com/questions/8970606/accessing-parent-class-in-backbone
				// and http://backbonejs.org/#Collection-sync
				return Backbone.Collection.prototype.sync.apply(this, [ method, this, options ]);

			} else {
				throw new NotImplementedError();
			}
		},

		/**
		 * retriveItemThen
		 * Attempts to retrive a given item (via a get callback) and pass it to a success call back.
		 * If item is not found, will attempt to fetch from API and then call the success.
		 * error callback will be fired if item still doesn't exist.
		 *
		 * @param options {"get":function(){}, "success":function(){}};
		 *
		 */
		retriveItemThen: function(options){
			// Ensure options is an object
			if(typeof options !== 'object') return false;

			// Stub all required methods (if they are not provided)
			if(typeof options.get !== 'function') options.get = function(){ return false; };
			if(typeof options.success !== 'function') options.success = function(){};
			if(typeof options.error !== 'function') options.error = function(){};

			var $this = this;

			// When data is ready, do this
			var onComplete = function(){
				// finish the fetch
				$this.fetching = false;
				// try and "get" data again
				data = options.get();
				if(data) return options.success(data);
				return options.error();	
			};

			// Try and get data
			var data = options.get();

			// Attempt to get data and run callbacks
			if(data){
				return options.success(data);
			}

			// Are we already doing a fetch?
			if(this.fetching)
			{
				this.once('sync', function(){
					return onComplete();
				});
			}
			else
			{
				//  Start zee fetch
				this.fetching = true;

				// Go get data
				this.fetch({
                    cache: true,
                    expires: 86400,
					"success": function(){
						$this.fetching = false;
						return onComplete();			
					},
					"error": function(){ 
						$this.fetching = false;
						return options.error(); 
					}
				});
			}

			// Everything worked :)
			return true;
		},
	});
});