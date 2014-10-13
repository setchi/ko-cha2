/**
 * 個々のタブの処理
 */

var Tab = function (viewerId, tabName) {
	this.editorId = viewerId + '-' + tabName;
	this.viewerId = viewerId;
	this.tabName = tabName;
	this.isSelf = viewerId === getMyViewerId();
	
	this._initTabElement(viewerId, tabName);
	this.$editor = $(document.getElementById(this.editorId));
	this.editor = ace.edit(this.editorId);
	this.fileMoniterTick = null;
	this.fileLastMod = -1;

	var _self = this;
	// 受信データ反映時の関数マッピング
	this.update = {
		range: function (range) {
			_self.editor.selection.setSelectionRange(range);
		},
		scroll: function (scroll) {
			_self.editor.session.setScrollTop(scroll.top);
			_self.editor.session.setScrollLeft(scroll.left);
		},
		mode: function (mode) {
			_self.setMode(mode);
		},
		theme: function (theme) {
			_self.setTheme(theme);
		},
		text: function (text) {
			var range = _self.editor.session.selection.getRange();
			_self.editor.setValue(decodeURIComponent(text));
			_self.editor.selection.setSelectionRange(range);
		},
		cursor: function (cursor) {
			var current = _self.editor.getCursorPosition();
			if (cursor.top !== current.top || cursor.left !== current.left) {
				_self.editor.moveCursorToPosition(cursor);
			}
		}
	}

	this._init();
}
Tab.prototype = {
	_initTabElement: function (viewerId, tabName) {
		var $root = $(document.getElementById(viewerId));
		var editorRegion = $(document.getElementById('editor-region'));
		var tabItemText = '<li class="tab-item" data-tab-name="%s"><a class="label" title="">%s</a><a class="close" data-tab-name="%s">x</a></li>';
		var editorText = '<div id="%s" data-tab-name="%s"></div>';
		// data属性がうまく反映されず、テンプレート化いったん断念
		$(sprintf(editorText, this.editorId, tabName)).width(editorRegion.width()).height(editorRegion.height() - 37).appendTo($root.find('.editor-list:first'));
		$(sprintf(tabItemText, tabName, tabName, tabName)).appendTo($root.find('.tab-list'));
	},

	_init: function () {		
		this.editor.session.setUseSoftTabs(true);
		this.editor.setAnimatedScroll(true);
		this.setTheme('cobalt');
		this.setMode('c_cpp');
		this.editor.setFontSize(12);

		if (this.isSelf) {
			this._initSelf();
		} else {
			this.editor.setReadOnly(true);
		}
	},

	_initSelf: function () {
		var _self = this;
		this.sendData = function (type, data, toServer) {
			var editorData = {
				type: 'editor_change_' + type,
				data: JSON.stringify({
					viewerId: _self.viewerId,
					tabName: encodeURIComponent(_self.tabName),
					data: data
				})
			};

			if (toServer) {
				connection.send(editorData);
				return;
			}

			var sendData = {};
			sendData.updated = true;
			sendData['editor_change_' + type] = {
				type: '',
				data: [editorData]
			};

			connection.sendRTC(sendData);
		}

		var timer = null;
		var textChangeActionList = {
			'insertText': 0,
			'removeText': 0,
			'insertLines': 0,
			'removeLines': 0
		};
		_self.editor.session.on('change', function (e) {
			if (!(e.data.action in textChangeActionList)) {
				return;
			}

			clearTimeout(timer);
			setTimeout(function () {
				_self.sendData('text', { text: _self.getText() });
			}, 5);
		});
		_self.editor.session.on('changeScrollLeft', function () {
			_self.sendData('state', _self.getState());
		});
		_self.editor.session.on('changeScrollTop', function () {
			_self.sendData('state', _self.getState());
		});
		_self.editor.session.selection.on('changeSelection', function () {
			_self.sendData('state', _self.getState());
		});
		_self.editor.session.selection.on('changeCursor', function () {
			_self.sendData('state', _self.getState());
		});
	},

	// 強制的に送信 複数ファイルを一度にドラッグ&ドロップされたときなど
	send: function (textData, toServer) {
		// サーバー側のremoveTabを上書きするためchange_state
		this.sendData('state', this.getState(), toServer);
		this.sendData('text', textData, toServer);
		return this;
	},

	// タブの状態をサーバに送信
	saveToServer: function (textData) {
		this.send(textData, true);
	},

	// ドロップされたファイルの更新日時を監視。外部で更新されたらエディタに反映。
	setMoniteringFile: function (file, getTextFromArrayBuffer) {
		var _self = this;
		this.fileLastMod = file.lastModifiedDate;
		clearTimeout(this.fileMoniterTick);
		this.fileMoniterTick = setInterval(function () {
			if (_self.fileLastMod.getTime() !== file.lastModifiedDate.getTime()) {
				_self.fileLastMod = file.lastModifiedDate;
				var reader = new FileReader();
				reader.onload = function (e) {
					_self.applyData({
						text: getTextFromArrayBuffer(e.target.result)
					});
				}
				reader.readAsArrayBuffer(file);
			}
		}, 1000);
		return this;
	},

	show: function () {
		this.$editor.removeClass('hidden');
		return this;
	},

	hide: function () {
		this.$editor.addClass('hidden');
		return this;
	},

	setTheme: function (theme) {
		theme = "ace/theme/" + theme;
		this.editor.setTheme( theme );
		return this;
	},

	setMode: function (mode) {
		mode = "ace/mode/" + mode;
		this.editor.session.setMode( mode );
		return this;
	},

	setFontSize: function (size) {
		this.editor.setFontSize(size|0);
		return this;
	},

	resize: function () {
		this.editor.resize();
		return this;
	},

	getText: function () {
		return encodeURIComponent(this.editor.getValue());
	},

	// エディタの状態をまとめたオブジェクト生成
	getState: function () {
		return {
			scroll: {
				top: this.editor.session.getScrollTop(),
				left: this.editor.session.getScrollLeft()
			},
			cursor: this.editor.getCursorPosition(),
			range: this.editor.session.selection.getRange(),
			theme: this.editor.getTheme().substr(10),
			mode: this.editor.session.getMode().$id.substr(9)
		};
	},

	// 受信データを反映する
	applyData: function (data) {
		// 入ってきたプロパティだけ反映する
		for (var prop in data) if (data.hasOwnProperty(prop)) {
			if (prop in this.update) {
				this.update[prop](data[prop]);
			} else {
				console.log('プロパティがありません。', data);
			}
		}
		return this;
	},

	// タブ削除処理
	remove: function () {
		clearTimeout(this.fileMoniterTick);
		this.editor.destroy();
		
		if (this.isSelf) {
			connection.send({
				type: 'editor_change_state',
				data: JSON.stringify({
					viewerId: this.viewerId,
					tabName: this.tabName,
					command: 'removeTab'
				})
			});
		}
		return this;
	}
}
