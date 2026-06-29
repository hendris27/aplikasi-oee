<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

if (!function_exists('oee_json_read')) {
    function oee_json_read(string $file): array
    {
        if (!File::exists($file)) return [];
        $data = json_decode(File::get($file), true);
        return is_array($data) ? $data : [];
    }
}

if (!function_exists('oee_json_write')) {
    function oee_json_write(string $file, array $data): void
    {
        File::put($file, json_encode(array_values($data), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
}

if (!function_exists('oee_json_response')) {
    function oee_json_response($data)
    {
        return response()->json($data)->header('Access-Control-Allow-Origin', '*');
    }
}

if (!function_exists('oee_save_record')) {
    function oee_save_record(Request $request, string $file)
    {
        $data = oee_json_read($file);
        $record = $request->all();
        $record['id'] = $record['id'] ?? (int) round(microtime(true) * 1000);
        $data[] = $record;
        oee_json_write($file, $data);
        return oee_json_response(['ok' => true, 'id' => $record['id']]);
    }
}

if (!function_exists('oee_edit_record')) {
    function oee_edit_record(Request $request, string $file)
    {
        $id = (string) $request->query('id', '');
        $data = oee_json_read($file);
        foreach ($data as &$row) {
            if ((string)($row['id'] ?? '') === $id) {
                $row = array_merge($row, $request->all(), ['id' => $row['id'] ?? $id]);
                oee_json_write($file, $data);
                return oee_json_response(['ok' => true]);
            }
        }
        return oee_json_response(['ok' => false, 'message' => 'Data not found'])->setStatusCode(404);
    }
}

if (!function_exists('oee_delete_record')) {
    function oee_delete_record(Request $request, string $file)
    {
        $id = trim((string) $request->query('id', ''));
        if ($id === '') {
            return oee_json_response(['ok' => false, 'message' => 'ID is required'])->setStatusCode(422);
        }

        $deleted = false;
        $data = array_values(array_filter(oee_json_read($file), function ($row) use ($id, &$deleted) {
            if (!is_array($row)) return true;
            if ((string)($row['id'] ?? '') === $id) {
                $deleted = true;
                return false;
            }
            return true;
        }));

        if ($deleted) {
            oee_json_write($file, $data);
        }

        return oee_json_response(['ok' => true, 'deleted' => $deleted]);
    }
}

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

$jsonApiRoutes = function () {
    $oeeFile = base_path('data_oee.json');
    $downtimeFile = base_path('data_downtime.json');
    $liveFile = base_path('data_live_status.json');

    Route::get('/api/read-oee', fn () => oee_json_response(oee_json_read($oeeFile)));
    Route::get('/api/read-downtime', fn () => oee_json_response(oee_json_read($downtimeFile)));
    Route::get('/api/live-status', fn () => oee_json_response(oee_json_read($liveFile)));

    Route::post('/api/save-oee', fn (Request $request) => oee_save_record($request, $oeeFile));
    Route::post('/api/save-downtime', fn (Request $request) => oee_save_record($request, $downtimeFile));

    Route::post('/api/edit-oee', fn (Request $request) => oee_edit_record($request, $oeeFile));
    Route::post('/api/edit-downtime', fn (Request $request) => oee_edit_record($request, $downtimeFile));

    Route::delete('/api/delete-oee', fn (Request $request) => oee_delete_record($request, $oeeFile));
    Route::delete('/api/delete-downtime', fn (Request $request) => oee_delete_record($request, $downtimeFile));

    Route::post('/api/live-update', function (Request $request) use ($liveFile) {
        $payload = $request->all();
        $line = trim((string)($payload['line'] ?? ''));
        if ($line === '' || $line === '-') {
            return oee_json_response(['ok' => false, 'message' => 'Line is required'])->setStatusCode(422);
        }

        $data = oee_json_read($liveFile);
        $found = false;
        foreach ($data as &$row) {
            if (trim((string)($row['line'] ?? '')) === $line) {
                $row = array_merge($row, $payload, [
                    'line' => $line,
                    'lastUpdate' => (int) round(microtime(true) * 1000),
                ]);
                $found = true;
                break;
            }
        }

        if (!$found) {
            $payload['line'] = $line;
            $payload['lastUpdate'] = (int) round(microtime(true) * 1000);
            $data[] = $payload;
        }

        oee_json_write($liveFile, $data);
        return oee_json_response(['ok' => true]);
    });

    Route::post('/api/live-clear', function (Request $request) use ($liveFile) {
        $line = trim((string)$request->input('line', ''));
        $data = array_values(array_filter(oee_json_read($liveFile), function ($row) use ($line) {
            return trim((string)($row['line'] ?? '')) !== $line;
        }));
        oee_json_write($liveFile, $data);
        return oee_json_response(['ok' => true]);
    });
};

Route::withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class])->group($jsonApiRoutes);
