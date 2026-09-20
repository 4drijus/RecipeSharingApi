namespace RecipeSharingApi.DTOs;

public class RecipeDto
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string Instructions { get; set; } = string.Empty;

    public int PreparationTime { get; set; }

    public int CategoryId { get; set; }

    public DateTime CreatedAt { get; set; }
}