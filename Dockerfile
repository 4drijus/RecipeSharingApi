FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY RecipeSharingApi.csproj ./
RUN dotnet restore RecipeSharingApi.csproj

COPY . ./
RUN dotnet publish RecipeSharingApi.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish ./

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_HTTP_PORTS=10000

EXPOSE 10000

CMD ["sh", "-c", "dotnet RecipeSharingApi.dll --urls http://0.0.0.0:${PORT:-10000}"]
