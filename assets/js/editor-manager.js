define([
	'jquery',
	'room-info',
	'local-session',
	'utils',
	'editor-object',
	'editor-positions-enum'
], function ($, roomInfo, localSession, Utils, EditorObject, EditorPositionsEnum) {
"use strict";

/**
 * 全Viewerのエディタの管理
 */
var EditorManager = function () {};
EditorManager.prototype = {
	/**
	 * Viewerごとのエディタのインスタンスを保持するリスト
	 * @type {Array}
	 */
	editorList: [],


	/**
	 * 初期化
	 */
	init: function () {
		this.setPosition(localSession.get(roomInfo.room.id), EditorPositionsEnum.FULLSCREEN);
	},


	/**
	 * Editor追加 (Viewer一人につき一つのエディタ)
	 * @param {String} viewerId
	 */
	add: function (viewerId) {
		this.editorList[viewerId] = new EditorObject(viewerId, EditorPositionsEnum.FULLSCREEN).hide();
	},


	/**
	 * Editor削除
	 * @param {String} viewerId
	 */
	remove: function (viewerId) {
		if (!(viewerId) in this.editorList) return;
		
		this.editorList[viewerId].remove();
		delete this.editorList[viewerId];
	},


	/**
	 * 表示エディタを切り替える
	 * @param  {String} viewerId
	 */
	changeViewingEditor: function (viewerId) {
		if (void 0 === this.editorList[viewerId]) {
			console.warn("ユーザー '" + viewerId + "' が存在しません");
			return;
		}
		for (var id in this.editorList) {
			this.editorList[id].hide();
		}
		this.editorList[viewerId].show();
	},


	/**
	 * ViewerのEditorインスタンスを取得。存在しなければ追加する
	 * @param  {String} viewerId 
	 * @return {Editor} 該当ViewerのEditorインスタンス
	 */
	get: function (viewerId) {
		if (void 0 === this.editorList[viewerId]) {
			this.add(viewerId);
		}
		return this.editorList[viewerId];
	},


	/**
	 * 受信データを反映
	 * @param  {Object} data
	 */
	update: function (data) {
		try {
			this.get(data.viewerId).get(data.tabId, decodeURIComponent(data.tabName)).applyData(data.data);
		} catch (e) {
			console.warn(e.message, e);
		}

		// 自分の場合は更新通知をしない
		if (data.viewerId === localSession.get(roomInfo.room.id)) return;

		if (!this.get(data.viewerId).isViewing()) {
			// 閲覧中じゃないユーザーが更新した
			this.get(data.viewerId).setFlashing(true);
		}
		if (this.get(data.viewerId).currentTabId !== data.tabId) {
			// 見ていないタブが更新された
			this.get(data.viewerId).get(data.tabId).setFlashing(true);
		}
	},


	/**
	 * リサイズ
	 * @param  {Number} rootWidth
	 * @param  {Number} rootHeight
	 */
	resize: function (rootWidth, rootHeight) {
		for (var prop in this.editorList) {
			this.editorList[prop].resize(rootWidth, rootHeight);
		}
	},


	/**
	 * エディタを表示する
	 * @param  {String} viewerId
	 */
	show: function (viewerId) {
		this.editorList[viewerId].show();
	},


	/**
	 * エディタのレイアウトを変更する
	 * @param {String} viewerId
	 * @param {EditorPositionsEnum} position    位置フラグ
	 */
	setPosition: function (viewerId, position) {
		if (void 0 === this.editorList[viewerId]) {
			this.add(viewerId);
		}

		var $editors = this.editorList[viewerId].$editorRegion.find('.editor-root');
		var _self = this;

		if ($editors.eq(0).attr('id') !== viewerId) {
			$editors.not(':first').each(function () {
				_self.editorList[$(this).attr('id')].hide();
			});
		}
		// ターゲットをeditorRegionの一番上に移動する
		this.editorList[viewerId].$root.prependTo(this.editorList[viewerId].$editorRegion);
		this.editorList[viewerId].show().setPosition(position).tabResize();

		for (var id in this.editorList) {
			if (!this.editorList[id].isViewing() || id === viewerId) {
				continue;
			}
			// 全面表示の場合は表示中の相手のエディタを非表示に
			if (position === EditorPositionsEnum.FULLSCREEN) {
				this.editorList[id].hide();
			
			// 全面表示でない場合、表示中のエディタを対となる位置へ移動
			} else {
				this.editorList[id].show().setPosition(EditorPositionsEnum.pair[position]);
			}
		}
	},


	/**
	 * 全Viewerのエディタの状態をまとめたオブジェクト生成
	 * @return {Object} 送信用オブジェクト
	 */
	serializeAll: function () {
		var res = [];

		for (var viewerId in this.editorList) {
			res = res.concat(this.editorList[viewerId].serialize());
		}
		return res;
	}
}

return EditorManager;

});
