using Microsoft.AspNetCore.Http;

namespace RecipeSharingApi.Services;

public static class ImageUploadValidator
{
    public const long MaxImageSizeBytes = 5 * 1024 * 1024;

    public static bool TryGetContentType(
        IFormFile? image,
        out string contentType)
    {
        contentType = string.Empty;

        if (image is null || image.Length is <= 0 or > MaxImageSizeBytes)
        {
            return false;
        }

        Span<byte> header = stackalloc byte[12];
        using var stream = image.OpenReadStream();
        var bytesRead = stream.Read(header);

        if (bytesRead >= 3 &&
            header[0] == 0xFF &&
            header[1] == 0xD8 &&
            header[2] == 0xFF)
        {
            contentType = "image/jpeg";
            return true;
        }

        if (bytesRead >= 8 &&
            header[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }))
        {
            contentType = "image/png";
            return true;
        }

        if (bytesRead >= 12 &&
            header[..4].SequenceEqual("RIFF"u8) &&
            header[8..12].SequenceEqual("WEBP"u8))
        {
            contentType = "image/webp";
            return true;
        }

        return false;
    }
}
