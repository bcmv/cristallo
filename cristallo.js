
var WEBSITE_LIVE = true;

/**
 * Module dependencies.
 */

var express = require('express') , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , _ = require('underscore')
  , MongoStore = require('connect-mongo')(express)
  , async = require('async')
  , jade_browser = require('jade-browser')
  , moment = require('moment')
_.str = require('underscore.string');

var cms = require('./lib/cms');
cms.add('website_administration',{
	single:true,
	fields:{
		contact:{type:'string', multi:true, rtl:true},
		image:{
			type:'image', 
			maintain_ratio:true,   
			crop_width:455,
			crop_height:415
		},		
		mobile:{type:'string'},
		phone:{type:'string'},
		fax:{type:'string'},
		twitter:{type:'string'},
		facebook:{type:'string'},
		google_analytics:{type:'string', multi:true}
	}
});
cms.add('website_about',{
	fields:{
		name:{type:"string"},
		article:{type:'string', multi:true, rtl:true},
		image:{
			type:'image', 
			maintain_ratio:false,   
			crop_width:1170, 
			crop_height:550, 
			sizes:[
				{
					prefix:"medium", 
					width:240, 
					height:180,
				}, 
				{
					prefix:"mediumbig", 
					width:370, 
					height:370
				}
			]
		}		
	}
});

cms.add('website_news',{
	fields:{
		name:{type:"string"},
		description:{type:'string', multi:true},
		article:{type:'string', multi:true, rtl:true},
		image:{
			type:'image', 
			maintain_ratio:false,   
			crop_width:680, 
			crop_height:400, 
			sizes:[
				{
					prefix:"medium", 
					width:240, 
					height:180,
				}, 
				{
					prefix:"mediumbig", 
					width:370, 
					height:370
				}
			]
		}		
	}
});
cms.add('website_services',{
	fields:{
		name:{type:"string"},
		description:{type:'string', multi:true},
		article:{type:'string', multi:true, rtl:true},
		image:{
			type:'image', 
			maintain_ratio:false,   
			crop_width:680, 
			crop_height:400, 
			sizes:[
				{
					prefix:"medium", 
					width:240, 
					height:180,
				}, 
				{
					prefix:"mediumbig", 
					width:370, 
					height:370
				}
			]
		}		
	}
});
cms.add('website_subservices',{
	fields:{
		name:{type:"string"},
		parent:{type:'select', source:'website_services.name'},
		description:{type:'string', multi:true},
		article:{type:'string', multi:true, rtl:true},
		image:{
			type:'image', 
			maintain_ratio:false,   
			crop_width:680, 
			crop_height:400, 
			sizes:[
				{
					prefix:"medium", 
					width:240, 
					height:180,
				}, 
				{
					prefix:"mediumbig", 
					width:370, 
					height:370
				}
			]
		}		
	}
});

cms.add('website_slides',{
	fields:{
		name:{type:"string"},
		description:{type:'string', multi:true, rtl:false},
		image:{
			type:'image', 
			maintain_ratio:false,   
			crop_width:680, 
			crop_height:400, 
			sizes:[
				{
					prefix:"medium", 
					width:240, 
					height:180,
				}, 
				{
					prefix:"mediumbig", 
					width:370, 
					height:370
				}
			]
		}		
	}
});

cms.add('website_projects',{
	fields:{
		name:{type:"string"},
		description:{type:'string', multi:true},
		images:{
			type:'images', 
			maintain_ratio:false,   
			manualcrop:false,
			crop_width:680, 
			crop_height:400, 
			sizes:[
				{
					prefix:"medium", 
					width:240, 
					height:180,
				}, 
				{
					prefix:"mediumbig", 
					width:370, 
					height:370
				}
			]
		}		
	}
});


cms.add('downloads_forms',{
	fields:{
		name:{type:"string"},
		file:{type:'file'},
		description:{type:'string', multi:'true'}	
	}
});

cms.add('downloads_announcements',{
	fields:{
		name:{type:"string"},
		file:{type:'file'},
		description:{type:'string', multi:'true'}	
	}
});


cms.add('subscription_list',{
	single:true,
	readonly:true,
	fields:{
		name:{
			type:"table",
			readonly:true,
			columns:1,
			rows:1			
		}
	}
});
cms.run(function(){
	//setup pre requisites
	cms
	.subscription_list
	.findOne({},function(err, doc){
		if (err) throw err;
		if(!doc){
			new cms
			.subscription_list({name:{rows:[], columns:["Emails"]}})
			.save(console.log);	
		}
	});
});

var app = express();

// all environments
app.set('port', process.env.PORT || 3067);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.compress());
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.cookieParser("herro"));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.session({secret:"herro",store: new MongoStore({url:'mongodb://127.0.0.1:27017/poolchemicals'}), cookie: { maxAge: 600000000 ,httpOnly: false, secure: false}}));
app.use(express.methodOverride());
app.use(jade_browser('/modals/packages.js', 'package*', {root: __dirname + '/views/modals', cache:false}));	
app.use(jade_browser('/modals/products.js', 'product*', {root: __dirname + '/views/modals', cache:false}));	
app.use(jade_browser('/templates.js', '**', {root: __dirname + '/views/components', cache:false}));	
app.use(function(req, res, next){
  	res.header('Vary', 'Accept');
	next();
});	
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

cms.listen(app);


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res){
	if(WEBSITE_LIVE == false){
		res.render('comingsoon');
	}else{
		async.auto({
			administration:function(fn){
				cms
				.website_administration
				.findOne()
				.lean()
				.exec(fn);	
			},
			news:function(fn){
				cms
				.website_news
				.find()
				.sort({_id:-1})
				.limit(4)
				.lean()
				.exec(function(err, articles){
					if(err) return fn(err);
					articles = _.map(articles, function(article){
						//TODO: t
						//extract time from objectid
						
						return article;
					});
					fn(null,articles);
				});	
			},
			slides:function(fn){
				cms
				.website_slides
				.find()
				.sort({_id:-1})
				.limit(4)
				.lean()
				.exec(fn);	
			},
			services:function(fn){
				cms
				.website_services
				.find()
				.sort({_id:-1})
				.limit()
				.lean()
				.exec(function(err, s){
					var sel = [];
					while(sel.length < 1){
						var pos = s.length-1;
						pos = ~~(Math.random()*pos)+1
						sel.push(s[pos]);
						delete s[pos];
					}
					console.log(sel)
					fn(null, sel)
				});	
			},
			project:function(fn){
				cms
				.website_projects
				.find()
				.sort({_id:-1})
				.lean()
				.exec(function(err, d){
					fn(null, d[~~(Math.random()*d.length)]);
				});	
			},
			top_news:function(fn){
				cms.website_news
				.findOne()
				.sort({views:-1})
				.lean()
				.exec(fn)
			}
		},function(err, page){
			res.render('index',page);
		});
	}
});
app.get('/services', function(req, res){
	cms
	.website_services
	.find()
	.lean()
	.exec(function(err, data){
		cms
		.website_subservices
		.find()
		.lean()
		.exec(function(err, subs){
			data = data.map(function(d){
				d.subservices = [];
				d.subservices = subs.filter(function(s){return s.parent.name == d.name});
				return d;
			})
			console.log(data);
			res.render('services',{affix:data});
		});

	});
});
app.get('/service/:id', function(req, res){
	cms
	.website_services
	.findOne({_id:req.params.id})
	.lean()
	.exec(function(err, data){
		cms
		.website_subservices
		.find({"parent.name":data.name})
		.lean()
		.exec(function(err, subs){
			console.log(subs)
			res.render('subservices',{affix:subs, service:data});
		});

	});
});
app.get('/news', function(req, res){
	cms
	.website_news
	.find()
	.lean()
	.exec(function(err, data){
		res.render('news',{affix:data});
	});


});
app.get('/projects', function(req, res){
	cms
	.website_projects
	.find()
	.lean()
	.exec(function(err, data){
		res.render('projects',{affix:data});
	});

});
app.get('/news/:id', function(req, res){
	async.auto({
		item:function(fn){
			cms
			.website_news
			.findById(req.params.id)
			.lean()
			.exec(fn);
		},
		archive:function(fn){
			cms
			.website_news
			.find({},{name:1})
			.sort({_id:-1})
			.lean()
			.exec(function(err, docs){
				var d = _.map(docs,function(d){
					d.year = new Date(parseInt(d._id.toString().slice(0,8), 16)*1000).getFullYear();
				});
				d = _.groupBy(docs, 'year');
				fn(null, d);
			});

		}
	},function(err, page){
		res.render('news-item', page);
	})
	cms
	.website_news
	.update({_id:req.params.id},{$inc:{views:1}},function(err,d){});
});
app.get('/gallery/:id', function(req, res){
	async.auto({
		item:function(fn){
			cms
			.website_gallery
			.findById(req.params.id)
			.lean()
			.exec(fn);
		},
		archive:function(fn){
			cms
			.website_gallery
			.find({},{name:1})
			.sort({_id:-1})
			.lean()
			.exec(function(err, docs){
				var d = _.map(docs,function(d){
					d.year = new Date(parseInt(d._id.toString().slice(0,8), 16)*1000).getFullYear();
				});
				d = _.groupBy(docs, 'year');
				fn(null, d);
			});

		}
	},function(err, page){
		res.render('gallery-item', page);
	})

});
app.get('/downloads', function(req, res){
	res.render('downloads');
});
app.get('/contact', function(req, res){
	cms
	.website_administration
	.findOne()
	.lean()
	.exec(function(err, doc){
		res.render('contact',{administration:doc});
	});

});
app.get('/about-us', function(req, res){
	cms
	.website_about
	.find()
	.lean()
	.exec(function(err, data){
		res.render('about',{affix:data});
	});
});



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
