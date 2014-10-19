/**
 * Viewerごとのタブの管理
 * @param {String} viewerId
 * @param {String} tabId
 * @param {String} tabName
 */
var Tab = function (viewerId, tabId, tabName) {
	/**
	 * AceのインスタンスID
	 * @type {String}
	 */
	this._aceId = viewerId + '-' + tabId;


	/**
	 * このタブのviewerId
	 * @type {String}
	 */
	this._viewerId = viewerId;


	/**
	 * タブID
	 * @type {String}
	 */
	this.id = tabId;


	/**
	 * タブ名
	 * @type {String}
	 */
	this.tabName = tabName;


	/**
	 * 自身かどうか
	 * @type {Boolean}
	 */
	this.isSelf = viewerId === localSession.get(roomInfo.room.id);


	/**
	 * タブHTML要素の初期化
	 */
	this._initTabElement(viewerId, tabId, tabName);


	/**
	 * エディタのルートHTML要素
	 * @type {Object}
	 */
	this._$editor = $('#' + this._aceId);


	/**
	 * Aceのインスタンス
	 * @type {Object}
	 */
	this.ace = ace.edit(this._aceId);


	/**
	 * ファイルの更新日時監視タイマー
	 * @type {Number}
	 */
	this._fileMonitorTimer = null;


	/**
	 * ファイルの最終更新日時
	 * @type {Number}
	 */
	this._fileLastMod = -1;


	var _self = this;
	/**
	 * 受信データ反映時の処理マッピング
	 * @type {Object}
	 */
	this._update = {
		/**
		 * 選択範囲
		 * @param  {Range} range
		 */
		range: function (range) {
			_self.ace.selection.setSelectionRange(range);
		},


		/**
		 * スクロール位置
		 * @param  {Object} scroll
		 */
		scroll: function (scroll) {
			_self.ace.session.setScrollTop(scroll.top);
			_self.ace.session.setScrollLeft(scroll.left);
		},


		/**
		 * 言語モード
		 * @param  {String} mode
		 */
		mode: function (mode) {
			_self.ace.session.setMode("ace/mode/" + mode);
		},


		/**
		 * カラーテーマ
		 * @param  {String} theme
		 */
		theme: function (theme) {
			_self.ace.setTheme("ace/theme/" + theme);
		},


		/**
		 * フォントサイズ
		 * @param  {Number} size
		 */
		fontsize: function (size) {
			_self.ace.setFontSize(size|0);
		},


		/**
		 * タブ名
		 * @param  {String} tabName
		 */
		tabname: function (tabName) {
			_self.tabName = tabName;
			var $tabLabel = $('#' + _self._viewerId).find('.tab-list').find('[data-tab-id="' + _self.id + '"] > .label');
			$tabLabel.text(decodeURIComponent(tabName));
		},


		/**
		 * テキスト
		 * @param  {String} text
		 */
		text: function (text) {
			var range = _self.ace.session.selection.getRange();
			var scrollTop = _self.ace.session.getScrollTop();
			var scrollLeft = _self.ace.session.getScrollLeft();

			_self.ace.setValue(decodeURIComponent(text));

			_self.ace.selection.setSelectionRange(range);
			_self.ace.session.setScrollTop(scrollTop);
			_self.ace.session.setScrollLeft(scrollLeft);
		},


		/**
		 * カーソル位置
		 * @param  {Object} cursor
		 */
		cursor: function (cursor) {
			var current = _self.ace.getCursorPosition();
			if (cursor.top !== current.top || cursor.left !== current.left) {
				_self.ace.moveCursorToPosition(cursor);
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
	 * @param  {String} tabId
	 * @param  {String} tabName
	 */
	_initTabElement: function (viewerId, tabId, tabName) {
		var $root = $('#' + viewerId);
		var editorRegion = $('#editor-region');
		var tabItemText = '<li class="tab-item" data-tab-id="%s"><a class="label" title="">%s</a><a class="close" data-tab-id="%s">x</a></li>';
		var editorText = '<div id="%s" data-tab-id="%s"></div>';
		// data属性がうまく反映されず、テンプレート化いったん断念
		$(Utils.sprintf(editorText, this._aceId, tabId)).width(editorRegion.width()).height(editorRegion.height() - 37).appendTo($root.find('.editor-list:first'));
		$(Utils.sprintf(tabItemText, tabId, tabName, tabId)).appendTo($root.find('.tab-list'));
	},


	/**
	 * 初期化
	 */
	_init: function () {		
		this.ace.session.setUseSoftTabs(true);
		this.ace.setAnimatedScroll(true);
		this.applyData({
			theme: 'cobalt',
			mode: 'c_cpp',
			fontsize: 12
		});
		this.isSelf ? this._initSelf() : this.ace.setReadOnly(true);
	},


	/**
	 * 自身の初期化(エディタが操作されたらメンバーに送信など)
	 */
	_initSelf: function () {
		var sendActionList = [
			'insertText',
			'removeText',
			'insertLines',
			'removeLines'
		];
		var sendState = function () {this._sendData('state', this.getState())}.bind(this);
		this.ace.session.on('changeScrollLeft', sendState);
		this.ace.session.on('changeScrollTop', sendState);
		this.ace.session.selection.on('changeSelection', sendState);
		this.ace.session.selection.on('changeCursor', sendState);
		this.ace.session.on('change', function (e) {
			if (sendActionList.indexOf(e.data.action) == -1) {
				return;
			}
			this._sendData('text', { text: this.getText() });
		}.bind(this));
	},


	/**
	 * データを送信する
	 * @param  {String} type - 送信タイプ
	 * @param  {Object} data
	 * @param  {Boolean} toServer - サーバに送信するならtrue
	 * @param  {String} command
	 */
	_sendData: function (type, data, toServer, command) {
		// TODO: この中をもっと整える
		var tmpData = {
			viewerId: this._viewerId,
			tabId: this.id,
			tabName: encodeURIComponent(this.tabName),
			data: data
		};
		if (command) tmpData.command = command;

		var editorData = {
			type: 'editor_change_' + type,
			data: JSON.stringify(tmpData)
		};
		if (toServer) {
			connection.send(editorData);
			return;
		}

		var sendData = {};
		sendData.updated = true;
		sendData[editorData.type] = {
			type: '',
			data: [editorData]
		};
		connection.sendRTC(sendData);
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
	 * タブの状態をまとめた送信用オブジェクト生成
	 * @return {Object} 送信用オブジェクト
	 */
	serialize: function () {
		var data = this.getState();
		data.text = this.getText();

		var editorData = {
			type: 'editor_change_text',
			data: JSON.stringify({
				viewerId: this._viewerId,
				tabId: this.id,
				tabName: encodeURIComponent(this.tabName),
				data: data
			})
		};

		var sendData = {};
		sendData.updated = true;
		sendData[editorData.type] = {
			type: '',
			data: [editorData]
		};
		return sendData;
	},


	/**
	 * ドロップされたファイルの更新日時を監視。外部で更新されたらエディタに反映。
	 * @param {File} file
	 */
	startMonitoringFile: function (file) {
		this._fileLastMod = file.lastModifiedDate;
		clearInterval(this._fileMonitorTimer);

		this._fileMonitorTimer = setInterval(function () {
			if (this._fileLastMod.getTime() !== file.lastModifiedDate.getTime()) {
				this._fileLastMod = file.lastModifiedDate;
				var reader = new FileReader();

				reader.onload = function (e) {
					this.applyData({
						text: Utils.arrayBufferToString(e.target.result)
					});
				}.bind(this);
				reader.readAsArrayBuffer(file);
			}
		}.bind(this), 1000);

		return this;
	},


	/**
	 * タブを表示する
	 * @return {Tab} 自身
	 */
	show: function () {
		this._$editor.removeClass('hidden');
		return this;
	},


	/**
	 * タブを非表示にする
	 * @return {Tab} 自身
	 */
	hide: function () {
		this._$editor.addClass('hidden');
		return this;
	},


	/**
	 * リサイズ
	 * @return {Tab} 自身
	 */
	resize: function () {
		this.ace.resize();
		return this;
	},


	/**
	 * タブを点滅させる
	 * @param {Boolean} flashing
	 * @return {Tab} self
	 */
	setFlashing: function (flashing) {
		$('#' + this._viewerId).find('[data-tab-id="' + this.id + '"]')[flashing ? 'addClass' : 'removeClass']('flashing');
		return this;
	},


	/**
	 * エディタのテキストをURIencodeして取得(送信用)
	 * @return {String} 送信用テキスト
	 */
	getText: function () {
		return encodeURIComponent(this.ace.getValue());
	},


	/**
	 * エディタの状態をまとめたオブジェクト生成
	 * @return {Object}
	 */
	getState: function () {
		return {
			tabname: this.tabName,
			scroll: {
				top: this.ace.session.getScrollTop(),
				left: this.ace.session.getScrollLeft()
			},
			cursor: this.ace.getCursorPosition(),
			range: this.ace.session.selection.getRange(),
			theme: this.ace.getTheme().substr(10),
			mode: this.ace.session.getMode().$id.substr(9),
			fontsize: this.ace.getFontSize()
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
			if (prop in this._update) {
				this._update[prop](data[prop]);
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
		clearInterval(this._fileMonitorTimer);
		this.ace.destroy();
		
		if (this.isSelf) {
			this._sendData('state', {}, true, 'removeTab');
		}
		return this;
	}
}
