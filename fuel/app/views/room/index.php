<!DOCTYPE html>
<html lang="ja">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="keywords" content="setchi_">
<meta name="description" content="ちょっとコードを交えてチャットしたい時のWebアプリ">

<meta name="twitter:card" content="summary">
<meta name="twitter:creator" content="@setchi_">
<!--<meta property="fb:app_id" content="">-->
<meta property="og:title" content="Ko-cha">
<meta property="og:description" content="ちょっとコードを交えてチャットしたい時のWebアプリ">
<meta property="og:url" content="<?php echo $base_url ?>">
<meta property="og:image" content="img/icon/kocha.png">
<meta property="og:type" content="website">
<meta name="google-site-verification" content="9hMJEsV9tNWEmbRxVIrMHbxJ2P-fCILSKhag2YqHKiE" />

<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="shortcut icon" href="http://setchi.jp/ko-cha2/assets/img/icon/kocha.png">
  <title>Ko-cha | チャットルーム</title>
<?php
	echo Asset::css('lib/bootstrap.min.css');
	echo Asset::css("common.css");
	Casset::css('lib/jquery.fancybox.css');
	Casset::css("lib/contextmenu.css");
	Casset::css("lib/toastr.min.css");
	Casset::css("chat.css");
	echo Casset::render_css();
?>
</head>

<body>
<div class="hidden" id="js_room_info"><?php echo htmlspecialchars(json_encode(array(
	'room' => $room,
	'viewer' => array()
))) ?></div>
<div class="wrapper">
	<div class="sidebar">
		<header class="navbar navbar-inverse" role="navigation">
		  <div class="navbar-header">
		    <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
		      <span class="sr-only">Toggle navigation</span>
		      <span class="icon-bar"></span>
		      <span class="icon-bar"></span>
		      <span class="icon-bar"></span>
		    </button>
		    <a class="navbar-brand" href="<?php echo $base_url ?>">Ko-cha</a>
		  </div>
			<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
				<ul class="nav navbar-nav viewer-list">
				</ul>
			</div>
			<!-- Modal -->
			<div class="modal fade" id="contactModal" tabindex="-1" role="dialog" aria-labelledby="contactModalLabel" aria-hidden="true">
				<div class="modal-dialog">
					<div class="modal-content">
						<div class="modal-header">
							<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
							<h4 class="modal-title" id="contactModalLabel"><span class="glyphicon glyphicon-envelope"></span> バグ報告</h4>
						</div>
						<div class="modal-body panel1">
							<form class="form-nickname" method="post" action="/">
								<textarea required placeholder="バグの内容、又はKo-chaへのご意見・ご要望"></textarea>
							</form>
						</div>
						<div class="modal-body panel2"></div>
						<div class="modal-footer">
							<div class="btn btn-primary js_email_send js_modal_send">送信</div>
							<a href="#" class="btn" data-dismiss="modal">閉じる</a>
						</div>
					</div><!-- /.modal-content -->
				</div><!-- /.modal-dialog -->
			</div><!-- /.modal -->
		</header>
		<div class="chat_submit input-group input-group-lg">
			<span class="input-group-addon js_my_icon"></span>
			<input type="text" class="form-control js_chat_send" maxlength="300" placeholder="メッセージ送信">
			<div class="sns-login" title="ログインするとプロフィール画像をインポートできます。">
				<span class="login-btn-github hidden" data-sns="github"></span>
				<span class="login-btn-twitter" data-sns="twitter"></span>
				<span class="login-btn-facebook" data-sns="facebook"></span>
			</div>
		</div>
		<div class="chat_log">
		</div>
	</div>
	<div class="sidebar-handle ui-draggable" style="left: 258px;"><span>||</span></div>

	<div id="editor-region">
	</div>
</div>

<div id="ko-cha-templates" class="hidden">
	<div class="editor" data-tab-name=""></div>
	<li class="tab-item" data-tab-name=""><a class="label" title=""></a><a class="close" data-tab-name="">x</a></li>

	<div class="editor-root">
		<div class="editor-top-bar">
			<span class="editor-user-icon user-icon"></span>
			<ul class="tab-list ui-sortable"></ul>

			<div class="tab-dropdown" style="display: none;">
				<a class="tab-dropdown-button" class="icon-down-open"></a>
			</div>
			<div class="tab-close" style="display: block;">
				<a class="tab-close-button" class="icon-cancel-circled"></a>
			</div>

			<div class="bar"></div>
		</div>
		<span class="editor-list-region"><div class="editor-list"> </div></span>
		
	</div>

	<li class="viewer-icon" data-viewer-id=""></li>

</div>
<script src="https://skyway.io/dist/0.3/peer.js"></script>
<?php
	echo Asset::js('lib/src-min/ace.js');
	echo Asset::js('lib/jquery.min.js');
	echo Asset::js('lib/bootstrap.min.js');
	echo Asset::js('lib/encoding.min.js');
/*
	echo Asset::js('lib/jquery.fancybox.pack.js');
	echo Asset::js('lib/contextmenu.min.js');
	echo Asset::js('lib/toastr.min.js');
	echo Asset::js('lib/notify.js');
	echo Asset::js('common.js');
	echo Asset::js('utils.js');
	echo Asset::js('editor-tab.js');
	echo Asset::js('editor.js');
	echo Asset::js('editor-list.js');
	echo Asset::js('connection.js');
	echo Asset::js('ui.js');
	echo Asset::js('viewer.js');
	echo Asset::js('filedrop.js');
	echo Asset::js('chat.js');
	echo Asset::js('update.js');
	echo Asset::js('sdk/sdk.js');
/*/
	Casset::js('lib/jquery.fancybox.pack.js');
	Casset::js('lib/contextmenu.min.js');
	Casset::js('lib/toastr.min.js');
	Casset::js('lib/notify.js');
	Casset::js('common.js');
	Casset::js('utils.js');
	Casset::js('editor-tab.js');
	Casset::js('editor.js');
	Casset::js('editor-list.js');
	Casset::js('connection.js');
	Casset::js('ui.js');
	Casset::js('viewer.js');
	Casset::js('filedrop.js');
	Casset::js('chat.js');
	Casset::js('update.js');
	Casset::js('sdk/sdk.js');
	echo Casset::render_js();
//*/
?>
</body>
</html>
