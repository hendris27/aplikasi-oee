<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>HOMEPAGE</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="icon" href="{{ asset('favicon.jpg') }}">

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

    <link rel="stylesheet" href="{{ asset('css/app.css') }}">

    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"></script>
</head>

<body>

    @include('partials.topbar')

    <div class="swiper">
        <div class="swiper-wrapper">
            <div class="swiper-slide">
                <div class="page">
                    @include('page1')
                </div>
            </div>
            <div class="swiper-slide">
                <div class="page">
                    @include('page2')
                </div>
            </div>
            <div class="swiper-slide">
                <div class="page">
                    @include('page3')
                </div>
            </div>
        </div>
    </div>

    <!--<div class="pageref">
            <div class="txt">
                <h6>Date</h6>
                <div id="current-date">00/00/0000</div>
            </div>
            <button onclick="window.location.href='/page1'">Page 1</button>
            <button onclick="window.location.href='/page2'">Page 2</button>
            <button onclick="window.location.href='/page3'">Page 3</button>
            <div class="txt">
                <h6>Full Time</h6>
                <div id="timer">00:00:00</div>
            </div>
            <div class="txt">
                <h6>Clock</h6>
                <div id="txt-bottom">00:00:00</div>
            </div>
        </div>
    </div> -->

    <script>
        const WS_SERVER = `ws://${window.location.hostname}:3000`;

    </script>
    <script src="{{ asset('js/app.js') }}?v={{ filemtime(public_path('js/app.js')) }}"></script>
</body>

</html>
