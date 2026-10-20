<?php

use App\Domain\Changelog\Jobs\PollExternalChanges;
use App\Domain\Compliance\Jobs\SweepCompliance;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::job(new PollExternalChanges)->everyFiveMinutes()->withoutOverlapping();
Schedule::job(new SweepCompliance)->hourly()->withoutOverlapping();
