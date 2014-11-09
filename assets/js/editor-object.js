define([
	'jquery',
	'room-info',
	'local-session',
	'utils',
	'editor-tab',
	'editor-positions-enum',
	'toastr',
	'jquery.contextmenu'
], function ($, roomInfo, localSession, Utils, Tab, EditorPositionsEnum, toastr) {
"use strict";

/**
 * エディタ単体の制御
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


		// 自身のタブが右クリックされたら設定ウィンドウを表示
		var targetTab = null;
		$(document).on('contextmenu', '#' + _self.viewerId + ' .tab-item', function (e) {
			var tabId = $(this).data('tab-id');
			targetTab = _self.changeActiveTab(tabId);

			var currentState = targetTab.getState();
			// 現在値を代入
			$('#inputTabName').val(decodeURIComponent(targetTab.tabName));
			$('#selectMode').val(currentState.mode);
			$('#selectTheme').val(currentState.theme);
			$('#selectFontSize').val(currentState.fontsize);

		// 言語変更
		}).on('change', '#selectMode', function (e) {
			var data  = { mode:  $(this).val() };
			targetTab.applyData(data).send(data).ace.focus();

		// テーマ変更
		}).on('change', '#selectTheme', function (e) {
			var data = { theme: $(this).val() };
			targetTab.applyData(data).send(data).ace.focus();

		// フォントサイズ変更
		}).on('change', '#selectFontSize', function (e) {
			var data = { fontsize: $(this).val() };
			targetTab.applyData(data).send(data).ace.focus();

		// タブ名変更
		}).on('keyup', '#inputTabName', function (e) {
			var data = { tabname: encodeURIComponent($(this).val()) };
			targetTab.applyData(data).send(data);
		});

		$.contextMenu({
			selector: '#' + localSession.get(roomInfo.room.id) + ' .tab-item',
			items: {
				content: {
					name: 'タブ名<input id="inputTabName" class="form-control" placeholder="タブ名を入力">言語モード<select id="selectMode" class="form-control"><option value="abap">ABAP</option><option value="actionscript">ActionScript</option><option value="ada">ADA</option><option value="apache_conf">Apache Conf</option><option value="asciidoc">AsciiDoc</option><option value="assembly_x86">Assembly x86</option><option value="autohotkey">AutoHotKey</option><option value="batchfile">BatchFile</option><option value="c9search">C9Search</option><option value="c_cpp">C and C++</option><option value="cirru">Cirru</option><option value="clojure">Clojure</option><option value="cobol">Cobol</option><option value="coffee">CoffeeScript</option><option value="coldfusion">ColdFusion</option><option value="csharp">C#</option><option value="css">CSS</option><option value="curly">Curly</option><option value="d">D</option><option value="dart">Dart</option><option value="diff">Diff</option><option value="dockerfile">Dockerfile</option><option value="dot">Dot</option><option value="eiffel">Eiffel</option><option value="ejs">EJS</option><option value="erlang">Erlang</option><option value="forth">Forth</option><option value="ftl">FreeMarker</option><option value="gcode">Gcode</option><option value="gherkin">Gherkin</option><option value="gitignore">Gitignore</option><option value="glsl">Glsl</option><option value="golang">Go</option><option value="groovy">Groovy</option><option value="haml">HAML</option><option value="handlebars">Handlebars</option><option value="haskell">Haskell</option><option value="haxe">haXe</option><option value="html">HTML</option><option value="html_ruby">HTML (Ruby)</option><option value="ini">INI</option><option value="io">Io</option><option value="jack">Jack</option><option value="jade">Jade</option><option value="java">Java</option><option value="javascript">JavaScript</option><option value="json">JSON</option><option value="jsoniq">JSONiq</option><option value="jsp">JSP</option><option value="jsx">JSX</option><option value="julia">Julia</option><option value="latex">LaTeX</option><option value="less">LESS</option><option value="liquid">Liquid</option><option value="lisp">Lisp</option><option value="livescript">LiveScript</option><option value="logiql">LogiQL</option><option value="lsl">LSL</option><option value="lua">Lua</option><option value="luapage">LuaPage</option><option value="lucene">Lucene</option><option value="makefile">Makefile</option><option value="markdown">Markdown</option><option value="matlab">MATLAB</option><option value="mel">MEL</option><option value="mushcode">MUSHCode</option><option value="mysql">MySQL</option><option value="nix">Nix</option><option value="objectivec">Objective-C</option><option value="ocaml">OCaml</option><option value="pascal">Pascal</option><option value="perl">Perl</option><option value="pgsql">pgSQL</option><option value="php">PHP</option><option value="powershell">Powershell</option><option value="praat">Praat</option><option value="prolog">Prolog</option><option value="properties">Properties</option><option value="protobuf">Protobuf</option><option value="python">Python</option><option value="r">R</option><option value="rdoc">RDoc</option><option value="rhtml">RHTML</option><option value="ruby">Ruby</option><option value="rust">Rust</option><option value="sass">SASS</option><option value="scad">SCAD</option><option value="scala">Scala</option><option value="scheme">Scheme</option><option value="scss">SCSS</option><option value="sh">SH</option><option value="sjs">SJS</option><option value="smarty">Smarty</option><option value="snippets">snippets</option><option value="soy_template">Soy Template</option><option value="space">Space</option><option value="sql">SQL</option><option value="stylus">Stylus</option><option value="svg">SVG</option><option value="tcl">Tcl</option><option value="tex">Tex</option><option value="text">Text</option><option value="textile">Textile</option><option value="toml">Toml</option><option value="twig">Twig</option><option value="typescript">Typescript</option><option value="vala">Vala</option><option value="vbscript">VBScript</option><option value="velocity">Velocity</option><option value="verilog">Verilog</option><option value="vhdl">VHDL</option><option value="xml">XML</option><option value="xquery">XQuery</option><option value="yaml">YAML</option></select>テーマ<select id="selectTheme" class="form-control"><optgroup label="Bright"><option value="chrome">Chrome</option><option value="clouds">Clouds</option><option value="crimson_editor">Crimson Editor</option><option value="dawn">Dawn</option><option value="dreamweaver">Dreamweaver</option><option value="eclipse">Eclipse</option><option value="github">GitHub</option><option value="solarized_light">Solarized Light</option><option value="textmate">TextMate</option><option value="tomorrow">Tomorrow</option><option value="xcode">XCode</option><option value="kuroir">Kuroir</option><option value="katzenmilch">KatzenMilch</option></optgroup><optgroup label="Dark"><option value="ambiance">Ambiance</option><option value="chaos">Chaos</option><option value="clouds_midnight">Clouds Midnight</option><option value="cobalt">Cobalt</option><option value="idle_fingers">idle Fingers</option><option value="kr_theme">krTheme</option><option value="merbivore">Merbivore</option><option value="merbivore_soft">Merbivore Soft</option><option value="mono_industrial">Mono Industrial</option><option value="monokai">Monokai</option><option value="pastel_on_dark">Pastel on dark</option><option value="solarized_dark">Solarized Dark</option><option value="terminal">Terminal</option><option value="tomorrow_night">Tomorrow Night</option><option value="tomorrow_night_blue">Tomorrow Night Blue</option><option value="tomorrow_night_bright">Tomorrow Night Bright</option><option value="tomorrow_night_eighties">Tomorrow Night 80s</option><option value="twilight">Twilight</option><option value="vibrant_ink">Vibrant Ink</option></optgroup></select>フォントサイズ<select id="selectFontSize" class="form-control"><option value="10">10px</option><option value="11">11px</option><option value="12" selected="selected">12px</option><option value="13">13px</option><option value="14">14px</option><option value="16">16px</option><option value="18">18px</option><option value="20">20px</option><option value="24">24px</option></select>',
					callback: function () {
						return false;
					}
				}
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
