<?php

namespace App\Console\Commands;

use App\Domain\Advertising\Models\Campaign;
use App\Domain\Advertising\Providers\FakeProvider;
use App\Domain\Changelog\ExternalChangePoller;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('demo:external-edit {campaign : Campaign id} {field} {value}')]
#[Description('Simulate an edit made directly in Google Ads/Meta (fake provider only) and poll it into the changelog')]
class DemoExternalEdit extends Command
{
    public function handle(FakeProvider $provider, ExternalChangePoller $poller): int
    {
        if (config('services.providers_driver') !== 'fake') {
            $this->error('Only available with PROVIDERS_DRIVER=fake.');

            return self::FAILURE;
        }

        $campaign = Campaign::with('account')->findOrFail($this->argument('campaign'));
        $value = is_numeric($this->argument('value')) ? (int) $this->argument('value') : $this->argument('value');
        $provider->externalEdit($campaign, [$this->argument('field') => $value]);

        $this->info($poller->poll($campaign).' change(s) mirrored into the changelog.');

        return self::SUCCESS;
    }
}
