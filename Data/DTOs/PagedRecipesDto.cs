namespace RecipeSharingApi.DTOs;

public class PagedRecipesDto
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
    public List<RecipeDto> Items { get; set; } = new();
}