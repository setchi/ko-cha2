SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

-- --------------------------------------------------------

--
-- テーブルの構造 `chat_log`
--

DROP TABLE IF EXISTS `chat_log`;
CREATE TABLE IF NOT EXISTS `chat_log` (
  `room_id` varchar(15) collate utf8_unicode_ci default NULL,
  `viewer_id` varchar(300) collate utf8_unicode_ci default NULL,
  `message` text collate utf8_unicode_ci,
  `id` int(11) default NULL,
  `time` double default NULL,
  `date` datetime default '0000-00-00 00:00:00',
  KEY `room_id` (`room_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- テーブルの構造 `editor_change_state`
--

DROP TABLE IF EXISTS `editor_change_state`;
CREATE TABLE IF NOT EXISTS `editor_change_state` (
  `room_id` varchar(15) collate utf8_unicode_ci NOT NULL default '',
  `viewer_id` varchar(250) collate utf8_unicode_ci NOT NULL default '',
  `tab_name` varchar(50) collate utf8_unicode_ci NOT NULL default '',
  `data` text collate utf8_unicode_ci,
  `time` double default NULL,
  PRIMARY KEY  (`room_id`,`viewer_id`,`tab_name`),
  KEY `viewer_id` (`viewer_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- テーブルの構造 `editor_change_text`
--

DROP TABLE IF EXISTS `editor_change_text`;
CREATE TABLE IF NOT EXISTS `editor_change_text` (
  `room_id` varchar(15) collate utf8_unicode_ci NOT NULL default '',
  `viewer_id` varchar(250) collate utf8_unicode_ci NOT NULL default '',
  `tab_name` varchar(50) collate utf8_unicode_ci NOT NULL default '',
  `data` mediumtext collate utf8_unicode_ci,
  `time` double default NULL,
  PRIMARY KEY  (`room_id`,`viewer_id`,`tab_name`),
  KEY `viewer_id` (`viewer_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- テーブルの構造 `room`
--

DROP TABLE IF EXISTS `room`;
CREATE TABLE IF NOT EXISTS `room` (
  `id` varchar(15) collate utf8_unicode_ci NOT NULL default '',
  `owner_id` varchar(300) collate utf8_unicode_ci default NULL,
  `partner_id` varchar(300) collate utf8_unicode_ci default NULL,
  `title` varchar(30) collate utf8_unicode_ci default NULL,
  `password` varchar(30) collate utf8_unicode_ci default NULL,
  `time` double default NULL,
  `date` datetime default '0000-00-00 00:00:00',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- テーブルの構造 `room_last_update`
--

DROP TABLE IF EXISTS `room_last_update`;
CREATE TABLE IF NOT EXISTS `room_last_update` (
  `room_id` varchar(15) collate utf8_unicode_ci default NULL,
  `viewer_id` varchar(300) collate utf8_unicode_ci default NULL,
  `type` varchar(40) collate utf8_unicode_ci default NULL,
  `time` double default NULL,
  `date` datetime default NULL,
  KEY `room_id` (`room_id`),
  KEY `viewer_id` (`viewer_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- テーブルの構造 `sessions`
--

DROP TABLE IF EXISTS `sessions`;
CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` varchar(40) NOT NULL,
  `previous_id` varchar(40) NOT NULL,
  `user_agent` text NOT NULL,
  `ip_hash` char(32) NOT NULL default '',
  `created` int(10) unsigned NOT NULL default '0',
  `updated` int(10) unsigned NOT NULL default '0',
  `payload` longtext NOT NULL,
  PRIMARY KEY  (`session_id`),
  UNIQUE KEY `PREVIOUS` (`previous_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- テーブルの構造 `viewer`
--

DROP TABLE IF EXISTS `viewer`;
CREATE TABLE IF NOT EXISTS `viewer` (
  `room_id` varchar(15) collate utf8_unicode_ci default NULL,
  `viewer_id` varchar(300) collate utf8_unicode_ci default NULL,
  `name` varchar(50) collate utf8_unicode_ci default NULL,
  `image` varchar(300) collate utf8_unicode_ci default NULL,
  `num` int(11) default '0',
  `time` double default NULL,
  `viewing` int(11) default '1',
  `date` datetime default NULL,
  KEY `room_id` (`room_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- ビュー用の代替構造 `v_chat_log`
--
DROP VIEW IF EXISTS `v_chat_log`;
CREATE TABLE IF NOT EXISTS `v_chat_log` (
`room_id` varchar(15)
,`viewer_id` varchar(300)
,`name` varchar(50)
,`image` varchar(300)
,`message` text
,`id` int(11)
,`time` double
);
-- --------------------------------------------------------

--
-- ビュー用の代替構造 `v_viewer`
--
DROP VIEW IF EXISTS `v_viewer`;
CREATE TABLE IF NOT EXISTS `v_viewer` (
`room_id` varchar(15)
,`viewer_id` varchar(300)
,`name` varchar(50)
,`image` varchar(300)
,`num` int(11)
,`time` double
,`viewing` int(11)
,`date` datetime
);
-- --------------------------------------------------------

--
-- ビュー用の構造 `v_chat_log`
--
DROP TABLE IF EXISTS `v_chat_log`;

CREATE VIEW `v_chat_log` AS select `viewer`.`room_id` AS `room_id`,`viewer`.`viewer_id` AS `viewer_id`,`viewer`.`name` AS `name`,`viewer`.`image` AS `image`,`chat_log`.`message` AS `message`,`chat_log`.`id` AS `id`,`chat_log`.`time` AS `time` from (`chat_log` join `viewer` on(((`chat_log`.`room_id` = `viewer`.`room_id`) and (`chat_log`.`viewer_id` = `viewer`.`viewer_id`)))) order by `chat_log`.`id` desc;

-- --------------------------------------------------------

--
-- ビュー用の構造 `v_viewer`
--
DROP TABLE IF EXISTS `v_viewer`;

CREATE VIEW `v_viewer` AS select `viewer`.`room_id` AS `room_id`,`viewer`.`viewer_id` AS `viewer_id`,`viewer`.`name` AS `name`,`viewer`.`image` AS `image`,`viewer`.`num` AS `num`,`viewer`.`time` AS `time`,`viewer`.`viewing` AS `viewing`,`viewer`.`date` AS `date` from `viewer` where (`viewer`.`viewing` = 1);
