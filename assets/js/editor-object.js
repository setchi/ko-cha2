define([
	'jquery',
	'room-info',
	'local-session',
	'utils',
	'editor-tab',
	'editor-positions-enum',
	'toastr'
], function ($, roomInfo, localSession, Utils, Tab, EditorPositionsEnum, toastr) {
"use strict";

/**
 * エディタオブジェクトの制御
 * @param {String} viewerId
 * @param {EditorPositionsEnum} position 初期位置フラグ
 */
var EditorObject = function (viewerId, position) {
	// HTML要素を生成する
	$('#ko-cha-templates').find('.editor-root').clone().attr('id', viewerId).appendTo('#editor-region');


	/**
	 * このインスタンスのViewerID
	 * @type {String}
	 */
	this.viewerId = viewerId;


	/**
	 * Tabインスタンスを保持するリスト
	 * @type {Array}
	 */
	this.tabList = [];


	/**
	 * 現在編集しているタブの名前
	 * @type {String}
	 */
	this.currentTabId = "";


	/**
	 * このエディタのHTMLルート
	 * @type {Object}
	 */
	this.$root = $('#' + this.viewerId);


	/**
	 * このエディタを現在表示しているか
	 * @type {Boolean}
	 */
	this.viewing = false;


	/**
	 * 現在の位置フラグ
	 * @type {EditorPositionsEnum}
	 */
	this.position = position;
	this.setPosition(position);


	/**
	 * サイドバーのHTMLルート。リサイズ時にサイズを取得するためキャッシュ。
	 * @type {Object}
	 */
	this.$sidebar = $('.sidebar');


	/**
	 * エディタ全体を表示しているHTMLのルート
	 * @type {Object}
	 */
	this.$editorRegion = $('#editor-region');


	/**
	 * 自身かどうか
	 * @type {Boolean}
	 */
	this.isSelf = viewerId === localSession.get(roomInfo.room.id);

	if (this.isSelf) {
		this._initSelfEditor();
	}
}
EditorObject.prototype = {
	/**
	 * 自身のエディタの初期化
	 */
	_initSelfEditor: function () {
		var _self = this;
		// 自身のエディタのトップバーをダブルクリックで空タブを生成する
		this.$editorRegion.find('.editor-top-bar').mousedown(function () {
			var timer = -1;
			return function (e) {
				// タブ自体がクリックされてたら無視
				if ($(e.target).parents('.tab-item').size() !== 0) {
					return;
				}
				// Top Barがダブルクリックされた
				if (timer !== -1) {
					clearTimeout(timer);
					timer = -1;
					_self.addTab('untitled').send();
				} else {
					timer = setTimeout(function() {
						timer = -1;
					}, 400);
				}
				return Utils.cancelEvent(e);
			}
		}());

		// Ctrl + S でサーバーに状態を保存する
		$(document).on('keydown', function (e) {
			var keyCode = e.keyCode || e.charCode;

			if (e.ctrlKey && keyCode === 83) {
				_self.saveToServer();
				return Utils.cancelEvent(e);
			}
		});
	},


	/**
	 * 位置フラグから位置とサイズを求める
	 * @param  {EditorPositionsEnum} position
	 * @return {Object}
	 */
	getSizeRate: function (position) {
		var rates = { top: 0, left: 0, width: 0, height: 0 };

		switch (position) {
		case EditorPositionsEnum.LEFT:
			rates.width = 50;
			rates.height = 100;
			break;

		case EditorPositionsEnum.RIGHT:
			rates.width = rates.left = 50;
			rates.height = 100;
			break;

		case EditorPositionsEnum.TOP:
			rates.height = 50;
			rates.width = 100;
			break;

		case EditorPositionsEnum.BOTTOM:
			rates.height = rates.top = 50;
			rates.width = 100;
			break;

		case EditorPositionsEnum.FULLSCREEN:
			rates.width = rates.height = 100;
			break;
		}
		return rates;
	},


	/**
	 * エディタの位置を変更する
	 * @param {EditorPositionsEnum} position
	 */
	setPosition: function (position) {
		this.position = position;
		var rates = this.getSizeRate(position);
		this.$root.css({
			'position': 'relative',
			'top': rates.top + '%',
			'width': rates.width + '%',
			'height': rates.height + '%'
		});
		this.$root.find('.editor-list').css({
			width: '100%',
			height: '100%'
		});
		var _self = this;
		this.tabResize();
		$(window).resize();
		// console.log(this.viewerId, position);
		return this;
	},


	/**
	 * タブのインスタンスを取得する。存在しない場合は新しく追加する
	 * @param  {String} tabId
	 * @param  {String} tabName
	 * @return {Tab} Tabのインスタンス
	 */
	get: function (tabId, tabName) {
		if (void 0 === this.tabList[tabId]) {
			return this.addTab(tabName);
		}
		return this.tabList[tabId];
	},


	/**
	 * タブのインスタンスを追加する
	 * @param {String} tabName
	 */
	addTab: function (tabName) {
		var tabId = 0;
		while (tabId in this.tabList) tabId++;

		this.tabList[tabId] = new Tab(this.viewerId, tabId, tabName).hide();
		if (Utils.getSize(this.tabList) === 1) {
			this.changeActiveTab(tabId);
		}
		this.tabResize();
		return this.tabList[tabId];
	},


	/**
	 * タブをリサイズする
	 */
	tabResize: (function () {
		var timer;
		return function () {
			clearTimeout(timer);
			timer = setTimeout(function() {
				var tabWidth = (this.$root.width() - 100) / Utils.getSize(this.tabList);
				this.$root.find('.tab-item').width(tabWidth).find('.label').width(tabWidth - (tabWidth / 200 * 60) - 10);
			}.bind(this), 100);
		}
	}()),


	/**
	 * タブ削除。左右にタブがあれば次のタブを表示する（左側優先）
	 * @param  {String} tabId
	 */
	removeTab: function (tabId) {
		if (void 0 === this.tabList[tabId]) return;

		var target = this.$root.find('.tab-list').find('li[data-tab-id="' + tabId + '"]');
		var prev = target.prev().eq(0);
		var next = target.next().eq(0);
		var nextViewing = prev.size() ? prev : next.size() ? next : false;

		this.tabList[tabId].remove();
		delete this.tabList[tabId];

		this.$root.find('[data-tab-id="' + tabId + '"]').remove();
		if (this.currentTabId == tabId && nextViewing !== false) {
			this.changeActiveTab(nextViewing.data('tab-id'));
		}
	},


	/**
	 * エディタを非表示にする
	 * @return {Editor} 自身のインスタンス
	 */
	hide: function () {
		this.viewing = false;
		this.$root.addClass('hidden');
		return this;
	},


	/**
	 * エディタを表示する
	 * @return {Editor} 自身のインスタンス
	 */
	show: function () {
		this.viewing = true;
		this.$root.removeClass('hidden');
		this.setFlashing(false);
		return this;
	},


	/**
	 * エディタを削除する(未実装)
	 */
	remove: function () {
		//
	},


	/**
	 * リサイズ
	 * @param  {Number} rootWidth
	 * @param  {Number} rootHeight
	 */
	resize: function (rootWidth, rootHeight) {
		var rates = this.getSizeRate(this.position);
		this.$root.add(this.$root.find('.ace_editor')).css({
			'width': rootWidth * rates.width / 100 + 'px',
			'height' : rootHeight * rates.height / 100 - 35 + 'px'
		});
		this.$root.css('left', this.$sidebar.width() + 20 + (this.$editorRegion.width() * rates.left/100) + 'px');
		for (var name in this.tabList) {
			this.tabList[name].resize();
		}
		if (this.isViewing()) {
			this.tabResize();
		}
	},


	/**
	 * タブを切り替える
	 * @param  {String} tabId
	 * @return {Tab} 切り替えたタブのインスタンス
	 */
	changeActiveTab: function (tabId) {
		if (!(tabId in this.tabList)) {
			console.warn("changeActiveTab 指定されたタブが存在しません: " + tabId);
			return;
		}
		var $target = $('#' + this.viewerId);
		$target.find('.tab-item').removeClass('active').filter('[data-tab-id="' + tabId + '"]').addClass('active');

		for (var name in this.tabList) {
			this.tabList[name].hide();
		}
		this.tabList[tabId].setFlashing(false).show().resize().ace.focus();
		this.currentTabId = tabId;
		$(window).resize();
		return this.tabList[tabId];
	},


	/**
	 * アイコンを点滅させる
	 * @param {Boolean} flashing
	 * @return {Editor} self
	 */
	setFlashing: function (flashing) {
		$('.viewer-list').find('[data-viewer-id="' + this.viewerId + '"]')[flashing ? 'addClass' : 'removeClass']('flashing');
		return this;
	},


	/**
	 * エディタの表示状態を取得
	 * @return {Boolean}
	 */
	isViewing: function () {
		return this.viewing;
	},


	/**
	 * エディタの情報を送信する
	 * @param  {Boolean} saveToServer サーバーに送るならtrue
	 * @return {Editor} 自身のインスタンス
	 */
	send: function (saveToServer) {
		for (var tabId in this.tabList) {
			console.log('sendRTC');
			var tab = this.tabList[tabId];

			tab[saveToServer ? 'saveToServer' : 'send']({ text: tab.getText() });
		}
		return this;
	},


	/**
	 * エディタの情報をサーバーに送信する
	 * @return {Editor} 自身のインスタンス
	 */
	saveToServer: function () {
		this.send(true);
		toastr.info('サーバーに保存しました。');
		return this;
	},


	/**
	 * エディタの状態をまとめた送信用オブジェクトを生成
	 * @return {Object} 送信用オブジェクト
	 */
	serialize: function () {
		var res = [];

		for (var tabName in this.tabList) {
			res.push(this.tabList[tabName].serialize());
		}
		return res;
	}
}

return EditorObject;

});
