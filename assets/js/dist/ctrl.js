/*!
 *	@author      Uday Hiwarale <uday hiwarale@gmail.com>
 *	@profile     https://github.com/thatisuday
 *	@link        http://gitmeet.com
 * 	@version     1.0.1
 * 	@license     MIT License, http://www.opensource.org/licenses/MIT
**/


angular
.module('gitmeet')
.controller('admin-add-post',
    ['$scope', '$http', '$state', '$location', '$timeout',
    function($scope, $http, $state, $location, $timeout){
    
    $scope.postData = {
        content : "#Hello World!" 
    };
    
    $timeout(function(){
        $('.stater-admin-add-post .menu .item').tab();
    });

    $scope.savePost = function(){
        var authToken = window.localStorage.getItem('authToken');
        if(!authToken){
            return alert('You are not signed in.');
        }

    	$http({
    		url : '/api/admin/post',
    		method : 'POST',
    		data : $scope.postData,
            headers : {
                authToken :  authToken
            }
    	})
    	.then(function(res){
    		if(res.status == 201){
                return $location.url('/post/' + res.data.postId);
            }

            return alert(res.data);
    	},
    	function(err){
    		alert(err.data);
    	});
    }


    /*
     *  dropzone
    **/
    $scope.dzOptions = {
        url : '/api/image',
        previewsContainer : false,
        clickable : '#add-image',
        headers : {
            authToken :  window.localStorage.getItem('authToken')
        }
    };

    $scope.dzCallbacks = {
        'success' : function(file, url){
            window.prompt('copy url', url);
        }
    };
}]);
angular
.module('gitmeet')
.controller('admin-edit-post',
    ['_postData', '$scope', '$http', '$state', '$location', '$timeout',
    function(_postData, $scope, $http, $state, $location, $timeout){
   
    $scope.postData = _postData;
    $scope.isEdit = true;
    
    $timeout(function(){
        $('.stater-admin-edit-post .menu .item').tab();
    });

    $scope.savePost = function(){
        var authToken = window.localStorage.getItem('authToken');
        if(!authToken){
            return alert('You are not signed in.');
        }

    	$http({
    		url : '/api/admin/post/' + _postData.postId,
    		method : 'PUT',
    		data : $scope.postData,
            headers : {
                authToken :  authToken
            }
    	})
    	.then(function(res){
    		$location.url('/post/' + res.data.postId);
    	},
    	function(err){
            console.log(err.data);
    		alert(err.data);
    	});
    }


    $scope.deletePost= function(){
        if(!confirm('are you sure????')){
            return false;
        }

        var authToken = window.localStorage.getItem('authToken');
        if(!authToken){
            return alert('You are not signed in.');
        }

        $http({
            url : '/api/admin/post/' + _postData.postId,
            method : 'Delete',
            headers : {
                authToken :  authToken
            }
        })
        .then(function(res){
            $location.url('/');
        },
        function(err){
            console.log(err.data);
            alert(err.data);
        });
    }


    /*
     *  dropzone
    **/
    $scope.dzOptions = {
        url : '/api/image',
        previewsContainer : false,
        clickable : '#add-image',
        headers : {
            authToken :  window.localStorage.getItem('authToken')
        }
    };

    $scope.dzCallbacks = {
        'success' : function(file, url){
            window.prompt('copy url', url);
        }
    };
}]);
angular
.module('gitmeet')
.controller('admin-signin', ['$scope', '$http', '$state', '$timeout', function($scope, $http, $state, $timeout){
    $scope.signinData = {};
    
    $scope.signin = function(){
    	$http({
    		url : '/api/admin/signin',
    		method : 'POST',
    		data : $scope.signinData
    	})
    	.then(function(res){
    		window.localStorage.setItem('authToken', res.data);
    		window.location.reload();
    	},
    	function(err){
    		if(err.status == 500) return alert(err.data);
    		if(err.status == 401) return alert('username not valid.');
    		if(err.status == 403) return alert('password not valid.');
    		if(err.status == 406) return alert('no data received.');
    	});
    }
}]);
angular
.module('gitmeet')
.controller('home', ['$scope', '$location', function($scope, $location){
	
	// Open search dialog
	// and redirect user to search page
	$scope.openSearch = function(){
		var query = prompt('What do you want to search?', 'type here...');
		$location.url('/search/' + query);
	}
}]);
angular
.module('gitmeet')
.controller('post', ['_postData', '$scope', '$http', function(_postData, $scope, $http){
	// store post data
	$scope.postData = _postData;

	// store similar posts
	$scope.similarPosts = [];

	// Load similar posts
	$http({
		url : '/api/posts',
		method : 'GET',
		params : {
			nPostId : _postData.postId,
			tags : _postData.tags,
			limit : 6
		}
	})
	.then(function(res){
		$scope.similarPosts = res.data;
	});
}]);
angular
.module('gitmeet')
.controller('posts',
	['__home_ignore_categories', '$scope', '$http', '$state', '$stateParams',
	function(__home_ignore_categories, $scope, $http, $state, $stateParams){

	// score posts in `posts` var
	$scope.posts = [];

	// set to `true` on posts fetch complete
	$scope.postLoaded = false;

	// query string param to send with request
	// skip and limit counters
	$scope.params = {
		skip : 0,
		limit : 10,
	}

	// if category page, add category to the request
	if(_.has($stateParams, 'category')){
		$scope.params.category = $stateParams.category;
	}

	// if tag page, add tags to the request
	if(_.has($stateParams, 'tag')){
		$scope.params.tags = $stateParams.tag;
	}

	// if search page, add search to the request
	if(_.has($stateParams, 'search')){
		$scope.params.search = $stateParams.search;
	}

	// if home controller, remove `life` & `news` category from posts
	if($state.current.name == 'home'){
		$scope.params.nCategories = __home_ignore_categories;
	}

	// post loader ajax function
	($scope.loadPosts = function(more){
		// if more is true, append posts
		if(more){
			$scope.params.skip = $scope.params.skip + $scope.params.limit;
		}

		$http({
			url : '/api/posts',
			method : 'GET',
			params : $scope.params
		})
		.then(function(res){
			$scope.posts = _.concat($scope.posts, res.data);
			$scope.postLoaded = true;
		})
	})(false);	
}]);