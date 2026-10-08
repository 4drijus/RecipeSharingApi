using System.ComponentModel.DataAnnotations;

namespace RecipeSharingApi.DTOs;

public class RecipeDetailsDto
{
    public int Id { get; set; }
    public String Title { get; set; } = string.Empty;
    public String? Description { get; set; }
    public string Instructions { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int PreparationTime { get; set; }
    public DateTime CreatedAt { get; set; }
    public CategoryDto? Category { get; set; }
    public List<RecipeIngredientDto> Ingredients { get; set; } = new();
    public List<HypermediaLinkDto> Links { get; set; } = new();
}