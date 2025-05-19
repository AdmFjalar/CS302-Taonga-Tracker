using Microsoft.AspNetCore.Identity;
using TaongaTrackerAPI.Services;
using TaongaTrackerAPI.Models;
using TaongaTrackerAPI.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Registering controllers and required services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
    {
        options.Password.RequireDigit = true;
        options.Password.RequiredLength = 6;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireLowercase = true;
    })
    .AddUserStore<UserStore>()  // Custom user store
    .AddRoleStore<RoleStore>()  // Custom role store
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "Identity.Application";
    options.DefaultChallengeScheme = "Identity.Application";
}).AddCookie("Identity.Application");

builder.Services.AddAuthorization();

// Register your custom services (example: INeo4jService implementation)
builder.Services.AddScoped<INeo4jService, Neo4jService>();

var app = builder.Build();

app.UseHttpsRedirection();

app.UseAuthorization();

// Map controllers to handle endpoints
app.MapControllers();

app.Run();