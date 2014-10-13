/**
 * Viewerごとのエディタの管理
 * @param {String} viewerId
 * @param {Number} state 初期位置フラグ
 */
var Editor = function (viewerId, state) {
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
	this.currentTabName = "";


	/**
	 * このエディタのHTMLルート
	 * @type {Object}
	 */
	this.$root = $(document.getElementById(this.viewerId));


	/**
	 * このエディタを現在表示しているか
	 * @type {Boolean}
	 */
	this.viewing = false;


	/**
	 * 現在の位置フラグ
	 * @type {Number}
	 */
	this.state = state;
	this.setPosition(state);


	/**
	 * サイドバーのHTMLルート。リサイズ時にサイズを取得するためキャッシュ。
	 * @type {Object}
	 */
	this.$sidebar = $(document.getElementsByClassName('sidebar'));


	/**
	 * エディタ全体を表示しているHTMLのルート
	 * @type {Object}
	 */
	this.$editorRegion = $(document.getElementById('editor-region'));


	/**
	 * 自身かどうか
	 * @type {Boolean}
	 */
	this.isSelf = viewerId === getMyViewerId();

	if (this.isSelf) {
		this._initSelfEditor();
	}
}
Editor.prototype = {
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
					_self.addEmptyTab();
				} else {
					timer = setTimeout(function() {
						timer = -1;
					}, 400);
				}
				return cancelEvent(e);
			}
		}());

		// Ctrl + S でサーバーに状態を保存する
		$(document).on('keydown', function (e) {
			var keyCode = e.keyCode || e.charCode;

			if (e.ctrlKey && keyCode === 83) {
				_self.saveToServer();
				return cancelEvent(e);
			}
		});
	},


	/**
	 * 位置フラグから位置とサイズを求める(もっと分かりやすくしたい)
	 * @param  {Number} state
	 * @return {Object}
	 */
	getSizeRate: function (state) {
		var rates = { top: 0, left: 0, width: 0, height: 0 };
		switch (state) {
		case 0: // 左
			rates.width = 50;
			rates.height = 100;
			break;
		case 1: // 右
			rates.width = rates.left = 50;
			rates.height = 100;
			break;
		case 2: // 上
			rates.height = 50;
			rates.width = 100;
			break;
		case 3: // 下
			rates.height = rates.top = 50;
			rates.width = 100;
			break;
		case 4:
			rates.width = rates.height = 100;
			break;
		}
		return rates;
	},


	/**
	 * エディタの位置を変更する
	 * @param {Number} state
	 */
	setPosition: function (state) {
		this.state = state;
		var rates = this.getSizeRate(state);
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
		// console.log(this.viewerId, state);
		return this;
	},


	/**
	 * タブの位置を変更する(未実装)
	 * @param {String} tabName
	 * @param {Number} state
	 */
	setLayout: function (tabName, state) {
		console.log(tabName, state);
	},


	/**
	 * 現在の位置フラグを取得
	 * @return {Number} 位置フラグ
	 */
	getPositionState: function () {
		return this.state
	},


	/**
	 * タブのインスタンスを取得する。存在しない場合は新しく追加する
	 * @param  {String} tabName
	 * @return {Tab} Tabのインスタンス
	 */
	get: function (tabName) {
		if (void 0 === this.tabList[tabName]) {
			this.addTab(tabName);
		}
		return this.tabList[tabName];
	},


	/**
	 * タブのインスタンスを追加する
	 * @param {String} tabName
	 */
	addTab: function (tabName) {
		if (tabName in this.tabList) {
			console.warn('タブ名が重複しています.');
			return this.tabList[tabName];
		}
		// エディタ生成
		this.tabList[tabName] = new Tab(this.viewerId, tabName).hide();
		if (getSize(this.tabList) === 1) {
			this.changeActiveTab(tabName);
		}
		this.tabResize();
		return this.tabList[tabName];
	},


	/**
	 * 空タブを生成する
	 */
	addEmptyTab: function () {
		var tabName = 'untitled', index = '';
		
		// 同じタブ名がある間 index を更新する
		while ((tabName + index) in this.tabList) {
			index++;
		}
		// タブ追加＆言語設定
		this.addTab(tabName + index).applyData({
			mode: 'c_cpp'
		}).send({
			mode: 'c_cpp'
		});
	},


	/**
	 * タブをリサイズする
	 */
	tabResize: (function () {
		var timer;
		return function () {
			var _self = this;
			clearTimeout(timer);
			timer = setTimeout(function() {
				var tabWidth = (_self.$root.width() - 100) / getSize(_self.tabList);
				_self.$root.find('.tab-item').width(tabWidth).find('.label').width(tabWidth - (tabWidth / 200 * 60) - 10);
			}, 100);
		}
	}()),


	/**
	 * タブ削除。左右にタブがあれば次のタブを表示する（左側優先）
	 * @param  {String} tabName
	 */
	removeTab: function (tabName) {
		if (void 0 === this.tabList[tabName]) return;

		var target = this.$root.find('.tab-list').find('li[data-tab-name="' + tabName + '"]');
		var prev = target.prev().eq(0);
		var next = target.next().eq(0);
		var nextViewing = prev.size() ? prev : next.size() ? next : false;

		this.tabList[tabName].remove();
		delete this.tabList[tabName];

		this.$root.find('[data-tab-name="' + tabName + '"]').remove();
		if (this.currentTabName == tabName && nextViewing !== false) {
			this.changeActiveTab(nextViewing.data('tab-name'));
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
		$('.viewer-list').find('[data-viewer-id="' + this.viewerId + '"]').removeClass('reception');
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
		var rates = this.getSizeRate(this.state);
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
	 * @param  {String} tabName
	 * @return {Tab} 切り替えたタブのインスタンス
	 */
	changeActiveTab: function (tabName) {
		if (!(tabName in this.tabList)) {
			console.warn("changeActiveTab 指定されたタブが存在しません: " + tabName);
			return;
		}
		var $target = $(document.getElementById(this.viewerId));
		$target.find('.tab-item').removeClass('active').filter('[data-tab-name="' + tabName + '"]').addClass('active').removeClass('reception');

		for (var name in this.tabList) {
			this.tabList[name].hide();
		}
		this.tabList[tabName].show().resize();
		this.currentTabName = tabName;
		$(window).resize();
		return this.tabList[tabName];
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
		for (var tabName in this.tabList) {
			console.log('sendRTC');
			var tab = this.tabList[tabName];

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
	}
}
