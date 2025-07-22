# Use the official .NET 9 runtime as base image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

# Use the .NET 9 SDK for building
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["TaongaTrackerAPI.csproj", "."]
RUN dotnet restore "./TaongaTrackerAPI.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/."
RUN dotnet build "TaongaTrackerAPI.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Publish the application
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "TaongaTrackerAPI.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Final stage/image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create wwwroot directory and ensure proper permissions
RUN mkdir -p /app/wwwroot/uploads/images && \
    chmod -R 755 /app/wwwroot

# Set environment variables
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "TaongaTrackerAPI.dll"]
