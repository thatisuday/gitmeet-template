const
    express     	=       require('express'),
    mongoose    	=       require('mongoose'),
    bcryptjs    	=       require('bcryptjs'),
    randomstring    =       require('randomstring'),
    _    			=       require('lodash')
;

var router = express.Router();
var categories = require('./constants/categories');
var postModel = require('./schemas/post');
var adminModel = require('./schemas/admin');


/**********************************************************/


// Check authorization
var checkAdmin = function(req, res, next){
	var authToken = req.get('authToken');
	if(!authToken){
		return res.status(401).send('authToken is missing.');
	}

	adminModel
	.findOne({
		authToken : authToken
	})
	.exec(function(err, doc){
		if(err) return res.status(500).send(err);
		if(_.isEmpty(doc)) return res.status(403).send('Admin does not exist.');
		next();
	});	
}


/**********************************************************/


// Check if admin is signed in
router.get('/admin/check-session', checkAdmin, function(req, res){
    res.sendStatus(200);
});


// Get access token
router.post('/admin/signin', function(req, res){
	if(!_.has(req.body, 'username') || !_.has(req.body, 'password')){
		return res.sendStatus(406);
	}

	adminModel
	.findOne({
		username : req.body.username
	})
	.exec(function(err, doc){
		if(err) return res.status(500).send(err);
		if(_.isEmpty(doc)) return res.sendStatus(401);

		// compare passwords
		if(bcryptjs.compareSync(req.body.password, doc.password)){
			// update auth token
			var authToken = randomstring.generate(30);
			doc.authToken = authToken;
			doc.save(function(err){
				if(err) return res.status(500).send(err);

				// send auth token
				return res.send(authToken);
			});
		}
		else{
			return res.sendStatus(403);
		}
	});
});


// Add a post
router.post('/admin/post', checkAdmin, function(req, res){
    var post = new postModel(req.body);

    post.save(function(err, doc){
        if(err) return res.status(500).send(err);
        return res.status(201).json(doc);
    });
});


// Edit a post
router.put('/admin/post/:postId', checkAdmin, function(req, res){
    postModel
    .findOne({
        postId : req.params.postId
    })
    .exec(function(err, doc){
        if(err) return res.status(500).send(err);
        _.assign(doc, req.body);
        
        doc.save(function(err, _doc){
            if(err) return res.status(500).send(err);
            return res.json(_doc);
        });
    });
});


// Delete a post
router.delete('/admin/post/:postId', checkAdmin, function(req, res){
    postModel
    .findOne({
        postId : req.params.postId
    })
    .exec(function(err, doc){
        if(err) return res.status(500).send(err);
        
        doc.remove(function(err){
            if(err) return res.status(500).send(err);
            return res.sendStatus(200);
        });
    });
});


/**********************************************************/


// Router
router.get('/categories', function(req, res){
    res.json(categories);
});

// Get a post
router.get('/post/:postId', function(req, res){
    postModel
    .findOne({
    	postId : req.params.postId
    })
    .exec(function(err, doc){
    	if(err) return res.status(500).send(err);
        if(_.isEmpty(doc)) return res.sendStatus(404);
    	return res.json(doc);
    });
});


// Get multiple posts
router.get('/posts', function(req, res){
    
    // Pick acceptable value from query string params
    var query = _.pick(req.query, ['postId', 'nPostId', 'category', 'tags', 'search']);
    
    // Change values based on key
    $query = _.mapValues(query, function(val, key){
        // ignore a postId
        if(key == 'nPostId') return {
			$ne : val
        };

        // match by tags in array
        if(key == 'tags'){
        	// if tags given in string,
        	// split by comma into array
        	if(_.isString(val)){
        		return {
		            $in : _.split(val, ',')
		        };
        	}

        	return {
	            $in : val
	        };
        }

        // match by search term
        if(key == 'search') return [
            {title : new RegExp(val, 'i')},
            {description : new RegExp(val, 'i')},
            {tags : {$in : [new RegExp(val, 'i')]}}
        ];
        
        return val;
    });


    // Change keys
    $query = _.mapKeys($query, function(val, key){
        if(key == 'nPostId') return 'postId';
        if(key == 'search') return '$or';
        return key;
    });


    // skip & limit
    var skip = _.toInteger(req.query.skip) || 0;
    var limit = _.toInteger(req.query.limit) || 20;


    // perform db query
    postModel
    .find($query)
    .sort({createdAt : -1})
    .skip(skip)
    .limit(limit)
    .select('-content')
    .exec(function(err, docs){
        if(err) return res.status(500).send(err);
        return res.json(docs);
    });
});


/**********************************************************/


module.exports = router;