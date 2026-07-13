<header class="top-bar">
    <div class="top-left">
        <img src="{{ asset('favicon.png') }}" alt="SIIX LOGO" class="logo">
        <div id="txt" class="clock"></div>
    </div>

    <div class="cntrtxt">
        <h1 class="top" id="txtedt">BE LINE</h1>
        <h1 class="bot" id="typscn">OEE APPLICATION</h1>
    </div>

    <div class="top-right">
        <h4>PRODUCTION 2</h4>
        <div class="top-actions">
            <div class="exp">
                <button class="icon-button" type="button" onclick="window.location.href='/live'" title="Live Monitor"
                    aria-label="Live Monitor">
                    <i class="bi bi-display" aria-hidden="true"></i>
                </button>
            </div>
            <div class="exp">
                <button class="icon-button" type="button" onclick="window.location.href='/all'" title="Report"
                    aria-label="Report">
                    <i class="bi bi-clipboard-data" aria-hidden="true"></i>
                </button>
            </div>
            <div class="exp">
                <button class="icon-button" type="button" onclick="openConfig()" title="Setting" aria-label="Setting">
                    <i class="bi bi-gear-fill" aria-hidden="true"></i>
                </button>
            </div>
            <div class="exp">
                <button class="icon-button icon-stop" type="button" onclick="resetData()" title="Stop"
                    aria-label="Stop">
                    <i class="bi bi-stop-circle" aria-hidden="true"></i>
                </button>
            </div>
            {{-- <div class="exp">
                <button type="button" onclick="toggleDowntime()" id="btn-downtime">Downtime</button>
            </div> --}}
            <form method="POST" action="{{ route('logout') }}" class="exp" onsubmit="confirmLogout(event)">
                @csrf
                <button class="icon-button icon-logout" type="submit" title="Logout" aria-label="Logout">
                    <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
                </button>
            </form>
        </div>
    </div>
</header>

<script>
    function confirmLogout(event) {
        event.preventDefault();
        const form = event.currentTarget;

        Swal.fire({
            title: 'Konfirmasi Logout',
            text: 'Apakah Anda yakin ingin keluar dari aplikasi?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, logout',
            cancelButtonText: 'Batal',
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                HTMLFormElement.prototype.submit.call(form);
            }
        });
    }
</script>
