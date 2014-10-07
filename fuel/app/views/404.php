<!DOCTYPE html>
<html lang="ja">
<head>
<?php echo $head; ?>

  <title>404 Not Found</title>

<?php
	echo Asset::css("lib/bootstrap.min.css");
	echo Asset::css("common.css");
?>
</head>

<body>
<?php echo $header; ?>
<div class="container">
	<div class="jumbotron">
		<h1>404 Not Found</h1>
		<p>URLが変更されたか、削除された可能性があります。</p>
		<p><a href="/ko-cha2/">&raquo;&nbsp;トップに戻る</a></p>
	</div>
<?php echo $footer; ?>
</div>

<?php
	echo Asset::js("lib/jquery.min.js");
	echo Asset::js("lib/bootstrap.min.js");
	echo Asset::js("sdk/sdk.js");
?>
</body>
</html>
