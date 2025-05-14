using TaongaTrackerAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Registering controllers and required services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Register your custom services (example: INeo4jService implementation)
builder.Services.AddScoped<INeo4jService, Neo4jService>();

var app = builder.Build();

app.UseHttpsRedirection();

app.UseAuthorization();

// Map controllers to handle endpoints
app.MapControllers();

app.Run();