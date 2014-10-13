<?php
/**
 * Fuel is a fast, lightweight, community driven PHP5 framework.
 *
 * @package    Fuel
 * @version    1.7
 * @author     Fuel Development Team
 * @license    MIT License
 * @copyright  2010 - 2013 Fuel Development Team
 * @link       http://fuelphp.com
 */

/**
 * The Room Controller.
 *
 * チャットルーム生成・ルームアクセスに関する処理
 *
 * @package  app
 * @extends  Controller
 */
class Controller_Room extends Controller_Rest
{
	/**
	 * 新しい使用可能なIDを取得
	 *
	 * @access private
	 * @return 新しい使用可能なID
	 */
	private static function get_room_id() {
		while (Model_Room::get_room($room_id = self::get_random_str(4))) ;
		return $room_id;
	}

	/**
	 * アルファベットと数字のランダムな文字列を生成します
	 *
	 * @access private
	 * @param 文字数
	 * @return ランダムな文字列
	 */
	private static function get_random_str($length) {
		return Str::random('alnum', $length);
	}

	/**
	 * 部屋へのアクセス
	 *
	 * @access  public
	 * @return  Response
	 */
	public function action_view($room_id = null) {
		if (!$room_id) {
			return NotFound::response404();
		}

		$room = Model_Room::get_room($room_id);
		if (!$room) {
			return NotFound::response404();
		}

		// パスワード認証
		if ($room['password']) {
			$password = Input::post('password');
			Session::set($room_id, $password);
			// パスワードが間違っていた
			if ($room['password'] != $password) {
				$view = ViewUtils::view_setup('room/auth');
				// 2回目以降
				if ($password) {
					$view->message = "パスワードが間違っています";
				}
				return Response::forge($view);
			}
		}
		
		// Room閲覧者情報更新
		$view = ViewUtils::view_setup('room/index');
		$view->room = $room;
		// $view->viewer = $viewer;
		return Response::forge($view);
	}
	
	/**
	 * 部屋を生成 - Rest
	 *
	 * @access  public
	 * @return  Response
	 */
	public function get_create()
	{
		$id = self::get_room_id();
		$title = '適当なタイトル';
		$owner_id = Session::key('session_id');
		$password = Input::get('password', false);

		// room_id, owrner_id, room_type, room_title
		Model_Room::create_room(array(
			'id' => $id,
			'owner_id' => $owner_id,
			'title' => $title,
			'password' => $password
		));

		$this->response(array(
			'id' => $id,
			'owner_id' => $owner_id
		));
	}

	/**
	 * 所有している部屋を検索する
	 *
	 * @access public
	 * @return 部屋リスト
	 */
	public function post_ownership() {
		$user_data = Input::post('user_data');
		$owner_id_list = array();

		foreach ($user_data as $key => $value) {
				$owner_id_list[] = $value;
		}
		if (count($owner_id_list) == 0) {
			return $this->response(array(
				'ownership' => array()
			));
		}
		$ownership_room_list = Model_Room::get_ownership_room($owner_id_list);

		return $this->response(array(
			'ownership' => $ownership_room_list
		));
	}

	/**
	 * 部屋を閉じる
	 *
	 * @access public
	 * @return 部屋ID
	 */
	public function post_close() {
		$id = Input::post('id');
		$owner_id = Input::post('viewer_id');
		$room =	Model_Room::get_room($id);

		if ($room['owner_id'] !== $owner_id) {
			return $this->response(array(
				'error' => true,
				'inputid' => $id,
				'room_info' => $room,
				'room_owner_id' => $room['owner_id'],
				'owner_id' => $owner_id
			));
		}
		Model_Room::update_room($id, array('owner_id' => null));
		return $this->response(array('id' => $id));
	}
}
