<?php

return array(

	'path' => '/ko-cha/auth/login/',
	'security_salt' => '', // デフォルトで設定されている値と違うものにする　※同じ場合動作しない
	'callback_url' => '/ko-cha/auth/callback/',

	'Strategy' => array(
	    'Facebook' => array(
	        'app_id' => '',
	        'app_secret' => ''
	    ),
//*
		'Twitter' => array(
			'key' => '',
			'secret' => ''
		),// */
		
		'Github' => array(
		    'client_id' => '',
		    'client_secret' => ''
		),
	),
);
