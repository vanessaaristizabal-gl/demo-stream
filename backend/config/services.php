<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // 'fake' keeps every write in memory. Set PROVIDERS_DRIVER=live in production.
    'providers_driver' => env('PROVIDERS_DRIVER', 'fake'),

    'google_ads' => [
        'version' => env('GOOGLE_ADS_API_VERSION', 'v21'),
        'developer_token' => env('GOOGLE_ADS_DEVELOPER_TOKEN'),
        'access_token' => env('GOOGLE_ADS_ACCESS_TOKEN'),
    ],

    'meta' => [
        'version' => env('META_API_VERSION', 'v23.0'),
        'access_token' => env('META_ACCESS_TOKEN'),
    ],

];
