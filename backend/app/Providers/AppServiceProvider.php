<?php

namespace App\Providers;

use App\Domain\Advertising\Providers\FakeProvider;
use App\Domain\Identity\Enums\UserRole;
use App\Domain\Identity\Models\User;
use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(FakeProvider::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Polymorphic columns (Sanctum tokens) store stable aliases, not class names, so modules can be moved or renamed safely.
        Relation::enforceMorphMap(['user' => User::class]);

        // Interactive docs at /docs/api (OpenAPI JSON at /docs/api.json). Open in local/testing; admins only elsewhere.
        Gate::define('viewApiDocs', fn (?User $user = null) => app()->environment(['local', 'testing'])
            || $user?->hasRole(UserRole::Admin) === true);

        Scramble::afterOpenApiGenerated(function (OpenApi $openApi) {
            $openApi->info->title = 'Stream API';
            $openApi->secure(SecurityScheme::http('bearer'));
        });
    }
}
