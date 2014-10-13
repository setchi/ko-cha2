/*
 * 全ページ共通処理
 */

$(function () {
	var $modal = null, pathName = location.pathname;

	$('[data-toggle="modal"]').mousedown(function () {
		$modal = $($(this).data('target'));
		$modal.find('input').focus();
		$modal.find('.panel2').text('').hide();
		$modal.find('.js_modal_send').show();
		$modal.find('.panel1').show();
	});

	$('.js_email_send').click(function () {
		var sending = false;
			return function () {
			var message = $modal.find('textarea').val();

			if (message && !sending) {
				sending = true;

				$.post(pathName + 'email/send.json', {
					'body': message

				}, function ($modal) {
					return function (msg) {
						sending = false;
						$modal.find('.panel1').hide();
						$modal.find('.js_email_send').hide();
						$modal.find('textarea').val('');
						$modal.find('.panel2').text(msg['msg']).show();
					}
				}($modal));
			}
		}
	}());

	$('.modal').find('form').submit(function () {return false;})
});



/**
 * 部屋ごとの自分のViewerIDをlocalStorageで管理する。
 */
var LocalSession = function () {
	/**
	 * 部屋ごとの自分のViewerIDのマップ
	 * @type {Object}
	 */
	this.data = JSON.parse(localStorage.getItem('ko-cha2localsession') || '{}');
}
LocalSession.prototype = {
	/**
	 * データをセット
	 * @param {String} roomId
	 * @param {String} viewerId
	 */
	set: function (roomId, viewerId) {
		this.data[roomId] = viewerId;
		this._save();
	},


	/**
	 * データを取得
	 * @param  {String} roomId
	 * @return {String} viewerId
	 */
	get: function (roomId) {
		return this.data[roomId];
	},


	/**
	 * 全てのデータを取得
	 * @return {Object} 全てのデータ
	 */
	getAll: function () {
		return this.data;
	},


	/**
	 * 追加する
	 * @param {String} roomId
	 * @param {String} viewerId
	 */
	add: function (roomId, viewerId) {
		this.data[roomId] = viewerId;
		this._save();
	},


	/**
	 * 削除する
	 * @param  {String} roomId
	 */
	remove: function (roomId) {
		delete this.data[roomId];
		this._save();
	},


	/**
	 * 現在のデータをローカルストレージに保存する
	 */
	_save: function () {
		localStorage.setItem('ko-cha2localsession', JSON.stringify(this.data));
	}
}
var localSession = new LocalSession();
