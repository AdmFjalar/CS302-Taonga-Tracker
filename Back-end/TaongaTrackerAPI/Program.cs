using Microsoft.AspNetCore.Identity;
using TaongaTrackerAPI.Services;
using TaongaTrackerAPI.Models;
using TaongaTrackerAPI.Data;
using TaongaTrackerAPI.Authorization;
using Microsoft.AspNetCore.Authorization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
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
    .AddUserStore<UserStore>()
    .AddRoleStore<RoleStore>()
    .AddDefaultTokenProviders();

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

var app = builder.Build();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();