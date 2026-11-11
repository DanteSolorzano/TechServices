# Etapa 1: Compilar la aplicación
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build-env
WORKDIR /app
# Copia el archivo del proyecto y restaura las dependencias
COPY *.csproj ./
RUN dotnet restore
# Copia el resto del código y lo publica en modo Release
COPY . ./
RUN dotnet publish -c Release -o out

# Etapa 2: Crear la imagen final ligera para producción
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build-env /app/out .
# Render inyecta el puerto 10000 por defecto, así que exponemos el 8080 como interno
EXPOSE 8080
ENTRYPOINT ["dotnet", "Backend-EnTeck.dll"]