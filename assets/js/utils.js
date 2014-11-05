define(['lib/encoding.min'], function (Encoding) {

/**
 * 共通関数
 */
var Utils = {
	/**
	 * 値を範囲内に丸める
	 * @param  {Number} val
	 * @param  {Number} min
	 * @param  {Number} max
	 * @return {Number} 丸めた値
	 */
	rangeFilter: function (val, min, max) {
		return val < min ? min : val > max ? max : val;
	},


	/**
	 * オブジェクトの要素数を取得
	 * @param  {Object} obj
	 * @return {Number} 要素数
	 */
	getSize: function (obj) {
		var size = 0;
		for (var prop in obj) if (obj.hasOwnProperty(prop)) {
			size++;
		}
		return size;
	},


	/**
	 * HTML特殊文字をエスケープする
	 * @param  {String} str
	 * @return {String} エスケープされた文字列
	 */
	 escapeHTML: function (str) {
		var obj = document.createElement('pre');
		if (typeof obj.textContent != 'undefined') {
			obj.textContent = str;
		} else {
			obj.innerText = str;
		}
		return obj.innerHTML;
	},


	/**
	 * イベントをキャンセルする
	 * @param  {Object} e
	 * @return {Boolean} false
	 */
	cancelEvent: function (e) {
		e.preventDefault();
		e.stopPropagation();
		return false;
	},


	/**
	 * sprintf
	 * @param  {String} text
	 * @return {String} 変換後の文字列
	 */
	sprintf: function (text) {
		var i = 1, args = arguments;
		return text.replace(/%s/g, function () {
			return (i < args.length) ? args[i++] : "";
		});
	},


	/**
	 * 画面を見ていないと思われる場合にcallbackを実行する (ブラウザを最小化している、又は他のタブを閲覧している)
	 * @param  {Function} callback
	 */
	executeIfNotViewing: function (callback) {
		var rendered= false;
		requestAnimationFrame(function () {
			rendered = true;
		});
		setTimeout(function () {
			if (!rendered) callback();
		}, 600);
	},


	/**
	 * ArrayBufferの内容を文字列に変換する
	 * @param  {ArrayBuffer} arrayBuffer
	 * @return {String} 文字列
	 */
	arrayBufferToString: function (arrayBuffer) {
		var array = new Uint8Array(arrayBuffer);

		// ArrayBufferを適切なViewで処理 (様々な文字コードに対応させる)
		switch (Encoding.detect(array)) {
		case 'UTF16':
			array = new Uint16Array(arrayBuffer);
			break;
		case 'UTF32':
			array = new Uint32Array(arrayBuffer);
			break;
		}
		array = Encoding.convert(array, 'UNICODE');
		return Encoding.codeToString(array);
	}
}

return Utils;

});