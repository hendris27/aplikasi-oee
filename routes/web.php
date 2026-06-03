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

use App\Http\Controllers\OeeController;

Route::get('/cari-oee', [App\Http\Controllers\OeeController::class, 'cariData']);