/**
 * Viewerに関する処理
 * @param {EditorList} editorList
 */
var Viewer = function (editorList) {
	var $templates = $('#ko-cha-templates');
	/**
	 * アイコンのHTMLテンプレート
	 * @type {jQuery Object}
	 */
	this.$icon = $templates.find('.viewer-icon').clone();


	/**
	 * EditorListのインスタンス
	 * @type {EditorList}
	 */
	this.editorList = editorList;
}
Viewer.prototype = {
	/**
	 * 初期化
	 */
	init: function () {
		$('.js_my_icon').addClass(roomInfo.viewer.viewer_id).css({
			'background-image': 'url(' + this.getIconUrl(roomInfo.viewer.image) + ')'
		});
		// 自分自身をビューワーリストに追加して、自分のエディタを全画面で表示する
		this.add(roomInfo.viewer);
		$('.viewer-list').find('[data-viewer-id="' + roomInfo.viewer.viewer_id + '"]').addClass('active-viewer');
		editorList.setLayout(roomInfo.viewer.viewer_id, 4);

		// SNSログイン
		$('.sns-login').find('span').click(function () {
			var sns = $(this).data('sns');
			var url = 'auth/login/' + sns;
			window.open(url, '', 'width=800,height=500');
		});
	},


	/**
	 * 受信データを反映
	 * @param  {Object} data
	 */
	update: function (data) {
		for (var i in data) {
			if (data[i].viewer_id in this.editorList.editorList) {
				var image = this.getIconUrl(data[i].image);
				this.changeIcon(image, data[i].viewer_id);

				$('.viewer-list').find('[data-viewer-id="' + data[i].viewer_id + '"]').addClass(data[i].viewer_id).css('background-image', 'url(' + image + ')');
				$('#' + data[i].viewer_id).find('.editor-user-icon').css('background-image', 'url(' + image + ')').addClass(data[i].viewer_id);
			} else {
				this.add(data[i]);
			}

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
		this.editorList.add(data.viewer_id);
		var image = this.getIconUrl(data.image);

		this.$icon.clone().attr('data-viewer-id', data.viewer_id).addClass(data.viewer_id).css('background-image', 'url(' + image + ')').appendTo(".viewer-list");
		$('#' + data.viewer_id).find('.editor-user-icon').css('background-image', 'url(' + image + ')').addClass(data.viewer_id).mouseenter(function () {
			$(this).addClass('hidden');
			var that = this;
			setTimeout(function() {$(that).removeClass('hidden') }, 2000);
		});

		if (roomInfo.viewer.viewer_id === data.viewer_id) {
			$('#' + data.viewer_id).addClass('self-editor');
		}
	},


	/**
	 * Viewerのアクティブ設定
	 * @param {String} viewerId
	 * @param {Boolean} active
	 */
	setActive: function (viewerId, active) {
		if (viewerId === getMyViewerId()) return;

		$('.viewer-list').find('[data-viewer-id="' + viewerId + '"]')[active ? 'addClass' : 'removeClass']('active-viewer');
	},


	/**
	 * ユーザーアイコンのHTML生成
	 * @param  {Object} data
	 * @return {String} HTML
	 */
	getIconUrl: function (data) {
		data = "" + data;
		return data.length < 10 ? 'assets/img/user/default/' + data + '.png' : data;
	},


	/**
	 * ユーザーアイコンを変更する
	 * @param  {String} image - 新しいアイコンのURL
	 * @param  {String} viewerId
	 */
	changeIcon: (function () {
		var viewerInfoMap = {};

		return function (image, viewerId) {
			if (viewerId === roomInfo.viewer.viewer_id) {
				roomInfo.viewer.image = image;
			}
			if (!(viewerId in viewerInfoMap)) {
				viewerInfoMap[viewerId] = "";
			}
			if (viewerInfoMap[viewerId] !== image) {
				viewerInfoMap[viewerId] = image;
				$('.' + viewerId).css('background-image', 'url(' + image + ')');
			}
		}
	}())
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
