using System.Globalization;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http;

namespace RecipeSharingApi.Services;

public sealed class CloudinaryImageStorageService : IImageStorageService
{
    private readonly HttpClient _httpClient;
    private readonly string? _cloudName;
    private readonly string? _apiKey;
    private readonly string? _apiSecret;

    public CloudinaryImageStorageService(
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _cloudName = configuration["Cloudinary:CloudName"];
        _apiKey = configuration["Cloudinary:ApiKey"];
        _apiSecret = configuration["Cloudinary:ApiSecret"];
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_cloudName) &&
        !string.IsNullOrWhiteSpace(_apiKey) &&
        !string.IsNullOrWhiteSpace(_apiSecret);

    public async Task<string> UploadAsync(
        IFormFile image,
        string folder,
        CancellationToken cancellationToken)
    {
        EnsureConfigured();

        if (!ImageUploadValidator.TryGetContentType(image, out var contentType))
        {
            throw new ArgumentException(
                "Pasirinkite JPEG, PNG arba WebP paveikslėlį iki 5 MB.",
                nameof(image));
        }

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            .ToString(CultureInfo.InvariantCulture);
        var parameters = new Dictionary<string, string>
        {
            ["folder"] = folder,
            ["timestamp"] = timestamp
        };

        using var form = new MultipartFormDataContent();
        form.Add(new StringContent(_apiKey!), "api_key");
        form.Add(new StringContent(timestamp), "timestamp");
        form.Add(new StringContent(folder), "folder");
        form.Add(new StringContent(CreateSignature(parameters)), "signature");

        var imageContent = new StreamContent(image.OpenReadStream());
        imageContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        var extension = contentType switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => throw new ImageStorageException("Unsupported image format.")
        };
        form.Add(imageContent, "file", $"image-{Guid.NewGuid():N}{extension}");

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.PostAsync(
                $"https://api.cloudinary.com/v1_1/{Uri.EscapeDataString(_cloudName!)}/image/upload",
                form,
                cancellationToken);
        }
        catch (HttpRequestException exception)
        {
            throw new ImageStorageException("Cloudinary image upload request failed.", exception);
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                throw new ImageStorageException(
                    $"Cloudinary rejected the image upload (HTTP {(int)response.StatusCode}).");
            }

            CloudinaryUploadResponse? result;
            try
            {
                result = await response.Content.ReadFromJsonAsync<CloudinaryUploadResponse>(
                    cancellationToken: cancellationToken);
            }
            catch (System.Text.Json.JsonException exception)
            {
                throw new ImageStorageException("Cloudinary returned an invalid upload response.", exception);
            }

            if (string.IsNullOrWhiteSpace(result?.SecureUrl) ||
                !Uri.TryCreate(result.SecureUrl, UriKind.Absolute, out var secureUrl) ||
                secureUrl.Scheme != Uri.UriSchemeHttps)
            {
                throw new ImageStorageException(
                    "Cloudinary returned an invalid secure image URL.");
            }

            return secureUrl.ToString();
        }
    }

    public async Task DeleteAsync(
        string? imageUrl,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(imageUrl) ||
            !TryGetPublicId(imageUrl, out var publicId))
        {
            return;
        }

        EnsureConfigured();

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            .ToString(CultureInfo.InvariantCulture);
        var parameters = new Dictionary<string, string>
        {
            ["public_id"] = publicId,
            ["timestamp"] = timestamp
        };

        using var form = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["api_key"] = _apiKey!,
            ["public_id"] = publicId,
            ["timestamp"] = timestamp,
            ["signature"] = CreateSignature(parameters)
        });

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.PostAsync(
                $"https://api.cloudinary.com/v1_1/{Uri.EscapeDataString(_cloudName!)}/image/destroy",
                form,
                cancellationToken);
        }
        catch (HttpRequestException exception)
        {
            throw new ImageStorageException("Cloudinary image deletion request failed.", exception);
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                throw new ImageStorageException(
                    $"Cloudinary rejected the image deletion (HTTP {(int)response.StatusCode}).");
            }
        }
    }

    private string CreateSignature(IReadOnlyDictionary<string, string> parameters)
    {
        var canonicalParameters = string.Join(
            "&",
            parameters
                .OrderBy(parameter => parameter.Key, StringComparer.Ordinal)
                .Select(parameter => $"{parameter.Key}={parameter.Value}"));

        var bytes = SHA1.HashData(
            Encoding.UTF8.GetBytes(canonicalParameters + _apiSecret));

        return Convert.ToHexStringLower(bytes);
    }

    private bool TryGetPublicId(string imageUrl, out string publicId)
    {
        publicId = string.Empty;

        if (!Uri.TryCreate(imageUrl, UriKind.Absolute, out var uri) ||
            uri.Scheme != Uri.UriSchemeHttps ||
            !string.Equals(uri.Host, "res.cloudinary.com", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var segments = uri.AbsolutePath
            .Split('/', StringSplitOptions.RemoveEmptyEntries)
            .Select(Uri.UnescapeDataString)
            .ToArray();

        if (segments.Length < 5 ||
            !string.Equals(segments[0], _cloudName, StringComparison.Ordinal) ||
            !string.Equals(segments[1], "image", StringComparison.Ordinal) ||
            !string.Equals(segments[2], "upload", StringComparison.Ordinal))
        {
            return false;
        }

        var publicIdSegments = segments.Skip(3).ToList();
        if (publicIdSegments.Count > 0 &&
            publicIdSegments[0].Length > 1 &&
            publicIdSegments[0][0] == 'v' &&
            publicIdSegments[0][1..].All(char.IsAsciiDigit))
        {
            publicIdSegments.RemoveAt(0);
        }

        if (publicIdSegments.Count == 0)
        {
            return false;
        }

        var lastSegment = publicIdSegments[^1];
        var extensionIndex = lastSegment.LastIndexOf('.');
        if (extensionIndex > 0)
        {
            publicIdSegments[^1] = lastSegment[..extensionIndex];
        }

        publicId = string.Join('/', publicIdSegments);
        return !string.IsNullOrWhiteSpace(publicId);
    }

    private void EnsureConfigured()
    {
        if (!IsConfigured)
        {
            throw new ImageStorageNotConfiguredException();
        }
    }

    private sealed record CloudinaryUploadResponse(
        [property: JsonPropertyName("secure_url")] string? SecureUrl);
}

public sealed class ImageStorageException(string message, Exception? innerException = null)
    : Exception(message, innerException)
{
}

public sealed class ImageStorageNotConfiguredException()
    : Exception("Cloudinary image storage is not configured")
{
}
