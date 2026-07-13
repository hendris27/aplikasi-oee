<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class AuthController extends Controller
{
    public function create(): View
    {
        return view('auth.login');
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'user' => ['required', 'digits_between:4,20'],
            'nik' => ['required', 'digits_between:4,20', 'same:user'],
        ], [
            'user.required' => 'User wajib diisi.',
            'user.digits_between' => 'User harus berupa 4 sampai 20 angka.',
            'nik.required' => 'NIK wajib diisi.',
            'nik.digits_between' => 'NIK harus berupa 4 sampai 20 angka.',
            'nik.same' => 'User dan NIK harus sama.',
        ]);

        if (! Auth::attempt([
            'user' => $credentials['user'],
            'password' => $credentials['nik'],
        ], true)) {
            return back()
                ->withErrors(['user' => 'User atau NIK salah.'])
                ->onlyInput('user');
        }

        $request->session()->regenerate();

        return redirect()->intended(route('home'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
