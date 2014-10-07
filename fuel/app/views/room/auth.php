<!DOCTYPE html>
<html lang="ja">
<head>
<?php echo $head ?>

  <title>Ko-cha | 認証</title>

<?php
	echo Asset::css('lib/bootstrap.min.css');
	echo Asset::css("common.css");
	echo Asset::css("chat.css");
?>
</head>

<body>
<?php echo $header ?>
<div class="container">

	<form method="post" action="<?php echo Uri::current() ?>" id="js_room_auth">
		<div class="modal-content">
		  <div class="modal-header">
		    <h3 class="modal-title" id="startPairProgrammingLabel"><?php echo isset($message) ? $message : "パスワードを入力してください" ?></h3>
		  </div>

		  <div class="modal-body">
			<div class="input-group input-group">
				<span class="input-group-addon">パスワード</span>
				<input type="password" class="form-control" name="password">
				<div class="hidden type">pair_programming</div>
			</div>
		  </div>
		  <div class="modal-footer">
		    <button type="submit" class="btn btn-primary js_submit">ログイン</button>
		  </div>
		</div>
	</form>
</div>
<?php echo $footer ?>
<?php
	echo Asset::js('lib/jquery.min.js');
	echo Asset::js('lib/bootstrap.min.js');
	echo Asset::js("sdk/sdk.js");
?>
</body>
</html>
