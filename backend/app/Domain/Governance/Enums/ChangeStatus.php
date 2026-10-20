<?php

namespace App\Domain\Governance\Enums;

enum ChangeStatus: string
{
    case PendingApproval = 'pending_approval';
    case Approved = 'approved';
    case Applying = 'applying';
    case Blocked = 'blocked';
    case Rejected = 'rejected';
    case Applied = 'applied';
    case PartiallyFailed = 'partially_failed';
    case Failed = 'failed';
    case NoChanges = 'no_changes';

    public function isTerminal(): bool
    {
        return in_array($this, [self::Blocked, self::Rejected, self::Applied, self::PartiallyFailed, self::Failed, self::NoChanges], true);
    }
}
