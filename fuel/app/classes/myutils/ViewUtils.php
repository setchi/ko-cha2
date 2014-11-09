<?php
/**
 * 自作Util置き場
 */

class ViewUtils
{
	/**
	 * viewに共通の属性を付与
	 *
	 * @access public
	 * @param $view
	 * @return $view
	 */
	public static function view_setup($path)
	{
		$view = View::forge($path);
		$view->set_global('base_url', Uri::base(false));
		$view->head = View::forge('common/head');
		$view->header = View::forge('common/header');
		$view->footer = View::forge('common/footer');
		return $view;
	}
}
