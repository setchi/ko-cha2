define(function () {
"use strict";

/**
 * UIの操作に関するイベントを管理する
 */
var UIEvent = function () {};
UIEvent.prototype = {
	/**
	 * イベントハンドラ
	 * @type {Map<String, Array<Function>>}
	 */
	_listeners: {},


	/**
	* イベントを登録する
	* @param {String} eventName
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
	fire: function(eventName){
		var args = $.extend(true, [], arguments);
		args.shift();

		(this._listeners[eventName] || []).forEach(function(listener){
			listener.apply(this, args);
		});
	}
}

return new UIEvent();

});
