<?php

namespace App\Domain\Changelog\Jobs;

use App\Domain\Advertising\Models\Campaign;
use App\Domain\Changelog\ExternalChangePoller;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class PollExternalChanges implements ShouldQueue
{
    use Queueable;

    public function handle(ExternalChangePoller $poller): void
    {
        Campaign::query()->with('account')->chunkById(100, function ($campaigns) use ($poller) {
            foreach ($campaigns as $campaign) {
                $poller->poll($campaign);
            }
        });
    }
}
