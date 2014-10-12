/**
 * 個々のエディタの処理
 */

var Editor = function (viewerId, state) {
	$('#ko-cha-templates').find('.editor-root').clone().attr('id', viewerId).appendTo('#editor-region');
	this.viewerId = viewerId;
	this.tabList = [];
	this.currentTabName;
	this.$root = $(document.getElementById(this.viewerId));
	this.viewing = false;
	this.state = state;
	this.setPosition(state);

	// resize用...
	this.$sidebar = $(document.getElementsByClassName('sidebar'));
	this.$editorRegion = $(document.getElementById('editor-region'));
	this.isSelf = viewerId === getMyViewerId();

	if (this.isSelf) {
		this._initSelfEditor();
	}
}
Editor.prototype = {
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

	setLayout: function (tabName, state) {
		console.log(tabName, state);
	},

	getPositionState: function () {
		return this.state
	},

	get: function (tabName) {
		if (void 0 === this.tabList[tabName]) {
			this.addTab(tabName);
		}
		return this.tabList[tabName];
	},

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

	// 空タブ生成
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

	// タブ削除。左右にタブがあれば次のタブを表示（左優先）
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

	hide: function () {
		this.viewing = false;
		this.$root.addClass('hidden');
		return this;
	},

	show: function () {
		this.viewing = true;
		this.$root.removeClass('hidden');
		$('.viewer-list').find('[data-viewer-id="' + this.viewerId + '"]').removeClass('reception');
		return this;
	},

	remove: function () {
		// do nothing.
	},

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

	// タブ切り替え
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

	isViewing: function () {
		return this.viewing;
	},

	// 強制的に送信 入室者に教える為
	send: function (saveToServer) {
		for (var tabName in this.tabList) {
			console.log('sendRTC');
			var tab = this.tabList[tabName];

			tab[saveToServer ? 'saveToServer' : 'send']({ text: tab.getText() });
		}
		return this;
	},

	// エディタの状態をサーバへ保存
	saveToServer: function () {
		this.send(true);
		toastr.info('サーバーに保存しました。');
		return this;
	}
}
