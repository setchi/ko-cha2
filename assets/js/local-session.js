define(function () {
"use strict";

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

return new LocalSession();

});
