function getMyViewerId() {
	return roomInfo.viewer.viewer_id || localSession.get(roomInfo.room.id);
}


/**
 * エディタ全体の処理
 */

var EditorList = function () {
	this.editorList = [];
}
EditorList.prototype = {
	init: function () {
		var changeTargetTab = null;

		// 言語が変更されたら反映＆メンバーに送信
		$(document).on('change', '#changeTabMode', function (e) {
			if (!changeTargetTab) return cancelEvent(e);
			var mode = $(this).val();

			changeTargetTab.applyData({
				mode: mode
			}).send({
				text: changeTargetTab.getText(),
				mode: mode
			}).editor.focus();

		// タブが右クリックされたら言語選択プルダウンを表示
		}).on('contextmenu', '.tab-item', function (e) {
			var viewerId = $(this).parents('.editor-root').attr('id');
			var tabName = $(this).data('tab-name');
			changeTargetTab = editorList.get(viewerId).changeActiveTab(tabName);

			if (changeTargetTab.isSelf) {
				// 初期値代入
				$(document.getElementById('changeTabMode')).val(changeTargetTab.getState().mode);
			} else {
				return cancelEvent(e);
			}
		});

		$.contextMenu({
			selector: '#' + getMyViewerId() + ' .tab-item',
			items: {
				changeTabMode: {
					name: '言語設定<select id="changeTabMode" class="form-control"><option value="abap">ABAP</option><option value="actionscript">ActionScript</option><option value="c_cpp">C++</option><option value="c_cpp">C</option><option value="cobol">COBOL</option><option value="coffee">CoffeeScript</option><option value="csharp">C#</option><option value="css">CSS</option><option value="clojure">Clojure</option><option value="d">D</option><option value="dart">Dart</option><option value="erlang">Erlang</option><option value="forth">Forth</option><option value="golang">Go</option><option value="groovy">Groovy</option><option value="haskell">Haskell</option><option value="haxe">Haxe</option><option value="java">Java</option><option value="javascript">JavaScript</option><option value="jsx">JSX</option><option value="lisp">Lisp</option><option value="lsl">LSL</option><option value="lua">Lua</option><option value="matlab">MATLAB</option><option value="mysql">MySQL</option><option value="objectivec">Objective-C</option><option value="markdown">Markdown</option><option value="ocaml">OCaml</option><option value="pascal">Pascal</option><option value="perl">Perl</option><option value="php">PHP</option><option value="plain_text">Plain Text</option><option value="prolog">Prolog</option><option value="python">Python</option><option value="r">R</option><option value="ruby">Ruby</option><option value="rust">Rust</option><option value="scala">Scala</option><option value="scheme">Scheme</option><option value="sh">ShellScript</option><option value="latex">LaTeX</option><option value="typescript">TypeScript</option><option value="vbscript">VBScript</option><option value="verilog">Verilog</option><option value="assembly_x86">Assembly x86</option><option value="xml">XML</option><option value="xquery">XQuery</option></select>',
					callback: function(e){
						return false;
					}
				}
			}
		});
	},

	// Editorインスタンス追加 (Viewer一人につき一つのエディタ)
	add: function (viewerId) {
		this.editorList[viewerId] = new Editor(viewerId, 4).hide();
	},

	// Editorインスタンスを削除
	remove: function (viewerId) {
		for (var id in this.editorList) {
			if (this.editorList[id] !== viewerId) {
				continue;
			}
			this.editorList[id].remove();
			delete this.editorList[id];
			break;
		}
	},

	// 表示エディタを切り替える
	changeViewingEditor: function (viewerId) {
		for (var id in this.editorList) {
			this.editorList[id].hide();
		}
		if (void 0 === this.editorList[viewerId]) {
			console.warn("ユーザー '" + viewerId + "' が存在しません");
			return;
		}
		this.editorList[viewerId].show();
	},

	// ViewerのEditorインスタンスを取得
	get: function (viewerId) {
		if (void 0 === this.editorList[viewerId]) {
			this.add(viewerId);
		}
		return this.editorList[viewerId];
	},

	// 受信データを反映
	update: function (data) {
		try {
			this.get(data.viewerId).get(decodeURIComponent(data.tabName)).applyData(data.data);
		} catch (e) {
			console.warn(e.message, e);
		}

		// 自分の場合は更新通知をしない
		if (data.viewerId === getMyViewerId()) return;

		if (!this.get(data.viewerId).isViewing()) {
			// 閲覧中じゃないユーザーが更新した
			$(document.getElementsByClassName('viewer-list')).find('[data-viewer-id="' + data.viewerId + '"]').addClass('reception');
		}
		if (this.get(data.viewerId).currentTabName !== data.tabName) {
			// 見ていないタブが更新された
			$(document.getElementById(data.viewerId)).find('[data-tab-name="' + data.tabName + '"]').addClass('reception');
		}
	},

	resize: function (rootWidth, rootHeight) {
		for (var prop in this.editorList) {
			this.editorList[prop].resize(rootWidth, rootHeight);
		}
	},

	show: function (viewerId) {
		this.editorList[viewerId].show();
	},

	setLayout: function (viewerId, state) {
		if (void 0 === this.editorList[viewerId]) {
			this.add(viewerId);
		}

		var pairPosition = [1, 0, 3, 2, -1];
		var _self = this;
		var $editors = this.editorList[viewerId].$editorRegion.find('.editor-root');

		if ($editors.eq(0).attr('id') !== viewerId) {
			$editors.not(':first').each(function () {
				_self.editorList[$(this).attr('id')].hide();
			});
		}
		// ターゲットをeditorRegionの一番上に移動する
		this.editorList[viewerId].$root.prependTo(this.editorList[viewerId].$editorRegion);
		this.editorList[viewerId].show().setPosition(state).tabResize();
		for (var id in this.editorList) {
			// 相手
			if (this.editorList[id].isViewing() && id !== viewerId) {
				if (pairPosition[state] === -1) {
					this.editorList[id].hide();
				} else {
					this.editorList[id].show().setPosition(pairPosition[state]);
				}
			}
		}
	}
}



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

	var _self = this;
	// 自身のエディタのトップバーをダブルクリックで空タブを生成する
	if (this.isSelf) {
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
	}
}
Editor.prototype = {
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
		
		if (this.isSelf) {
			connection.send({
				type: 'editor_change_state',
				data: JSON.stringify({
					viewerId: this.viewerId,
					tabName: tabName,
					command: 'removeTab'
				})
			});
		} else {
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



/**
 * 個々のタブの処理
 */

var Tab = function (viewerId, tabName) {
	this.editorId = viewerId + '-' + tabName;
	this.viewerId = viewerId;
	this.tabName = tabName;
	this.isSelf = viewerId === getMyViewerId();
	var _self = this;

	var $root = $(document.getElementById(viewerId));
	var editorRegion = $(document.getElementById('editor-region'));
	var tabItemText = '<li class="tab-item" data-tab-name="%s"><a class="label" title="">%s</a><a class="close" data-tab-name="%s">x</a></li>';
	var editorText = '<div id="%s" data-tab-name="%s"></div>';
	// data属性がうまく反映されず、テンプレート化いったん断念
	$(sprintf(editorText, this.editorId, tabName)).width(editorRegion.width()).height(editorRegion.height() - 37).appendTo($root.find('.editor-list:first'));
	$(sprintf(tabItemText, tabName, tabName, tabName)).appendTo($root.find('.tab-list'));
	
	this.$editor = $(document.getElementById(this.editorId));
	this.editor = ace.edit(this.editorId);
	this.editor.session.setUseSoftTabs(true);
	this.editor.setAnimatedScroll(true);
	this.setTheme('cobalt');
	this.setMode('c_cpp');
	this.editor.setFontSize(12);
	this.fileMoniterTick = null;
	this.fileLastMod = -1;

	if (this.viewerId !== roomInfo.viewer.viewer_id) {
		this.editor.setReadOnly(true);
	}

	// 受信データ反映時の関数マッピング
	this.update = {
		range: function (_self, range) {
			_self.editor.selection.setSelectionRange(range);
		},
		scroll: function (_self, scroll) {
			_self.editor.session.setScrollTop(scroll.top);
			_self.editor.session.setScrollLeft(scroll.left);
		},
		mode: function (_self, mode) {
			_self.setMode(mode);
		},
		theme: function (_self, theme) {
			_self.setTheme(theme);
		},
		text: function (_self, text) {
			var range = _self.editor.session.selection.getRange();
			_self.editor.setValue(decodeURIComponent(text));
			_self.editor.selection.setSelectionRange(range);
		},
		cursor: function (_self, cursor) {
			var current = _self.editor.getCursorPosition();
			if (cursor.top !== current.top || cursor.left !== current.left) {
				_self.editor.moveCursorToPosition(cursor);
			}
		}
	}

	var init = false;
	if (this.isSelf) {
		this.init();
	}
}
Tab.prototype = {
	init: function () {
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
				this.update[prop](this, data[prop]);
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
		return this;
	}
}

var editorList = new EditorList();
