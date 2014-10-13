/**
 * コマンド受信時の処理マッピング
 * @type {Object}
 */
var command = {
	removeTab: function (editorData) {
		editorList.get(editorData.viewerId).removeTab(editorData.tabName);
	}
}


/**
 * 受信データをそれぞれのインスタンスに受け渡す
 * @param  {Object} e
 */
function dataUpdate(e) {
	if (!e.updated) return;

	for (var state in e) {
		// エディタ
		if (state === 'editor_change_state' || state === 'editor_change_text') {
			for (var i in e[state].data) {
				var editorData = e[state].data[i].data;
				if ((typeof editorData) === 'string') {
					editorData = JSON.parse(editorData);
				}

				if (editorData.command !== undefined) {
					if (editorData.command in command) {
						command[editorData.command](editorData);
					}

				} else {
					editorList.update(editorData);
				}
			}

		// Viewer
		} else if (state === 'update_viewer') {
			viewer.update(e[state].list);

		// チャットログ
		} else if (state === 'chat_log') {
			Chat.insert(e[state]);
		}
	}
}
