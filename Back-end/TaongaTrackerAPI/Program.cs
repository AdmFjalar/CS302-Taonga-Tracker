using Microsoft.AspNetCore.Identity;
using TaongaTrackerAPI.Services;
using TaongaTrackerAPI.Models;
using TaongaTrackerAPI.Data;
using TaongaTrackerAPI.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin() //WithOrigins("http://localhost:3000") // React app origin
            .AllowAnyHeader() // Allow any headers (e.g., Content-Type)
            .AllowAnyMethod(); // Allow any HTTP method (POST, GET, etc.)
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
    {
        options.Password.RequireDigit = true;
        options.Password.RequiredLength = 8;
        options.Password.RequireNonAlphanumeric = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireLowercase = true;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.AllowedForNewUsers = false;
    })
    .AddUserStore<UserStore>()
    .AddRoleStore<RoleStore>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JWT:Issuer"],
            ValidAudience = builder.Configuration["JWT:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JWT:Secret"]))
        };
    });

// Add HTTP Context Accessor for authorization handlers
builder.Services.AddHttpContextAccessor();

// Add authorization services
builder.Services.AddScoped<IAuthorizationHandler, ResourceOwnershipHandler>();

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("FamilyTreeOwnership", policy =>
        policy.Requirements.Add(new ResourceOwnershipRequirement("familytree")));
    
    options.AddPolicy("FamilyMemberOwnership", policy =>
        policy.Requirements.Add(new ResourceOwnershipRequirement("familymember")));
});

builder.Services.AddScoped<INeo4jService, Neo4jService>();

builder.WebHost.ConfigureKestrel((context, options) =>
{
    options.Configure(context.Configuration.GetSection("Kestrel"));
});

var app = builder.Build();

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();

app.MapControllers();
app.Run();