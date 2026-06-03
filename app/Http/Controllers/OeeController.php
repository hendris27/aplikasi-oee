<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\MyDataImport;

class OeeController extends Controller
{
    public function cleanAndSearch(Request $request)
    {
        ini_set('memory_limit', '512M'); 

        $path = public_path('import/oee-data.xlsx');
        
        if (!file_exists($path)) {
            return response()->json(['error' => 'File Excel data master tidak ditemukan di folder public/import/'], 404);
        }
        
        try {
            $sheets = Excel::toCollection(new MyDataImport, $path);
            $data = $sheets[0]; 
            
            $modelCari = strtolower(trim((string)$request->query('model')));

            if (empty($modelCari)) {
                return response()->json(['message' => 'Input model tidak boleh kosong'], 400);
            }
            
            $result = $data->first(function ($row) use ($modelCari) {
                return strtolower(trim((string)($row['model'] ?? ''))) === $modelCari;
            });

            if ($result) {
                $rowArray = $result->toArray();
                
                $uphKey = collect(array_keys($rowArray))->first(function($key) {
                    $k = strtolower($key);
                    return str_contains($k, 'ppc_target') || str_contains($k, 'uph') || str_contains($k, 'target');
                });

                // Mencari kolom Customer Name
                $customerKey = collect(array_keys($rowArray))->first(function($key) {
                    $k = strtolower($key);
                    return str_contains($k, 'customer') || str_contains($k, 'cust');
                });

                return response()->json([
                    'model'    => $rowArray['model'] ?? $modelCari,
                    'uph'      => $uphKey ? (int)($rowArray[$uphKey] ?? 0) : 0, 
                    'customer' => $customerKey ? ($rowArray[$customerKey] ?? '-') : '-',
                ]);
            }

            return response()->json(['message' => 'Model tidak ditemukan di data master'], 404);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Gagal membaca file Excel: ' . $e->getMessage()
            ], 500);
        }
    }
}