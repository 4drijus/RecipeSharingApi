using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeSharingApi.Data;
using RecipeSharingApi.DTOs;
using RecipeSharingApi.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using RecipeSharingApi.Services;

namespace RecipeSharingApi.Controllers;

[ApiController]
[Route("api/recipes")]
public class RecipesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IImageStorageService _imageStorage;
    private readonly ILogger<RecipesController> _logger;
    
    public RecipesController(
        AppDbContext context,
        IImageStorageService imageStorage,
        ILogger<RecipesController> logger)
    {
        _context = context;
        _imageStorage = imageStorage;
        _logger = logger;
    }

    // GET (api/recipes)
    [HttpGet]
    [ProducesResponseType(typeof(PagedRecipesDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedRecipesDto>> GetRecipes(int page, int pageSize = 10, int? categoryId = null)
    {
        if (page < 1 || pageSize < 1 || pageSize > 100)
        {
            return BadRequest("Puslapis negali būti mažesnis už 1, o jo dydis nuo 1 iki 100");
        }

        var query = _context.Recipes.AsQueryable();

        if (categoryId.HasValue)
        {
            var categoryExists = await _context.Categories
                .AnyAsync(c => c.Id == categoryId.Value);

            if (!categoryExists)
            {
                return NotFound();
            }

            query = query.Where(r => r.CategoryId == categoryId.Value);
        }

        var totalItems = await query.CountAsync();

        var recipes = await query
            .OrderBy(r => r.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RecipeDto
            {
                Id = r.Id,
                Title = r.Title,
                Description = r.Description,
                Instructions = r.Instructions,
                ImageUrl = r.ImageUrl,
                PreparationTime = r.PreparationTime,
                CategoryId = r.CategoryId,
                CreatedAt = r.CreatedAt,
                UserId = r.UserId
            }).ToListAsync();

        var result = new PagedRecipesDto
        {
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
            Items = recipes
        };

        return Ok(result);
    }

    // GET (api/recipes/id)
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RecipeDto>> GetRecipe(int id)
    {
        var recipe = await _context.Recipes.Where(r => r.Id == id)
        .Select(r => new RecipeDto
        {
            Id = r.Id,
            Title = r.Title,
            Description = r.Description,
            Instructions = r.Instructions,
            ImageUrl = r.ImageUrl,
            PreparationTime = r.PreparationTime,
            CategoryId = r.CategoryId,
            CreatedAt = r.CreatedAt,
            UserId = r.UserId
        }).FirstOrDefaultAsync();

        if (recipe == null)
        {
            return NotFound();
        }

        return Ok(recipe);
    }

    // POST
    [HttpPost]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<RecipeDto>> CreateRecipe(RecipeDto recipeDto)
    {
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == recipeDto.CategoryId);

        if (!categoryExists)
        {
            return BadRequest("Nurodyta kategorija neegzistuoja");
        }

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized($"JWT user ID claim: {userIdClaim}");
        }

        var recipe = new Recipe
        {
            Title = recipeDto.Title,
            Description = recipeDto.Description,
            Instructions = recipeDto.Instructions,
            PreparationTime = recipeDto.PreparationTime,
            CategoryId = recipeDto.CategoryId,
            CreatedAt = DateTime.Now,
            UserId = userId
        };

        _context.Recipes.Add(recipe);
        await _context.SaveChangesAsync();

        var result = new RecipeDto
        {
            Id = recipe.Id,
            Title = recipe.Title,
            Description = recipe.Description,
            Instructions = recipe.Instructions,
            ImageUrl = recipe.ImageUrl,
            PreparationTime = recipe.PreparationTime,
            CategoryId = recipe.CategoryId,
            CreatedAt = recipe.CreatedAt,
            UserId = recipe.UserId
        };

        return CreatedAtAction(nameof(GetRecipe), new
            { id = recipe.Id}, result);
    }

    /// <summary>Creates a recipe and uploads its image in one request.</summary>
    [HttpPost("with-image")]
    [Authorize]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 6 * 1024 * 1024)]
    [ProducesResponseType(typeof(RecipeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<RecipeDto>> CreateRecipeWithImage(
        [FromForm] CreateRecipeWithImageRequest request,
        CancellationToken cancellationToken)
    {
        var categoryExists = await _context.Categories
            .AnyAsync(c => c.Id == request.CategoryId, cancellationToken);

        if (!categoryExists)
        {
            return BadRequest("Nurodyta kategorija neegzistuoja");
        }

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        if (!_imageStorage.IsConfigured)
        {
            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Nuotraukų saugykla nesukonfigūruota.");
        }

        if (!ImageUploadValidator.TryGetContentType(request.Image, out _))
        {
            return BadRequest("Pasirinkite JPEG, PNG arba WebP nuotrauką iki 5 MB.");
        }

        string imageUrl;
        try
        {
            imageUrl = await _imageStorage.UploadAsync(
                request.Image,
                "recipe-sharing/recipes",
                cancellationToken);
        }
        catch (ImageStorageException exception)
        {
            _logger.LogError(exception, "Recipe image upload failed during recipe creation.");
            return Problem(
                statusCode: StatusCodes.Status502BadGateway,
                title: "Nepavyko įkelti recepto nuotraukos į saugyklą.");
        }

        var recipe = new Recipe
        {
            Title = request.Title,
            Description = request.Description,
            Instructions = request.Instructions,
            ImageUrl = imageUrl,
            PreparationTime = request.PreparationTime,
            CategoryId = request.CategoryId,
            CreatedAt = DateTime.UtcNow,
            UserId = userId
        };

        _context.Recipes.Add(recipe);
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            try
            {
                await _imageStorage.DeleteAsync(imageUrl, CancellationToken.None);
            }
            catch (ImageStorageException cleanupException)
            {
                _logger.LogError(cleanupException, "Could not clean up an image after recipe creation failed.");
            }

            throw;
        }

        var result = new RecipeDto
        {
            Id = recipe.Id,
            Title = recipe.Title,
            Description = recipe.Description,
            Instructions = recipe.Instructions,
            ImageUrl = recipe.ImageUrl,
            PreparationTime = recipe.PreparationTime,
            CategoryId = recipe.CategoryId,
            CreatedAt = recipe.CreatedAt,
            UserId = recipe.UserId
        };

        return CreatedAtAction(nameof(GetRecipe), new { id = recipe.Id }, result);
    }

    // PUT
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateRecipe (int id, RecipeDto recipeDto)
    {
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == recipeDto.CategoryId);

        if (!categoryExists)
        {
            return BadRequest("Nurodyta kategorija neegzistuoja");
        }

        var recipe = await _context.Recipes.FindAsync(id);

        if (recipe == null)
        {
            return NotFound();
        }

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // Admin gali redaguoti visus receptus, o user tik savo
        if (!User.IsInRole("Admin") && recipe.UserId != userId)
        {
            return Forbid();
        }

        recipe.Title = recipeDto.Title;
        recipe.Description = recipeDto.Description;
        recipe.Instructions = recipeDto.Instructions;
        recipe.PreparationTime = recipeDto.PreparationTime;
        recipe.CategoryId = recipeDto.CategoryId;
        recipe.CreatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return Ok(new RecipeDto
        {
            Id = recipe.Id,
            Title = recipe.Title,
            Description = recipe.Description,
            Instructions = recipe.Instructions,
            ImageUrl = recipe.ImageUrl,
            PreparationTime = recipe.PreparationTime,
            CategoryId = recipe.CategoryId,
            CreatedAt = recipe.CreatedAt,
            UserId = recipe.UserId
        });
    }

    /// <summary>Uploads or replaces a recipe image in Cloudinary.</summary>
    [HttpPost("{id:int}/image")]
    [Authorize]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 6 * 1024 * 1024)]
    [ProducesResponseType(typeof(ImageUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ImageUploadResponse>> UploadRecipeImage(
        int id,
        IFormFile image,
        CancellationToken cancellationToken)
    {
        var recipe = await _context.Recipes
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (recipe is null)
        {
            return NotFound();
        }

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        if (!User.IsInRole("Admin") && recipe.UserId != userId)
        {
            return Forbid();
        }

        if (!_imageStorage.IsConfigured)
        {
            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Nuotraukų saugykla nesukonfigūruota.");
        }

        if (!ImageUploadValidator.TryGetContentType(image, out _))
        {
            return BadRequest("Pasirinkite JPEG, PNG arba WebP nuotrauką iki 5 MB.");
        }

        var previousImageUrl = recipe.ImageUrl;
        string uploadedImageUrl;

        try
        {
            uploadedImageUrl = await _imageStorage.UploadAsync(
                image,
                "recipe-sharing/recipes",
                cancellationToken);
        }
        catch (ImageStorageException exception)
        {
            _logger.LogError(exception, "Recipe image upload failed for recipe {RecipeId}.", id);
            return Problem(
                statusCode: StatusCodes.Status502BadGateway,
                title: "Nepavyko įkelti recepto nuotraukos į saugyklą.");
        }

        recipe.ImageUrl = uploadedImageUrl;

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            recipe.ImageUrl = previousImageUrl;
            try
            {
                await _imageStorage.DeleteAsync(uploadedImageUrl, CancellationToken.None);
            }
            catch (ImageStorageException cleanupException)
            {
                _logger.LogError(
                    cleanupException,
                    "Could not clean up an uploaded image after saving recipe {RecipeId} failed.",
                    id);
            }

            throw;
        }

        try
        {
            await _imageStorage.DeleteAsync(previousImageUrl, cancellationToken);
        }
        catch (ImageStorageException exception)
        {
            _logger.LogError(exception, "Could not delete the replaced image for recipe {RecipeId}.", id);
        }

        return Ok(new ImageUploadResponse(uploadedImageUrl));
    }

    // DELETE
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRecipe (int id)
    {
        var recipe = await _context.Recipes.FindAsync(id);

        if (recipe == null)
        {
            return NotFound();
        }

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // Admin gali trinti visus receptus, o user tik savo
        if (!User.IsInRole("Admin") && recipe.UserId != userId)
        {
            return Forbid();
        }

        _context.Recipes.Remove(recipe);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{id}/details")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RecipeDetailsDto>> GetRecipeDetails(int id)
    {
        var recipe = await _context.Recipes
            .Where(r => r.Id == id)
            .Select(r => new RecipeDetailsDto
            {
                Id = r.Id,
                Title = r.Title,
                Description = r.Description,
                Instructions = r.Instructions,
                ImageUrl = r.ImageUrl,
                PreparationTime = r.PreparationTime,
                CreatedAt = r.CreatedAt,

                Category = r.Category == null
                    ? null
                    : new CategoryDto
                    {
                        Id = r.Category.Id,
                        Name = r.Category.Name,
                        Description = r.Category.Description,
                        ImageUrl = r.Category.ImageUrl
                    },

                Ingredients = r.Ingredients
                    .Select(i => new RecipeIngredientDto
                    {
                        Id = i.Id,
                        RecipeId = i.RecipeId,
                        Name = i.Name,
                        Quantity = i.Quantity,
                        Unit = i.Unit
                    }).ToList(),

                Links = new List<HypermediaLinkDto>
                {
                    new HypermediaLinkDto
                    {
                        Rel = "self",
                        Href = $"/api/recipes/{r.Id}/details"
                    },
                    new HypermediaLinkDto
                    {
                        Rel = "recipe",
                        Href = $"/api/recipes/{r.Id}"
                    },
                    new HypermediaLinkDto
                    {
                        Rel = "category",
                        Href = $"/api/categories/{r.CategoryId}"
                    },
                    new HypermediaLinkDto
                    {
                        Rel = "ingredients",
                        Href = $"/api/recipes/{r.Id}/ingredients"
                    },
                    new HypermediaLinkDto
                    {
                        Rel = "categoryIngredients",
                        Href = $"/api/categories/{r.CategoryId}/recipes/{r.Id}/ingredients"
                    }
                }
            }).FirstOrDefaultAsync();

        if (recipe == null)
        {
            return NotFound();
        }

        return Ok(recipe);
    }
}