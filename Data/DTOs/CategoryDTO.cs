using System.ComponentModel.DataAnnotations;

namespace RecipeSharingApi.DTOs;

public class CategoryDto
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    public string? ImageUrl { get; set; }
}