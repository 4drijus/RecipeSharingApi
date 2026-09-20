using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeSharingApi.Data;
using RecipeSharingApi.DTOs;
using RecipeSharingApi.Models;

namespace RecipeSharingApi.Controllers;

[ApiController]
[Route("api/recipes")]
public class RecipesController : ControllerBase
{
    private readonly AppDbContext _context;
    
    public RecipesController(AppDbContext context)
    {
        _context = context;
    }

    // GET (api/recipes)
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RecipeDto>>> GetRecipes()
    {
        var recipes = await _context.Recipes.Select(r => new RecipeDto
        {
            Id = r.Id,
            Title = r.Title,
            Description = r.Description,
            Instructions = r.Instructions,
            PreparationTime = r.PreparationTime,
            CategoryId = r.CategoryId,
            CreatedAt = r.CreatedAt
        }).ToListAsync();

        return Ok(recipes);
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
            PreparationTime = r.PreparationTime,
            CategoryId = r.CategoryId,
            CreatedAt = r.CreatedAt
        }).FirstOrDefaultAsync();

        if (recipe == null)
        {
            return NotFound();
        }

        return Ok(recipe);
    }

    // POST
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RecipeDto>> CreateRecipe(RecipeDto recipeDto)
    {
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == recipeDto.CategoryId);

        if (!categoryExists)
        {
            return BadRequest("Nurodyta kategorija neegzistuoja");
        }

        var recipe = new Recipe
        {
            Title = recipeDto.Title,
            Description = recipeDto.Description,
            Instructions = recipeDto.Instructions,
            PreparationTime = recipeDto.PreparationTime,
            CategoryId = recipeDto.CategoryId,
            CreatedAt = DateTime.Now,
        };

        _context.Recipes.Add(recipe);
        await _context.SaveChangesAsync();

        var result = new RecipeDto
        {
            Id = recipe.Id,
            Title = recipe.Title,
            Description = recipe.Description,
            Instructions = recipe.Instructions,
            PreparationTime = recipe.PreparationTime,
            CategoryId = recipe.CategoryId,
            CreatedAt = recipe.CreatedAt
        };

        return CreatedAtAction(nameof(GetRecipe), new
            { id = recipe.Id}, result);
    }

    // PUT
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
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
            PreparationTime = recipe.PreparationTime,
            CategoryId = recipe.CategoryId,
            CreatedAt = recipe.CreatedAt
        });
    }

    // DELETE
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRecipe (int id)
    {
        var recipe = await _context.Recipes.FindAsync(id);

        if (recipe == null)
        {
            return NotFound();
        }

        _context.Recipes.Remove(recipe);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}