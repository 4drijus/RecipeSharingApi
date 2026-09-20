using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeSharingApi.Models;
using RecipeSharingApi.DTOs;
using RecipeSharingApi.Data;

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
    public async Task<ActionResult<RecipeIngredientDto>> GetIngredient(int recipeId, int id)
    {
        var ingredient = await _context.RecipeIngredients.Where(i =>recipeId == recipeId && i.Id == id)
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
    public async Task<ActionResult<RecipeIngredientDto>> CreateIngredient (int recipeId, RecipeIngredientDto ingredientDto)
    {
        var recipeExists = await _context.Recipes.AnyAsync(r => r.Id == recipeId);

        if (!recipeExists)
        {
            return NotFound();
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
    public async Task<IActionResult> UpdateIngredient( int recipeId, int id, RecipeIngredient ingredientDto)
    {
        var ingredient = await _context.RecipeIngredients.FirstOrDefaultAsync(i => i.Id == id && i.RecipeId == recipeId);

        if (ingredient == null)
        {
            return NotFound();
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
    public async Task<IActionResult> DeleteIngredient(int recipeId, int id)
    {
        var ingredient = await _context.RecipeIngredients.FirstOrDefaultAsync(i => i.Id == id && i.RecipeId == recipeId);

        if (ingredient == null)
        {
            return NotFound();
        }

        _context.RecipeIngredients.Remove(ingredient);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}