<?php

namespace App\Domain\Advertising\Providers;

use App\Domain\Advertising\Contracts\CampaignReader;
use App\Domain\Advertising\Contracts\CampaignWriter;

/** A full provider adapter (Google Ads, Meta, fake): read side plus write side. */
interface AdProvider extends CampaignReader, CampaignWriter {}
