var app = angular.module('app', ['ngRoute', 'ngSanitize']);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

    $routeProvider
        .when('/', {
            templateUrl: swift.templates + '/index.html',
            controller: 'Index'
        })
        .when('/:slug/', {
            templateUrl: swift.templates + '/single.html',
            controller: 'Single'
        })
        .when('/category/:category/', {
            templateUrl: swift.templates + '/index.html',
            controller: 'Category'
        })
        .when('/category/:category/page/:page/', {
            templateUrl: swift.templates + '/index.html',
            controller: 'Category'
        })
        .when('/page/:page/', {
            templateUrl: swift.templates + '/index.html',
            controller: 'Index'
        })
        .otherwise({
            templateUrl: swift.templates + '/404.html',
            controller: '404'
        });

    $locationProvider.html5Mode(true);

}]);

app.controller('Index', ['$scope', '$http', '$routeParams', '$wpService', function($scope, $http, $routeParams, $wpService) {
    $wpService.getAllCategories();
    $wpService.getPosts($routeParams.page);
    $scope.data = $wpService;
}]);

app.controller('404', function() {
    document.querySelector('title').innerHTML = 'Page not found | ' + swift.site_name;
});

app.controller('Category', ['$scope', '$http', '$routeParams', '$wpService', function($scope, $http, $routeParams, $wpService) {
    $wpService.getAllCategories();
    $http.get(swift.root + '/wp-json/wp/v2/categories?slug=' + $routeParams.category).success(function(res) {
        $wpService.getPostsInCategory(res[0], $routeParams.page);
    });
    $scope.data = $wpService;
}]);

app.controller('Single', ['$scope', '$http', '$routeParams', function($scope, $http, $routeParams) {
    $http.get(swift.root + '/wp-json/wp/v2/posts?filter[name]=' + $routeParams.slug).success(function(res) {
        $scope.post = res[0];
        document.querySelector('title').innerHTML = res[0].title.rendered + ' | ' + swift.site_name;
    });
}]);

app.filter('toTrusted', ['$sce', function($sce) {
    return function(text) {
        return $sce.trustAsHtml(text);
    };
}]);

app.directive('swiftSearchForm', function() {
    return {
        restrict: 'E', // E = element, A = attribute, C = classname
        templateUrl: swift.templates + '/search-form.html',
        controller: ['$scope', '$http', '$wpService', function($scope, $http, $wpService) {
            $scope.filter = {
                s: ''
            };
            $scope.search = function() {
                $wpService.getSearchResults($scope.filter.s);
            };
        }]
    };
});

app.directive('postsNavLink', function() {
    return {
        restrict: 'E',
        templateUrl: swift.templates + '/posts-nav-link.html',
        controller: ['$scope', '$element', '$routeParams', function($scope, $element, $routeParams) {
            var currentPage = !$routeParams.page ? 1 : parseInt($routeParams.page),
                linkPrefix = !$routeParams.category ? 'page/' : 'category/' + $routeParams.category + '/page/';

            $scope.postsNavLink = {
                prevLink: linkPrefix + (currentPage - 1),
                nextLink: linkPrefix + (currentPage + 1),
                sep: !$element.attr('sep')? '|' : $element.attr('sep'),
                prevLabel: !$element.attr('prev-label') ? 'Previous' : $element.attr('prev-label'),
                nextLabel: !$element.attr('next-label') ? 'Next' : $element.attr('next-label')
            };
        }]
    };
});

app.factory('$wpService', ['$http', function($http) {
    var WpService = {
        categories: [],
        posts: [],
        currentPage: 1,
        totalPages: 1
    };

    function _setArchivePage(posts, page, headers) {
        WpService.posts = posts;
        WpService.currentPage = page;
        WpService.totalPages = headers('x-wp-totalpages');
    }

    WpService.getAllCategories = function() {
        if (WpService.categories.length) {
            return;
        }
        return $http.get(swift.root + '/wp-json/wp/v2/categories').success(function(res) {
            WpService.categories = res;
        });
    };

    WpService.getPosts = function(page) {
        page = !page ? 1 : parseInt(page);
        return $http.get(swift.root + '/wp-json/wp/v2/posts?per_page=4&page=' + page).success(function(res, status, headers) {
            _setArchivePage(res, page, headers);
        });
    };

    WpService.getSearchResults = function(s) {
        return $http.get(swift.root + '/wp-json/wp/v2/posts?per_page=-1&filter[s]=' + s).success(function(res, status, headers) {
            _setArchivePage(res, 1, headers);
        });
    };

    WpService.getPostsInCategory = function(category, page) {
        page = !page ? 1 : parseInt(page);
        return $http.get(swift.root + '/wp-json/wp/v2/posts?per_page=4&filter[category_name]=' + category.name + '&page=' + page).success(function(res, status, headers) {
            _setArchivePage(res, page, headers);
        });
    };

    return WpService;
}]);