/**
 * チャットログに関する処理
 */

var Chat = {
	$log: $('.chat_log'),
	initialized: false,
	regexURL: /(?:^|[\s　]+)((?:https?|ftp):\/\/[^\s　]+)/,
	logText: '<div class="letter"><span class="viewer-icon %s" style="background-image:url(%s)"></span>%s</div>',
	linkText: '<a href="%s" target="_blank">%s</a>',

	init: function () {
		this.initialized = true;
		return this;
	},

	// 受信データをチャットログに反映する
	insert: function (logs, selfEnter) {
		var html = '';

		for (var i in logs) {
			var data = logs[i];
			if (!selfEnter && this.initialized && roomInfo.viewer.viewer_id === data.viewer_id) continue;

			data.message = decodeURIComponent(data.message);

			// html = message + html;
			var string = "", isImage = false;
			if (data.message.match('\\[image\\](.*)\\[/image\\]')) {
				isImage = true;
				string = this.genImageHTML(data);

			// TODO: WebRTCのpeerID交換にチャットの機能を借りているので専用APIを作る。
			} else if (data.message.match('\\[sendOffer\\](.*)\\[/sendOffer\\]')) {
				server.onOffer(data.message.match('\\[sendOffer\\](.*)\\[/sendOffer\\]')[1]);
				continue;

			} else {
				string = this.genRemarkHTML(data);
			}
			html = string + html;
			
			if (this.initialized && roomInfo.viewer.viewer_id !== data.viewer_id) {
				executeIfNotViewing(function () {
					var myNotification = new Notify('Ko-cha', {
						icon: viewer.getImageUrl(data.image),
						body: isImage ? "画像を送信しました。" : data.message
					});
					myNotification.show();
				});
			}
		}

		this.init().$log.prepend(html).scrollTop(0);
		$('.fancybox').fancybox({
			autoSize: true
		});
	},

	// 発言用HTML生成
	genRemarkHTML: function (log) {
		var that = this;
		var message = this.escapeHTML(log.message).replace(this.regexURL, function () {
			var url = "";
			log.message.replace(that.regexURL, function ($1, $2) {
				url = $2;
			});
			return sprintf(that.linkText, url, url);
		});
		return sprintf(this.logText, log.viewer_id, viewer.getImageUrl(log.image), message);
	},

	// 画像用HTML生成
	genImageHTML: function (log) {
		var imageName = log.message.match('\\[image\\](.*)\\[/image\\]')[1];
		var baseUrl = 'assets/upload/' + roomInfo.room.id + '/';
		var imageUrl = baseUrl + imageName;

		var thumbExt = imageName.substr(-3).toLowerCase();
		var thumbUrl = baseUrl + 'thumb-' + imageName.substr(0, imageName.length-3) + thumbExt;

		var image = '画像を送信しました。<a href="' + imageUrl + '" class="fancybox" title=""><img src="' + thumbUrl + '"></a>';
		return sprintf(this.logText, log.viewer_id, viewer.getImageUrl(log.image), image);
	},

	escapeHTML: function (str) {
		var obj = document.createElement('pre');
		if (typeof obj.textContent != 'undefined') {
			obj.textContent = str;
		} else {
			obj.innerText = str;
		}
		return obj.innerHTML;
	}
}

// テキストボックスでエンターキーが押されたら送信
$('.js_chat_send').keydown(function (e) {
	var eCode = e.keyCode || e.charCode,
		message = $(this).val();

	if (eCode !== 13 || !message) return;
	sendChat(message);
	$(this).val('');
});

function sendChat(message) {
	var data = roomInfo.viewer;
	data['message'] = encodeURIComponent(message);
	Chat.insert([data], true);

	//*
	server.sendRTC({
		updated: true,
		chat_log: [{
			viewer_id: getMyViewerId(),
			image: roomInfo.viewer.image,
			message: encodeURIComponent(message)
		}]
	});

	/*/
	server.send({
		type: 'chat_log',
		data: message
	});
	// */
}
