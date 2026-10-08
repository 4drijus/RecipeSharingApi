using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace RecipeSharingApi.DTOs;

/// <summary>Recipe details and its image submitted together as multipart form data.</summary>
public sealed record CreateRecipeWithImageRequest
{
    [Required, StringLength(100)]
    public required string Title { get; init; }

    [StringLength(500)]
    public string? Description { get; init; }

    [Required]
    public required string Instructions { get; init; }

    [Range(1, 1440)]
    public int PreparationTime { get; init; }

    [Range(1, int.MaxValue)]
    public int CategoryId { get; init; }

    [Required]
    public required IFormFile Image { get; init; }
}
