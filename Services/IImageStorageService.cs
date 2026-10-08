using Microsoft.AspNetCore.Http;

namespace RecipeSharingApi.Services;

public interface IImageStorageService
{
    bool IsConfigured { get; }

    Task<string> UploadAsync(
        IFormFile image,
        string folder,
        CancellationToken cancellationToken);

    Task DeleteAsync(string? imageUrl, CancellationToken cancellationToken);
}
