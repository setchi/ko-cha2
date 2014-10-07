<?php
/**
 * 404Responseを生成
 */

class NotFound {
	/**
	 * 404Responseを生成
	 *
	 * @access public
	 * @return Response
	 */
	public static function response404() {
		return Response::forge(ViewUtils::view_setup('404'), 404);
	}
}
