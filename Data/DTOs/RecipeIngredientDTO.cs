namespace RecipeSharingApi.DTOs;

public class RecipeIngredientDto
{
    public int Id { get; set; }

    public int RecipeId { get; set; }

    public string Name { get; set; } = string.Empty;

    public decimal Quantity { get; set; }

    public string Unit { get; set; } = string.Empty;
}