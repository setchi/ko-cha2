<?php

class Model_Editor extends Model
{
	public static function get_data($table, $room_id, $viewer_id, $last_time) {
		$query = DB::select(
			'viewer_id',
			'tab_name',
			'data',
			DB::expr('MAX(time) as time')
		)->from($table)
			->where('room_id', $room_id)
			->and_where('time', '>=', $last_time);

		// 初回以外は自分以外の更新情報だけ取得する
		if ($last_time != 0) {
			$query = $query->and_where('viewer_id', '!=', $viewer_id);
		}

		$query = $query->group_by(
			'room_id',
			'viewer_id',
			'tab_name'
		)->order_by('time')->execute()->as_array();

		if (0 === count($query)) {
			return array();
		} else {
			return $query;
		}
	}

	public static function set_data($table, $room_id, $viewer_id, $data, $last_time) {
		$data_obj = json_decode($data);
		if (property_exists ($data_obj , 'command')) if ($data_obj->command === 'removeTab') {
			DB::delete('editor_change_text')
				->where('room_id', $room_id)
				->and_where('viewer_id', $viewer_id)
				->and_where('tab_name', $data_obj->tabName)
				->execute();
		}

		$prev_data = DB::select('room_id')->from($table)
			->where('room_id', $room_id)
			->and_where('viewer_id', $viewer_id)
			->and_where('tab_name', $data_obj->tabName)
			->execute()->as_array();

		// insert
		if (0 === count($prev_data)) {
			DB::insert($table)->set(array(
				'room_id' => $room_id,
				'viewer_id' => $viewer_id,
				'tab_name' => $data_obj->tabName,
				'data' => $data,
				'time' => $last_time
			))->execute();

		// update
		} else {
			DB::update($table)->set(array(
				'data' => $data,
				'time' => $last_time
			))->where('room_id', $room_id)
			->and_where('viewer_id', $viewer_id)
			->and_where('tab_name', $data_obj->tabName)
			->execute();
		}
	}
}
