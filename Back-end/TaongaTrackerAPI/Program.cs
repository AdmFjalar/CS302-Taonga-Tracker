using Microsoft.AspNetCore.Identity;
using TaongaTrackerAPI.Services;
using TaongaTrackerAPI.Models;
using TaongaTrackerAPI.Data;
using TaongaTrackerAPI.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.DataProtection;
using System.Threading.RateLimiting;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// ==================== LOGGING CONFIGURATION ====================
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

if (builder.Environment.IsProduction())
{
    builder.Logging.AddEventSourceLogger();
}

// ==================== CORS CONFIGURATION ====================
builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() 
                        ?? new[] { "http://localhost:3000", "https://localhost:3001", "http://taongatracker.com", "https://taongatracker.com", "http://www.taongatracker.com", "https://www.taongatracker.com" };
    
    options.AddPolicy("SecureCors", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

// ==================== DATA PROTECTION CONFIGURATION ====================
var encryptionKey = builder.Configuration["DataProtection:EncryptionKey"];
var dataProtectionBuilder = builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo("/app/keys"))
    .SetApplicationName("TaongaTrackerAPI")
    .SetDefaultKeyLifetime(TimeSpan.FromDays(90));

if (!string.IsNullOrEmpty(encryptionKey))
{
    try
    {
        // Use encryption key as additional entropy for application isolation
        dataProtectionBuilder.SetApplicationName($"TaongaTrackerAPI-{encryptionKey.GetHashCode()}");
    }
    catch (Exception)
    {
        // Fallback to basic configuration - already configured above
    }
}

// ==================== RATE LIMITING CONFIGURATION ====================
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("AuthPolicy", limiterOptions =>
    {
        limiterOptions.PermitLimit = 10;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 5;
    });
    
    options.AddFixedWindowLimiter("GeneralPolicy", limiterOptions =>
    {
        limiterOptions.PermitLimit = 100;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 10;
    });
    
    // GDPR and Security endpoints rate limiting - more restrictive for sensitive operations
    options.AddFixedWindowLimiter("GdprSecurityPolicy", limiterOptions =>
    {
        limiterOptions.PermitLimit = 30;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 5;
    });
});

// ==================== JSON CONFIGURATION ====================
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
    options.SerializerOptions.MaxDepth = 32; // Prevent JSON depth attacks
});

builder.Services.AddControllers(options =>
{
    options.ModelValidatorProviders.Clear(); // Remove default validators for performance
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    options.JsonSerializerOptions.MaxDepth = 32;
});

// ==================== IDENTITY CONFIGURATION ====================
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
{
    // Password requirements
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 12;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.Password.RequiredUniqueChars = 4;
    
    // Account lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 3;
    options.Lockout.AllowedForNewUsers = true;
    
    // User account settings
    options.User.RequireUniqueEmail = true;
    options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
    
    // Sign-in requirements
    options.SignIn.RequireConfirmedEmail = false; // Set to true in production
    options.SignIn.RequireConfirmedAccount = false;
})
.AddUserStore<UserStore>()
.AddRoleStore<RoleStore>()
.AddDefaultTokenProviders()
.AddTokenProvider<DataProtectorTokenProvider<ApplicationUser>>(TokenOptions.DefaultProvider);

// ==================== JWT AUTHENTICATION CONFIGURATION ====================
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        RequireExpirationTime = true,
        RequireSignedTokens = true,
        ClockSkew = TimeSpan.FromMinutes(1),
        ValidIssuer = builder.Configuration["JWT:Issuer"],
        ValidAudience = builder.Configuration["JWT:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["JWT:Secret"] ?? 
                throw new InvalidOperationException("JWT:Secret is required")))
    };
    
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogWarning("JWT authentication failed: {Exception}", context.Exception.Message);
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogDebug("JWT token validated for user: {UserId}", 
                context.Principal?.FindFirst("sub")?.Value);
            return Task.CompletedTask;
        }
    };
});

// ==================== SERVICE REGISTRATION ====================
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAuthorizationHandler, ResourceOwnershipHandler>();
builder.Services.AddScoped<INeo4jService, Neo4jService>();
builder.Services.AddScoped<IFileUploadService, FileUploadService>();
builder.Services.AddScoped<IImageCleanupService, ImageCleanupService>();

// ==================== BACKGROUND SERVICES ====================
builder.Services.AddHostedService<ImageCleanupBackgroundService>();

// ==================== AUTHORIZATION POLICIES ====================
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("FamilyTreeOwnership", policy =>
        policy.Requirements.Add(new ResourceOwnershipRequirement("familytree")));
    
    options.AddPolicy("FamilyMemberOwnership", policy =>
        policy.Requirements.Add(new ResourceOwnershipRequirement("familymember")));
        
    options.AddPolicy("VaultOwnership", policy =>
        policy.Requirements.Add(new ResourceOwnershipRequirement("vault")));
        
    options.AddPolicy("RequireAuthentication", policy =>
        policy.RequireAuthenticatedUser());
});

// ==================== SECURITY CONFIGURATION ====================
builder.Services.AddHsts(options =>
{
    options.Preload = true;
    options.IncludeSubDomains = true;
    options.MaxAge = TimeSpan.FromDays(365);
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// ==================== KESTREL CONFIGURATION ====================
builder.WebHost.ConfigureKestrel((context, options) =>
{
    options.Limits.MaxConcurrentConnections = 1000;
    options.Limits.MaxConcurrentUpgradedConnections = 1000;
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10MB limit
    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(30);
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(2);
    
    options.Configure(context.Configuration.GetSection("Kestrel"));
});

var app = builder.Build();

// ==================== SECURITY HEADERS MIDDLEWARE ====================
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    
    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
        context.Response.Headers.Append("Content-Security-Policy", 
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';");
    }
    
    await next();
});

// ==================== REQUEST PIPELINE CONFIGURATION ====================
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseForwardedHeaders();
app.UseHttpsRedirection();
app.UseRateLimiter();
app.UseCors("SecureCors");
app.UseAuthentication();
app.UseAuthorization();

// ==================== STATIC FILES CONFIGURATION ====================
app.UseStaticFiles(new StaticFileOptions
{
    RequestPath = "/uploads",
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(app.Environment.WebRootPath, "uploads")),
    ServeUnknownFileTypes = false,
    DefaultContentType = "application/octet-stream",
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
        ctx.Context.Response.Headers.Append("X-Frame-Options", "DENY");
        
        if (!app.Environment.IsDevelopment())
        {
            ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=31536000");
        }
        
        // Only allow image files from uploads directory
        var extension = Path.GetExtension(ctx.Context.Request.Path.Value?.ToLowerInvariant());
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        
        if (!allowedExtensions.Contains(extension))
        {
            ctx.Context.Response.StatusCode = 404;
            ctx.Context.Response.ContentLength = 0;
            ctx.Context.Response.Body = Stream.Null;
        }
    }
});

app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
        
        if (!app.Environment.IsDevelopment())
        {
            ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=31536000");
        }
    }
});

app.MapControllers().RequireRateLimiting("GeneralPolicy");

app.Run();