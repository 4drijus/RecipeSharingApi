using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace RecipeSharingApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthorizationController : ControllerBase
{
    [HttpGet("user")]
    [Authorize(Roles = "User,Admin")]
    public IActionResult UserAccess()
    {
        return Ok("User role access granted");
    }

    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public IActionResult AdminAccess()
    {
        return Ok("Admin role access granted");
    }
}