<?php

namespace App\Domain\Governance\Jobs;

use App\Domain\Governance\Models\ChangeRequest;
use App\Domain\Governance\WritePath\GovernedWritePath;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ApplyChangeRequest implements ShouldQueue
{
    use Queueable;

    /** One attempt: the write path is idempotent but a blind retry could hide an unknown outcome. */
    public int $tries = 1;

    public function __construct(public int $changeRequestId) {}

    public function handle(GovernedWritePath $writePath): void
    {
        $writePath->apply(ChangeRequest::findOrFail($this->changeRequestId));
    }
}
