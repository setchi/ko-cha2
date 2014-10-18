/**
 * チャットログに関する処理
 * @type {Object}
 */
var Chat = {

	/**
	 * チャットログを表示する要素
	 * @type {HTMLElement}
	 */
	$log: $('.chat_log'),


	/**
	 * チャットログを保持する
	 * @type {Array}
	 */
	log: [],


	/**
	 * URLにマッチさせる正規表現
	 * @type {RegExp}
	 */
	regexURL: /(?:^|[\s　]+)((?:https?|ftp):\/\/[^\s　]+)/,


	/**
	 * チャットログのHTMLテンプレート
	 * @type {String}
	 */
	logText: '<div class="letter"><span class="viewer-icon %s" style="background-image:url(%s)"></span>%s</div>',


	/**
	 * リンクのHTMLテンプレート
	 * @type {String}
	 */
	linkText: '<a href="%s" target="_blank">%s</a>',


	init: function () {
		var _self = this;

		// データ受信時
		connection.on('received', function (data) {
			for (var state in data) {
				if (state !== 'chat_log') continue;
				_self._insert(data[state])
			}
		});

		// テキストボックスでエンターキーが押されたら送信
		$('.js_chat_send').keydown(function (e) {
			var eCode = e.keyCode || e.charCode,
				message = $(this).val();

			if (eCode !== 13 || !message) return;
			_self._send(message);
			$(this).val('');
		});
	},


	/**
	 * 受信データをチャとログに反映する
	 * @param  {Object} logs      受信したログのリスト
	 * @param  {Boolean} selfEnter 自身の発言による挿入か
	 */
	_insert: function (logs, selfEnter) {
		var html = '';

		for (var i in logs) {
			var data = logs[i];
			// TODO: ついさっきスクリプトから挿入した自分の発言が、サーバーからも送られて来るので無視している。もっと構造を整える。
			if (!selfEnter && roomInfo.viewer.viewer_id === data.viewer_id) continue;

			this.log.push($.extend(true, {}, data));
			data.message = decodeURIComponent(data.message);

			// html = message + html;
			var string = "", isImage = false;
			if (data.message.match('\\[image\\](.*)\\[/image\\]')) {
				isImage = true;
				string = this._genImageHTML(data);

			} else {
				string = this._genRemarkHTML(data);
			}
			html = string + html;
			
			// 自分の更新でなく、今この画面を見ていなければデスクトップ通知を出す
			if (roomInfo.viewer.viewer_id !== data.viewer_id) {
				executeIfNotViewing(function () {
					var myNotification = new Notify('Ko-cha', {
						icon: viewer.getImageUrl(data.image),
						body: isImage ? "画像を送信しました。" : data.message
					});
					myNotification.show();
				});
			}
		}

		this.$log.prepend(html).scrollTop(0);
		$('.fancybox').fancybox({
			autoSize: true
		});
	},


	/**
	 * ログHTML生成
	 * @param  {Object} log
	 * @return {String} ログHTML
	 */
	_genRemarkHTML: function (log) {
		var that = this;
		var message = escapeHTML(log.message).replace(this.regexURL, function () {
			var url = "";
			log.message.replace(that.regexURL, function ($1, $2) {
				url = $2;
			});
			return sprintf(that.linkText, url, url);
		});
		return sprintf(this.logText, log.viewer_id, viewer.getIconUrl(log.image), message);
	},


	/**
	 * 画像ログHTML生成
	 * @param  {Object} log
	 * @return {String} 画像ログHTML
	 */
	_genImageHTML: function (log) {
		var imageName = log.message.match('\\[image\\](.*)\\[/image\\]')[1];
		var baseUrl = 'assets/upload/' + roomInfo.room.id + '/';
		var imageUrl = baseUrl + imageName;

		var thumbExt = imageName.substr(-3).toLowerCase();
		var thumbUrl = baseUrl + 'thumb-' + imageName.substr(0, imageName.length-3) + thumbExt;

		var image = '画像を送信しました。<a href="' + imageUrl + '" class="fancybox" title=""><img src="' + thumbUrl + '"></a>';
		return sprintf(this.logText, log.viewer_id, viewer.getIconUrl(log.image), image);
	},


	/**
	 * 発言する
	 * @param  {String} message
	 */
	_send: function (message) {
		var data = roomInfo.viewer;
		data['message'] = encodeURIComponent(message);
		this._insert([data], true);

		//*
		connection.sendRTC({
			updated: true,
			chat_log: [{
				viewer_id: getMyViewerId(),
				image: roomInfo.viewer.image,
				message: encodeURIComponent(message)
			}]
		});

		/*/
		connection.send({
			type: 'chat_log',
			data: message
		});
		// */
	}
}
