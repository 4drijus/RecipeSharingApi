using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeSharingApi.Data;

namespace RecipeSharingApi.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    // GET /api/users
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.Role
            })
            .ToListAsync();

        return Ok(users);
    }

    // GET /api/users/{id}
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _context.Users
            .Where(u => u.Id == id)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.Role
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    // DELETE /api/users/{id}
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}