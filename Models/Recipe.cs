namespace RecipeSharingApi.Models;

public class Recipe
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string Instructions { get; set; } = string.Empty;

    public int PreparationTime { get; set; }

    public int CategoryId { get; set; }

    public DateTime CreatedAt { get; set; }

    public Category? Category { get; set; }

    public ICollection<RecipeIngredient> Ingredients { get; set; } = new List<RecipeIngredient>();
}