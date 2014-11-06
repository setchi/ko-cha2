define([
	'jquery',
	'room-info',
	'local-session',
	'chat',
	'toastr'
], function ($, roomInfo, localSession, Chat, toastr) {
"use strict";

/**
 * Viewerに関する処理
 */
var Viewer = function () {};
Viewer.prototype = {
	/**
	 * アイコンのHTMLテンプレート
	 * @type {jQuery Object}
	 */
	$icon: $('#ko-cha-templates').find('.viewer-icon').clone(),


	/**
	 * Viewerの情報を保持する
	 * @type {Object}
	 */
	viewerInfoList: {},


	/**
	 * イベントハンドラ
	 * @type {Map<String, Array<Function>>}
	 */
	_listeners: {},


	/**
	* イベントを登録する
	* @param {String} eventName on-offer, add-viewer
	* @param {Function} listener
	*/
	on: function(eventName, listener){
		if(!this._listeners[eventName]){
			this._listeners[eventName] = [];
		}
		this._listeners[eventName].push(listener);
	},


	/**
	 * イベントを発火する
	 * @param  {String} eventName [args...]
	 */
	_fire: function(eventName){
		var args = $.extend(true, [], arguments);
		args.shift();

		(this._listeners[eventName] || []).forEach(function(listener){
			listener.apply(this, args);
		});
	},


	/**
	 * 初期化
	 * @param  {Object} selfViewerInfo
	 */
	init: function (selfViewerInfo) {
		roomInfo.viewer = selfViewerInfo;
		localSession.add(roomInfo.room.id, selfViewerInfo.viewer_id);

		this._add(roomInfo.viewer);
		$('.viewer-list').find('[data-viewer-id="' + selfViewerInfo.viewer_id + '"]').addClass('active-viewer');

		// 自身のアイコン画像を適用
		$('.js_my_icon').addClass(selfViewerInfo.viewer_id).css({
			'background-image': 'url(' + Chat.getIconUrl(selfViewerInfo.image) + ')'
		});

		// SNSログイン
		$('.sns-login').find('span').click(function () {
			var sns = $(this).data('sns');
			window.open('auth/login/' + sns, '', 'width=800,height=500');
		});
	},


	/**
	 * 受信データを反映
	 * @param  {Object} data
	 */
	update: function (data) {
		for (var i in data) {
			if (!(data[i].viewer_id in this.viewerInfoList)) {
				this._add(data[i]);
			}

			this._applyIcon(Chat.getIconUrl(data[i].image), data[i].viewer_id);

			// PeerConnectionのオファーが来た
			if (data[i].peer_id && data[i].viewing == '1' && data[i].viewer_id !== localSession.get(roomInfo.room.id)) {
				this._fire('on-offer', data[i].peer_id);
			}
		}
	},


	/**
	 * Viewerの追加
	 * @param {Object} data
	 */
	_add: function (data) {
		this._fire('add-viewer', data.viewer_id);

		this.viewerInfoList[data.viewer_id] = $.extend(true, {}, data);
		this.$icon.clone().attr('data-viewer-id', data.viewer_id).addClass(data.viewer_id).appendTo(".viewer-list");
		$('#' + data.viewer_id).find('.editor-user-icon').addClass(data.viewer_id).mouseenter(function () {
			$(this).addClass('hidden');
			var that = this;
			setTimeout(function() {$(that).removeClass('hidden') }, 2000);
		});

		if (localSession.get(roomInfo.room.id) === data.viewer_id) {
			$('#' + data.viewer_id).addClass('self-editor');
		}
	},


	/**
	 * Viewerのアクティブ設定
	 * @param {String} viewerId
	 * @param {Boolean} active
	 */
	setActive: function (viewerId, active) {
		if (viewerId === localSession.get(roomInfo.room.id)) return;
		var $viewerIcon = $('.viewer-list').find('[data-viewer-id="' + viewerId + '"]');

		if (active === $viewerIcon.hasClass('active-viewer')) return;
		$viewerIcon[active ? 'addClass' : 'removeClass']('active-viewer');

		// 右上の通知
		var iconUrl = Chat.getIconUrl(this.viewerInfoList[viewerId].image);
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
	 * ユーザーアイコンを適用する
	 * @param  {String} imageUrl - 新しいアイコンのURL
	 * @param  {String} viewerId
	 */
	_applyIcon: function (imageUrl, viewerId) {
		if (viewerId === localSession.get(roomInfo.room.id)) {
			roomInfo.viewer.image = imageUrl;
		}

		this.viewerInfoList[viewerId].image = imageUrl;
		$('#' + viewerId + ' .editor-user-icon, .' + viewerId).css('background-image', 'url(' + imageUrl + ')');
	}
}

return Viewer;

});
