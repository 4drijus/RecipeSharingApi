using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeSharingApi.Models;
using RecipeSharingApi.DTOs;
using RecipeSharingApi.Data;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace RecipeSharingApi.Controllers;

[ApiController]
[Route("api/recipes/{recipeId}/ingredients")]
public class RecipeIngredientsController : ControllerBase
{
    private readonly AppDbContext _context;

    public RecipeIngredientsController(AppDbContext context)
    {
        _context = context;
    }

    // GET (api/recipes/1/ingredients)
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<RecipeIngredientDto>>> GetIngredients(int recipeId)
    {
        var recipeExists = await _context.Recipes.AnyAsync(r => r.Id == recipeId);

        if (!recipeExists)
        {
            return NotFound();
        }

        var ingredients = await _context.RecipeIngredients.Where(r => r.RecipeId == recipeId)
        .Select(i => new RecipeIngredientDto
        {
            Id = i.Id,
            RecipeId = i.RecipeId,
            Name = i.Name,
            Quantity = i.Quantity,
            Unit = i.Unit
        }).ToListAsync();

        return Ok(ingredients);
    }

    // GET (api/recipes/1/ingredients/id)
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RecipeIngredientDto>> GetIngredient(int recipeId, int id)
    {
        var ingredient = await _context.RecipeIngredients.Where(i => i.RecipeId == recipeId && i.Id == id)
        .Select(i => new RecipeIngredientDto
        {
           Id = i.Id,
           RecipeId = i.RecipeId,
           Name = i.Name,
           Quantity = i.Quantity,
           Unit = i.Unit 
        }).FirstOrDefaultAsync();
        
        if (ingredient == null)
        {
            return NotFound();
        }

        return Ok(ingredient);
    }

    // POST
    [HttpPost]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RecipeIngredientDto>> CreateIngredient (int recipeId, RecipeIngredientDto ingredientDto)
    {
        var recipe = await _context.Recipes.FindAsync(recipeId);

        if (recipe == null)
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

        var ingredient = new RecipeIngredient
        {
            RecipeId = recipeId,
            Name = ingredientDto.Name,
            Quantity = ingredientDto.Quantity,
            Unit = ingredientDto.Unit
        };

        _context.RecipeIngredients.Add(ingredient);
        await _context.SaveChangesAsync();

        var result = new RecipeIngredientDto
        {
            Id = ingredient.Id,
            RecipeId = ingredient.RecipeId,
            Name = ingredient.Name,
            Quantity = ingredient.Quantity,
            Unit = ingredient.Unit
        };

        return CreatedAtAction(nameof(GetIngredient), new
        {
            recipeId = recipeId,
            id = ingredient.Id
        }, result);
    }

    // PUT
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateIngredient( int recipeId, int id, RecipeIngredientDto ingredientDto)
    {
        var ingredient = await _context.RecipeIngredients.FirstOrDefaultAsync(i => i.Id == id && i.RecipeId == recipeId);

        if (ingredient == null)
        {
            return NotFound();
        }

        var recipe = await _context.Recipes.FindAsync(recipeId);

        if (recipe == null)
        {
            return NotFound();
        }

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }


        // Admin gali valdyti visų receptų ingredientus, o User tik savo
        if (!User.IsInRole("Admin") && recipe.UserId != userId)
        {
            return Forbid();
        }

        ingredient.Name = ingredientDto.Name;
        ingredient.Quantity = ingredientDto.Quantity;
        ingredient.Unit = ingredientDto.Unit;

        await _context.SaveChangesAsync();

        return Ok(new RecipeIngredientDto
        {
            Id = ingredient.Id,
            RecipeId = ingredient.RecipeId,
            Name = ingredient.Name,
            Quantity = ingredient.Quantity,
            Unit = ingredient.Unit
        });
    }

    // DELETE
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteIngredient(int recipeId, int id)
    {
        var ingredient = await _context.RecipeIngredients.FirstOrDefaultAsync(i => i.Id == id && i.RecipeId == recipeId);

        if (ingredient == null)
        {
            return NotFound();
        }

        var recipe = await _context.Recipes.FindAsync(recipeId);

        if (recipe == null)
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

        _context.RecipeIngredients.Remove(ingredient);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}