<?php
return array(
	'_root_'  => 'home/index',  // The default route
	'_404_'   => 'home/404',    // The main 404 route
	
	'([a-zA-Z0-9]{4})/chat/(push|watch)'  => array(
		array('POST', new Route('chat/$2/$1')),
	),

	'([a-zA-Z0-9]{4})'  => array(
		array('GET', new Route('room/view/$1')),
		array('POST', new Route('room/view/$1')),
	),
);
