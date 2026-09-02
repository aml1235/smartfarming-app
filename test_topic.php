<?php
$pattern = 'smartfarming/+/sensor/+';
$topic = 'smartfarming/hydroponic/sensor/SEC-010';
$regex = preg_quote($pattern, '/');
$regex = str_replace('\#', '.*', $regex);
$regex = str_replace('\+', '[^/]+', $regex);
var_dump((bool) preg_match('/^' . $regex . '$/', $topic));
