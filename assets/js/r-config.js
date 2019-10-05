({
	name: 'main',
	out: 'all.js',

	paths: {
		'jquery': 'lib/jquery.min',
		'jquery.fancybox': 'lib/jquery.fancybox.pack',
		'jquery.contextmenu': 'lib/contextmenu.min',
		'bootstrap': 'lib/bootstrap.min',
		'ace': 'lib/src-min/ace',
		'encoding': 'lib/encoding.min',
		'toastr': 'lib/toastr.min',
		'notify': 'lib/notify'
	},

	shim: {
		'jquery.contextmenu': ['jquery'],
		'jquery.fancybox': ['jquery'],
		'bootstrap': ['jquery']
	}
})