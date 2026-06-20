<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('homepage');
});

Route::get('/page1', function () {
    return view('page1');
});

Route::get('/page2', function () {
    return view('page2');
});

Route::get('/page3', function () {
    return view('page3');
});

Route::get('/all', function () {
    return view('allpage');
});

Route::get('/live', function () {
    return view('live_monitor');
});

use App\Http\Controllers\OeeController;

Route::get('/api/model-list', [App\Http\Controllers\OeeController::class, 'modelList']);

Route::get('/cari-oee', [App\Http\Controllers\OeeController::class, 'cariData']);

Route::get('/good', [OeeController::class, 'esp32Trigger']);