using System.ComponentModel.DataAnnotations;

namespace RecipeSharingApi.DTOs;

public class RecipeIngredientDto
{
    public int Id { get; set; }

    public int RecipeId { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue)]
    public decimal Quantity { get; set; }

    [Required]
    [StringLength(20)]
    public string Unit { get; set; } = string.Empty;
}