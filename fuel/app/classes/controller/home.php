<?php

class Controller_Home extends Controller
{
	/**
	 * トップページ
	 *
	 * @access  public
	 * @return  Response
	 */
	public function action_index()
	{
		$view = ViewUtils::view_setup('home/index');
		return Response::forge($view);
	}

	/**
	 * The 404 action for the application.
	 *
	 * @access  public
	 * @return  Response
	 */
	public function action_404()
	{
		return NotFound::response404();
	}
}
