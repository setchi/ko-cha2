/**
 * 受信データをそれぞれのインスタンスに受け渡す
 */

var command = {
	removeTab: function (editorData) {
		editorList.get(editorData.viewerId).removeTab(editorData.tabName);
	}
}

function dataUpdate(e) {
	if (!e.updated) return;

	for (var state in e) {
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
		} else if (state === 'update_viewer') {
			viewer.update(e[state].list);

		} else if (state === 'chat_log') {
			Chat.insert(e[state]);
		}
	}
}
