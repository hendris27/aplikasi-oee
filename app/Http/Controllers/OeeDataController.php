<?php

namespace App\Http\Controllers;

use App\Models\DataProduction;
use App\Models\DowntimeRecord;
use App\Models\OeeRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OeeDataController extends Controller
{
    public function readOee(): JsonResponse
    {
        return $this->json(OeeRecord::query()->oldest('created_at')->get());
    }

    public function readDowntime(): JsonResponse
    {
        return $this->json(DowntimeRecord::query()->oldest('created_at')->get());
    }

    public function storeOee(Request $request): JsonResponse
    {
        $payload = $this->oeePayload($request);
        $payload['id'] = (string) ($payload['id'] ?? $this->newRecordId());

        $record = OeeRecord::query()->updateOrCreate(
            ['id' => $payload['id']],
            $payload
        );

        return $this->json(['ok' => true, 'id' => $record->getKey()]);
    }

    public function storeDowntime(Request $request): JsonResponse
    {
        $payload = $request->only((new DowntimeRecord)->getFillable());
        $payload['id'] = (string) ($payload['id'] ?? $this->newRecordId());

        $record = DowntimeRecord::query()->updateOrCreate(
            ['id' => $payload['id']],
            $payload
        );

        return $this->json(['ok' => true, 'id' => $record->getKey()]);
    }

    public function storeProduction(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'id' => ['nullable', 'integer'],
            'line' => ['required', 'string', 'max:255'],
            'machine' => ['required', 'string', 'max:255'],
            'model' => ['required', 'string', 'max:255'],
            'target' => ['required', 'numeric', 'min:0'],
            'uph' => ['required', 'numeric', 'min:0'],
            'qty_pallet' => ['required', 'numeric', 'gt:0'],
            'customer' => ['nullable', 'string', 'max:255'],
            'planned_time' => ['required', 'integer', 'between:1,24'],
            'shift' => ['required', 'in:1,2,3'],
            'group' => ['required', 'in:A,B,C'],
        ]);

        $id = $payload['id'] ?? null;
        unset($payload['id']);

        $record = $id ? DataProduction::query()->find($id) : null;
        if ($record) {
            $record->update($payload);
        } else {
            $record = DataProduction::query()->create($payload);
        }

        return $this->json([
            'ok' => true,
            'id' => $record->getKey(),
            'data' => $record->fresh(),
        ]);
    }

    public function editOee(Request $request): JsonResponse
    {
        $id = trim((string) $request->query('id', ''));
        $record = $id !== '' ? OeeRecord::query()->find($id) : null;

        if ($record) {
            $payload = $this->oeePayload($request);
            unset($payload['id']);
            $record->update($payload);

            return $this->json(['ok' => true]);
        }

        return $this->json(['ok' => false, 'message' => 'Data OEE tidak ditemukan di database'], 404);
    }

    public function editDowntime(Request $request): JsonResponse
    {
        $id = trim((string) $request->query('id', ''));
        $record = $id !== '' ? DowntimeRecord::query()->find($id) : null;

        if ($record) {
            $payload = $request->only((new DowntimeRecord)->getFillable());
            unset($payload['id']);
            $record->update($payload);

            return $this->json(['ok' => true]);
        }

        return $this->json(['ok' => false, 'message' => 'Data downtime tidak ditemukan di database'], 404);
    }

    public function deleteOee(Request $request): JsonResponse
    {
        $id = trim((string) ($request->query('id', '') ?: $request->input('id', '')));

        if ($id !== '' && OeeRecord::query()->whereKey($id)->delete() > 0) {
            return $this->json(['ok' => true, 'deleted' => true]);
        }

        $fingerprint = $request->only([
            'date',
            'line',
            'machine',
            'model',
            'start',
            'stop_time',
        ]);
        $hasCompleteFingerprint = collect($fingerprint)->every(
            static fn ($value) => trim((string) $value) !== '' && trim((string) $value) !== '-'
        ) && count($fingerprint) === 6;

        if ($hasCompleteFingerprint) {
            $record = OeeRecord::query()
                ->where('date', $fingerprint['date'])
                ->where('line', $fingerprint['line'])
                ->where('machine', $fingerprint['machine'])
                ->where('model', $fingerprint['model'])
                ->where('start', $fingerprint['start'])
                ->where('stop_time', $fingerprint['stop_time'])
                ->first();

            if ($record && $record->delete()) {
                return $this->json(['ok' => true, 'deleted' => true]);
            }
        }

        return $this->json([
            'ok' => false,
            'deleted' => false,
            'message' => 'Data OEE tidak ditemukan di database',
        ], 404);
    }

    public function deleteDowntime(Request $request): JsonResponse
    {
        $id = trim((string) ($request->query('id', '') ?: $request->input('id', '')));

        if ($id !== '' && DowntimeRecord::query()->whereKey($id)->delete() > 0) {
            return $this->json(['ok' => true, 'deleted' => true]);
        }

        return $this->json([
            'ok' => false,
            'deleted' => false,
            'message' => 'Data downtime tidak ditemukan di database',
        ], 404);
    }

    private function oeePayload(Request $request): array
    {
        $payload = $request->only((new OeeRecord)->getFillable());

        if (empty($payload['real_cycle'])) {
            $payload['real_cycle'] = $request->input('avg_cycle', $request->input('real_cycle_avg'));
        }

        return array_filter($payload, static fn ($value) => $value !== null);
    }

    private function newRecordId(): string
    {
        return (string) round(microtime(true) * 1000).'-'.Str::lower(Str::random(6));
    }

    private function json(mixed $data, int $status = 200): JsonResponse
    {
        return response()->json($data, $status)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->header('Pragma', 'no-cache');
    }
}
