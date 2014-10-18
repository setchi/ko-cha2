/**
 * 部屋の情報
 * @type {Object}
 */
var roomInfo = JSON.parse($('#js_room_info').text());


/**
 * 通信の制御
 */
var Connection = function () {
	/**
	 * long polling監視開始
	 */
	this._watch(-1, -1);


	/**
	 * viewerIdごとのDataConnectionのインスタンスを保持する
	 * @type {Map<String, DataConnection>}
	 */
	this._connectionList = {};
};
Connection.prototype = {
	/**
	 * ページを離れるときに呼び出される
	 */
	_disconnect: function () {
		this.peer.destroy();
		this.send({
			type: 'exit_viewer',
			data: roomInfo.viewer.viewer_id
		}, true);
	},


	/**
	 * 初期化
	 * @param  {String} selfViewerInfo
	 */
	_init: function (selfViewerInfo) {
		roomInfo.viewer = selfViewerInfo;
		localSession.add(roomInfo.room.id, selfViewerInfo.viewer_id);
		this._createPeerConnection();
		viewer.init(selfViewerInfo.viewer_id);
		editorList.init();

		// ページを離れるとき
		var _self = this;
		window.onbeforeunload = function () {
			_self._disconnect();
		}
	},


	/**
	 * Peer接続の初期化
	 */
	_createPeerConnection: function () {
		var _self = this;
		this.peer = new Peer({
			key: 'e2cc565a-4d67-11e4-a512-5552163100a0',
			config: {
				iceServers: [{
					url: 'stun:stun.l.google.com:19302'
				}, {
					url: 'turn:192.158.29.39:3478?transport=udp',
					credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
					username: '28224511:1379330808'
				}, {
					url: 'turn:192.158.29.39:3478?transport=tcp',
					credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
					username: '28224511:1379330808'
				}]
			}
		});

		this.peer.on('open', function (myPeerId) {
			console.log('My peer ID Is: ' + myPeerId);
			_self.send({
				type: 'update_peer_id',
				data: { 'peer_id': myPeerId }
			})
		});

		this.peer.on('error', function (err) {
			console.log(err);
		});

		this.peer.on('connection', function (conn) {
			console.log('metadata: ', conn.metadata);
			_self._connectionList[conn.metadata.viewerId] = conn;
			_self._setupDataConnection(conn);
		});
	},


	/**
	 * PeerJS DataConnectionのセットアップ
	 * @param  {DataConnection} conn
	 */
	_setupDataConnection: function (conn) {
		var _self = this;
		conn.on('data', function (data) {
			_self._onRTC(data);
		});

		conn.on('open', function () {
			// 相手が最初に接続成功したのが自分の場合、現在までのチャットログを送信する
			if (!viewer.isActive(conn.metadata.viewerId) && conn.metadata.num === 0) {
				conn.send({ updated: true, chat_log: Chat.log });
			}

			editorList.get(getMyViewerId()).send();
			viewer.setActive(conn.metadata.viewerId, true);
		});

		conn.on('close', function () {
			viewer.setActive(conn.metadata.viewerId, false);
			delete _self._connectionList[conn.metadata.viewerId];
		});
	},


	/**
	 * Peer接続のオファーを受信
	 * @param  {String} peerId
	 */
	onOffer: (function () {
		var num = 0;

		return function (peerId) {
			console.log('onOffer', peerId);

			var conn = this.peer.connect(peerId, {
				reliable: true,
				metadata: {
					viewerId: getMyViewerId(),
					num: num++
				}
			});
			this._setupDataConnection(conn);
		}
	}()),


	/**
	 * Peerからデータを受信
	 * @param  {Object} data
	 */
	_onRTC: function (data) {
		dataUpdate(data);
	},


	/**
	 * 部屋のメンバーにデータ送信
	 * @param  {Object} data
	 */
	sendRTC: function (data) {
		for (var viewerId in this._connectionList) {
			this._connectionList[viewerId].send(data);
		}
	},


	/**
	 * long pollingにpush
	 * @param  {String} data
	 * @param  {Boolean} [sync] 同期処理させる場合はtrue
	 */
	send: function (data, sync) {
		var async = !sync;
		data['viewer_id'] = getMyViewerId();

		$.ajax({
			url: roomInfo.room.id + '/chat/push.json',
			type: 'post',
			dataType: 'json',
			data: data,
			async: async
		}).done(function (e) {
			if (e['error']) {
				// location.reload();
				console.warn('Error!', e);
			}
		});
	},


	/**
	 * long pollingのpushを監視する
	 * @param  {Number} lastChatId
	 * @param  {Number} lastTime
	 */
	_watch: function (lastChatId, lastTime) {
		var _self = this;
		var viewerId = getMyViewerId();

		$.ajax({
			url: roomInfo.room.id + '/chat/watch.json',
			type: 'post',
			timeout: 35000,
			dataType: 'json',
			data: {
				'last_chat_id': lastChatId,
				'last_time': lastTime,
				'viewer_id': viewerId
			}
		}).done(function (e) {
			if (e['error']) {
				// location.reload();
				console.warn('Error!', e);
				setTimeout(function () {
					_self._watch(lastChatId, lastTime);
				}, 500);
				return;
			}

			if (e['updated']) {
				lastChatId = e['last_chat_id'];
				lastTime = e['time'];
				dataUpdate(e);
			}

			if (e['viewer']) {
				_self._init(e['viewer']);
				lastChatId = 0;
				lastTime = 0;
			}

			_self._watch(lastChatId, lastTime);
		}).fail(function () {
			_self._watch(lastChatId, lastTime);
		});
	}
}
var connection = new Connection();
