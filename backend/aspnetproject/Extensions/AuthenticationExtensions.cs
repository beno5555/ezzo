using System.Text;
using aspnetproject.Common.ProjectConstants.Enums;
using aspnetproject.Infrastructure.Services.Automation.Authentication;
using aspnetproject.Infrastructure.Services.Automation.Configuration;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace aspnetproject.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                var jwtSection = configuration.GetSection("Jwt");
                var signInKey  = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["Key"]!));
                
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = signInKey,
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    
                    ClockSkew = TimeSpan.FromMinutes(1)
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path        = context.HttpContext.Request.Path;

                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                        {
                            context.Token = accessToken;
                        }

                        return Task.CompletedTask;
                    }
                };
            });

        return services;
    }

    // The automation's second scheme, beside JWT, and the two policies that name it. JWT stays the default scheme, so a route
    // that names no scheme never runs the API-key handler and a request with only the key gets 401 there.
    public static IServiceCollection AddAutomationAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<AutomationApiConfiguration>(configuration.GetSection(AutomationApiConfiguration.SectionName));
        services.AddSingleton<AutomationKeyValidator>();

        services.AddAuthentication()
            .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>(AutomationAuth.Scheme, null);

        services.AddAuthorizationBuilder()
            .AddPolicy(AutomationAuth.Policies.AutomationOnly, policy => policy
                .AddAuthenticationSchemes(AutomationAuth.Scheme)
                .RequireAssertion(context => AutomationAuth.IsAutomation(context.User)))
            .AddPolicy(AutomationAuth.Policies.AdministratorOrAutomation, policy => policy
                .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme, AutomationAuth.Scheme)
                .RequireAssertion(context =>
                {
                    bool isAdministrator = context.User.IsInRole(nameof(RoleName.Administrator));
                    bool isAutomation    = AutomationAuth.IsAutomation(context.User);

                    return isAdministrator || isAutomation;
                }));

        return services;
    }
}