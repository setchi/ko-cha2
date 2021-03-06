require([
	'jquery',
	'room-info',
	'local-session',
	'connection',
	'editor-manager',
	'editor-positions-enum',
	'viewer',
	'chat',
	'ui-event',
	'ui-filedrop',
	'ui-main',
	'ace'
], function ($, roomInfo, localSession, connection, editorManager, EditorPositionsEnum, viewer, Chat, UIEvent) {
	"use strict";

	connection.start();

	// 相手から接続要求が来た時
	viewer.on('on-offer', function (peerId) {
		connection.connect(peerId);
	});


	// 新規Viewerが入室した時
	viewer.on('add-viewer', function (viewerId) {
		editorManager.add(viewerId);
	});


	/**
	 * 通信に関するイベント登録
	 */

	// 接続準備完了時
	connection.on('init', function (selfViewerInfo) {
		viewer.init(selfViewerInfo);
		Chat.init(connection);
		editorManager.init();
	});


	// 相手と接続完了したとき
	connection.on('open', function (conn) {

		// 相手が最初に接続成功したのが自分の場合、部屋のすべての状態を送信する
		if (!viewer.isActive(conn.metadata.viewerId) && conn.metadata.num === 0) {
			conn.send({
				updated: true,
				chat_log: Chat.getHistory(),
				editor_change_text: {
					type: 'text',
					data: editorManager.serializeAll()
				}
			});
		}
		viewer.setActive(conn.metadata.viewerId, true);
	});


	// 相手との接続が切れたとき
	connection.on('close', function (conn) {
		viewer.setActive(conn.metadata.viewerId, false);
	});


	// 接続エラーが起きたとき
	connection.on('error', function (e) {

		switch (e.type) {
		case 'browser-incompatible':
			alert('ご利用のブラウザはWebRTCに対応していません。このアプリは、GoogleChromeなどのWebRTC対応ブラウザで利用してください。');
			break;
		}
	});

		
	var commandList = {
		removeTab: function (editorData) {
			editorManager.get(editorData.viewerId).removeTab(editorData.tabId);
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
						editorManager.update(editorData);

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


	/**
	 * UIの操作に関するイベント登録
	 */

	// 表示タブを切り替えた
	UIEvent.on('switch-tab', function (viewerId, tabId) {
		editorManager.get(viewerId).changeActiveTab(tabId);
	});


	// タブを削除した
	UIEvent.on('remove-tab', function (viewerId, tabId) {
		editorManager.get(viewerId).removeTab(tabId);
	});


	// タブのレイアウトを変更
	UIEvent.on('switch-tab-layout', function (viewerId, tabId, layout) {
		// 未実装
	});


	// エディタのレイアウトを変更
	UIEvent.on('switch-editor-layout', function (viewerId, layout) {
		editorManager.setPosition(viewerId, layout);
	});


	// エディタのリサイズ
	UIEvent.on('editor-resize', function (rootWidth, rootHeight) {
		editorManager.resize(rootWidth, rootHeight);
	});


	// ファイルがドロップされた
	UIEvent.on('file-dropped', function (file, mode, content) {
		var selfEditor = editorManager.get(localSession.get(roomInfo.room.id));
		var targetTab = selfEditor.addTab(file.name);

		// エディタに情報を反映、ファイルの更新監視開始
		targetTab.startMonitoringFile(file).applyData({
			text: encodeURIComponent(content),
			mode: mode
		}).send({
			mode: mode
		});
		
		// 自分のエディタを開いていなければ表示
		if (!selfEditor.isViewing()) {
			editorManager.setPosition(localSession.get(roomInfo.room.id), EditorPositionsEnum.FULLSCREEN);
		}
		selfEditor.changeActiveTab(targetTab.id);
	});
});
