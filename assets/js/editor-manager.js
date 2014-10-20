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
		var targetTab = null;
		this.setLayout(localSession.get(roomInfo.room.id), 4);

		// 自身のタブが右クリックされたら設定ウィンドウを表示
		var _self = this;
		$(document).on('contextmenu', '.tab-item', function (e) {
			var viewerId = $(this).parents('.editor-root').attr('id');
			var tabId = $(this).data('tab-id');
			targetTab = _self.get(viewerId).changeActiveTab(tabId);

			if (!targetTab.isSelf) {
				return Utils.cancelEvent(e);
			}
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
	 * Editor追加 (Viewer一人につき一つのエディタ)
	 * @param {String} viewerId
	 */
	add: function (viewerId) {
		this.editorList[viewerId] = new EditorObject(viewerId, 4).hide();
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
	 * @param {Number} state    位置フラグ
	 */
	setLayout: function (viewerId, state) {
		if (void 0 === this.editorList[viewerId]) {
			this.add(viewerId);
		}

		var pairPosition = [1, 0, 3, 2, -1];
		var $editors = this.editorList[viewerId].$editorRegion.find('.editor-root');
		var _self = this;

		if ($editors.eq(0).attr('id') !== viewerId) {
			$editors.not(':first').each(function () {
				_self.editorList[$(this).attr('id')].hide();
			});
		}
		// ターゲットをeditorRegionの一番上に移動する
		this.editorList[viewerId].$root.prependTo(this.editorList[viewerId].$editorRegion);
		this.editorList[viewerId].show().setPosition(state).tabResize();

		for (var id in this.editorList) {
			if (!this.editorList[id].isViewing() || id === viewerId) {
				continue;
			}
			if (pairPosition[state] === -1) {
				this.editorList[id].hide();
			} else {
				this.editorList[id].show().setPosition(pairPosition[state]);
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
