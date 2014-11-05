require.config({
	baseUrl: 'assets/js/',

	paths: {
		'jquery': [
			'//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min',
			'lib/jquery.min.js'
		],
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
});


require([
	'jquery',
	'bootstrap',
	'lib/sdk/sdk'
], function ($) {


/*
 * 全ページ共通処理
 */

$(function () {
	var $modal = null, pathName = location.pathname;

	$('[data-toggle="modal"]').mousedown(function () {
		$modal = $($(this).data('target'));
		$modal.find('input').focus();
		$modal.find('.panel2').text('').hide();
		$modal.find('.js_modal_send').show();
		$modal.find('.panel1').show();
	});

	$('.js_email_send').click(function () {
		var sending = false;
			return function () {
			var message = $modal.find('textarea').val();

			if (message && !sending) {
				sending = true;

				$.post(pathName + 'email/send.json', {
					'body': message

				}, function ($modal) {
					return function (msg) {
						sending = false;
						$modal.find('.panel1').hide();
						$modal.find('.js_email_send').hide();
						$modal.find('textarea').val('');
						$modal.find('.panel2').text(msg['msg']).show();
					}
				}($modal));
			}
		}
	}());

	$('.modal').find('form').submit(function () {return false;})
});

});
