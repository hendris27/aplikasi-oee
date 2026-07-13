<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - OEE Program</title>
    <link rel="icon" href="{{ asset('favicon.jpg') }}">
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
            font-family: Arial, Helvetica, sans-serif;
            color: #f8f9ff;
            background:
                radial-gradient(circle at 15% 20%, rgba(159, 160, 163, 0.418), transparent 30%),
                radial-gradient(circle at 85% 80%, rgba(220, 222, 223, 0.795), transparent 30%),
                #d6d8e0dc;
        }

        .login-card {
            width: min(100%, 420px);
            padding: 36px;
            border: 1px solid rgb(255, 255, 255);
            border-radius: 20px;
            color: #111217;
            background: rgb(253, 253, 253);
            box-shadow: 0 24px 60px rgba(0, 0, 0, .38);
        }

        .brand {
            text-align: center;
            margin-bottom: 5px;
        }

        .brand img {
            width: 74px;
            height: 74px;
            object-fit: contain;
            margin-bottom: 14px;
        }

        .brand h1 {
            margin: 0 0 8px;
            font-size: 26px;
            letter-spacing: .04em;
        }

        .brand p {
            margin: 0;
            color: #606372;
            font-size: 14px;
        }

        .field {
            margin-bottom: 18px;
        }

        .password-wrap {
            position: relative;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #111217;
            font-weight: 700;
            font-size: 14px;
        }

        input[type="text"],
        input[type="password"] {
            width: 100%;
            height: 48px;
            padding: 0 14px;
            border: 1px solid #c9cbd3;
            border-radius: 10px;
            outline: none;
            color: #1c1a27;
            background: #ffffff;
            font-size: 16px;
        }

        .password-wrap input {
            padding-right: 52px;
        }

        .toggle-nik {
            position: absolute;
            top: 50%;
            right: 10px;
            width: 38px;
            height: 38px;
            display: grid;
            place-items: center;
            padding: 0;
            transform: translateY(-50%);
            border: 0;
            border-radius: 8px;
            color: #555864;
            background: transparent;
            cursor: pointer;
        }

        .toggle-nik:hover,
        .toggle-nik:focus-visible {
            color: #1c1a27;
            background: #f0f1f4;
            outline: none;
        }

        .toggle-nik svg {
            width: 22px;
            height: 22px;
            fill: none;
            stroke: currentColor;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-width: 2;
        }

        input:focus {
            border-color: #fb8d1a;
            box-shadow: 0 0 0 3px rgba(251, 141, 26, .16);
        }

        .login-button {
            width: 100%;
            height: 48px;
            border: 0;
            border-radius: 999px;
            cursor: pointer;
            color: #1c1a27;
            background: #fb8d1a;
            font-size: 16px;
            font-weight: 800;
            transition: transform .15s, background .15s;
        }

        .login-button:hover {
            background: #ffa33d;
            transform: translateY(-1px);
        }

        .error {
            margin-top: 7px;
            color: #ff809c;
            font-size: 13px;
        }

        @media (max-width: 480px) {
            .login-card {
                padding: 28px 22px;
            }
        }
    </style>
</head>

<body>
    <main class="login-card">
        <div class="brand">
            <img src="{{ asset('favicon.png') }}" alt="Logo SIIX">
        </div>

        <form method="POST" action="{{ route('login.store') }}">
            @csrf

            <div class="field">
                <label for="user">User</label>
                <input id="user" name="user" type="text" value="{{ old('user') }}" placeholder="Username"
                    autocomplete="username" autofocus required>
                @error('user')
                    <div class="error">{{ $message }}</div>
                @enderror
            </div>

            <div class="field">
                <label for="nik">NIK</label>
                <div class="password-wrap">
                    <input id="nik" name="nik" type="password" inputmode="numeric" placeholder="NIK"
                        autocomplete="current-password" required>
                    <button id="toggle-nik" class="toggle-nik" type="button" aria-label="Tampilkan NIK"
                        aria-pressed="false">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                            <circle cx="12" cy="12" r="3" />
                            <path id="eye-slash" d="m3 3 18 18" />
                        </svg>
                    </button>
                </div>
                @error('nik')
                    <div class="error">{{ $message }}</div>
                @enderror
            </div>

            <button class="login-button" type="submit">Masuk</button>
        </form>
    </main>

    <script>
        const nikInput = document.getElementById('nik');
        const toggleNik = document.getElementById('toggle-nik');
        const eyeSlash = document.getElementById('eye-slash');

        eyeSlash.hidden = true;

        toggleNik.addEventListener('click', () => {
            const willShow = nikInput.type === 'password';
            nikInput.type = willShow ? 'text' : 'password';
            toggleNik.setAttribute('aria-label', willShow ? 'Sembunyikan NIK' : 'Tampilkan NIK');
            toggleNik.setAttribute('aria-pressed', String(willShow));
            eyeSlash.hidden = !willShow;
            nikInput.focus();
        });
    </script>
</body>

</html>
