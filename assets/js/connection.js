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
	this.watch(-1, -1);


	/**
	 * ViewerIDごとにPeerConnectionを保持する
	 * @type {Object}
	 */
	this.connectionList = {};
};
Connection.prototype = {
	/**
	 * 接続切断
	 */
	_disconnect: function () {
		this.myPeer.destroy();
		this.send({
			type: 'exit_viewer',
			data: roomInfo.viewer.viewer_id
		}, true);
	},


	/**
	 * 自分のViewerInfoを元に初期化
	 * @param  {String} viewerInfo
	 */
	_init: function (viewerInfo) {
		roomInfo.viewer = viewerInfo;
		localSession.add(roomInfo.room.id, viewerInfo.viewer_id);
		this._initPeer();
		viewer.init();
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
	_initPeer: function () {
		var _self = this;
		this.myPeer = new Peer({
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

		this.myPeer.on('open', function (myPeerId) {
			console.log('My peer ID Is: ' + myPeerId);
			_self.send({
				type: 'update_peer_id',
				data: { 'peer_id': myPeerId }
			})
		});

		this.myPeer.on('error', function (err) {
			console.log(err);
		});

		this.myPeer.on('connection', function (conn) {
			console.log('metadata: ', conn.metadata);
			_self.connectionList[conn.metadata.viewerId] = conn;

			conn.on('data', function (data) {
				_self.onRTC(data);
			});

			conn.on('close', function () {
				console.log('dataConnection close')
				conn.close();
				delete _self.connectionList[conn.metadata.viewerId];
			});

			editorList.get(getMyViewerId()).send();
		});
	},


	/**
	 * Peer接続のオファーを受信
	 * @param  {String} peerId
	 */
	onOffer: function (peerId) {
		console.log('onOffer', peerId);

		var _self = this;
		var conn = this.myPeer.connect(peerId, {
			reliable: true,
			metadata: {
				viewerId: getMyViewerId()
			}
		});

		conn.on('data', function (data) {
			_self.onRTC(data);
		});

		// 現在のデータを入室者におくる
		conn.on('open', function (e) {
			// TODO: 本人に送れば十分だが、既存の機能で全員に送っているのであとで直す
			editorList.get(getMyViewerId()).send();
		});

		conn.on('close', function () {
			console.log('dataConnection close ---');
			conn.close();
			delete _self.connectionList[conn.metadata.viewerId];
		});
	},


	/**
	 * Peerからデータを受信
	 * @param  {Object} data
	 */
	onRTC: function (data) {
		dataUpdate(data);
	},


	/**
	 * 部屋のメンバーにデータ送信
	 * @param  {Object} data
	 */
	sendRTC: function (data) {
		for (var viewerId in this.connectionList) {
			this.connectionList[viewerId].send(data);
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
	watch: function (lastChatId, lastTime) {
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
					_self.watch(lastChatId, lastTime);
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

			_self.watch(lastChatId, lastTime);
		}).fail(function () {
			_self.watch(lastChatId, lastTime);
		});
	}
}
var connection = new Connection();
