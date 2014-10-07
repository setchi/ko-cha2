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
	    <ul class="nav navbar-nav pull-right">
			<li>
				<div class="ninja_onebutton">
					<span class="fb-like" data-href="http://setchi.jp/ko-cha/" data-width="150" data-layout="button_count" data-show-faces="false"></span>&nbsp;
					<a href="https://twitter.com/share" class="twitter-share-button" data-url="http://setchi.jp/ko-cha/" data-lang="ja" data-hashtags="Ko-cha">ツイート</a>
				</div>
			</li>
			<li><a href="#contactModal" data-toggle="modal" data-target="#contactModal"><span class="glyphicon glyphicon-envelope"></span> バグ報告</a></li>
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