namespace RecipeSharingApi.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "User";
    public ICollection<Recipe> Recipes { get; set; } = new List<Recipe>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}