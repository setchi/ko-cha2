<!DOCTYPE html>
<html lang="ja">
  <head>
	<meta charset="UTF-8">
	<title>アイコン画像適用中</title>
  </head>
  <body>
  	適用中...
	<script>
	window.opener.require(['jquery', 'connection'], function ($, connection) {
		connection.send({
			type: 'update_image',
			data: <?php echo json_encode($data) ?>
		}, true);

		close();
	});
	</script>
  </body>
</html>
