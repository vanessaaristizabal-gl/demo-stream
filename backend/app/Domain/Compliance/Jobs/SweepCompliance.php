<?php

namespace App\Domain\Compliance\Jobs;

use App\Domain\Compliance\ComplianceEngine;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SweepCompliance implements ShouldQueue
{
    use Queueable;

    public function handle(ComplianceEngine $engine): void
    {
        $engine->sweep();
    }
}
