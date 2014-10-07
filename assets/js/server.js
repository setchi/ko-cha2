var roomInfo = JSON.parse($('#js_room_info').text());

/**
 * 通信制御
 */

var Server = function () {
	this.watch(-1, -1);
	this.connectionList = [];
};
Server.prototype = {
	init: function (viewerInfo) {
		roomInfo.viewer = viewerInfo;
		localSession.add(roomInfo.room.id, viewerInfo.viewer_id);
		this.initPeer();
		viewer.init();
		editorList.init();
	},

	// peerの初期化処理
	initPeer: function () {
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
			sendOffer(myPeerId);
		});

		this.myPeer.on('error', function (err) {
			console.log(err);
		});

		this.myPeer.on('connection', function (conn) {
			conn.on('data', function (data) {
				_self.onRTC(data);
			});
			
			_self.connectionList.push(conn);
		});

		// 自分が入室した
		function sendOffer(myPeerId) {
			// メンバーへpeerIDを送信
			_self.send({
				type: 'chat_log',
				data: '[sendOffer]' + JSON.stringify({
					id: myPeerId,
					date: new Date().getTime()
				}) + '[/sendOffer]'
			});
		}
	},

	// 接続が閉じている connection を削除する
	clearningConnectionList: function () {
		for (var i in this.connectionList) {
			if (!this.connectionList[i].open) {
				delete this.connectionList[i];
			}
		}
	},

	// 自分以外の誰かが入室した
	onOffer: function (data) {
		var data = JSON.parse(data);
		if (new Date().getTime() - data.date > 1000 * 20) {
			return;
		}

		var _self = this, peerId = data.id;
		if (this.connectionList.indexOf(peerId) > -1) {
			return;
		}

		var conn = this.myPeer.connect(peerId);
		this.clearningConnectionList();
		this.connectionList.push(conn);

		// 現在のデータを入室者におくる
		conn.on('open', function (e) {
			// TODO: 本人に送れば十分だが、既存の機能で全員に送っているのであとで直す
			editorList.get(getMyViewerId()).send();
		});

		conn.on('data', function (data) {
			_self.onRTC(data);
		});
	},

	// データを受信
	onRTC: function (data) {
		dataUpdate(data);
	},

	// 会話グループにデータ送信
	sendRTC: function (data) {
		for (var i in this.connectionList) {
			this.connectionList[i].send(data);
		}
	},

	// 接続切断処理。　onbeforeunload で呼び出される
	disconnect: function () {
		this.myPeer.destroy();
		this.send({
			type: 'exit_viewer',
			data: roomInfo.viewer.viewer_id
		}, true);
	},

	// long pollingにpush
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

	// long polling push監視メソッド
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
				_self.init(e['viewer']);
				lastChatId = 0;
				lastTime = 0;
			}

			_self.watch(lastChatId, lastTime);
		}).fail(function () {
			_self.watch(lastChatId, lastTime);
		});
	}
}
var server = new Server();
