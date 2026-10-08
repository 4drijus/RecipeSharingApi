using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace RecipeSharingApi.DTOs;

/// <summary>Category details and its image submitted together as multipart form data.</summary>
public sealed record CreateCategoryWithImageRequest
{
    [Required, StringLength(100)]
    public required string Name { get; init; }

    [StringLength(500)]
    public string? Description { get; init; }

    [Required]
    public required IFormFile Image { get; init; }
}
