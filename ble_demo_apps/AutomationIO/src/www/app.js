window.ionic.Platform.ready(function() 
{
    angular.bootstrap(document, ['bleApplication']);
});

angular.module('bleApplication', ['ionic', 'bleApplication.controllers'])

.config(function($stateProvider, $urlRouterProvider) 
{
    $stateProvider

    .state('app', 
	{
		url: "/app",
		abstract: true,
		templateUrl: "app/menu.html",
		controller: 'ApplicationController'
    })
	
	.state('app.home', 
	{
		url: "/home",
		views: 
		{
			'menuContent' :
			{
				templateUrl: "app/home.html",
				controller: 'HomeController'
			}
		}
    })
	
	.state('app.pins', 
	{
		url: "/pins",
		views: 
		{
			'menuContent' :
			{
				templateUrl: "app/pins.html",
				controller: 'PinsController'
			}
		}
    })
	
	.state('app.boards', 
	{
		url: "/boards",
		views: 
		{
			'menuContent' :
			{
				templateUrl: "app/boards.html",
				controller: 'BoardsController'
			}
		}
    })
	
	.state('app.console', 
	{
		url: "/console",
		views: 
		{
			'menuContent' :
			{
				templateUrl: "app/console.html",
				controller: 'ConsoleController'
			}
		}
    })
	
	.state('app.about', 
	{
		url: "/about",
		views: 
		{
			'menuContent' :
			{
				templateUrl: "app/about.html",
				controller: 'AboutController'
			}
		}
    })
	
    .state('app.close', 
	{
		url: "/close",
		views: 
		{
			'menuContent' :
			{
				templateUrl: "app/close.html",
				controller: 'CloseController'
			}
		}
    })
	
	$urlRouterProvider.otherwise('/app/home');
});
