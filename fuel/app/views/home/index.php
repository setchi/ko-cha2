<!DOCTYPE html>
<html lang="ja">
<head>
<?php echo $head ?>

  <title>Ko-cha</title>

<?php
	echo Asset::css('lib/bootstrap.min.css');
	echo Asset::css("common.css");
	echo Asset::css("index.css");
?>
</head>

<body>
<?php echo $header ?>
<div class="container">
	<div class="panel panel-default index-header">
		<div class="media">
			<img class="media-object pull-left col-xs-12 col-sm-4 col-md-3" src="<?php echo $base_url ?>assets/img/icon/kocha-medium.png" alt="Ko-cha">
			<div class="caption">
				<h1 class="media-heading">Ko-cha2(β)</h1>
				<p>コードを交えたチャットを手軽に始められるWebアプリです。</p>
				<div class="btn btn-primary btn-lg" data-toggle="modal" data-target="#startPairProgramming">
				  チャットルームの作成
				</div>
			</div>
		</div>
	</div>
	<div class="alert alert-info" role="alert">当サイトは Ko-cha のリニューアル版です。前作は<a href="http://setchi.jp/ko-cha/" class="alert-link">こちら</a>。変更点は<a href="http://setchi-q.hatenablog.com/entry/2014/07/26/235455" class="alert-link">こちら</a>から。</div>

	<!-- Modal -->
	<div class="modal fade" id="startPairProgramming" tabindex="-1" role="dialog" aria-labelledby="startPairProgrammingLabel" aria-hidden="true">
	  <div class="modal-dialog">
	    <div class="modal-content">
	      <div class="modal-header">
	        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
	        <h4 class="modal-title" id="startPairProgrammingLabel">チャットルームの作成</h4>
	      </div>

	      <div class="modal-body panel1">
			<div class="input-group input-group">
				<span class="input-group-addon">部屋のパスワード</span>
				<input type="password" class="form-control" placeholder="未入力の場合は全体公開になります">
				<div class="hidden type">pair_programming</div>
			</div>
	      </div>
	      <div class="modal-body panel2">
	      	<p>部屋が作成されました。下記のURLを共有して開始してください。</p>
	      	<div class="js_room_url"></div>
	      </div>

	      <div class="modal-footer">
	        <button type="submit" class="btn btn-primary js_create_room js_modal_send">部屋を作る</button>
	        <button type="button" class="btn btn-default" data-dismiss="modal">閉じる</button>
	      </div>
	    </div><!-- /.modal-content -->
	  </div><!-- /.modal-dialog -->
	</div><!-- /.modal -->

	<div class="panel panel-default js_ownership_room hidden">
		<div class="panel-heading">あなたが開催中のチャットルーム</div>
		<ul class="list-group js_ownership_room_list ownership_room_list">
		</ul>
	</div>

<?php echo $footer ?>
</div>
<?php
	echo Asset::js('lib/jquery.min.js');
	echo Asset::js('lib/bootstrap.min.js');
	echo Asset::js("sdk/sdk.js");
	echo Asset::js("common.js");
	echo Asset::js("index.js");
?>
</body>
</html>
