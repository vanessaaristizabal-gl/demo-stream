<?php

namespace App\Domain\Changelog\Enums;

enum ChangeSource: string
{
    case Platform = 'platform';
    case External = 'external';
}
