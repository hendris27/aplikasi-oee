<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\OeeController;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

if (! function_exists('oee_json_read')) {
    function oee_json_read(string $file): array
    {
        if (! File::exists($file)) {
            return [];
        }
        $data = json_decode(File::get($file), true);

        return is_array($data) ? $data : [];
    }
}

if (! function_exists('oee_json_write')) {
    function oee_json_write(string $file, array $data): void
    {
        File::put($file, json_encode(array_values($data), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
}

if (! function_exists('oee_json_response')) {
    function oee_json_response($data)
    {
        return response()->json($data)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->header('Pragma', 'no-cache');
    }
}

if (! function_exists('oee_save_record')) {
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

if (! function_exists('oee_edit_record')) {
    function oee_edit_record(Request $request, string $file)
    {
        $id = (string) $request->query('id', '');
        $data = oee_json_read($file);
        foreach ($data as &$row) {
            if ((string) ($row['id'] ?? '') === $id) {
                $row = array_merge($row, $request->all(), ['id' => $row['id'] ?? $id]);
                oee_json_write($file, $data);

                return oee_json_response(['ok' => true]);
            }
        }

        return oee_json_response(['ok' => false, 'message' => 'Data not found'])->setStatusCode(404);
    }
}

if (! function_exists('oee_delete_record')) {
    function oee_delete_record(Request $request, string $file)
    {
        $id = trim((string) ($request->query('id', '') ?: $request->input('id', '')));
        $fingerprint = [
            'date' => (string) $request->input('date', ''),
            'line' => (string) $request->input('line', ''),
            'machine' => (string) $request->input('machine', ''),
            'model' => (string) $request->input('model', ''),
            'start' => (string) $request->input('start', ''),
            'stop_time' => (string) $request->input('stop_time', ''),
        ];
        $sourceIndex = trim((string) $request->input('source_index', ''));

        if ($id === '' && implode('', $fingerprint) === '' && $sourceIndex === '') {
            return oee_json_response(['ok' => false, 'message' => 'ID or record data is required'])->setStatusCode(422);
        }

        $deleted = false;
        $data = [];
        foreach (oee_json_read($file) as $index => $row) {
            if (! is_array($row)) {
                continue;
            }

            $idMatches = $id !== '' && (string) ($row['id'] ?? '') === $id;
            $sourceIndexMatches = $sourceIndex !== '' && (string) $index === $sourceIndex;
            $fingerprintMatches = implode('', $fingerprint) !== '' &&
                (string) ($row['date'] ?? '') === $fingerprint['date'] &&
                (string) ($row['line'] ?? '') === $fingerprint['line'] &&
                (string) ($row['machine'] ?? '') === $fingerprint['machine'] &&
                (string) ($row['model'] ?? '') === $fingerprint['model'] &&
                (string) ($row['start'] ?? '') === $fingerprint['start'] &&
                (string) ($row['stop_time'] ?? '') === $fingerprint['stop_time'];

            if ($idMatches || $sourceIndexMatches || $fingerprintMatches) {
                $deleted = true;

                continue;
            }
            $data[] = $row;
        }

        if ($deleted) {
            oee_json_write($file, $data);
        }

        return oee_json_response(['ok' => true, 'deleted' => $deleted]);
    }
}

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'create'])->name('login');
    Route::post('/login', [AuthController::class, 'store'])
        ->middleware('throttle:5,1')
        ->name('login.store');
});

Route::middleware('auth')->group(function () {
    Route::view('/', 'homepage')->name('home');
    Route::view('/page1', 'perpage', ['pageView' => 'page1', 'pageTitle' => 'OEE - Page 1']);
    Route::view('/page2', 'perpage', ['pageView' => 'page2', 'pageTitle' => 'OEE - Page 2']);
    Route::view('/page3', 'perpage', ['pageView' => 'page3', 'pageTitle' => 'OEE - Page 3']);
    Route::view('/all', 'allpage');
    Route::view('/live', 'live_monitor');
    Route::post('/logout', [AuthController::class, 'destroy'])->name('logout');
});

Route::get('/api/model-list', [OeeController::class, 'modelList']);

Route::get('/cari-oee', [OeeController::class, 'cariData']);

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
    Route::post('/api/delete-oee', fn (Request $request) => oee_delete_record($request, $oeeFile));
    Route::delete('/api/delete-downtime', fn (Request $request) => oee_delete_record($request, $downtimeFile));

    Route::post('/api/live-update', function (Request $request) use ($liveFile) {
        $payload = $request->all();
        $line = trim((string) ($payload['line'] ?? ''));
        if ($line === '' || $line === '-') {
            return oee_json_response(['ok' => false, 'message' => 'Line is required'])->setStatusCode(422);
        }

        $data = oee_json_read($liveFile);
        $found = false;
        foreach ($data as &$row) {
            if (! is_array($row)) {
                continue;
            }
            if (trim((string) ($row['line'] ?? '')) === $line) {
                $row = array_merge($row, $payload, [
                    'line' => $line,
                    'lastUpdate' => (int) round(microtime(true) * 1000),
                ]);
                $found = true;
                break;
            }
        }

        if (! $found) {
            $payload['line'] = $line;
            $payload['lastUpdate'] = (int) round(microtime(true) * 1000);
            $data[] = $payload;
        }

        oee_json_write($liveFile, $data);

        return oee_json_response(['ok' => true]);
    });

    Route::post('/api/live-clear', function (Request $request) use ($liveFile) {
        $line = trim((string) $request->input('line', ''));
        $data = array_values(array_filter(oee_json_read($liveFile), function ($row) use ($line) {
            if (! is_array($row)) {
                return true;
            }

            return trim((string) ($row['line'] ?? '')) !== $line;
        }));
        oee_json_write($liveFile, $data);

        return oee_json_response(['ok' => true]);
    });
};

Route::withoutMiddleware([ValidateCsrfToken::class])->group($jsonApiRoutes);
