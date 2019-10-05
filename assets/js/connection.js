define([
	'jquery',
	'room-info',
	'local-session'
], function ($, roomInfo, localSession) {
"use strict";

/**
 * 通信の制御
 */
var Connection = function () {};
Connection.prototype = {
	/**
	 * long polling監視開始
	 */
	start: function () {
		this._watch(-1, -1);
	},

	/**
	 * viewerIdごとのDataConnectionのインスタンスを保持する
	 * @type {Map<String, DataConnection>}
	 */
	_connectionList: {},


	/**
	 * イベントハンドラ
	 * @type {Map<String, Array<Function>>}
	 */
	_listeners: {},


	/**
	* イベントを登録する
	* @param {String} eventName open, close, error, received
	* @param {Function} listener
	*/
	on: function(eventName, listener){
		if(!this._listeners[eventName]){
			this._listeners[eventName] = [];
		}
		this._listeners[eventName].push(listener);
	},


	/**
	 * イベントを発火する
	 * @param  {String} eventName [args...]
	 */
	_fire: function(eventName){
		var args = $.extend(true, [], arguments);
		args.shift();

		(this._listeners[eventName] || []).forEach(function(listener){
			listener.apply(this, args);
		});
	},


	/**
	 * ページを離れるときに呼び出される
	 */
	_disconnect: function () {
		this.peer.destroy();
		this.send({
			type: 'exit_viewer',
			data: localSession.get(roomInfo.room.id)
		}, true);
	},


	/**
	 * 相手との接続が切れたときに呼び出される
	 * @param  {DataConnection} conn
	 */
	_close: function (conn) {
		this._fire('close', conn);
		delete this._connectionList[conn.metadata.viewerId];
	},


	/**
	 * 接続に関するエラーが発生したときに呼び出される
	 * @param  {Error} e
	 */
	_error: function (e) {
		this._fire('error', e);
		console.warn(e.message);
	},


	/**
	 * 初期化
	 * @param  {Object} selfViewerInfo
	 */
	_init: function (selfViewerInfo) {
		this._fire('init', selfViewerInfo);
		this._createPeerConnection();

		// ページを離れるとき
		window.addEventListener('beforeunload', this._disconnect.bind(this));
	},


	/**
	 * Peer接続の初期化
	 */
	_createPeerConnection: function () {
		this.peer = new Peer({
			key: '02bd7ce9-dc0e-41d2-93c8-1b3146445905',
			config: {
				iceServers: [{
				  urls: 'stun:stun.webrtc.ecl.ntt.com:3478',
				  url:  'stun:stun.webrtc.ecl.ntt.com:3478',
				}],
				iceTransportPolicy: 'all',
				sdpSemantics: 'plan-b',
			}
		});

		this.peer.on('open', function (myPeerId) {
			console.log('My peer ID Is: ' + myPeerId);
			this.send({
				type: 'update_peer_id',
				data: { 'peer_id': myPeerId }
			});
		}.bind(this));

		this.peer.on('connection', function (conn) {
			console.log('metadata: ', conn.metadata);
			this._connectionList[conn.metadata.viewerId] = conn;
			this._setupDataConnection(conn);
		}.bind(this));

		this.peer.on('error', this._error.bind(this));
	},


	/**
	 * PeerJS DataConnectionのセットアップ
	 * @param  {DataConnection} conn
	 */
	_setupDataConnection: function (conn) {
		conn.on('data', function (data) {
			this._fire('received', data);
		}.bind(this));

		conn.on('open', function () {
			this._fire('open', conn);
		}.bind(this));

		conn.on('close', function () {
			this._close(conn);
		}.bind(this));

		conn.on('error', this._error.bind(this));
	},


	/**
	 * 相手とDataConnectionを確立する
	 * @param  {String} peerId
	 */
	connect: (function () {
		var num = 0;

		return function (peerId) {
			function peerConnect(that) {
				var conn = that.peer.connect(peerId, {
					reliable: true,
					metadata: {
						viewerId: localSession.get(roomInfo.room.id),
						num: num++
					}
				});
				that._setupDataConnection(conn);
			}
			console.log('onOffer', peerId);
			
			if (!this.peer.open) {
				this.on('peerOpenProcess', () => peerConnect(this));
			} else {
				peerConnect(this);
			}
		}
	}()),


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
		data['viewer_id'] = localSession.get(roomInfo.room.id);

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
		}.bind(this));
	},


	/**
	 * long pollingのpushを監視する
	 * @param  {Number} lastChatId
	 * @param  {Number} lastTime
	 */
	_watch: function (lastChatId, lastTime) {
		var viewerId = localSession.get(roomInfo.room.id);

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
		}).done(function (data) {
			if (data['error']) {
				// location.reload();
				console.warn('Error!', data);
				setTimeout(function () {
					this._watch(lastChatId, lastTime);
				}, 500);
				return;
			}

			if (data['updated']) {
				lastChatId = data['last_chat_id'];
				lastTime = data['time'];
				this._fire('received', data);
			}

			if (data['viewer']) {
				this._init(data['viewer']);
				lastChatId = 0;
				lastTime = 0;
			}

			this._watch(lastChatId, lastTime);
		}.bind(this)).fail(function () {
			this._watch(lastChatId, lastTime);
		}.bind(this));
	}
}

return new Connection();

});
