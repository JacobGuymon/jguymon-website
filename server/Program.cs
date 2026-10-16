using System.Threading.RateLimiting;
using Amazon.Extensions.NETCore.Setup;
using Amazon.SimpleEmailV2;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();
builder.Services.AddDefaultAWSOptions(builder.Configuration.GetAWSOptions());
builder.Services.AddAWSService<IAmazonSimpleEmailServiceV2>();

// In production the app sits behind a reverse proxy on a private Docker network, so the TCP peer is
// the proxy, not the visitor. Trust X-Forwarded-For only from private ranges so the rate limiter
// below partitions by real client IP without letting arbitrary clients spoof the header.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor;
    options.KnownIPNetworks.Add(System.Net.IPNetwork.Parse("10.0.0.0/8"));
    options.KnownIPNetworks.Add(System.Net.IPNetwork.Parse("172.16.0.0/12"));
    options.KnownIPNetworks.Add(System.Net.IPNetwork.Parse("192.168.0.0/16"));
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(ContactFormEndpoint.RateLimitPolicy, context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(15) }));
});

var app = builder.Build();

app.UseForwardedHeaders();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");

    // Framing protection is scoped to HTML responses only. Applying X-Frame-Options/CSP to every
    // static asset (e.g. the resume PDF) breaks the page's own same-origin <object> embed of it —
    // X-Frame-Options: DENY blocks ALL framing, including same-origin, and browsers render an
    // embedded PDF through an internal frame-like mechanism subject to that header.
    context.Response.OnStarting(() =>
    {
        var isHtml = context.Response.ContentType?.Contains("text/html", StringComparison.OrdinalIgnoreCase) == true;
        if (isHtml)
        {
            context.Response.Headers.Append("X-Frame-Options", "DENY");
            if (!app.Environment.IsDevelopment())
            {
                context.Response.Headers.Append("Content-Security-Policy", "default-src 'self'");
            }
        }

        return Task.CompletedTask;
    });

    await next();
});

app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRateLimiter();

app.MapContactFormEndpoint();

app.MapFallbackToFile("index.html");

app.Run();
