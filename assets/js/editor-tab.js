/**
 * Viewerごとのタブの管理
 * @param {String} viewerId
 * @param {String} tabName
 */
var Tab = function (viewerId, tabName) {
	/**
	 * エディタのID
	 * @type {String}
	 */
	this.editorId = viewerId + '-' + tabName;


	/**
	 * このタブのviewerId
	 * @type {String}
	 */
	this.viewerId = viewerId;


	/**
	 * タブ名
	 * @type {String}
	 */
	this.tabName = tabName;


	/**
	 * 自身かどうか
	 * @type {Boolean}
	 */
	this.isSelf = viewerId === getMyViewerId();


	/**
	 * タブHTML要素の初期化
	 */
	this._initTabElement(viewerId, tabName);


	/**
	 * エディタのルートHTML要素
	 * @type {Object}
	 */
	this.$editor = $(document.getElementById(this.editorId));


	/**
	 * Aceのインスタンス
	 * @type {Object}
	 */
	this.editor = ace.edit(this.editorId);


	/**
	 * ファイルの更新日時監視タイマー
	 * @type {Number}
	 */
	this.fileMoniterTimer = null;


	/**
	 * ファイルの最終更新日時
	 * @type {Number}
	 */
	this.fileLastMod = -1;


	var _self = this;
	/**
	 * 受信データ反映時の処理マッピング
	 * @type {Object}
	 */
	this.update = {
		/**
		 * 選択範囲
		 * @param  {Range} range
		 */
		range: function (range) {
			_self.editor.selection.setSelectionRange(range);
		},


		/**
		 * スクロール位置
		 * @param  {Object} scroll
		 */
		scroll: function (scroll) {
			_self.editor.session.setScrollTop(scroll.top);
			_self.editor.session.setScrollLeft(scroll.left);
		},


		/**
		 * 言語モード
		 * @param  {String} mode
		 */
		mode: function (mode) {
			_self.setMode(mode);
		},


		/**
		 * カラーテーマ
		 * @param  {String} theme
		 */
		theme: function (theme) {
			_self.setTheme(theme);
		},


		/**
		 * フォントサイズ
		 * @param  {Number} size
		 */
		fontsize: function (size) {
			_self.setFontSize(size);
		},


		/**
		 * テキスト
		 * @param  {String} text
		 */
		text: function (text) {
			var range = _self.editor.session.selection.getRange();
			_self.editor.setValue(decodeURIComponent(text));
			_self.editor.selection.setSelectionRange(range);
		},


		/**
		 * カーソル位置
		 * @param  {Object} cursor
		 */
		cursor: function (cursor) {
			var current = _self.editor.getCursorPosition();
			if (cursor.top !== current.top || cursor.left !== current.left) {
				_self.editor.moveCursorToPosition(cursor);
			}
		}
	}


	/**
	 * 初期化
	 */
	this._init();
}
Tab.prototype = {
	/**
	 * タブのHTML要素初期化
	 * @param  {String} viewerId
	 * @param  {String} tabName
	 */
	_initTabElement: function (viewerId, tabName) {
		var $root = $(document.getElementById(viewerId));
		var editorRegion = $(document.getElementById('editor-region'));
		var tabItemText = '<li class="tab-item" data-tab-name="%s"><a class="label" title="">%s</a><a class="close" data-tab-name="%s">x</a></li>';
		var editorText = '<div id="%s" data-tab-name="%s"></div>';
		// data属性がうまく反映されず、テンプレート化いったん断念
		$(sprintf(editorText, this.editorId, tabName)).width(editorRegion.width()).height(editorRegion.height() - 37).appendTo($root.find('.editor-list:first'));
		$(sprintf(tabItemText, tabName, tabName, tabName)).appendTo($root.find('.tab-list'));
	},


	/**
	 * 初期化
	 */
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


	/**
	 * 自身の初期化(エディタが操作されたらメンバーに送信など)
	 */
	_initSelf: function () {
		var _self = this;

		/**
		 * データを送信する
		 * @param  {String} type - 送信タイプ
		 * @param  {Object} data
		 * @param  {Boolean} toServer - サーバに送信するならtrue
		 */
		this._sendData = function (type, data, toServer) {
			// TODO: この中をもっと整える
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

		var sendActionList = [
			'insertText',
			'removeText',
			'insertLines',
			'removeLines'
		];
		// イベント登録
		_self.editor.session.on('change', function (e) {
			if (sendActionList.indexOf(e.data.action) == -1) {
				return;
			}
			_self._sendData('text', { text: _self.getText() });
		});
		_self.editor.session.on('changeScrollLeft', function () {
			_self._sendData('state', _self.getState());
		});
		_self.editor.session.on('changeScrollTop', function () {
			_self._sendData('state', _self.getState());
		});
		_self.editor.session.selection.on('changeSelection', function () {
			_self._sendData('state', _self.getState());
		});
		_self.editor.session.selection.on('changeCursor', function () {
			_self._sendData('state', _self.getState());
		});
	},


	/**
	 * タブの情報を送信. 複数ファイルを一度にドラッグ&ドロップされたときなど
	 * @param  {Object} textData
	 * @param  {Boolean} toServer - サーバに送信するならtrue
	 * @return {Tab} 自身
	 */
	send: function (textData, toServer) {
		// サーバー側のremoveTabを上書きするためchange_state
		this._sendData('state', this.getState(), toServer);
		this._sendData('text', textData, toServer);
		return this;
	},


	/**
	 * タブの情報をサーバに送信
	 * @param  {Object} textData
	 */
	saveToServer: function (textData) {
		this.send(textData, true);
	},


	/**
	 * ドロップされたファイルの更新日時を監視。外部で更新されたらエディタに反映。
	 * @param {File} file
	 * @param {Function} arrayBufferToString - ArrayBufferの内容を文字列に変換する関数
	 */
	startMonitoringFile: function (file, arrayBufferToString) {
		var _self = this;
		this.fileLastMod = file.lastModifiedDate;

		function applyIfUpdated() {
			if (_self.fileLastMod.getTime() !== file.lastModifiedDate.getTime()) {
				_self.fileLastMod = file.lastModifiedDate;
				var reader = new FileReader();
				reader.onload = function (e) {
					_self.applyData({
						text: arrayBufferToString(e.target.result)
					});
				}
				reader.readAsArrayBuffer(file);
			}
		}

		clearInterval(this.fileMoniterTimer);
		this.fileMoniterTimer = setInterval(applyIfUpdated, 1000);
		return this;
	},


	/**
	 * タブを表示する
	 * @return {Tab} 自身
	 */
	show: function () {
		this.$editor.removeClass('hidden');
		return this;
	},


	/**
	 * タブを非表示にする
	 * @return {Tab} 自身
	 */
	hide: function () {
		this.$editor.addClass('hidden');
		return this;
	},


	/**
	 * カラーテーマを変更
	 * @param {String} theme
	 * @return {Tab} 自身
	 */
	setTheme: function (theme) {
		theme = "ace/theme/" + theme;
		this.editor.setTheme( theme );
		return this;
	},


	/**
	 * 言語モードを変更
	 * @param {String} mode
	 * @return {Tab} 自身
	 */
	setMode: function (mode) {
		mode = "ace/mode/" + mode;
		this.editor.session.setMode( mode );
		return this;
	},


	/**
	 * フォントサイズを変更
	 * @param {Number} size
	 * @return {Tab} 自身
	 */
	setFontSize: function (size) {
		this.editor.setFontSize(size|0);
		return this;
	},


	/**
	 * リサイズ
	 * @return {Tab} 自身
	 */
	resize: function () {
		this.editor.resize();
		return this;
	},


	/**
	 * エディタのテキストをURIencodeして取得(送信用)
	 * @return {String} 送信用テキスト
	 */
	getText: function () {
		return encodeURIComponent(this.editor.getValue());
	},


	/**
	 * エディタの状態をまとめた送信用オブジェクト生成
	 * @return {Object} 送信用データ
	 */
	getState: function () {
		return {
			scroll: {
				top: this.editor.session.getScrollTop(),
				left: this.editor.session.getScrollLeft()
			},
			cursor: this.editor.getCursorPosition(),
			range: this.editor.session.selection.getRange(),
			theme: this.editor.getTheme().substr(10),
			mode: this.editor.session.getMode().$id.substr(9),
			fontsize: parseInt(this.$editor.css('font-size'))
		};
	},


	/**
	 * 受信データを反映する
	 * @param  {Object} data
	 * @return {Tab} 自身
	 */
	applyData: function (data) {
		// 入ってきたプロパティだけ反映する
		for (var prop in data) if (data.hasOwnProperty(prop)) {
			if (prop in this.update) {
				this.update[prop](data[prop]);
			} else {
				console.warn('無効なプロパティ: ', data);
			}
		}
		return this;
	},


	/**
	 * タブ削除
	 * @return {Tab} 自身
	 */
	remove: function () {
		clearInterval(this.fileMoniterTimer);
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
