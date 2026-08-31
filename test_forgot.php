<?php
$url = 'https://smartfarming-app-production-9f9b.up.railway.app/api/forgot-password';
$data = ['email' => 'amelkartika120305@gmail.com'];
$options = [
    'http' => [
        'header'  => "Content-Type: application/json\r\nAccept: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
        'ignore_errors' => true // to get response even on 500 error
    ]
];
$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);
echo $http_response_header[0] . "\n";
echo $result;
