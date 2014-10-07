<?php

class Model_Chat extends Model
{
	public static function get_updated_type_list($room_id, $viewer_id, $last_time) {
		$query = DB::select('type')->from('room_last_update')
			->where('room_id', $room_id)
			->and_where('time', '>=', $last_time);

		// 初回以外は自分以外の更新情報だけ取得する
		if ($last_time != 0) {
			$query = $query->and_where('viewer_id', '!=', $viewer_id);
		}
		
		return $query->order_by('time')
			->distinct(true)
			->execute()
			->as_array();
	}

	public static function get_chat_log($room_id, $last_chat_id) {
		return DB::select()->from('v_chat_log')
			->where('id', '>', $last_chat_id)
			->and_where('room_id', $room_id)
			->order_by('id')
			->execute()
			->as_array();
	}

	public static function get_next_chat_id($room_id) {
		$query = DB::select('id')->from('chat_log')
			->order_by('id', 'desc')
			->limit(1)
			->execute()
			->as_array();

		if (count($query) === 0) {
			return 1;
		}
		return 1 + $query[0]['id'];
	}

	public static function send($room_id, $viewer_id, $type, $data) {
		$time = microtime(true);
		switch ($type) {
		case 'chat_log':
			DB::insert('chat_log')->set(array(
				'room_id' => $room_id,
				'viewer_id' => $viewer_id,
				'message' => $data,
				'id' => self::get_next_chat_id($room_id),
				'time' => $time,
				'date' => date('Y-m-d H:i:s')
			))->execute();
			break;

		case 'exit_viewer':
			Model_Viewer::exit_viewer($room_id, $viewer_id);
			$type = 'update_viewer';
			break;

		case 'update_image':
			Model_Viewer::update_viewer($room_id, $viewer_id, $data);
			$viewer_id = 'all';
			$type = 'update_viewer';
			break;

		case 'editor_change_text':
			Model_Editor::set_data($type, $room_id, $viewer_id, $data, $time);
			break;

		case 'editor_change_state':
			Model_Editor::set_data($type, $room_id, $viewer_id, $data, $time);
			break;

		default:
			break;
		}

		// room_last_update更新
		DB::insert('room_last_update')->set(array(
			'room_id' => $room_id,
			'viewer_id' => $viewer_id,
			'type' => $type,
			'time' => $time,
			'date' => date('Y-m-d H:i:s')
		))->execute();
	}
}
