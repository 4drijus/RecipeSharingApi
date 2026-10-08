using System.ComponentModel.DataAnnotations;

namespace RecipeSharingApi.DTOs;

public class RecipeDto
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Title { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [Required]
    public string Instructions { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    [Range(1,1440)]
    public int PreparationTime { get; set; }

    [Range(1, int.MaxValue)]
    public int CategoryId { get; set; }
    public int? UserId { get; set; }

    public DateTime CreatedAt { get; set; }
}