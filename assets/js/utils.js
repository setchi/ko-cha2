/**
 * 共通関数
 */

/**
 * 値を範囲内に丸める
 * @param  {Number} val
 * @param  {Number} min
 * @param  {Number} max
 * @return {Number} 丸めた値
 */
function rangeFilter(val, min, max) {
	return val < min ? min : val > max ? max : val;
}


/**
 * オブジェクトの要素数を取得
 * @param  {Object} obj
 * @return {Number} 要素数
 */
function getSize(obj) {
	var size = 0;
	for (var prop in obj) if (obj.hasOwnProperty(prop)) {
		size++;
	}
	return size;
}


/**
 * イベントをキャンセルする
 * @param  {Object} e
 * @return {Boolean} false
 */
function cancelEvent(e) {
	e.preventDefault();
	e.stopPropagation();
	return false;
}


/**
 * sprintf
 * @param  {String} text
 * @return {String} 変換後の文字列
 */
function sprintf(text) {
	var i = 1, args = arguments;
	return text.replace(/%s/g, function () {
		return (i < args.length) ? args[i++] : "";
	});
}


/**
 * 画面を見ていないと思われる場合にcallbackを実行する (ブラウザを最小化している、又は他のタブを閲覧している)
 * @param  {Function} callback
 */
function executeIfNotViewing(callback) {
	var rendered= false;
	requestAnimationFrame(function () {
		rendered = true;
	});
	setTimeout(function () {
		if (!rendered) callback();
	}, 600);
}


/**
 * 自身のViewerIDを取得する(お前ここじゃないだろ)
 * @return {String} viewerId
 */
function getMyViewerId() {
	return roomInfo.viewer.viewer_id || localSession.get(roomInfo.room.id);
}