<?php

namespace App\Domain\Advertising\Providers;

use App\Domain\Advertising\Contracts\CampaignReader;
use App\Domain\Advertising\Enums\Provider;
use App\Domain\Advertising\Models\AdAccount;
use Illuminate\Contracts\Container\Container;

class ProviderManager
{
    public function __construct(private Container $container) {}

    /** Read-only access: use this everywhere except the governed write path. */
    public function reader(AdAccount $account): CampaignReader
    {
        return $this->for($account);
    }

    /** Full read/write adapter. Reserved for the Governance module. */
    public function for(AdAccount $account): AdProvider
    {
        if (config('services.providers_driver') === 'fake') {
            return $this->container->make(FakeProvider::class);
        }

        return match ($account->provider) {
            Provider::Google => $this->container->make(GoogleAdsProvider::class),
            Provider::Meta => $this->container->make(MetaProvider::class),
        };
    }
}
