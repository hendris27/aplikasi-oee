<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL; // <-- Pastikan baris ini ada

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Jika diakses lewat ngrok, paksa semua aset pakai HTTPS ngrok
        if (str_contains(request()->headers->get('X-Forwarded-Proto') ?? '', 'https') || str_contains(request()->header('host') ?? '', 'ngrok-free')) {
            URL::forceScheme('https');
        }
    }
}