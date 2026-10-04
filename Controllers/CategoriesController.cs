using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeSharingApi.Data;
using RecipeSharingApi.DTOs;
using RecipeSharingApi.Models;
using Microsoft.AspNetCore.Authorization;

namespace RecipeSharingApi.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public CategoriesController(AppDbContext context)
    {
        _context = context;
    }

    // GET (api/categories)
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories()
    {
        var categories = await _context.Categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description
        }).ToListAsync();

        return Ok(categories);
    }


    // GET (api/categories/id)
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryDto>> GetCategory(int id)
    {
        var category = await _context.Categories.Where(c => c.Id == id)
        .Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description
        }).FirstOrDefaultAsync();

        if (category == null)
        {
            return NotFound();
        }

        return Ok(category);
    }

    // POST
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CategoryDto>> CreateCategory(CategoryDto categoryDto)
    {
        var category = new Category
        {
            Name = categoryDto.Name,
            Description = categoryDto.Description
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        var result = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description
        };

        return CreatedAtAction(nameof(GetCategory), new
            { id = category.Id}, result);
    }

    // PUT
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCategory (int id, CategoryDto categoryDto)
    {
        var category = await _context.Categories.FindAsync(id);

        if (category == null)
        {
            return NotFound();
        }

        category.Name = categoryDto.Name;
        category.Description = categoryDto.Description;

        await _context.SaveChangesAsync();

        return Ok(new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description
        });
    }


    // DELETE
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCategory (int id)
    {
        var category = await _context.Categories.FindAsync(id);

        if (category == null)
        {
            return NotFound();
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return NoContent();
    }
 }