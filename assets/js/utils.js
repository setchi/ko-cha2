/**
 * 共通関数
 */

function rangeFilter(val, min, max) {
	return val < min ? min : val > max ? max : val;
}

function getSize(obj) {
	var size = 0;
	for (var prop in obj) if (obj.hasOwnProperty(prop)) {
		size++;
	}
	return size;
}

function cancelEvent(e) {
	e.preventDefault();
	e.stopPropagation();
	return false;
}

function sprintf(text) {
	var i = 1, args = arguments;
	return text.replace(/%s/g, function () {
		return (i < args.length) ? args[i++] : "";
	});
}

// ブラウザを最小化している、又は他のタブを閲覧していたらcallbackを実行する
function executeIfNotViewing(callback) {
	var rendered= false;
	requestAnimationFrame(function () {
		rendered = true;
	});
	setTimeout(function () {
		if (!rendered) callback();
	}, 600);
}
