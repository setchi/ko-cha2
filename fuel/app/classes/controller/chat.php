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
 * The Chat Controller.
 *
 * A basic controller example.  Has examples of how to set the
 * response body and status.
 *
 * @package  app
 * @extends  Controller
 */
class Controller_Chat extends Controller_Rest
{
	/**
	 * Viewerの認証を行います
	 *
	 * @access private
	 * @return boolean
	 */
	private static function access_auth($room_id, $viewer_id)
	{
		return $viewer_id && 1 === count(Model_Viewer::get_viewer($room_id, $viewer_id));
	}

	/**
	 * 最終更新時間から差分情報を取得します
	 *
	 * @access public
	 * @return JSON
	 */
	private static function get_updates($room_id, $viewer_id, $updated_type_list, $last_chat_id, $last_time)
	{
		$response = array(
			'updated' => true,
			'time' => microtime(true),
			'last_chat_id' => $last_chat_id,
			'viewer_id' => $viewer_id
		);
		
		foreach ($updated_type_list as $key => $value)
		{
			$type = $value['type'];
			// タイプ別に、更新情報を取得
			if ($type === 'chat_log')
			{
				$chat_logs = Model_Chat::get_chat_log($room_id, $last_chat_id);
				if (count($chat_logs))
				{
					$response[$type] = $chat_logs;
					$response['last_chat_id'] = $chat_logs[count($chat_logs)-1]['id'];
				}

			}
			elseif ($type === 'update_viewer')
			{
				$response[$type] = array(
					'list' => Model_Viewer::get_viewers($room_id),
					'party' => Model_Room::get_room($room_id),
				);
			
			}
			elseif ($type === 'editor_change_text')
			{
				$response[$type] = array(
					'type' => 'text',
					'data' => Model_Editor::get_data(
						$type,
						$room_id,
						$viewer_id,
						$last_time
					)
				);
			}
			elseif ($type === 'editor_change_state')
			{
				$response[$type] = array(
					'type' => 'state',
					'data' => Model_Editor::get_data(
						$type,
						$room_id,
						$viewer_id,
						$last_time
					)
				);
			}
		}
		return $response;
	}

	/**
	 * long pollingのpushを監視します
	 *
	 * @access public
	 * @return JSON
	 */
	public function post_watch($room_id)
	{
		$viewer_id = Input::post('viewer_id');
		if (!$viewer_id)
		{
			$viewer_id = Session::key('session_id');
		}
		/*
		if (!self::access_auth($room_id, $viewer_id))
		{
			return $this->response(array(
				'error' => true,
				'viewer_id' => $viewer_id,
				'room_id' => $room_id,
				'message' => DB::last_query(),
			));
		}*/

		$last_chat_id = Input::post('last_chat_id', false);
		$last_time = Input::post('last_time', false);
		if ($last_chat_id === false || $last_time === false)
		{
			return $this->response(array('updated' => false));
		}

		if ($last_chat_id == -1 && $last_time == -1)
		{
			$viewer = Model_Viewer::enter_viewer($room_id, $viewer_id);
			Model_Viewer::update_viewer($room_id, $viewer_id, array('peer_id' => null));
			return $this->response(array(
				'updated' => false,
				'viewer' => $viewer
			));
		}

		$timeout = 30000;
		$wait = 70;
		$counter = 0;

		while ($counter < $timeout)
		{
			usleep($wait * 1000);
			$updated_type_list = Model_Chat::get_updated_type_list($room_id, $viewer_id, $last_time);
			
			if (count($updated_type_list))
			{
				return $this->response(self::get_updates(
					$room_id,
					$viewer_id,
					$updated_type_list,
					$last_chat_id,
					$last_time
				));
			}
			$counter += $wait;
		}
		return $this->response(array(
			'updated' => false
		));
	}

	/**
	 * long pollingにpushします
	 *
	 * @access public
	 * @return JSON
	 */
	public function post_push($room_id)
	{
		$viewer_id = Input::post('viewer_id');
		if (!self::access_auth($room_id, $viewer_id))
		{
			return $this->response(array(
				'error' => true,
				'viewer_id' => $viewer_id,
				'room_id' => $room_id,
				'message' => DB::last_query()
			));
		}

		$type = Input::post('type');
		$data = Input::post('data');

		Model_Chat::send($room_id, $viewer_id, $type, $data);

		return $this->response(array(
			'type' => $type,
			'data' => $data
		));
	}

	/**
	 * 画像を受信します
	 * @access public
	 * @return JSON
	 */
	public function post_upload_image($room_id)
	{
		$path = DOCROOT.'assets/upload/'.$room_id.'/';

		// ファイルを書き込み専用でオープンします。
		if (!file_exists($path))
		{
			mkdir($path, 0707, true);
		}

		// 初期設定
		$config = array(
			'path' => $path,
			'auto_rename' => true,
			'overwrite' => true,
			'ext_whitelist' => array(
				'jpg',
				'gif',
				'png',
				'bmp',
			),
		);
		// アップロード基本プロセス実行
		Upload::process($config);

		if (Upload::is_valid())
		{
			Upload::save();
			$files = Upload::get_files();
			$names = array();

			foreach ($files as $file)
			{
				$name[] = $file['saved_as'];

				Image::load($path.$file['saved_as'], false)
				 	->rotate(90)
					->resize(130, null)
					->rotate(-90)
					->save_pa('thumb-');
			}

			return $this->response($name);
		}
		// エラー有り
		foreach (Upload::get_errors() as $file)
		{
			// $file['errors']の中にエラーが入っているのでそれを処理
		}
	}

	/**
	 * ファイルを受信します。
	 * @access public
	 * @param  String $room_id
	 * @return JSON
	 */
	public function post_upload_file($room_id)
	{
		$path = DOCROOT.'assets/upload/'.$room_id.'/';

		// ファイルを書き込み専用でオープンします。
		if (!file_exists($path))
		{
			mkdir($path, 0707, true);
		}

		// 初期設定
		$config = array(
			'path' => $path,
			'auto_rename' => true,
			'overwrite' => true,
		);
		// アップロード基本プロセス実行
		Upload::process($config);

		if (Upload::is_valid())
		{
			Upload::save();
			$files = Upload::get_files();
			$names = array();

			foreach ($files as $file)
			{
				$name[] = $file['saved_as'];
			}

			return $this->response($name);
		}
		// エラー有り
		foreach (Upload::get_errors() as $file)
		{
			// $file['errors']の中にエラーが入っているのでそれを処理
		}
	}
}
