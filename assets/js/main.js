var connection = new Connection();

(function () {
	var editorList = new EditorList();
	var viewer = new Viewer();

	// 相手からPeerの接続要求が来た時
	viewer.on('on-offer', function (peerId) {
		connection.onOffer(peerId);
	});


	// 新規Viewerが入室した時
	viewer.on('add-viewer', function (viewerId) {
		editorList.add(viewerId);
	});


	/**
	 * UIの操作に関するイベント
	 */

	// 表示タブを切り替えた
	UIEvent.on('switch-tab', function (viewerId, tabId) {
		editorList.get(viewerId).changeActiveTab(tabId);
	});


	// タブを削除した
	UIEvent.on('remove-tab', function (viewerId, tabId) {
		editorList.get(viewerId).removeTab(tabId);
	});


	// タブのレイアウトを変更
	UIEvent.on('switch-tab-layout', function (viewerId, tabId, layout) {
		editorList.get(viewerId).setLayout(tabId, layout);
	});


	// エディタのレイアウトを変更
	UIEvent.on('switch-editor-layout', function (viewerId, layout) {
		editorList.setLayout(viewerId, layout);
	});


	// エディタのリサイズ
	UIEvent.on('editor-resize', function (rootWidth, rootHeight) {
		editorList.resize(rootWidth, rootHeight);
	});


	// ファイルがドロップされた
	UIEvent.on('file-dropped', function (file, mode, content) {
		var targetEditor = editorList.get(localSession.get(roomInfo.room.id));
		var targetTab = targetEditor.addTab(file.name);

		// エディタに情報を反映、ファイルの更新監視開始
		targetTab.startMonitoringFile(file).applyData({
			text: encodeURIComponent(content),
			mode: mode
		}).send({
			mode: mode
		});
		
		// 自分のエディタを開いていなければ表示
		if (!targetEditor.isViewing()) {
			editorList.setLayout(localSession.get(roomInfo.room.id), 4);
		}
		targetEditor.changeActiveTab(file.name);
	});


	/**
	 * 通信に関するイベント
	 */

	// 接続準備完了時
	connection.on('init', function (selfViewerInfo) {
		viewer.init(selfViewerInfo);
		Chat.init(connection);
		editorList.init();
	});


	// 相手と接続完了したとき
	connection.on('open', function (conn) {
		// 相手が最初に接続成功したのが自分の場合、相手にチャット履歴を送信する
		if (!viewer.isActive(conn.metadata.viewerId) && conn.metadata.num === 0) {
			conn.send({ updated: true, chat_log: Chat.getHistory() });
		}
		viewer.setActive(conn.metadata.viewerId, true);
		editorList.get(localSession.get(roomInfo.room.id)).send();
	});


	// 相手との接続が切れたとき
	connection.on('close', function (conn) {
		viewer.setActive(conn.metadata.viewerId, false);
	});

		
	var commandList = {
		removeTab: function (editorData) {
			editorList.get(editorData.viewerId).removeTab(editorData.tabId);
		}
	}

	// データを受信したとき
	connection.on('received', function (data) {
		for (var state in data) {
			switch (state) {
			case 'update_viewer':
				viewer.update(data[state].list);
				break;

			case 'chat_log':
				Chat.update(data[state]);
				break;

			case 'editor_change_state':
			case 'editor_change_text':
				for (var i in data[state].data) {
					var editorData = data[state].data[i].data;
					if ((typeof editorData) === 'string') {
						editorData = JSON.parse(editorData);
					}

					if (editorData.command === undefined) {
						editorList.update(editorData);

					} else if (editorData.command in commandList) {
						commandList[editorData.command](editorData);
					}
				}
				break;
			default:
				break;
			}
		}
	});
}());
