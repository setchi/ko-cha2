define(['jquery', 'room-info', 'local-session', 'utils', 'lib/jquery.fancybox.pack'],
	function ($, roomInfo, localSession, Utils) {

/**
 * チャットログに関する処理
 * @type {Object}
 */
var Chat = {
	/**
	 * チャットログを保持する
	 * @type {Array}
	 */
	_history: [],


	/**
	 * チャットログを表示する要素
	 * @type {HTMLElement}
	 */
	_$log: $('.chat_log'),


	/**
	 * URL
	 * @type {RegExp}
	 */
	_URLRegex: /(?:^|[\s　]+)((?:https?|ftp):\/\/[^\s　]+)/,


	/**
	 * チャットログのHTMLテンプレート
	 * @type {String}
	 */
	_logText: '<div class="letter"><span class="viewer-icon %s" style="background-image:url(%s)"></span>%s</div>',


	/**
	 * リンクのHTMLテンプレート
	 * @type {String}
	 */
	_linkText: '<a href="%s" target="_blank">%s</a>',


	/**
	 * 初期化
	 * @param  {Connection} connection
	 */
	init: function (connection) {
		var _self = this;

		// テキストボックスでエンターキーが押されたら送信
		$('.js_chat_send').keydown(function (e) {
			var eCode = e.keyCode || e.charCode,
				message = $(this).val();

			if (eCode !== 13 || !message) return;
			_self.send(message);
			$(this).val('');
		});


		/**
		 * 発言する
		 * @param  {String} message
		 * @param  {String} [type]
		 */
		this.send = function (message, type) {
			var data = [{
				viewer_id: localSession.get(roomInfo.room.id),
				image: roomInfo.viewer.image,
				message: encodeURIComponent(message),
				type: type || false
			}];
			this.update(data, true);

			connection.sendRTC({
				updated: true,
				chat_log: data
			});
		}
	},


	/**
	 * 受信データをチャットログに反映する
	 * @param  {Object} logs      受信したログのリスト
	 * @param  {Boolean} selfEnter 自身の発言による挿入か
	 */
	update: function (logs, selfEnter) {
		var html = '',
			currentHtml = $.trim(this._$log.html());

		for (var i in logs) {
			var data = logs[i],
				notificationMessage = data.message;

			// TODO: ついさっきスクリプトから挿入した自分の発言が、サーバーからも送られて来るので無視している。もっと構造を整える。
			if (!selfEnter && currentHtml !== '' && localSession.get(roomInfo.room.id) === data.viewer_id) continue;

			this._history.push($.extend(true, {}, data));

			// html = message + html;
			var string = "";
			if (data.type === 'image') {
				notificationMessage = '画像を送信しました。';
				string = this._getImageHTML(data);

			} else if (data.type === 'file') {
				notificationMessage = 'ファイルを送信しました。';
				string = this._getFileHTML(data);

			} else {
				string = this._getRemarkHTML(data);
			}
			html = string + html;
			
			// 自分の更新でなく、今この画面を見ていなければデスクトップ通知を出す
			if (localSession.get(roomInfo.room.id) !== data.viewer_id) {
				Utils.executeIfNotViewing(function () {
					var myNotification = new Notify('Ko-cha', {
						icon: this.getIconUrl(data.image),
						body: notificationMessage
					});
					myNotification.show();
				}.bind(this));
			}
		}

		this._$log.prepend(html).scrollTop(0);
		$('.fancybox').fancybox({
			autoSize: true
		});
	},


	/**
	 * ログHTML生成
	 * @param  {Object} log
	 * @return {String} ログHTML
	 */
	_getRemarkHTML: function (log) {
		var message = decodeURIComponent(log.message);
		message = Utils.escapeHTML(message).replace(this._regexURL, function () {
			var url = "";
			message.replace(this._regexURL, function ($1, $2) {
				url = $2;
			});
			return Utils.sprintf(this._linkText, url, url);
		}.bind(this));
		return Utils.sprintf(this._logText, log.viewer_id, this.getIconUrl(log.image), message);
	},


	/**
	 * 画像ログHTML生成
	 * @param  {Object} log
	 * @return {String} 画像ログHTML
	 */
	_getImageHTML: function (log) {
		var imageName = decodeURIComponent(log.message);
		var baseUrl = 'assets/upload/' + roomInfo.room.id + '/';
		var imageUrl = baseUrl + imageName;

		var thumbExt = imageName.substr(imageName.lastIndexOf('.') + 1).toLowerCase();
		var thumbUrl = baseUrl + 'thumb-' + imageName.substr(0, imageName.length-3) + thumbExt;

		var image = '画像を送信しました。<a href="' + imageUrl + '" class="fancybox" title=""><img src="' + thumbUrl + '"></a>';
		return Utils.sprintf(this._logText, log.viewer_id, this.getIconUrl(log.image), image);
	},


	/**
	 * ファイル送信ログのHTML生成
	 * @param  {[type]} log [description]
	 * @return {[type]}     [description]
	 */
	_getFileHTML: function (log) {
		var fileName = decodeURIComponent(log.message);
		var baseUrl = 'assets/upload/' + roomInfo.room.id + '/';
		var fileUrl = baseUrl + fileName;

		var thumbExt = fileName.substr(fileName.lastIndexOf('.') + 1).toLowerCase();
		var thumbUrl = baseUrl + 'thumb-' + fileName.substr(0, fileName.lastIndexOf('.') + 1) + thumbExt;

		var file = 'ファイルを送信しました。<div>【 <a href="' + fileUrl + '" title="" target="_blank">' + fileName + '</a> 】</div>';
		return Utils.sprintf(this._logText, log.viewer_id, this.getIconUrl(log.image), file);
	},


	/**
	 * ユーザーアイコンのURL生成
	 * @param  {String} fileName
	 * @return {String} HTML
	 */
	getIconUrl: function (fileName) {
		fileName = "" + fileName;
		return fileName.length < 10 ? 'assets/img/user/default/' + fileName + '.png' : fileName;
	},


	/**
	 * チャット履歴を取得
	 * @return {Object} チャット履歴
	 */
	getHistory: function () {
		return this._history;
	}
}

return Chat;

});
