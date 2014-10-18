/**
 * Viewerに関する処理
 * @param {EditorList} editorList
 */
var Viewer = function (editorList) {
	/**
	 * アイコンのHTMLテンプレート
	 * @type {jQuery Object}
	 */
	this.$icon = $('#ko-cha-templates').find('.viewer-icon').clone();


	/**
	 * EditorListのインスタンス
	 * @type {EditorList}
	 */
	this.editorList = editorList;


	/**
	 * Viewerの情報を保持する
	 * @type {Object}
	 */
	this.viewerInfoList = {};
}
Viewer.prototype = {
	/**
	 * 初期化
	 */
	init: function (selfViewerId) {
		// 自身のアイコン画像を適用
		$('.js_my_icon').addClass(selfViewerId).css({
			'background-image': 'url(' + this.getIconUrl(roomInfo.viewer.image) + ')'
		});

		this.add(roomInfo.viewer);
		$('.viewer-list').find('[data-viewer-id="' + roomInfo.viewer.viewer_id + '"]').addClass('active-viewer');

		// SNSログイン
		$('.sns-login').find('span').click(function () {
			var sns = $(this).data('sns');
			window.open('auth/login/' + sns, '', 'width=800,height=500');
		});

		// 接続が完了したとき
		connection.on('open', function (conn) {
			if (!this.isActive(conn.metadata.viewerId) && conn.metadata.num === 0) {
				conn.send({ updated: true, chat_log: Chat.log });
			}
			this._setActive(conn.metadata.viewerId, true);
		}.bind(this));

		// 接続が切断されたとき
		connection.on('close', function (conn) {
			this._setActive(conn.metadata.viewerId, false);
		}.bind(this));

		// データを受信したとき
		connection.on('received', function (data) {
			for (var state in data) {
				if (state !== 'update_viewer') continue;
				this._update(data[state].list);
			}
		}.bind(this));
	},


	/**
	 * 受信データを反映
	 * @param  {Object} data
	 */
	_update: function (data) {
		for (var i in data) {
			if (!(data[i].viewer_id in this.viewerInfoList)) {
				this.add(data[i]);
			}

			this.changeIcon(this.getIconUrl(data[i].image), data[i].viewer_id);

			// PeerConnectionのオファーが来た
			if (data[i].peer_id &&　data[i].viewing == '1' && data[i].viewer_id !== getMyViewerId()) {
				connection.onOffer(data[i].peer_id);
			}
		}
	},


	/**
	 * Viewerの追加
	 * @param {Object} data
	 */
	add: function (data) {
		this.viewerInfoList[data.viewer_id] = data;
		this.editorList.add(data.viewer_id);

		this.$icon.clone().attr('data-viewer-id', data.viewer_id).addClass(data.viewer_id).appendTo(".viewer-list");
		$('#' + data.viewer_id).find('.editor-user-icon').addClass(data.viewer_id).mouseenter(function () {
			$(this).addClass('hidden');
			var that = this;
			setTimeout(function() {$(that).removeClass('hidden') }, 2000);
		});

		if (getMyViewerId() === data.viewer_id) {
			$('#' + data.viewer_id).addClass('self-editor');
		}
	},


	/**
	 * Viewerのアクティブ設定
	 * @param {String} viewerId
	 * @param {Boolean} active
	 */
	_setActive: function (viewerId, active) {
		if (viewerId === getMyViewerId()) return;
		var $viewerIcon = $('.viewer-list').find('[data-viewer-id="' + viewerId + '"]');

		if (active === $viewerIcon.hasClass('active-viewer')) return;
		$viewerIcon[active ? 'addClass' : 'removeClass']('active-viewer');

		// 右上の通知
		var iconUrl = this.getIconUrl(this.viewerInfoList[viewerId].image);
		toastr.info('<img src="' + iconUrl + '" width="32" height="32"> --- ' + (active ? '入室' : '退室') + 'しました。');
	},


	/**
	 * Viewerがアクティブかどうか
	 * @param {String} viewerId
	 * @return {Boolean}
	 */
	isActive: function (viewerId) {
		return $('.viewer-list').find('[data-viewer-id="' + viewerId + '"]').hasClass('active-viewer');
	},


	/**
	 * ユーザーアイコンのHTML生成
	 * @param  {String} fileName
	 * @return {String} HTML
	 */
	getIconUrl: function (fileName) {
		fileName = "" + fileName;
		return fileName.length < 10 ? 'assets/img/user/default/' + fileName + '.png' : fileName;
	},


	/**
	 * ユーザーアイコンを変更する
	 * @param  {String} imageUrl - 新しいアイコンのURL
	 * @param  {String} viewerId
	 */
	changeIcon: function (imageUrl, viewerId) {
		if (viewerId === getMyViewerId()) {
			roomInfo.viewer.image = imageUrl;
		}
		this.viewerInfoList[viewerId].image = imageUrl;
		$('#' + viewerId + ' .editor-user-icon, .' + viewerId).css('background-image', 'url(' + imageUrl + ')');
	}
}

var viewer = new Viewer(editorList);


/**
 * SNSのアイコン画像を適用する
 * @param  {String} image - 新しいアイコンのURL
 * @param  {String} name
 */
function snsApply(image, name) {
	connection.send({
		type: 'update_image',
		data: {
			'image': image,
			'name': name
		}
	});
}
