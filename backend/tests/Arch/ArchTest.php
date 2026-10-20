<?php

/*
 * Architecture fitness tests. They turn the module rules in docs/architecture.md into failing tests.
 *
 * Dependency direction (acyclic):
 *   Identity            (standalone)
 *   Playbooks           (standalone)
 *   Sandbox             (standalone demo area: simulated campaigns, no providers, no real accounts)
 *   Advertising  <-  Compliance  <-  Governance  ->  Changelog  ->  Advertising
 */

const DOMAINS = [
    'Identity' => 'App\Domain\Identity',
    'Advertising' => 'App\Domain\Advertising',
    'Compliance' => 'App\Domain\Compliance',
    'Governance' => 'App\Domain\Governance',
    'Changelog' => 'App\Domain\Changelog',
    'Playbooks' => 'App\Domain\Playbooks',
    'Sandbox' => 'App\Domain\Sandbox',
];

function except(string ...$allowed): array
{
    return array_values(array_diff_key(DOMAINS, array_flip($allowed)));
}

arch('the domain never depends on the HTTP layer')
    ->expect('App\Domain')->not->toUse('App\Http');

arch('identity is standalone')
    ->expect(DOMAINS['Identity'])->not->toUse(except('Identity'));

arch('playbooks are standalone')
    ->expect(DOMAINS['Playbooks'])->not->toUse(except('Playbooks'));

arch('the sandbox is standalone: it never depends on another module, so it cannot reach a provider')
    ->expect(DOMAINS['Sandbox'])->not->toUse(except('Sandbox'));

arch('advertising is the foundation and depends on no other module')
    ->expect(DOMAINS['Advertising'])->not->toUse(except('Advertising'));

arch('compliance depends only on advertising')
    ->expect(DOMAINS['Compliance'])->not->toUse(except('Compliance', 'Advertising'));

arch('changelog depends only on advertising and identity')
    ->expect(DOMAINS['Changelog'])->not->toUse(except('Changelog', 'Advertising', 'Identity'));

arch('governance may use advertising, compliance, changelog and identity, never playbooks')
    ->expect(DOMAINS['Governance'])->not->toUse(DOMAINS['Playbooks']);

/*
 * The product rule: every production write goes through the governed path.
 * Structurally: only Advertising (the adapters) and Governance may depend on the write side of a provider.
 */
arch('only the governed write path depends on the provider write side')
    ->expect('App\Domain\Advertising\Contracts\CampaignWriter')
    ->toOnlyBeUsedIn(['App\Domain\Advertising', 'App\Domain\Governance']);

arch('only governance asks for a full read/write provider')
    ->expect('App\Domain\Advertising\Providers\AdProvider')
    ->toOnlyBeUsedIn(['App\Domain\Advertising', 'App\Domain\Governance']);

arch('controllers and jobs outside governance cannot reach the provider write side')
    ->expect(['App\Http', 'App\Domain\Changelog', 'App\Domain\Compliance'])
    ->not->toUse(['App\Domain\Advertising\Contracts\CampaignWriter', 'App\Domain\Advertising\Providers\AdProvider']);

arch('no debugging statements are left behind')
    ->expect(['dd', 'dump', 'ray', 'var_dump', 'print_r', 'die', 'exit'])->not->toBeUsed();

arch('domain enums are string-backed')
    ->expect('App\Domain')->enums()->toBeStringBackedEnums();
