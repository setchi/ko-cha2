/**
 * エディタ全体の管理
 */
var EditorList = function () {
	/**
	 * Viewerごとのエディタのインスタンスを保持するリスト
	 * @type {Array}
	 */
	this.editorList = [];
}
EditorList.prototype = {
	/**
	 * 初期化
	 */
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


	/**
	 * Editor追加 (Viewer一人につき一つのエディタ)
	 * @param {String} viewerId
	 */
	add: function (viewerId) {
		this.editorList[viewerId] = new Editor(viewerId, 4).hide();
	},


	/**
	 * Editor削除
	 * @param {String} viewerId
	 */
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

var editorList = new EditorList();
