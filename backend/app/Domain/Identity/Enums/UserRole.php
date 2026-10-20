<?php

namespace App\Domain\Identity\Enums;

enum UserRole: string
{
    case Strategist = 'strategist';
    case Approver = 'approver';
    case Admin = 'admin';
}
